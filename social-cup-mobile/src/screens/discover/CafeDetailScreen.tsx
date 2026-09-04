import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Image,
  Dimensions,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { api, ApiCafe } from '../../api/client';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

type Props = NativeStackScreenProps<RootStackParamList, 'CafeDetail'>;

export const CafeDetailScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId } = route.params;
  const { user, openRateModal, getCafe } = useAppStore();
  const [cafe, setCafe] = useState<ApiCafe | undefined>(getCafe(cafeId));
  const [loading, setLoading] = useState(!cafe);

  useEffect(() => {
    if (!cafe) {
      api.getCafe(cafeId).then(setCafe).finally(() => setLoading(false));
    }
  }, [cafeId]);

  if (loading || !cafe) {
    return (
      <SafeAreaView style={styles.container}>
        <ActivityIndicator style={{ marginTop: 60 }} color={Colors.gold} />
      </SafeAreaView>
    );
  }

  const isMember = user?.accountStatus === 'MEMBER';
  const hasCredits = (user?.credits ?? 0) > 0;

  const handleRedeemPress = () => {
    if (!isMember) {
      navigation.navigate('Membership');
    } else {
      navigation.navigate('RedeemPicker', { cafeId: cafe.id });
    }
  };

  const openDirections = () => {
    const query = encodeURIComponent(cafe.address);
    Linking.openURL(`https://maps.google.com/?q=${query}`).catch(() =>
      Alert.alert('Could not open maps', 'No map application is available on this device.')
    );
  };

  const galleryImages = cafe.gallery && cafe.gallery.length > 0 ? cafe.gallery : [cafe.image || ''];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Photo Gallery Header Carousel */}
        <View style={styles.galleryWrapper}>
          <ScrollView horizontal pagingEnabled showsHorizontalScrollIndicator={false}>
            {galleryImages.map((imgUri, idx) => (
              <Image
                key={idx}
                source={{ uri: imgUri }}
                style={styles.galleryImage}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        </View>

        {/* Info Header */}
        <View style={styles.headerInfo}>
          <View style={styles.titleRow}>
            <Text style={styles.name}>{cafe.name}</Text>
            <View
              style={[
                styles.openBadge,
                { backgroundColor: cafe.open ? Colors.successBg : Colors.dangerBg },
              ]}
            >
              <Text
                style={[
                  styles.openText,
                  { color: cafe.open ? Colors.success : Colors.danger },
                ]}
              >
                {cafe.open ? 'Open now' : 'Closed'}
              </Text>
            </View>
          </View>

          <Text style={styles.metaText}>
            {cafe.neighborhood} · {cafe.address}
          </Text>
          <Text style={styles.metaText}>Hours: {cafe.hours}</Text>

          <View style={styles.ratingRow}>
            <Text style={styles.ratingText}>{cafe.rating !== null ? `★ ${cafe.rating.toFixed(1)}` : 'New on Social Cup'}</Text>
            <TouchableOpacity onPress={openDirections}>
              <Text style={styles.directionsLink}>Get directions →</Text>
            </TouchableOpacity>
          </View>

          {/* Vibe Tags */}
          <View style={styles.tagRow}>
            {cafe.tags.map((tag, i) => (
              <View key={i} style={styles.tagBadge}>
                <Text style={styles.tagText}>{tag}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* Menu Section */}
        <View style={styles.menuSection}>
          <Text style={styles.menuHeader}>Menu</Text>
          {cafe.drinks.map((drink) => (
            <View key={drink.id} style={styles.drinkRow}>
              {drink.image ? (
                <Image
                  source={{ uri: drink.image }}
                  style={styles.drinkThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.drinkThumbnail}>
                  <Text style={styles.drinkThumbIcon}>☕</Text>
                </View>
              )}

              <View style={styles.drinkInfo}>
                <View style={styles.drinkTitleRow}>
                  <Text style={styles.drinkName}>{drink.name}</Text>
                  {drink.isSignature && (
                    <View style={styles.signatureBadge}>
                      <Text style={styles.signatureText}>Signature</Text>
                    </View>
                  )}
                </View>

                <Text style={styles.drinkDesc}>{drink.description}</Text>

                <View style={styles.drinkFooter}>
                  <Text style={styles.drinkPrice}>
                    ${drink.retailPrice.toFixed(2)} · {drink.creditsCost} cr
                  </Text>

                  <View style={styles.ratingActionGroup}>
                    <Text style={styles.drinkRating}>
                      {drink.rating !== null ? `★ ${drink.rating.toFixed(1)}` : 'New'}
                    </Text>
                    <TouchableOpacity
                      style={styles.rateBtn}
                      onPress={() => openRateModal(cafe.id, drink.id)}
                    >
                      <Text style={styles.rateBtnText}>Rate</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Floating Bottom Bar */}
      <SafeAreaView style={styles.bottomBarWrapper}>
        <View style={styles.bottomBar}>
          {!isMember && (
            <Text style={styles.disabledNote}>
              Subscribe to redeem drinks with credits
            </Text>
          )}
          {isMember && !hasCredits && (
            <Text style={styles.disabledNote}>
              No credits remaining this month
            </Text>
          )}

          <TouchableOpacity
            style={[
              styles.redeemBtn,
              (!isMember || hasCredits)
                ? { backgroundColor: Colors.gold }
                : { backgroundColor: Colors.panel },
            ]}
            onPress={handleRedeemPress}
            disabled={isMember && !hasCredits}
          >
            <Text
              style={[
                styles.redeemBtnText,
                (!isMember || hasCredits)
                  ? { color: Colors.ink }
                  : { color: Colors.pale },
              ]}
            >
              {isMember ? 'Redeem a drink' : 'Become a member'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: 110,
  },
  galleryWrapper: {
    height: 240,
    width: '100%',
    backgroundColor: Colors.panel,
    position: 'relative',
    overflow: 'hidden',
  },
  galleryImage: {
    width: SCREEN_WIDTH,
    height: 240,
  },
  backBtn: {
    position: 'absolute',
    top: 50,
    left: 18,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backBtnText: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.ink,
  },
  headerInfo: {
    padding: 20,
    gap: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  name: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  openBadge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  openText: {
    fontSize: 11,
    fontWeight: '600',
  },
  metaText: {
    fontSize: 13,
    color: Colors.mute,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  ratingText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  directionsLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.goldDark,
  },
  tagRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 4,
  },
  tagBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: Colors.panel,
  },
  tagText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.goldDark,
  },
  menuSection: {
    paddingHorizontal: 20,
    gap: 14,
    marginTop: 8,
  },
  menuHeader: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.mute,
    marginBottom: 4,
  },
  drinkRow: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.line,
  },
  drinkThumbnail: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  drinkThumbIcon: {
    fontSize: 24,
  },
  drinkInfo: {
    flex: 1,
    gap: 3,
  },
  drinkTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  drinkName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.ink,
  },
  signatureBadge: {
    backgroundColor: Colors.panel,
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 6,
  },
  signatureText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
  },
  drinkDesc: {
    fontSize: 12,
    color: Colors.mute,
  },
  drinkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  drinkPrice: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  ratingActionGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  drinkRating: {
    fontSize: 12,
    color: Colors.mute,
  },
  rateBtn: {
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  rateBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },
  bottomBarWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: Colors.background,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
  },
  bottomBar: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 6,
  },
  disabledNote: {
    textAlign: 'center',
    fontSize: 12,
    color: Colors.mute,
  },
  redeemBtn: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  redeemBtnText: {
    fontSize: 15,
    fontWeight: '600',
  },
});
