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
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { FAIL_REASONS } from '../../data/mockData';
import { PopIn } from '../../components/PopIn';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemFailed'>;

export const RedeemFailedScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, reason = 'expired' } = route.params;
  const currentReason = FAIL_REASONS[reason];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <PopIn style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>✕</Text>
        </PopIn>

        <FadeSlideIn delay={120} style={{ alignItems: 'center', gap: 16 }}>
          <Text style={styles.title}>{currentReason.title}</Text>
          <Text style={styles.message}>{currentReason.message}</Text>

          <AnimatedPressable
            style={[PillButton.primary, styles.retryBtn]}
            onPress={() => navigation.navigate('CafeDetail', { cafeId })}
          >
            <Text style={PillButton.primaryText}>Try again</Text>
          </AnimatedPressable>
        </FadeSlideIn>
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
    fontFamily: Fonts.display,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mute,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    paddingHorizontal: 36,
    marginTop: 14,
  },
});
