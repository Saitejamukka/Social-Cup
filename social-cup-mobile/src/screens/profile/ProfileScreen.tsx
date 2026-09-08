import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Switch,
  Image,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';
import { CompositeScreenProps } from '@react-navigation/native';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList, TabParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { showAlert } from '../../utils/alert';
import { FadeSlideIn } from '../../components/FadeSlideIn';

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
    updateProfile,
    locationAllowed,
    setLocationAllowed,
    offlineSim,
    setOfflineSim,
    notifReminders,
    notifRenewals,
    toggleNotifReminders,
    toggleNotifRenewals,
  } = useAppStore();

  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const isMember = user?.accountStatus === 'MEMBER';
  // Never in a real build, and hidden by default even in dev — set
  // EXPO_PUBLIC_SHOW_DEV_TOOLS=true in .env to bring the QA toggles back locally.
  const showDevTools = __DEV__ && process.env.EXPO_PUBLIC_SHOW_DEV_TOOLS === 'true';

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

  const handleChangePhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showAlert('Permission needed', 'Allow photo library access to set a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (result.canceled || !result.assets[0]) return;

    setUploadingPhoto(true);
    try {
      // Resize down before upload — a phone camera photo can be several MB, far more
      // than a ~56px avatar ever needs, and the backend caps the stored data URI size.
      // height: null (auto, preserving aspect ratio) throws on web's canvas-based
      // implementation, so the target height is computed explicitly instead.
      const asset = result.assets[0];
      const targetWidth = Math.min(512, asset.width);
      const targetHeight = Math.round((targetWidth / asset.width) * asset.height);
      const context = ImageManipulator.manipulate(asset.uri);
      context.resize({ width: targetWidth, height: targetHeight });
      const rendered = await context.renderAsync();
      const { base64 } = await rendered.saveAsync({ format: SaveFormat.JPEG, compress: 0.7, base64: true });
      await updateProfile({ photoUrl: `data:image/jpeg;base64,${base64}` });
    } catch (err: any) {
      showAlert('Could not update photo', err.message || 'Please try again.');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleCancelMembership = () => {
    showAlert(
      'Cancel membership?',
      'Your credits and redemptions keep working until the end of your current billing period, then your membership ends.',
      [
        { text: 'Keep membership', style: 'cancel' },
        { text: 'Cancel membership', style: 'destructive', onPress: () => cancelMembership() },
      ]
    );
  };

  const handleDeleteAccount = () => {
    const message = isMember
      ? `You have an active membership with ${user?.credits ?? 0} credit${
          user?.credits === 1 ? '' : 's'
        } remaining. Deleting your account will immediately cancel your membership and this cannot be undone.`
      : 'This cannot be undone.';

    showAlert(
      'Delete your account?',
      message,
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
        <FadeSlideIn style={styles.userHeader}>
          <TouchableOpacity style={styles.avatarWrapper} onPress={handleChangePhoto} disabled={uploadingPhoto}>
            <View style={styles.avatar}>
              {uploadingPhoto ? (
                <ActivityIndicator color={Colors.gold} />
              ) : user?.photoUrl ? (
                <Image source={{ uri: user.photoUrl }} style={styles.avatarImage} resizeMode="cover" />
              ) : (
                <Text style={styles.avatarGlyph}>👤</Text>
              )}
            </View>
            <View style={styles.avatarEditBadge}>
              <Text style={styles.avatarEditBadgeText}>✎</Text>
            </View>
          </TouchableOpacity>
          <View>
            <Text style={styles.name}>{user?.name ?? ''}</Text>
            <Text style={[styles.status, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </FadeSlideIn>

        {/* Member / Visitor Card */}
        {isMember ? (
          <FadeSlideIn delay={80} style={styles.creditCard}>
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
            {user?.subscriptionCancelAtPeriodEnd && user.subscriptionCurrentPeriodEnd ? (
              <Text style={styles.renewNote}>
                Cancels on {new Date(user.subscriptionCurrentPeriodEnd).toLocaleDateString()}
              </Text>
            ) : (
              <TouchableOpacity onPress={handleCancelMembership}>
                <Text style={styles.cancelMembershipText}>Cancel membership</Text>
              </TouchableOpacity>
            )}
          </FadeSlideIn>
        ) : (
          <FadeSlideIn delay={80} style={styles.visitorCard}>
            <Text style={styles.visitorTitle}>
              {user?.accountStatus === 'CANCELED' ? "You're no longer a member" : "You're browsing as a Visitor"}
            </Text>
            <Text style={styles.visitorDesc}>
              Subscribe to start redeeming drinks with monthly credits.
            </Text>
            <TouchableOpacity
              style={[PillButton.primary, styles.membershipBtn]}
              onPress={() => navigation.navigate('Membership')}
            >
              <Text style={PillButton.primaryText}>See membership</Text>
            </TouchableOpacity>
          </FadeSlideIn>
        )}

        {/* Settings & Links List */}
        <View style={styles.settingsGroup}>
          <TouchableOpacity
            style={styles.settingRow}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Text style={styles.settingLabel}>Edit profile</Text>
            <Text style={styles.arrow}>→</Text>
          </TouchableOpacity>

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

        {/* Developer preview settings — exercise the PRD's required screen states.
            Opt-in (EXPO_PUBLIC_SHOW_DEV_TOOLS=true in .env) and dev-build-only, so a
            stakeholder demo run via `npm run web` never shows this by default. */}
        {showDevTools && (
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
        )}

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
  avatarWrapper: {
    width: 56,
    height: 56,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImage: {
    width: '100%',
    height: '100%',
  },
  avatarGlyph: {
    fontSize: 24,
  },
  avatarEditBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    borderWidth: 2,
    borderColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadgeText: {
    fontSize: 10,
    color: Colors.ink,
  },
  name: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
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
    fontFamily: Fonts.display,
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
    marginTop: 6,
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
