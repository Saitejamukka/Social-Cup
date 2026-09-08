import { useEffect } from 'react';
import {
  View,
  Text,
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
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'DiaryTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const DiaryScreen: React.FC<Props> = ({ navigation }) => {
  const { diary, diaryLoading, fetchDiary, openRateModal } = useAppStore();

  useEffect(() => {
    fetchDiary();
  }, [fetchDiary]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <FadeSlideIn style={styles.header}>
          <Text style={styles.title}>Your drink diary</Text>
          <Text style={styles.count}>
            {diary.length} drink{diary.length === 1 ? '' : 's'} rated
          </Text>
        </FadeSlideIn>

        {diaryLoading && diary.length === 0 ? (
          <ActivityIndicator style={{ marginTop: 40 }} color={Colors.gold} />
        ) : diary.length === 0 ? (
          <FadeSlideIn delay={80} style={styles.emptyState}>
            <View style={styles.emptyCircle}>
              <Text style={styles.emptyIcon}>☕</Text>
            </View>
            <Text style={styles.emptyTitle}>No drinks rated yet</Text>
            <Text style={styles.emptySub}>
              Rate a drink to start your personal coffee diary.
            </Text>
            <AnimatedPressable
              style={[PillButton.primary, styles.exploreBtn]}
              onPress={() => navigation.navigate('DiscoverTab')}
            >
              <Text style={PillButton.primaryText}>Explore cafes</Text>
            </AnimatedPressable>
          </FadeSlideIn>
        ) : (
          <ScrollView contentContainerStyle={styles.list}>
            {diary.map((entry, i) => {
              const starsText = '★'.repeat(entry.stars) + '☆'.repeat(5 - entry.stars);

              return (
                <FadeSlideIn key={entry.id} delay={Math.min(i * 50, 300)}>
                  <AnimatedPressable
                    style={styles.entryCard}
                    onPress={() => openRateModal(entry.cafeId, entry.drinkId, entry.stars, entry.note ?? undefined)}
                  >
                    <View style={styles.drinkThumb}>
                      <Text style={styles.drinkThumbText}>☕</Text>
                    </View>

                    <View style={styles.entryContent}>
                      <Text style={styles.drinkName}>{entry.drinkName}</Text>
                      <Text style={styles.meta}>
                        {entry.cafeName} · {new Date(entry.date).toLocaleDateString()}
                      </Text>
                      <Text style={styles.stars}>{starsText}</Text>
                      {entry.note ? <Text style={styles.note}>"{entry.note}"</Text> : null}
                    </View>
                  </AnimatedPressable>
                </FadeSlideIn>
              );
            })}
          </ScrollView>
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
  header: {
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  count: {
    fontSize: 13,
    color: Colors.mute,
  },
  list: {
    gap: 12,
    paddingBottom: 24,
  },
  entryCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
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
    fontSize: 22,
  },
  entryContent: {
    flex: 1,
    gap: 3,
  },
  drinkName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  meta: {
    fontSize: 12,
    color: Colors.mute,
  },
  stars: {
    fontSize: 14,
    color: Colors.gold,
  },
  note: {
    fontSize: 12,
    color: Colors.mute,
    fontStyle: 'italic',
    marginTop: 2,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 40,
    gap: 12,
  },
  emptyCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 4,
  },
  emptyIcon: {
    fontSize: 30,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: Colors.ink,
  },
  emptySub: {
    fontSize: 13,
    color: Colors.mute,
    textAlign: 'center',
  },
  exploreBtn: {
    paddingHorizontal: 28,
    marginTop: 6,
  },
});
