import React from 'react';
import { View, Text, StyleSheet, ImageBackground, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Coffee } from 'lucide-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { PillButton } from '../../theme/buttons';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Welcome'>;

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1200&auto=format&fit=crop&q=80';

export const WelcomeScreen: React.FC<Props> = ({ navigation }) => {
  return (
    <ImageBackground source={{ uri: HERO_IMAGE }} style={styles.background} resizeMode="cover">
      <SafeAreaView style={styles.safeArea}>
        <FadeSlideIn style={styles.topContent}>
          <Coffee color={Colors.white} size={28} strokeWidth={1.8} />
          <Text style={styles.wordmark}>Social Cup</Text>
          <Text style={styles.tagline}>Discover. Sip. Share.</Text>
        </FadeSlideIn>

        <View style={styles.spacer} />

        <View style={styles.bottomWrap}>
          <LinearGradient
            colors={['transparent', 'rgba(53,42,36,0.88)']}
            style={styles.bottomScrim}
            pointerEvents="none"
          />
          <FadeSlideIn delay={150} style={styles.bottomContent}>
            <Text style={styles.description}>
              Find the best coffee spots, explore new flavors, and connect with coffee lovers around you.
            </Text>

            <FadeSlideIn delay={250} style={styles.buttonGroup}>
              <AnimatedPressable style={PillButton.primary} onPress={() => navigation.navigate('Signup')}>
                <Text style={PillButton.primaryText}>Get Started  →</Text>
              </AnimatedPressable>

              <AnimatedPressable style={styles.secondaryBtn} onPress={() => navigation.navigate('Login')}>
                <Text style={styles.secondaryBtnText}>I already have an account</Text>
              </AnimatedPressable>
            </FadeSlideIn>
          </FadeSlideIn>
        </View>
      </SafeAreaView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    backgroundColor: Colors.darkBg,
  },
  safeArea: {
    flex: 1,
  },
  topContent: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 28,
  },
  wordmark: {
    fontSize: 34,
    color: Colors.white,
    fontFamily: Fonts.displayBold,
    letterSpacing: 0.5,
    textShadowColor: 'rgba(0, 0, 0, 0.35)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 6,
  },
  tagline: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  spacer: {
    flex: 1,
  },
  bottomWrap: {
    justifyContent: 'flex-end',
  },
  bottomScrim: {
    position: 'absolute',
    left: 0,
    right: 0,
    top: -80,
    bottom: 0,
  },
  bottomContent: {
    paddingHorizontal: 28,
    paddingBottom: 28,
    gap: 20,
  },
  description: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 14,
    lineHeight: 21,
    textAlign: 'center',
  },
  buttonGroup: {
    gap: 14,
  },
  secondaryBtn: {
    paddingVertical: 8,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
});
