import React, { useState } from 'react';
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
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { BackButton } from '../../components/BackButton';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { NEIGHBORHOODS, PREF_OPTIONS } from '../../data/mockData';
import { showAlert } from '../../utils/alert';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export const EditProfileScreen: React.FC<Props> = ({ navigation }) => {
  const { user, updateProfile } = useAppStore();
  const [name, setName] = useState(user?.name ?? '');
  const [neighborhood, setNeighborhood] = useState(user?.neighborhood ?? NEIGHBORHOODS[0]);
  const [preferences, setPreferences] = useState<string[]>(user?.preferences ?? []);
  const [saving, setSaving] = useState(false);

  const togglePreference = (pref: string) => {
    setPreferences((prev) => (prev.includes(pref) ? prev.filter((p) => p !== pref) : [...prev, pref]));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      showAlert('Name required', 'Enter a display name.');
      return;
    }
    setSaving(true);
    try {
      await updateProfile({ name: name.trim(), neighborhood, preferences });
      navigation.goBack();
    } catch (err: any) {
      showAlert('Could not save', err.message || 'Please try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.topBar}>
        <BackButton onPress={() => navigation.goBack()} />
        <Text style={styles.topBarTitle}>Edit profile</Text>
        <View style={styles.backBtnSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <FadeSlideIn style={styles.section}>
          <Text style={styles.label}>Display name</Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="Your name"
            placeholderTextColor={Colors.pale}
          />
        </FadeSlideIn>

        <FadeSlideIn delay={60} style={styles.section}>
          <Text style={styles.label}>Coffee preferences</Text>
          <Text style={styles.sublabel}>We'll surface matching cafes first.</Text>
          <View style={styles.chipsContainer}>
            {PREF_OPTIONS.map((pref) => {
              const isSelected = preferences.includes(pref);
              return (
                <TouchableOpacity
                  key={pref}
                  style={[styles.chip, isSelected && styles.chipActive]}
                  onPress={() => togglePreference(pref)}
                >
                  <Text style={[styles.chipText, isSelected && styles.chipTextActive]}>{pref}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeSlideIn>

        <FadeSlideIn delay={120} style={styles.section}>
          <Text style={styles.label}>Home neighborhood</Text>
          <Text style={styles.sublabel}>Used when location is off, and as a fallback filter.</Text>
          <View style={styles.listContainer}>
            {NEIGHBORHOODS.map((n) => {
              const isSelected = neighborhood === n;
              return (
                <TouchableOpacity
                  key={n}
                  style={[styles.neighborhoodItem, isSelected && styles.neighborhoodItemActive]}
                  onPress={() => setNeighborhood(n)}
                >
                  <Text style={styles.neighborhoodText}>{n}</Text>
                  {isSelected && <Text style={styles.checkText}>✓</Text>}
                </TouchableOpacity>
              );
            })}
          </View>
        </FadeSlideIn>
      </ScrollView>

      <View style={styles.footer}>
        <AnimatedPressable style={PillButton.primary} onPress={handleSave} disabled={saving}>
          {saving ? <ActivityIndicator color={Colors.white} /> : <Text style={PillButton.primaryText}>Save changes</Text>}
        </AnimatedPressable>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtnSpacer: {
    width: 40,
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: Fonts.display,
  },
  content: {
    padding: 24,
    gap: 28,
  },
  section: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.ink,
  },
  sublabel: {
    fontSize: 13,
    color: Colors.mute,
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    backgroundColor: Colors.white,
    color: Colors.ink,
    marginTop: 6,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 4,
  },
  chip: {
    paddingVertical: 12,
    paddingHorizontal: 18,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  chipActive: {
    backgroundColor: Colors.panel,
    borderColor: Colors.gold,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  chipTextActive: {
    color: Colors.goldDark,
  },
  listContainer: {
    gap: 8,
    marginTop: 4,
  },
  neighborhoodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.line,
    backgroundColor: Colors.white,
  },
  neighborhoodItemActive: {
    backgroundColor: Colors.panel,
    borderColor: Colors.gold,
  },
  neighborhoodText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.ink,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.goldDark,
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.background,
  },
});
