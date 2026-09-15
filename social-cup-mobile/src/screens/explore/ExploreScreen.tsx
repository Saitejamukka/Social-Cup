import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  FlatList,
  ActivityIndicator,
} from 'react-native';
import { CompositeScreenProps, useFocusEffect } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { NEIGHBORHOODS } from '../../data/mockData';
import { CafeCard } from '../../components/CafeCard';
import { FadeSlideIn } from '../../components/FadeSlideIn';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ExploreTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ExploreScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const { savedCafeIds, cafes, cafesLoading, fetchCafes, pendingExploreQuery, setPendingExploreQuery } = useAppStore();

  const neighborhoodList = ['All', ...NEIGHBORHOODS];

  // A Discover-screen category tile (e.g. "Rooftop Cafés") stashes its search term here
  // right before navigating in — pick it up each time this tab gains focus, then clear
  // it so a later manual visit to Explore doesn't re-apply a stale filter.
  useFocusEffect(
    useCallback(() => {
      if (pendingExploreQuery !== null) {
        setSearchQuery(pendingExploreQuery);
        setSelectedNeighborhood('All');
        setActiveTab('all');
        setPendingExploreQuery(null);
      }
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pendingExploreQuery])
  );

  // Server-backed filtering: the PRD's neighborhood filter + name search run on the API.
  useEffect(() => {
    const timeout = setTimeout(() => {
      fetchCafes({
        neighborhood: selectedNeighborhood === 'All' ? undefined : selectedNeighborhood,
        search: searchQuery || undefined,
      });
    }, 250);
    return () => clearTimeout(timeout);
  }, [selectedNeighborhood, searchQuery, fetchCafes]);

  const filtered = activeTab === 'saved' ? cafes.filter((c) => savedCafeIds.includes(c.id)) : cafes;

  const handleSelectCafe = (cafeId: string) => {
    navigation.navigate('CafeDetail', { cafeId });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedNeighborhood('All');
    setActiveTab('all');
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FadeSlideIn>
          <Text style={styles.title}>Explore</Text>
        </FadeSlideIn>

        {/* Search Input */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>⌕</Text>
          <TextInput
            style={styles.input}
            placeholder="Search cafes by name"
            placeholderTextColor={Colors.pale}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        {/* Neighborhood Chips */}
        <View style={styles.chipsWrapper}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.chipsScroll}
          >
            {neighborhoodList.map((n) => {
              const active = selectedNeighborhood === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.chip, active && styles.chipActive]}
                  onPress={() => setSelectedNeighborhood(n)}
                >
                  <Text style={[styles.chipText, active && styles.chipTextActive]}>
                    {n}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* All vs Saved Toggle */}
        <View style={styles.tabToggle}>
          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'all' && styles.tabBtnActive]}
            onPress={() => setActiveTab('all')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'all' && styles.tabBtnTextActive,
              ]}
            >
              All cafes
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'saved' && styles.tabBtnActive]}
            onPress={() => setActiveTab('saved')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'saved' && styles.tabBtnTextActive,
              ]}
            >
              Saved ({savedCafeIds.length})
            </Text>
          </TouchableOpacity>
        </View>

        {/* Results List — windowed since this can show the full catalog (dozens of
            cafes) with no filter applied; a plain ScrollView+map here mounted every
            card and its image at once, which is what made real-device scrolling janky. */}
        {cafesLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(cafe) => cafe.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item, index }) => (
              <FadeSlideIn delay={Math.min(index * 40, 240)}>
                <CafeCard cafe={item} onPress={() => handleSelectCafe(item.id)} showSaveButton />
              </FadeSlideIn>
            )}
            ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>☕</Text>
                <Text style={styles.emptyTitle}>No cafes match</Text>
                <Text style={styles.emptySub}>
                  Try clearing your search or neighborhood filters.
                </Text>
                <TouchableOpacity style={styles.clearBtn} onPress={clearFilters}>
                  <Text style={styles.clearBtnText}>Clear filters</Text>
                </TouchableOpacity>
              </View>
            }
            initialNumToRender={8}
            maxToRenderPerBatch={8}
            updateCellsBatchingPeriod={50}
            windowSize={7}
            removeClippedSubviews
          />
        )}
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  searchIcon: {
    fontSize: 16,
    color: Colors.pale,
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.ink,
  },
  chipsWrapper: {
    marginHorizontal: -20,
  },
  chipsScroll: {
    paddingHorizontal: 20,
    gap: 8,
  },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  chipTextActive: {
    color: Colors.white,
  },
  tabToggle: {
    flexDirection: 'row',
    backgroundColor: Colors.panel,
    borderRadius: 10,
    padding: 4,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 9,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabBtnActive: {
    backgroundColor: Colors.white,
  },
  tabBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.mute,
  },
  tabBtnTextActive: {
    color: Colors.ink,
  },
  listContent: {
    paddingBottom: 24,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 10,
  },
  emptyIcon: {
    fontSize: 32,
    color: Colors.pale,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.mute,
    textAlign: 'center',
  },
  clearBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    marginTop: 6,
  },
  clearBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
});
