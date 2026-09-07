import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { PopIn } from '../../components/PopIn';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ navigation }) => {
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
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </AnimatedPressable>

        <TouchableOpacity style={styles.resendBtn}>
          <Text style={styles.resendText}>Resend email</Text>
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
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 12,
  },
  primaryBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  resendBtn: {
    marginTop: 8,
  },
  resendText: {
    fontSize: 13,
    color: Colors.goldDark,
  },
});
