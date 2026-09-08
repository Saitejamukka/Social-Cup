import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { PopIn } from '../../components/PopIn';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { api } from '../../api/client';
import { showAlert } from '../../utils/alert';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ navigation }) => {
  const [resending, setResending] = useState(false);

  const handleResend = async () => {
    setResending(true);
    try {
      await api.resendVerification();
      showAlert('Email sent', 'Check your inbox for a new verification link.');
    } catch (err: any) {
      showAlert('Could not resend', err.message || 'Please try again in a moment.');
    } finally {
      setResending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <PopIn style={styles.iconCircle}>
          <Text style={styles.iconText}>✉</Text>
        </PopIn>

        <FadeSlideIn delay={120} style={styles.textContainer}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to your inbox. Tap it to confirm your address.
          </Text>
        </FadeSlideIn>

        <AnimatedPressable
          style={[PillButton.primary, styles.primaryBtn]}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={PillButton.primaryText}>Continue</Text>
        </AnimatedPressable>

        <TouchableOpacity style={styles.resendBtn} onPress={handleResend} disabled={resending}>
          {resending ? (
            <ActivityIndicator size="small" color={Colors.goldDark} />
          ) : (
            <Text style={styles.resendText}>Resend email</Text>
          )}
        </TouchableOpacity>
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
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 28,
    color: Colors.gold,
  },
  textContainer: {
    alignItems: 'center',
    gap: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 22,
    color: Colors.mute,
    textAlign: 'center',
  },
  primaryBtn: {
    paddingHorizontal: 40,
    marginTop: 12,
  },
  resendBtn: {
    marginTop: 8,
  },
  resendText: {
    fontSize: 13,
    color: Colors.goldDark,
  },
});
