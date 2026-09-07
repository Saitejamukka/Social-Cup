import React from 'react';
import { View, Text, StyleSheet, ImageBackground } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80';

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      {/* Top Hero Section */}
      <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.heroSection} resizeMode="cover">
        <View style={styles.heroScrim} />
        <FadeSlideIn style={styles.heroContent}>
          <Text style={styles.heroWordmark}>Social Cup</Text>
          <Text style={styles.heroSubtext}>Real drinks at the city's best independent cafes</Text>
        </FadeSlideIn>
      </ImageBackground>

      {/* Bottom Action Section */}
      <View style={styles.bottomSection}>
        <FadeSlideIn delay={120} style={styles.titleContainer}>
          <Text style={styles.title}>Welcome to Social Cup</Text>
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  heroScrim: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(20, 22, 12, 0.42)',
  },
  heroContent: {
    alignItems: 'center',
    gap: 10,
  },
  heroWordmark: {
    fontSize: 48,
    color: Colors.white,
    fontFamily: Fonts.calligraphy,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  heroSubtext: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 13,
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
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
