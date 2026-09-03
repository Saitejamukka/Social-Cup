import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { CAFES } from '../../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemCode'>;

export const RedeemCodeScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, drinkId } = route.params;
  const cafe = CAFES.find((c) => c.id === cafeId) || CAFES[0];
  const drink = cafe.drinks.find((d) => d.id === drinkId) || cafe.drinks[0];

  const {
    redeemCode,
    backupCode,
    timerSeconds,
    tickTimer,
    cancelRedemptionCode,
  } = useAppStore();

  useEffect(() => {
    const timer = setInterval(() => {
      tickTimer();
    }, 1000);
    return () => clearInterval(timer);
  }, [tickTimer]);

  const minutes = Math.floor(timerSeconds / 60);
  const seconds = timerSeconds % 60;
  const timerLabel = `${minutes}:${String(seconds).padStart(2, '0')} remaining`;

  const handleCancel = () => {
    cancelRedemptionCode(drink.credits);
    navigation.goBack();
  };

  const handleSimulateSuccess = () => {
    navigation.replace('RedeemSuccess', { cafeId, drinkId });
  };

  const handleSimulateFail = () => {
    cancelRedemptionCode(drink.credits);
    navigation.replace('RedeemFailed', { cafeId });
  };

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
            <Text style={styles.codeText}>{redeemCode}</Text>
          </View>

          {/* Timer */}
          <Text style={styles.timerText}>{timerLabel}</Text>

          {/* Backup Code */}
          <Text style={styles.backupText}>
            Can't scan? Use backup code:{' '}
            <Text style={styles.backupHighlight}>{backupCode}</Text>
          </Text>

          {/* Prototype Demo Controls */}
          <View style={styles.demoBox}>
            <Text style={styles.demoTitle}>Demo controls</Text>
            <TouchableOpacity
              style={styles.simulateSuccessBtn}
              onPress={handleSimulateSuccess}
            >
              <Text style={styles.simulateSuccessText}>
                Simulate: barista scans code
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.simulateFailBtn}
              onPress={handleSimulateFail}
            >
              <Text style={styles.simulateFailText}>Simulate: scan failed</Text>
            </TouchableOpacity>
          </View>
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
  demoBox: {
    width: '100%',
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    borderStyle: 'dashed',
    paddingTop: 20,
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  demoTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.pale,
    textTransform: 'uppercase',
  },
  simulateSuccessBtn: {
    backgroundColor: Colors.success,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  simulateSuccessText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  simulateFailBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    width: '100%',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  simulateFailText: {
    color: Colors.mute,
    fontSize: 13,
    fontWeight: '600',
  },
});
