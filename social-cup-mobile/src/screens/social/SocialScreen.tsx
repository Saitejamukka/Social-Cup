import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { CAFES, CONNECTIONS, INITIAL_ACTIVITY } from '../../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Social'>;

export const SocialScreen: React.FC<Props> = ({ navigation }) => {
  const [activeTab, setActiveTab] = useState<'activity' | 'saved' | 'meetup'>('activity');
  const {
    savedCafeIds,
    connectionsSelected,
    toggleConnection,
    meetupSent,
    sendMeetupInvite,
  } = useAppStore();

  const savedCafes = CAFES.filter((c) => savedCafeIds.includes(c.id));
  const midpointCafe = CAFES.find((c) => c.id === 'true-black') || CAFES[0];

  const selectedConnectionNames = CONNECTIONS.filter((c) => connectionsSelected[c]);
  const inviteesLabel =
    selectedConnectionNames.length > 0
      ? selectedConnectionNames.join(', ')
      : 'your connections';

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Top Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Connections</Text>
        </View>

        {/* Tab Toggle */}
        <View style={styles.toggleBar}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeTab === 'activity' && styles.tabBtnActive,
            ]}
            onPress={() => setActiveTab('activity')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'activity' && styles.tabBtnTextActive,
              ]}
            >
              Activity
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
              Saved
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.tabBtn, activeTab === 'meetup' && styles.tabBtnActive]}
            onPress={() => setActiveTab('meetup')}
          >
            <Text
              style={[
                styles.tabBtnText,
                activeTab === 'meetup' && styles.tabBtnTextActive,
              ]}
            >
              Meetup
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* TAB 1: ACTIVITY */}
          {activeTab === 'activity' && (
            <View style={styles.activityList}>
              {INITIAL_ACTIVITY.map((item) => (
                <View key={item.id} style={styles.activityCard}>
                  <View style={styles.avatarMini}>
                    <Text style={styles.avatarGlyph}>👤</Text>
                  </View>
                  <View style={styles.activityTextCol}>
                    <Text style={styles.activityText}>
                      <Text style={styles.nameBold}>{item.name}</Text> {item.text}
                    </Text>
                    <Text style={styles.activityTime}>{item.when}</Text>
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* TAB 2: SAVED CAFES */}
          {activeTab === 'saved' && (
            <View style={styles.savedList}>
              {savedCafes.length === 0 ? (
                <Text style={styles.emptyNotice}>
                  No saved cafes yet. Save one from Explore.
                </Text>
              ) : (
                savedCafes.map((cafe) => (
                  <View key={cafe.id} style={styles.savedCard}>
                    <View style={styles.cafeThumb}>
                      <Text style={styles.cafeThumbText}>☕</Text>
                    </View>
                    <View>
                      <Text style={styles.savedCafeName}>{cafe.name}</Text>
                      <Text style={styles.savedCafeSub}>{cafe.neighborhood}</Text>
                      <Text style={styles.socialNote}>
                        2 connections have been here
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}

          {/* TAB 3: MEETUP */}
          {activeTab === 'meetup' && (
            <View style={styles.meetupContainer}>
              <Text style={styles.meetupDesc}>
                Invite connections and we'll suggest a midpoint cafe.
              </Text>

              {/* Connection Chips */}
              <View style={styles.connectionChipsRow}>
                {CONNECTIONS.map((name) => {
                  const selected = !!connectionsSelected[name];
                  return (
                    <TouchableOpacity
                      key={name}
                      style={[
                        styles.connChip,
                        selected && styles.connChipActive,
                      ]}
                      onPress={() => toggleConnection(name)}
                    >
                      <Text
                        style={[
                          styles.connChipText,
                          selected && styles.connChipTextActive,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Midpoint Suggestion Card */}
              <View style={styles.midpointCard}>
                <View style={styles.midpointThumb}>
                  <Text style={styles.midpointThumbText}>📍</Text>
                </View>
                <View>
                  <Text style={styles.midpointHeader}>Suggested midpoint</Text>
                  <Text style={styles.midpointName}>{midpointCafe.name}</Text>
                  <Text style={styles.midpointSub}>{midpointCafe.neighborhood}</Text>
                </View>
              </View>

              {meetupSent && (
                <View style={styles.sentBanner}>
                  <Text style={styles.sentText}>
                    ✓ Invite sent to {inviteesLabel}.
                  </Text>
                </View>
              )}

              <TouchableOpacity
                style={styles.inviteBtn}
                onPress={sendMeetupInvite}
              >
                <Text style={styles.inviteBtnText}>Send invite</Text>
              </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    padding: 4,
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  toggleBar: {
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
    fontSize: 12,
    fontWeight: '600',
    color: Colors.mute,
  },
  tabBtnTextActive: {
    color: Colors.ink,
  },
  content: {
    paddingBottom: 24,
  },
  activityList: {
    gap: 12,
  },
  activityCard: {
    flexDirection: 'row',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    alignItems: 'center',
  },
  avatarMini: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 16,
  },
  activityTextCol: {
    flex: 1,
  },
  activityText: {
    fontSize: 13,
    lineHeight: 18,
    color: Colors.ink,
  },
  nameBold: {
    fontWeight: '700',
  },
  activityTime: {
    fontSize: 11,
    color: Colors.pale,
    marginTop: 2,
  },
  savedList: {
    gap: 10,
  },
  emptyNotice: {
    textAlign: 'center',
    paddingVertical: 32,
    color: Colors.mute,
    fontSize: 13,
  },
  savedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  cafeThumb: {
    width: 52,
    height: 52,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cafeThumbText: {
    fontSize: 20,
  },
  savedCafeName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  savedCafeSub: {
    fontSize: 12,
    color: Colors.mute,
  },
  socialNote: {
    fontSize: 11,
    color: Colors.gold,
    marginTop: 2,
  },
  meetupContainer: {
    gap: 16,
  },
  meetupDesc: {
    fontSize: 13,
    color: Colors.mute,
    lineHeight: 18,
  },
  connectionChipsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  connChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  connChipActive: {
    backgroundColor: Colors.ink,
    borderColor: Colors.ink,
  },
  connChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.ink,
  },
  connChipTextActive: {
    color: Colors.white,
  },
  midpointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
  },
  midpointThumb: {
    width: 48,
    height: 48,
    borderRadius: 10,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  midpointThumbText: {
    fontSize: 22,
  },
  midpointHeader: {
    fontSize: 11,
    color: Colors.pale,
  },
  midpointName: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  midpointSub: {
    fontSize: 12,
    color: Colors.mute,
  },
  sentBanner: {
    backgroundColor: Colors.successBg,
    padding: 12,
    borderRadius: 10,
  },
  sentText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.success,
    textAlign: 'center',
  },
  inviteBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  inviteBtnText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
});
