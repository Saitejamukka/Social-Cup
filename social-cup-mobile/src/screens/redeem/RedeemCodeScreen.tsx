import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { api } from '../../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemCode'>;

export const RedeemCodeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, drinkId } = route.params;
  const { activeRedemption, cancelActiveRedemption, refreshUser } = useAppStore();
  const [secondsLeft, setSecondsLeft] = useState(300);
  const navigatedAway = useRef(false);

  useEffect(() => {
    if (!activeRedemption) {
      navigation.goBack();
      return;
    }

    const tick = () => {
      const remaining = Math.max(0, Math.round((new Date(activeRedemption.expiresAt).getTime() - Date.now()) / 1000));
      setSecondsLeft(remaining);
    };
    tick();
    const timer = setInterval(tick, 1000);

    // Poll the server so this screen reacts the instant a barista scans the code.
    const poll = setInterval(async () => {
      if (navigatedAway.current) return;
      try {
        const redemption = await api.getRedemption(activeRedemption.id);
        if (redemption.status === 'REDEEMED') {
          navigatedAway.current = true;
          await refreshUser();
          navigation.replace('RedeemSuccess', { cafeId, drinkId });
        } else if (redemption.status === 'EXPIRED') {
          navigatedAway.current = true;
          navigation.replace('RedeemFailed', { cafeId, reason: 'expired' });
        } else if (redemption.status === 'VOIDED') {
          navigatedAway.current = true;
          navigation.goBack();
        }
      } catch {
        // Transient network error — the next poll will retry.
      }
    }, 2000);

    return () => {
      clearInterval(timer);
      clearInterval(poll);
    };
  }, [activeRedemption?.id]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const timerLabel = `${minutes}:${String(seconds).padStart(2, '0')} remaining`;

  const handleCancel = async () => {
    navigatedAway.current = true;
    await cancelActiveRedemption();
    navigation.goBack();
  };

  if (!activeRedemption) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.gold} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity style={styles.backBtn} onPress={handleCancel}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.headerSubtitle}>Show this to your barista</Text>

          {/* Large Code Display */}
          <View style={styles.codeCard}>
            <Text style={styles.codeText}>{activeRedemption.code}</Text>
          </View>

          {/* Timer */}
          <Text style={styles.timerText}>{secondsLeft > 0 ? timerLabel : 'Expiring…'}</Text>

          {/* Backup Code */}
          <Text style={styles.backupText}>
            Can't scan? Use backup code:{' '}
            <Text style={styles.backupHighlight}>{activeRedemption.backupCode}</Text>
          </Text>

          <TouchableOpacity style={styles.cancelLink} onPress={handleCancel}>
            <Text style={styles.cancelLinkText}>Cancel this code</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    padding: 24,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 18,
  },
  headerSubtitle: {
    fontSize: 15,
    color: Colors.mute,
  },
  codeCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 16,
    paddingVertical: 24,
    paddingHorizontal: 40,
    width: '100%',
    alignItems: 'center',
  },
  codeText: {
    fontSize: 44,
    fontWeight: '700',
    color: Colors.ink,
    letterSpacing: 8,
    fontFamily: 'monospace',
  },
  timerText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.gold,
  },
  backupText: {
    fontSize: 13,
    color: Colors.mute,
  },
  backupHighlight: {
    fontWeight: '700',
    color: Colors.ink,
  },
  cancelLink: {
    marginTop: 20,
    padding: 8,
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mute,
  },
});
