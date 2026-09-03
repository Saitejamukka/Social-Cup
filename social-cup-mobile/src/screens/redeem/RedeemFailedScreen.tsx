import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { FAIL_REASONS } from '../../data/mockData';
import { FailReasonKey } from '../../types';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemFailed'>;

export const RedeemFailedScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId } = route.params;
  const { failReasonKey, setFailReasonKey } = useAppStore();

  const currentReason = FAIL_REASONS[failReasonKey];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>✕</Text>
        </View>

        <Text style={styles.title}>{currentReason.title}</Text>
        <Text style={styles.message}>{currentReason.message}</Text>

        {/* Prototype error reason switcher */}
        <View style={styles.reasonChips}>
          {(Object.keys(FAIL_REASONS) as FailReasonKey[]).map((key) => {
            const isSelected = failReasonKey === key;
            return (
              <TouchableOpacity
                key={key}
                style={[
                  styles.reasonChip,
                  isSelected && styles.reasonChipActive,
                ]}
                onPress={() => setFailReasonKey(key)}
              >
                <Text
                  style={[
                    styles.reasonChipText,
                    isSelected && styles.reasonChipTextActive,
                  ]}
                >
                  {FAIL_REASONS[key].label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.navigate('CafeDetail', { cafeId })}
        >
          <Text style={styles.retryBtnText}>Try again</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flexGrow: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 32,
    color: Colors.danger,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mute,
    textAlign: 'center',
    maxWidth: 280,
  },
  reasonChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginTop: 10,
  },
  reasonChip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  reasonChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  reasonChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },
  reasonChipTextActive: {
    color: Colors.white,
  },
  retryBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 12,
    marginTop: 14,
  },
  retryBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
