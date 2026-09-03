import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyEmail'>;

export const VerifyEmailScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconText}>✉</Text>
        </View>

        <View style={styles.textContainer}>
          <Text style={styles.title}>Check your email</Text>
          <Text style={styles.subtitle}>
            We sent a verification link to your inbox. Tap it to confirm your address.
          </Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => navigation.navigate('Onboarding')}
        >
          <Text style={styles.primaryBtnText}>Continue</Text>
        </TouchableOpacity>

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
    fontFamily: 'serif',
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
