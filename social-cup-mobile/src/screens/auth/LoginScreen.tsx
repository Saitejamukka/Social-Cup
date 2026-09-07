import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { ApiError } from '../../api/client';
import { useGoogleAuthRequest, extractGoogleIdToken } from '../../auth/googleAuth';
import { GoogleIcon } from '../../components/GoogleIcon';
import { AppleIcon } from '../../components/AppleIcon';
import { showAlert } from '../../utils/alert';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

// Apple Sign-In is fully implemented in src/auth/appleAuth.ts but stays disabled
// here until the account holds a paid Apple Developer Program membership
// (required for the "Sign in with Apple" entitlement) — wire handleAppleLogin
// back to that module's signInWithApple() once that's in place.
const appleComingSoon = () =>
  showAlert('Coming soon', 'Apple sign-in is being set up and will be available shortly.');

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const login = useAppStore((s) => s.login);
  const loginWithOAuth = useAppStore((s) => s.loginWithOAuth);
  const { request: googleRequest, promptAsync: promptGoogleAsync, isConfigured: googleConfigured } = useGoogleAuthRequest();

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('Enter your email and password.');
      return;
    }
    setError(null);
    setSubmitting(true);
    try {
      await login(email.trim(), password);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      setError(err.message || 'Login failed');
    } finally {
      setSubmitting(false);
    }
  };

  const finishOAuthSignin = async (provider: 'google' | 'apple', idToken: string) => {
    setError(null);
    setSubmitting(true);
    try {
      await loginWithOAuth(provider, idToken);
      navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
    } catch (err: any) {
      if (err instanceof ApiError && err.code === 'NO_ACCOUNT') {
        showAlert('No account found', 'Please sign up first.', [
          { text: 'OK', onPress: () => navigation.navigate('Signup') },
        ]);
      } else {
        setError(err.message || 'Sign in failed');
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = async () => {
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
    await finishOAuthSignin('google', idToken);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <FadeSlideIn style={styles.header}>
          <Text style={styles.title}>Welcome back</Text>
        </FadeSlideIn>

        <FadeSlideIn delay={80} style={styles.socialGroup}>
          <AnimatedPressable style={styles.googleBtn} onPress={handleGoogleLogin} disabled={submitting || !googleRequest}>
            <GoogleIcon />
            <Text style={styles.googleBtnText}>Sign in with Google</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.appleBtn} onPress={appleComingSoon}>
            <AppleIcon />
            <Text style={styles.appleBtnText}>Sign in with Apple</Text>
          </AnimatedPressable>
        </FadeSlideIn>

        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        <FadeSlideIn delay={140} style={styles.form}>
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
              placeholder="Password"
              placeholderTextColor={Colors.pale}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
            <TouchableOpacity
              style={styles.forgotBtn}
              onPress={() => showAlert('Not available yet', 'Password reset email delivery is not configured in this build.')}
            >
              <Text style={styles.forgotText}>Forgot password?</Text>
            </TouchableOpacity>
          </View>
        </FadeSlideIn>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <AnimatedPressable style={styles.submitBtn} onPress={handleLogin} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.ink} /> : <Text style={styles.submitBtnText}>Log in</Text>}
        </AnimatedPressable>
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
    padding: 24,
    gap: 20,
  },
  backBtn: {
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    color: Colors.ink,
    fontWeight: '600',
  },
  header: {
    marginTop: 8,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  socialGroup: {
    gap: 10,
    marginTop: 16,
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
    marginTop: 4,
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
    gap: 16,
    marginTop: 0,
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
  forgotBtn: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  forgotText: {
    fontSize: 12,
    color: Colors.goldDark,
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
  },
  submitBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10,
  },
  submitBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
