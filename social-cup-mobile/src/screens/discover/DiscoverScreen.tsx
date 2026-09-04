import React, { useEffect } from 'react';
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
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { CafeCard } from '../../components/CafeCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'DiscoverTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const {
    user,
    offlineSim,
    setOfflineSim,
    locationAllowed,
    cafes,
    cafesLoading,
    fetchCafes,
  } = useAppStore();

  useEffect(() => {
    fetchCafes();
  }, [fetchCafes]);

  const handleSelectCafe = (cafeId: string) => {
    navigation.navigate('CafeDetail', { cafeId });
  };

  // Offline Simulation screen
  if (offlineSim) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.offlineContainer}>
          <Text style={styles.offlineIcon}>⚡</Text>
          <Text style={styles.offlineTitle}>You're offline</Text>
          <Text style={styles.offlineSubtitle}>
            Check your connection to see nearby cafes.
          </Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => {
              setOfflineSim(false);
              fetchCafes();
            }}
          >
            <Text style={styles.retryBtnText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const featuredCafes = cafes.filter((c) => c.isFeatured).slice(0, 3);
  const signatureDrinks = cafes.flatMap((c) =>
    c.drinks.filter((d) => d.isSignature).map((d) => ({ ...d, cafeName: c.name, cafeId: c.id }))
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Top Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good afternoon</Text>
            <Text style={styles.userName}>{user?.name ?? ''}</Text>
          </View>
          <TouchableOpacity
            style={styles.profileAvatar}
            onPress={() => navigation.navigate('ProfileTab')}
          >
            <Text style={styles.avatarGlyph}>👤</Text>
          </TouchableOpacity>
        </View>

        {/* Search trigger */}
        <TouchableOpacity
          style={styles.searchBar}
          onPress={() => navigation.navigate('ExploreTab')}
          activeOpacity={0.8}
        >
          <Text style={styles.searchIcon}>⌕</Text>
          <Text style={styles.searchPlaceholder}>Search cafes or neighbourhoods</Text>
        </TouchableOpacity>

        {/* Location denied notice */}
        {locationAllowed === false && (
          <View style={styles.locationNotice}>
            <Text style={styles.locationNoticeText}>
              Location off — showing cafes near {user?.neighborhood ?? 'your area'} instead.
            </Text>
          </View>
        )}

        {cafesLoading && cafes.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />
        ) : (
          <>
            {featuredCafes.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Featured cafes</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {featuredCafes.map((cafe) => (
                    <TouchableOpacity
                      key={cafe.id}
                      style={styles.featuredCard}
                      onPress={() => handleSelectCafe(cafe.id)}
                      activeOpacity={0.8}
                    >
                      {cafe.image ? (
                        <Image source={{ uri: cafe.image }} style={styles.featuredImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.featuredImage}>
                          <Text style={styles.featuredImageText}>☕ {cafe.name}</Text>
                        </View>
                      )}
                      <Text style={styles.featuredName}>{cafe.name}</Text>
                      <Text style={styles.featuredSub}>{cafe.neighborhood}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {signatureDrinks.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Signature drinks</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
                  {signatureDrinks.map((drink) => (
                    <TouchableOpacity
                      key={drink.id}
                      style={styles.signatureCard}
                      onPress={() => handleSelectCafe(drink.cafeId)}
                      activeOpacity={0.8}
                    >
                      <View style={styles.signatureImageWrapper}>
                        {drink.image ? (
                          <Image source={{ uri: drink.image }} style={styles.signatureImage} resizeMode="cover" />
                        ) : (
                          <View style={styles.signatureImage} />
                        )}
                        <View style={styles.signatureBadgeContainer}>
                          <Text style={styles.signatureBadge}>Signature</Text>
                        </View>
                      </View>
                      <Text style={styles.signatureName} numberOfLines={1}>
                        {drink.name}
                      </Text>
                      <Text style={styles.signatureSub}>
                        {drink.cafeName} · {drink.creditsCost} cr
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>New on Social Cup</Text>
              <View style={styles.cafeList}>
                {cafes.map((cafe) => (
                  <CafeCard
                    key={cafe.id}
                    cafe={cafe}
                    onPress={() => handleSelectCafe(cafe.id)}
                    showSaveButton
                  />
                ))}
              </View>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    padding: 20,
    gap: 22,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  greeting: {
    fontSize: 13,
    color: Colors.mute,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 18,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 13,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.pale,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: Colors.pale,
  },
  locationNotice: {
    backgroundColor: Colors.panel,
    padding: 10,
    borderRadius: 8,
  },
  locationNoticeText: {
    fontSize: 12,
    color: Colors.goldDark,
  },
  section: {
    gap: 10,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    color: Colors.mute,
  },
  horizontalScroll: {
    gap: 12,
    paddingBottom: 4,
  },
  featuredCard: {
    width: 190,
  },
  featuredImage: {
    width: 190,
    height: 120,
    borderRadius: 12,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  featuredImageText: {
    fontSize: 12,
    color: Colors.mute,
    textAlign: 'center',
  },
  featuredName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 8,
  },
  featuredSub: {
    fontSize: 12,
    color: Colors.mute,
    marginTop: 2,
  },
  signatureCard: {
    width: 130,
  },
  signatureImageWrapper: {
    position: 'relative',
    width: 130,
    height: 100,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.panel,
  },
  signatureImage: {
    width: '100%',
    height: '100%',
  },
  signatureBadgeContainer: {
    position: 'absolute',
    bottom: 6,
    left: 6,
  },
  signatureBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gold,
    backgroundColor: 'rgba(255,255,255,0.92)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  signatureName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
    marginTop: 8,
  },
  signatureSub: {
    fontSize: 11,
    color: Colors.mute,
    marginTop: 2,
  },
  cafeList: {
    gap: 12,
  },
  offlineContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    gap: 14,
  },
  offlineIcon: {
    fontSize: 34,
    color: Colors.pale,
  },
  offlineTitle: {
    fontSize: 19,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  offlineSubtitle: {
    fontSize: 14,
    color: Colors.mute,
    textAlign: 'center',
  },
  retryBtn: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  retryBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
});
