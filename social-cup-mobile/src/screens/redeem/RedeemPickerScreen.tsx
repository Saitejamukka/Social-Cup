import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { api, ApiCafe } from '../../api/client';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemPicker'>;

export const RedeemPickerScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId } = route.params;
  const { user, getCafe } = useAppStore();
  const [cafe, setCafe] = useState<ApiCafe | undefined>(getCafe(cafeId));

  useEffect(() => {
    if (!cafe) api.getCafe(cafeId).then(setCafe);
  }, [cafeId]);

  const credits = user?.credits ?? 0;

  const handlePickDrink = (drinkId: string) => {
    navigation.navigate('RedeemConfirm', { cafeId, drinkId });
  };

  if (!cafe) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.gold} />
      </SafeAreaView>
    );
  }

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
          <Text style={styles.title}>Redeem at {cafe.name}</Text>
          <Text style={styles.balance}>Your balance: {credits} credits</Text>
        </FadeSlideIn>

        <ScrollView contentContainerStyle={styles.list}>
          {cafe.drinks.map((drink, i) => {
            const canAfford = credits >= drink.creditsCost;
            return (
              <FadeSlideIn key={drink.id} delay={80 + i * 50}>
                <AnimatedPressable
                  style={[styles.drinkCard, !canAfford && styles.drinkCardDisabled]}
                  onPress={() => canAfford && handlePickDrink(drink.id)}
                  disabled={!canAfford}
                >
                  {drink.image ? (
                    <Image
                      source={{ uri: drink.image }}
                      style={styles.drinkThumb}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={styles.drinkThumb}>
                      <Text style={styles.drinkThumbText}>☕</Text>
                    </View>
                  )}

                  <View style={styles.drinkDetails}>
                    <Text style={styles.drinkName}>{drink.name}</Text>
                    <Text style={styles.drinkType}>{drink.category}</Text>
                  </View>

                  <View style={styles.costCol}>
                    <Text style={styles.creditCost}>{drink.creditsCost} cr</Text>
                    {!canAfford && (
                      <Text style={styles.notEnough}>Not enough</Text>
                    )}
                  </View>
                </AnimatedPressable>
              </FadeSlideIn>
            );
          })}
        </ScrollView>
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
    padding: 20,
    gap: 16,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  header: {
    gap: 4,
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  balance: {
    fontSize: 13,
    color: Colors.mute,
  },
  list: {
    gap: 10,
    marginTop: 8,
  },
  drinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  drinkCardDisabled: {
    opacity: 0.5,
  },
  drinkThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkThumbText: {
    fontSize: 20,
  },
  drinkDetails: {
    flex: 1,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  drinkType: {
    fontSize: 12,
    color: Colors.mute,
    marginTop: 2,
  },
  costCol: {
    alignItems: 'flex-end',
  },
  creditCost: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.gold,
  },
  notEnough: {
    fontSize: 10,
    color: Colors.danger,
    marginTop: 2,
  },
});
