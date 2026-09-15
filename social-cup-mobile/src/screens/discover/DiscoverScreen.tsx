import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  Image,
  ActivityIndicator,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { CafeCard } from '../../components/CafeCard';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';
import { useDragToScroll } from '../../utils/useDragToScroll';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'DiscoverTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

// Card width + gap define the snap interval so each swipe settles exactly
// one card over, with the image sliding continuously along with the drag.
const CARD_GAP = 12;
const FEATURED_CARD_WIDTH = 190;
const SIGNATURE_CARD_WIDTH = 130;
// The catalog can grow well past what a "teaser" row should ever show —
// unbounded here meant rendering dozens of unvirtualized cards in a plain
// horizontal ScrollView, which is what was causing the lag on real devices.
const MAX_SIGNATURE_DRINKS = 12;
const ITEM_GAP = 12;

const CATEGORY_TILE_WIDTH = 148;
const CATEGORY_GAP = 12;

// Each category maps to a `search` term that already matches a curated set of
// cafes' vibeTags on the backend (see admin.ts's name/vibeTags search) — tapping
// a tile jumps to Explore pre-filtered by it rather than filtering client-side,
// so it stays consistent with every other search entry point in the app.
const CATEGORIES: { label: string; query: string; image: string }[] = [
  { label: 'Rooftop Cafés', query: 'rooftop', image: 'https://images.unsplash.com/photo-1533777857889-4be7c70b33f7?w=400&auto=format&fit=crop&q=80' },
  { label: 'Comfy Cafés', query: 'comfy', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80' },
  { label: 'Best in Town', query: 'best in town', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80' },
  { label: 'Dine Under Trees', query: 'dine under trees', image: 'https://images.unsplash.com/photo-1521401830884-6c03c1c87ebb?w=400&auto=format&fit=crop&q=80' },
  { label: 'Work & WiFi', query: 'work & wifi', image: 'https://images.unsplash.com/photo-1521737604893-d14cc237f11d?w=400&auto=format&fit=crop&q=80' },
  { label: 'Late Night', query: 'late night', image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=400&auto=format&fit=crop&q=80' },
  { label: 'Pet Friendly', query: 'pet friendly', image: 'https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=400&auto=format&fit=crop&q=80' },
  { label: 'Instagrammable', query: 'instagrammable', image: 'https://images.unsplash.com/photo-1524712245354-2c4e5e7121c0?w=400&auto=format&fit=crop&q=80' },
];
// Rendered as stacked pairs so the grid reads as 2 rows that scroll horizontally
// together, matching the reference layout.
const CATEGORY_COLUMNS = Array.from({ length: Math.ceil(CATEGORIES.length / 2) }, (_, i) =>
  CATEGORIES.slice(i * 2, i * 2 + 2)
);

export const DiscoverScreen: React.FC<Props> = ({ navigation }) => {
  const {
    user,
    isConnected,
    offlineSim,
    setOfflineSim,
    locationAllowed,
    userCoords,
    distanceSortEnabled,
    setDistanceSortEnabled,
    cafes,
    cafesLoading,
    fetchCafes,
    setPendingExploreQuery,
  } = useAppStore();

  // Separate instances so dragging one carousel's DOM node never gets
  // confused with the other's on web.
  const featuredDrag = useDragToScroll();
  const signatureDrag = useDragToScroll();
  const categoryDrag = useDragToScroll();

  const canSortByDistance = locationAllowed === true && userCoords !== null;
  // offlineSim is a manual QA override on top of real device connectivity — see useAppStore.
  const isOffline = offlineSim || !isConnected;

  useEffect(() => {
    if (isOffline) return;
    fetchCafes(
      canSortByDistance && distanceSortEnabled
        ? { lat: userCoords!.latitude, lng: userCoords!.longitude }
        : undefined
    );
  }, [fetchCafes, isOffline, canSortByDistance, distanceSortEnabled, userCoords?.latitude, userCoords?.longitude]);

  const handleSelectCafe = (cafeId: string) => {
    navigation.navigate('CafeDetail', { cafeId });
  };

  const handleSelectCategory = (query: string) => {
    setPendingExploreQuery(query);
    navigation.navigate('ExploreTab');
  };

  const firstName = user?.name?.trim().split(/\s+/)[0] ?? 'there';

  if (isOffline) {
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
              // The manual QA override needs an explicit way back; real connectivity
              // recovers on its own via the NetInfo listener in RootNavigator.
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
  const signatureDrinks = cafes
    .flatMap((c) => c.drinks.filter((d) => d.isSignature).map((d) => ({ ...d, cafeName: c.name, cafeId: c.id })))
    .slice(0, MAX_SIGNATURE_DRINKS);

  const listHeader = (
    <View style={styles.headerBlock}>
      {/* Top Header */}
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.greeting}>Hi there!</Text>
          <Text style={styles.userName}>{user?.name ?? ''}</Text>
        </View>
        <TouchableOpacity
          style={styles.profileAvatar}
          onPress={() => navigation.navigate('ProfileTab')}
        >
          {user?.photoUrl ? (
            <Image source={{ uri: user.photoUrl }} style={styles.profileAvatarImage} resizeMode="cover" />
          ) : (
            <Text style={styles.avatarGlyph}>👤</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Search trigger */}
      <TouchableOpacity
        style={styles.searchBar}
        onPress={() => navigation.navigate('ExploreTab')}
        activeOpacity={0.8}
      >
        <Text style={styles.searchIcon}>⌕</Text>
        <Text style={styles.searchPlaceholder}>Search cafes or neighborhoods</Text>
      </TouchableOpacity>

      {/* What's on your mind — category shortcuts */}
      <View style={styles.section}>
        <Text style={styles.mindHeading}>{firstName}, what's on your mind?</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.horizontalScroll}
          snapToInterval={CATEGORY_TILE_WIDTH + CATEGORY_GAP}
          snapToAlignment="start"
          decelerationRate="fast"
          {...categoryDrag}
        >
          {CATEGORY_COLUMNS.map((column, colIdx) => (
            <View key={colIdx} style={styles.categoryColumn}>
              {column.map((cat, rowIdx) => (
                <FadeSlideIn key={cat.label} delay={(colIdx * 2 + rowIdx) * 50}>
                  <AnimatedPressable
                    style={styles.categoryTile}
                    onPress={() => handleSelectCategory(cat.query)}
                  >
                    <Text style={styles.categoryLabel} numberOfLines={2}>
                      {cat.label}
                    </Text>
                    <Image source={{ uri: cat.image }} style={styles.categoryImage} resizeMode="cover" />
                  </AnimatedPressable>
                </FadeSlideIn>
              ))}
            </View>
          ))}
        </ScrollView>
      </View>

      {/* Location denied notice */}
      {locationAllowed === false && (
        <View style={styles.locationNotice}>
          <Text style={styles.locationNoticeText}>
            Location off — showing cafes near {user?.neighborhood ?? 'your area'} instead.
          </Text>
        </View>
      )}

      {/* Distance sort toggle — only meaningful once we actually have coordinates */}
      {canSortByDistance && (
        <TouchableOpacity
          style={styles.distanceToggleRow}
          onPress={() => setDistanceSortEnabled(!distanceSortEnabled)}
          activeOpacity={0.7}
        >
          <Text style={styles.distanceToggleText}>Sort by distance</Text>
          <View style={[styles.toggleTrack, distanceSortEnabled && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, distanceSortEnabled && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>
      )}

      {cafesLoading && cafes.length === 0 ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />
      ) : (
        <>
          {featuredCafes.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Featured cafes</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
                snapToInterval={FEATURED_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                decelerationRate="fast"
                {...featuredDrag}
              >
                {featuredCafes.map((cafe, i) => (
                  <FadeSlideIn key={cafe.id} delay={i * 60}>
                    <AnimatedPressable style={styles.featuredCard} onPress={() => handleSelectCafe(cafe.id)}>
                      {cafe.image ? (
                        <Image source={{ uri: cafe.image }} style={styles.featuredImage} resizeMode="cover" />
                      ) : (
                        <View style={styles.featuredImage}>
                          <Text style={styles.featuredImageText}>☕ {cafe.name}</Text>
                        </View>
                      )}
                      <Text style={styles.featuredName}>{cafe.name}</Text>
                      <Text style={styles.featuredSub}>{cafe.neighborhood}</Text>
                    </AnimatedPressable>
                  </FadeSlideIn>
                ))}
              </ScrollView>
            </View>
          )}

          {signatureDrinks.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Signature drinks</Text>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalScroll}
                snapToInterval={SIGNATURE_CARD_WIDTH + CARD_GAP}
                snapToAlignment="start"
                decelerationRate="fast"
                {...signatureDrag}
              >
                {signatureDrinks.map((drink, i) => (
                  <FadeSlideIn key={drink.id} delay={i * 60}>
                    <AnimatedPressable style={styles.signatureCard} onPress={() => handleSelectCafe(drink.cafeId)}>
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
                    </AnimatedPressable>
                  </FadeSlideIn>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.sectionTitle}>New on Social Cup</Text>
        </>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <FlatList
        data={cafesLoading && cafes.length === 0 ? [] : cafes}
        keyExtractor={(c) => c.id}
        renderItem={({ item, index }) => (
          <FadeSlideIn delay={Math.min(index * 50, 300)}>
            <CafeCard cafe={item} onPress={() => handleSelectCafe(item.id)} showSaveButton />
          </FadeSlideIn>
        )}
        ItemSeparatorComponent={() => <View style={{ height: ITEM_GAP }} />}
        ListHeaderComponent={listHeader}
        contentContainerStyle={styles.container}
        // A plain map-over-array here used to mount all 59+ cafe cards (each with a
        // network image and its own entrance animation) at once — fine at the original
        // ~8-cafe scale, but visibly janky on a real phone once the catalog grew.
        // Windowing keeps only nearby rows mounted.
        initialNumToRender={8}
        maxToRenderPerBatch={8}
        updateCellsBatchingPeriod={50}
        windowSize={7}
        removeClippedSubviews
      />
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
  },
  headerBlock: {
    gap: 22,
    marginBottom: ITEM_GAP,
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
    fontFamily: Fonts.display,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  profileAvatarImage: {
    width: '100%',
    height: '100%',
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
  distanceToggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  distanceToggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  toggleTrack: {
    width: 40,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.line,
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackActive: {
    backgroundColor: Colors.gold,
  },
  toggleThumb: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.white,
  },
  toggleThumbActive: {
    transform: [{ translateX: 18 }],
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
    gap: CARD_GAP,
    paddingBottom: 4,
  },
  mindHeading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  categoryColumn: {
    gap: CATEGORY_GAP,
  },
  categoryTile: {
    width: CATEGORY_TILE_WIDTH,
    height: 168,
    borderRadius: 16,
    backgroundColor: Colors.panel,
    padding: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  categoryLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.ink,
    lineHeight: 19,
  },
  categoryImage: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 96,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
  featuredCard: {
    width: FEATURED_CARD_WIDTH,
  },
  featuredImage: {
    width: FEATURED_CARD_WIDTH,
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
    width: SIGNATURE_CARD_WIDTH,
  },
  signatureImageWrapper: {
    position: 'relative',
    width: SIGNATURE_CARD_WIDTH,
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
    fontFamily: Fonts.display,
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
