import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { NEIGHBORHOODS } from '../../data/mockData';
import { CafeCard } from '../../components/CafeCard';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ExploreTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ExploreScreen: React.FC<Props> = ({ navigation }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNeighborhood, setSelectedNeighborhood] = useState('All');
  const [activeTab, setActiveTab] = useState<'all' | 'saved'>('all');
  const { savedCafeIds, cafes, cafesLoading, fetchCafes } = useAppStore();

  const neighborhoodList = ['All', ...NEIGHBORHOODS];

  // Server-backed filtering: the PRD's neighbourhood filter + name search run on the API.
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
        <Text style={styles.title}>Explore</Text>

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

        {/* Results List */}
        <ScrollView contentContainerStyle={styles.listContent}>
          {cafesLoading ? (
            <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />
          ) : filtered.length === 0 ? (
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
          ) : (
            <View style={styles.cardList}>
              {filtered.map((cafe) => (
                <CafeCard
                  key={cafe.id}
                  cafe={cafe}
                  onPress={() => handleSelectCafe(cafe.id)}
                  showSaveButton
                />
              ))}
            </View>
          )}
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
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
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
  cardList: {
    gap: 12,
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
