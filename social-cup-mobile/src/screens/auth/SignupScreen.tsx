import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { BackButton } from '../../components/BackButton';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { ApiError } from '../../api/client';
import { useGoogleAuthRequest, extractGoogleIdToken } from '../../auth/googleAuth';
import { GoogleIcon } from '../../components/GoogleIcon';
import { AppleIcon } from '../../components/AppleIcon';
import { showAlert } from '../../utils/alert';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

// Apple Sign-In is fully implemented in src/auth/appleAuth.ts but stays disabled
// here until the account holds a paid Apple Developer Program membership
// (required for the "Sign in with Apple" entitlement) — wire handleAppleSignup
// back to that module's signInWithApple() once that's in place.
const appleComingSoon = () =>
  showAlert('Coming soon', 'Apple sign-in is being set up and will be available shortly.');

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = useAppStore((s) => s.register);
  const registerWithOAuth = useAppStore((s) => s.registerWithOAuth);
  const { request: googleRequest, promptAsync: promptGoogleAsync, isConfigured: googleConfigured } = useGoogleAuthRequest();

  const finishOAuthSignup = async (provider: 'google' | 'apple', idToken: string, providerName?: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await registerWithOAuth(provider, idToken, providerName);
      // Email is already verified by the provider, so OAuth sign-ups skip VerifyEmail.
      navigation.navigate('Onboarding');
    } catch (err: any) {
      setError(err instanceof ApiError ? err.message : err.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignup = async () => {
    if (!googleConfigured) {
      showAlert('Not available yet', 'Google sign-in is not configured in this build.');
      return;
    }
    const result = await promptGoogleAsync();
    if (result.type === 'dismiss' || result.type === 'cancel') return;
    const idToken = extractGoogleIdToken(result);
    if (!idToken) {
      setError('Google sign-in did not complete. Please try again.');
      return;
    }
    await finishOAuthSignup('google', idToken);
  };

  const handleSubmit = async () => {
    if (!name.trim()) {
      setError('Enter your name.');
      return;
    }
    if (!email.trim()) {
      setError('Enter your email.');
      return;
    }
    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await register(email.trim(), password, name.trim());
      navigation.navigate('VerifyEmail');
    } catch (err: any) {
      setError(err.message || 'Could not create your account');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <BackButton style={styles.backBtn} onPress={() => navigation.goBack()} />

        <FadeSlideIn style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Free to browse, rate, and build your diary.
          </Text>
        </FadeSlideIn>

        {/* Social Buttons */}
        <FadeSlideIn delay={80} style={styles.socialGroup}>
          <AnimatedPressable style={styles.googleBtn} onPress={handleGoogleSignup} disabled={submitting || !googleRequest}>
            <GoogleIcon />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.appleBtn} onPress={appleComingSoon}>
            <AppleIcon />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </AnimatedPressable>
        </FadeSlideIn>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Inputs */}
        <FadeSlideIn delay={140} style={styles.form}>
          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Display name</Text>
            <TextInput
              style={styles.input}
              placeholder="Jordan Avery"
              placeholderTextColor={Colors.pale}
              value={name}
              onChangeText={setName}
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@email.com"
              placeholderTextColor={Colors.pale}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputWrapper}>
            <Text style={styles.inputLabel}>Password</Text>
            <TextInput
              style={styles.input}
              placeholder="At least 8 characters"
              placeholderTextColor={Colors.pale}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>
        </FadeSlideIn>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <AnimatedPressable style={[PillButton.primary, styles.submitBtn]} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.white} /> : <Text style={PillButton.primaryText}>Create account</Text>}
        </AnimatedPressable>

        <View style={styles.footerRow}>
          <Text style={styles.footerText}>Already have an account? </Text>
          <TouchableOpacity onPress={() => navigation.navigate('Login')}>
            <Text style={styles.linkText}>Log in</Text>
          </TouchableOpacity>
        </View>
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
    padding: 24,
    gap: 20,
  },
  backBtn: {
    alignSelf: 'flex-start',
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mute,
  },
  socialGroup: {
    gap: 10,
    marginTop: 8,
  },
  googleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  googleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  appleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    padding: 14,
    borderRadius: 10,
    backgroundColor: Colors.ink,
  },
  appleBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.pale,
  },
  form: {
    gap: 14,
  },
  inputWrapper: {
    gap: 6,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.mute,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    backgroundColor: Colors.white,
    color: Colors.ink,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
  },
  submitBtn: {
    marginTop: 6,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 13,
    color: Colors.mute,
  },
  linkText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.goldDark,
  },
});
