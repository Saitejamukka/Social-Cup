import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Top Hero Section */}
      <View style={styles.heroSection}>
        <Text style={styles.heroText}>☕</Text>
        <Text style={styles.heroSubtext}>Real drinks at the city's best independent cafes</Text>
      </View>

      {/* Bottom Action Section */}
      <View style={styles.bottomSection}>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>Social Cup</Text>
          <Text style={styles.subtitle}>
            30 drink credits a month. Real drinks at the city's best independent cafes.
          </Text>
        </View>

        <View style={styles.buttonGroup}>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={() => navigation.navigate('Signup')}
            activeOpacity={0.85}
          >
            <Text style={styles.primaryBtnText}>Get started</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryBtn}
            onPress={() => navigation.navigate('Login')}
            activeOpacity={0.85}
          >
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.white,
  },
  heroSection: {
    flex: 1.1,
    backgroundColor: Colors.heroBg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  heroText: {
    fontSize: 54,
    marginBottom: 8,
  },
  heroSubtext: {
    color: Colors.mute,
    fontSize: 12,
    textAlign: 'center',
  },
  bottomSection: {
    flex: 1,
    padding: 32,
    justifyContent: 'space-between',
  },
  titleContainer: {
    gap: 10,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: Colors.mute,
  },
  buttonGroup: {
    gap: 12,
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.white,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
