import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Alert,
} from 'react-native';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, 'ProfileTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

export const ProfileScreen: React.FC<Props> = ({ navigation }) => {
  const {
    user,
    logout,
    deleteAccount,
    cancelMembership,
    locationAllowed,
    setLocationAllowed,
    offlineSim,
    setOfflineSim,
    notifReminders,
    notifRenewals,
    toggleNotifReminders,
    toggleNotifRenewals,
  } = useAppStore();

  const isMember = user?.accountStatus === 'MEMBER';

  const statusLabel =
    user?.accountStatus === 'MEMBER'
      ? 'Member'
      : user?.accountStatus === 'EXPIRED'
      ? 'Payment failed'
      : user?.accountStatus === 'CANCELED'
      ? 'Canceled'
      : 'Visitor';

  const statusColor = isMember ? Colors.success : Colors.pale;

  const handleLogout = async () => {
    await logout();
    (navigation as any).reset({ index: 0, routes: [{ name: 'Welcome' }] });
  };

  const handleCancelMembership = () => {
    Alert.alert(
      'Cancel membership?',
      'Your card is managed by Stripe in production; this build cancels immediately rather than at the end of the paid period.',
      [
        { text: 'Keep membership', style: 'cancel' },
        { text: 'Cancel membership', style: 'destructive', onPress: () => cancelMembership() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Delete your account?',
      'This cancels any active membership and cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete account',
          style: 'destructive',
          onPress: async () => {
            await deleteAccount();
            (navigation as any).reset({ index: 0, routes: [{ name: 'Welcome' }] });
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        {/* Profile Header */}
        <View style={styles.userHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarGlyph}>👤</Text>
          </View>
          <View>
            <Text style={styles.name}>{user?.name ?? ''}</Text>
            <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Member / Visitor Card */}
        {isMember ? (
          <View style={styles.creditCard}>
            <View style={styles.creditCardHeader}>
              <Text style={styles.creditNumber}>{user?.credits ?? 0}</Text>
              <Text style={styles.creditTotal}>/ 30 credits</Text>
            </View>
            <View style={styles.progressBarBg}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${Math.min(100, Math.round(((user?.credits ?? 0) / 30) * 100))}%` },
                ]}
              />
            </View>
            <Text style={styles.renewNote}>Resets monthly · no rollover</Text>
            <TouchableOpacity onPress={handleCancelMembership}>
              <Text style={styles.cancelMembershipText}>Cancel membership</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.visitorCard}>
            <Text style={styles.visitorTitle}>
              {user?.accountStatus === 'CANCELED' ? "You're no longer a member" : "You're browsing as a Visitor"}
            </Text>
            <Text style={styles.visitorDesc}>
              Subscribe to start redeeming drinks with monthly credits.
            </Text>
            <TouchableOpacity
              style={styles.membershipBtn}
              onPress={() => navigation.navigate('Membership')}
            >
              <Text style={styles.membershipBtnText}>See membership</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Settings & Links List */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('Social')}
          >
            <Text style={styles.settingLabel}>Connections & activity</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('ExploreTab')}
          >
            <Text style={styles.settingLabel}>Saved cafes</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Redemption reminders</Text>
            <Switch
              value={notifReminders}
              onValueChange={toggleNotifReminders}
              trackColor={{ false: Colors.line, true: Colors.gold }}
              thumbColor={Colors.white}
            />
          </View>

          <View style={styles.settingRow}>
            <Text style={styles.settingLabel}>Credit renewal alerts</Text>
            <Switch
              value={notifRenewals}
              onValueChange={toggleNotifRenewals}
              trackColor={{ false: Colors.line, true: Colors.gold }}
              thumbColor={Colors.white}
            />
          </View>
        </View>

        {/* Developer preview settings — exercise the PRD's required screen states */}
        <View style={styles.demoControlsBox}>
          <Text style={styles.demoHeading}>DEVELOPER PREVIEW SETTINGS</Text>
          <View style={styles.toggleRow}>
            <View style={styles.simItem}>
              <Text style={styles.simLabel}>Location</Text>
              <TouchableOpacity
                style={styles.simBtn}
                onPress={() => setLocationAllowed(locationAllowed === false ? true : false)}
              >
                <Text style={styles.simBtnText}>{locationAllowed === false ? 'Off' : 'On'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.simItem}>
              <Text style={styles.simLabel}>Network</Text>
              <TouchableOpacity style={styles.simBtn} onPress={() => setOfflineSim(!offlineSim)}>
                <Text style={styles.simBtnText}>{offlineSim ? 'Offline' : 'Online'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Logout / Delete */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
          <Text style={styles.logoutText}>Log out</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.deleteBtn} onPress={handleDeleteAccount}>
          <Text style={styles.deleteText}>Delete account</Text>
        </TouchableOpacity>
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
    gap: 20,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarGlyph: {
    fontSize: 24,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  status: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 2,
  },
  creditCard: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    padding: 16,
    gap: 10,
  },
  creditCardHeader: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
  },
  creditNumber: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.gold,
    fontFamily: 'serif',
  },
  creditTotal: {
    fontSize: 13,
    color: Colors.mute,
  },
  progressBarBg: {
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.panel,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: Colors.gold,
  },
  renewNote: {
    fontSize: 12,
    color: Colors.mute,
  },
  cancelMembershipText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.danger,
    marginTop: 4,
  },
  visitorCard: {
    backgroundColor: Colors.darkBg,
    borderRadius: 14,
    padding: 18,
    gap: 8,
  },
  visitorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  visitorDesc: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.65)',
    lineHeight: 18,
  },
  membershipBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 6,
  },
  membershipBtnText: {
    color: Colors.ink,
    fontSize: 13,
    fontWeight: '600',
  },
  settingsGroup: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 14,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.rowBorder,
  },
  settingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  arrow: {
    fontSize: 16,
    color: Colors.pale,
  },
  demoControlsBox: {
    borderWidth: 1,
    borderColor: Colors.demoBorder,
    borderStyle: 'dashed',
    borderRadius: 14,
    padding: 16,
    gap: 14,
  },
  demoHeading: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    color: Colors.pale,
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 20,
  },
  simItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  simLabel: {
    fontSize: 12,
    color: Colors.mute,
  },
  simBtn: {
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  simBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.ink,
  },
  logoutBtn: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  logoutText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.danger,
  },
  deleteBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  deleteText: {
    fontSize: 12,
    color: Colors.pale,
  },
});
