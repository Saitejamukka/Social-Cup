import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { api, ApiCafe } from '../../api/client';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { PopIn } from '../../components/PopIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemSuccess'>;

export const RedeemSuccessScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, drinkId } = route.params;
  const { user, getCafe, openRateModal } = useAppStore();
  const [cafe, setCafe] = useState<ApiCafe | undefined>(getCafe(cafeId));

  useEffect(() => {
    if (!cafe) api.getCafe(cafeId).then(setCafe);
  }, [cafeId]);

  const drink = cafe?.drinks.find((d) => d.id === drinkId);

  const handleRate = () => {
    openRateModal(cafeId, drinkId);
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleSkip = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <PopIn style={styles.checkCircle}>
          <Text style={styles.checkGlyph}>✓</Text>
        </PopIn>

        <FadeSlideIn delay={150} style={styles.textGroup}>
          <Text style={styles.title}>Redeemed</Text>
          {!cafe || !drink ? (
            <ActivityIndicator color={Colors.white} />
          ) : (
            <>
              <Text style={styles.subtitle}>
                {drink.name} · {cafe.name}
              </Text>

              <View style={styles.creditsRow}>
                <View style={styles.creditStat}>
                  <Text style={styles.creditVal}>-{drink.creditsCost}</Text>
                  <Text style={styles.creditLabel}>credits used</Text>
                </View>
                <View style={styles.creditStat}>
                  <Text style={[styles.creditVal, { color: Colors.gold }]}>{user?.credits ?? 0}</Text>
                  <Text style={styles.creditLabel}>remaining</Text>
                </View>
              </View>
            </>
          )}

          <AnimatedPressable style={[PillButton.primary, styles.primaryBtn]} onPress={handleRate}>
            <Text style={PillButton.primaryText}>Rate this drink</Text>
          </AnimatedPressable>

          <TouchableOpacity onPress={handleSkip} style={styles.skipBtn}>
            <Text style={styles.skipBtnText}>Skip to diary</Text>
          </TouchableOpacity>
        </FadeSlideIn>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.darkBg,
    justifyContent: 'center',
    padding: 32,
  },
  content: {
    alignItems: 'center',
    gap: 16,
  },
  textGroup: {
    alignItems: 'center',
    gap: 16,
  },
  checkCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  checkGlyph: {
    fontSize: 36,
    color: Colors.ink,
    fontWeight: '700',
  },
  title: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  creditsRow: {
    flexDirection: 'row',
    gap: 32,
    marginVertical: 14,
  },
  creditStat: {
    alignItems: 'center',
  },
  creditVal: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.white,
    fontFamily: Fonts.display,
  },
  creditLabel: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 2,
  },
  primaryBtn: {
    paddingHorizontal: 36,
    marginTop: 8,
  },
  skipBtn: {
    padding: 8,
  },
  skipBtnText: {
    color: 'rgba(255, 255, 255, 0.6)',
    fontSize: 13,
  },
});
