import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Signup'>;

const notAvailable = () =>
  Alert.alert('Not available yet', 'Google and Apple sign-in are not set up in this build — please use email and password.');

export const SignupScreen: React.FC<Props> = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const register = useAppStore((s) => s.register);

  const handleSubmit = async () => {
    if (!name.trim() || !email.trim() || password.length < 8) {
      setError('Enter your name, email, and a password of at least 8 characters.');
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
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>

        <View style={styles.header}>
          <Text style={styles.title}>Create your account</Text>
          <Text style={styles.subtitle}>
            Free to browse, rate, and build your diary.
          </Text>
        </View>

        {/* Social Buttons */}
        <View style={styles.socialGroup}>
          <TouchableOpacity style={styles.googleBtn} onPress={notAvailable}>
            <View style={styles.socialDot} />
            <Text style={styles.googleBtnText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.appleBtn} onPress={notAvailable}>
            <View style={[styles.socialDot, { backgroundColor: Colors.white }]} />
            <Text style={styles.appleBtnText}>Continue with Apple</Text>
          </TouchableOpacity>
        </View>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <Text style={styles.dividerText}>or</Text>
          <View style={styles.dividerLine} />
        </View>

        {/* Form Inputs */}
        <View style={styles.form}>
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
        </View>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit} disabled={submitting}>
          {submitting ? <ActivityIndicator color={Colors.ink} /> : <Text style={styles.submitBtnText}>Create account</Text>}
        </TouchableOpacity>

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
    paddingVertical: 8,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    color: Colors.ink,
    fontWeight: '600',
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
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
  socialDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: Colors.line,
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
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
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
