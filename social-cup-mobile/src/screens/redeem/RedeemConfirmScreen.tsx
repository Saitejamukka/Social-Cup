import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { api, ApiCafe } from '../../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemConfirm'>;

export const RedeemConfirmScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, drinkId } = route.params;
  const { user, getCafe, generateRedemption } = useAppStore();
  const [cafe, setCafe] = useState<ApiCafe | undefined>(getCafe(cafeId));
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!cafe) api.getCafe(cafeId).then(setCafe);
  }, [cafeId]);

  const drink = cafe?.drinks.find((d) => d.id === drinkId);
  const credits = user?.credits ?? 0;
  const balanceAfter = drink ? Math.max(0, credits - drink.creditsCost) : credits;

  const handleConfirm = async () => {
    setSubmitting(true);
    setError(null);
    try {
      await generateRedemption(cafeId, drinkId);
      navigation.navigate('RedeemCode', { cafeId, drinkId });
    } catch (err: any) {
      setError(err.message || 'Could not generate a code — please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!cafe || !drink) {
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

        <Text style={styles.title}>Confirm redemption</Text>

        {/* Selected Drink Summary Card */}
        <View style={styles.drinkCard}>
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
          <View style={styles.drinkInfo}>
            <Text style={styles.drinkName}>{drink.name}</Text>
            <Text style={styles.cafeName}>{cafe.name}</Text>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.breakdownCard}>
          <View style={styles.breakdownRow}>
            <Text style={styles.label}>Credit cost</Text>
            <Text style={styles.valueBold}>{drink.creditsCost} credits</Text>
          </View>

          <View style={styles.breakdownRow}>
            <Text style={styles.label}>Current balance</Text>
            <Text style={styles.valueBold}>{credits} credits</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.breakdownRow}>
            <Text style={styles.label}>Balance after</Text>
            <Text style={styles.balanceAfterText}>{balanceAfter} credits</Text>
          </View>
        </View>

        <Text style={styles.validityNotice}>
          Your code will be valid for 5 minutes once generated. Credits are only deducted
          when the barista scans it.
        </Text>

        {error && <Text style={styles.errorText}>{error}</Text>}

        <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm} disabled={submitting}>
          {submitting ? (
            <ActivityIndicator color={Colors.ink} />
          ) : (
            <Text style={styles.confirmBtnText}>Confirm & generate code</Text>
          )}
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
    padding: 20,
    gap: 20,
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
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  drinkCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 14,
    borderRadius: 14,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  drinkThumb: {
    width: 56,
    height: 56,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkThumbText: {
    fontSize: 24,
  },
  drinkInfo: {
    gap: 4,
  },
  drinkName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  cafeName: {
    fontSize: 12,
    color: Colors.mute,
  },
  breakdownCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 16,
    gap: 12,
  },
  breakdownRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: Colors.mute,
  },
  valueBold: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.line,
  },
  balanceAfterText: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.gold,
  },
  validityNotice: {
    fontSize: 12,
    color: Colors.mute,
    textAlign: 'center',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
  },
  confirmBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  confirmBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
