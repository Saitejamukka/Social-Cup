import React, { useMemo } from 'react';
import { View, Text, Image, StyleSheet, SafeAreaView, useWindowDimensions } from 'react-native';
import { Coffee, Leaf } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/ThemeContext';
import { ColorPalette } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { createPillButtonStyles } from '../../theme/buttons';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

// A barista pouring milk mid-latte-art — kept as a contained hero photo rather
// than a full-bleed background so the branding sits on the app's own cream
// surface instead of competing with the image for legibility.
const HERO_IMAGE =
  'https://images.unsplash.com/photo-1575883446992-61cb2d7d301c?w=1200&auto=format&fit=crop&q=80';

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  const { colors: Colors } = useTheme();
  const styles = useMemo(() => createStyles(Colors), [Colors]);
  const PillButton = useMemo(() => createPillButtonStyles(Colors), [Colors]);
  // Proportional to the viewport (capped) rather than a fixed height, so the
  // hero stays "visually important" on a small phone without ever crowding
  // the CTA off the bottom of a short screen.
  const { height } = useWindowDimensions();
  const heroHeight = Math.min(height * 0.34, 320);

  return (
    <SafeAreaView style={styles.safeArea}>
      {/* Purely decorative botanical/organic accents behind the content — echoes
          the cafe/plant motif without any icon, color, or asset borrowed from
          elsewhere; pointerEvents none so they never intercept touches. */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={[styles.blob, styles.blobTopLeft]} />
        <View style={[styles.blob, styles.blobBottomLeft]} />
        <View style={[styles.blob, styles.blobBottomRight]} />
        <Leaf color={Colors.gold} size={28} strokeWidth={1.6} style={styles.leafTopLeft} />
        <Leaf color={Colors.gold} size={32} strokeWidth={1.6} style={styles.leafBottomRight} />
      </View>

      <View style={styles.container}>
        <FadeSlideIn style={styles.brandBlock}>
          <Coffee color={Colors.ink} size={38} strokeWidth={1.6} />
          <Text style={styles.wordmark}>Social Cup</Text>
          <Text style={styles.tagline}>Discover. Sip. Share.</Text>
        </FadeSlideIn>

        <FadeSlideIn delay={100} style={styles.heroWrap}>
          <Image
            source={{ uri: HERO_IMAGE }}
            style={[styles.heroImage, { height: heroHeight }]}
            resizeMode="cover"
          />
        </FadeSlideIn>

        <FadeSlideIn delay={200} style={styles.bottomContent}>
          <Text style={styles.description}>
            Find the best coffee spots, explore new flavors, and connect with coffee lovers around you.
          </Text>

          <View style={styles.buttonGroup}>
            <AnimatedPressable style={PillButton.primary} onPress={() => navigation.navigate('Signup')}>
              <Text style={PillButton.primaryText}>Get Started  →</Text>
            </AnimatedPressable>

            <AnimatedPressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
              <Text style={styles.secondaryBtnText}>I already have an account</Text>
            </AnimatedPressable>
          </View>
        </FadeSlideIn>
      </View>
    </SafeAreaView>
  );
};

function createStyles(Colors: ColorPalette) {
  return StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 22,
  },
  brandBlock: {
    alignItems: 'center',
    gap: 8,
  },
  wordmark: {
    fontSize: 38,
    color: Colors.ink,
    fontFamily: Fonts.displayBold,
    letterSpacing: 0.3,
  },
  tagline: {
    color: Colors.mute,
    fontSize: 16,
    fontWeight: '500',
  },
  heroWrap: {
    // Fixed black regardless of theme — see the identical note in CustomTabBar.
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 20,
    elevation: 6,
  },
  heroImage: {
    width: '100%',
    borderRadius: 28,
    backgroundColor: Colors.panel,
  },
  bottomContent: {
    gap: 20,
  },
  description: {
    color: Colors.mute,
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 12,
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.mute,
    fontSize: 13,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  blob: {
    position: 'absolute',
    borderRadius: 999,
    backgroundColor: Colors.line,
    opacity: 0.55,
  },
  blobTopLeft: {
    width: 170,
    height: 170,
    top: -70,
    left: -70,
  },
  blobBottomLeft: {
    width: 190,
    height: 190,
    bottom: -90,
    left: -90,
  },
  blobBottomRight: {
    width: 150,
    height: 150,
    bottom: -60,
    right: -60,
  },
  leafTopLeft: {
    position: 'absolute',
    top: '22%',
    left: 14,
    transform: [{ rotate: '-18deg' }],
    opacity: 0.6,
  },
  leafBottomRight: {
    position: 'absolute',
    bottom: 86,
    right: 18,
    transform: [{ rotate: '24deg' }],
    opacity: 0.6,
  },
  });
}
