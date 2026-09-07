import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Top Hero Section */}
      <FadeSlideIn style={styles.heroSection}>
        <Text style={styles.heroText}>☕</Text>
        <Text style={styles.heroSubtext}>Real drinks at the city's best independent cafes</Text>
      </FadeSlideIn>

      {/* Bottom Action Section */}
      <View style={styles.bottomSection}>
        <FadeSlideIn delay={120} style={styles.titleContainer}>
          <Text style={styles.title}>Social Cup</Text>
          <Text style={styles.subtitle}>
            30 drink credits a month. Real drinks at the city's best independent cafes.
          </Text>
        </FadeSlideIn>

        <FadeSlideIn delay={220} style={styles.buttonGroup}>
          <AnimatedPressable style={styles.primaryBtn} onPress={() => navigation.navigate('Signup')}>
            <Text style={styles.primaryBtnText}>Get started</Text>
          </AnimatedPressable>

          <AnimatedPressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
            <Text style={styles.secondaryBtnText}>I already have an account</Text>
          </AnimatedPressable>
        </FadeSlideIn>
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
    fontFamily: Fonts.display,
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
