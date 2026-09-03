import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { NEIGHBORHOODS, PREF_OPTIONS } from '../../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'Onboarding'>;

export const OnboardingScreen: React.FC<Props> = ({ navigation }) => {
  const [step, setStep] = useState(0);
  const {
    userName,
    setUserName,
    preferences,
    togglePreference,
    homeNeighborhood,
    setHomeNeighborhood,
    setLocationAllowed,
    locationAllowed,
  } = useAppStore();

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  const handleNext = () => {
    if (step < 3) {
      setStep(step + 1);
    } else {
      handleFinish();
    }
  };

  const handleBack = () => {
    if (step > 0) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Bar & Back */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn}>
            <Text style={styles.backText}>←</Text>
          </TouchableOpacity>
          <View style={styles.dotsContainer}>
            {[0, 1, 2, 3].map((i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  { backgroundColor: i <= step ? Colors.gold : Colors.line },
                ]}
              />
            ))}
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* STEP 0: Display Name & Photo */}
          {step === 0 && (
            <View style={styles.stepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>What should we call you?</Text>
                <Text style={styles.subtitle}>
                  Your display name is shown on your diary and to connections.
                </Text>
              </View>

              <View style={styles.avatarPlaceholder}>
                <Text style={styles.avatarText}>add photo</Text>
              </View>

              <TextInput
                style={styles.nameInput}
                value={userName}
                onChangeText={setUserName}
                placeholder="Display name"
                placeholderTextColor={Colors.pale}
              />
            </View>
          )}

          {/* STEP 1: Coffee Preferences */}
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Coffee preferences</Text>
                <Text style={styles.subtitle}>
                  Pick what you love — we'll surface matching cafes first.
                </Text>
              </View>

              <View style={styles.chipsContainer}>
                {PREF_OPTIONS.map((pref) => {
                  const isSelected = preferences.includes(pref);
                  return (
                    <TouchableOpacity
                      key={pref}
                      style={[
                        styles.chip,
                        isSelected && styles.chipActive,
                      ]}
                      onPress={() => togglePreference(pref)}
                    >
                      <Text
                        style={[
                          styles.chipText,
                          isSelected && styles.chipTextActive,
                        ]}
                      >
                        {pref}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 2: Home Neighbourhood */}
          {step === 2 && (
            <View style={styles.stepContainer}>
              <View style={styles.header}>
                <Text style={styles.title}>Your home neighbourhood</Text>
                <Text style={styles.subtitle}>
                  We use this if location is off, and as a fallback filter.
                </Text>
              </View>

              <View style={styles.listContainer}>
                {NEIGHBORHOODS.map((n) => {
                  const isSelected = homeNeighborhood === n;
                  return (
                    <TouchableOpacity
                      key={n}
                      style={[
                        styles.neighborhoodItem,
                        isSelected && styles.neighborhoodItemActive,
                      ]}
                      onPress={() => setHomeNeighborhood(n)}
                    >
                      <Text style={styles.neighborhoodText}>{n}</Text>
                      {isSelected && <Text style={styles.checkText}>✓</Text>}
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>
          )}

          {/* STEP 3: Location */}
          {step === 3 && (
            <View style={[styles.stepContainer, styles.centerStep]}>
              <View style={styles.locationIcon}>
                <Text style={styles.locationGlyph}>◎</Text>
              </View>
              <Text style={styles.title}>Enable location</Text>
              <Text style={[styles.subtitle, { textAlign: 'center' }]}>
                We'll use it to sort nearby cafes by distance. You can change this anytime.
              </Text>

              {locationAllowed === false && (
                <View style={styles.locationNote}>
                  <Text style={styles.locationNoteText}>
                    We'll sort cafes by your neighbourhood ({homeNeighborhood}) instead.
                  </Text>
                </View>
              )}

              <View style={styles.locationActions}>
                <TouchableOpacity
                  style={styles.primaryBtn}
                  onPress={() => {
                    setLocationAllowed(true);
                    handleFinish();
                  }}
                >
                  <Text style={styles.primaryBtnText}>Allow location</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.secondaryBtn}
                  onPress={() => {
                    setLocationAllowed(false);
                  }}
                >
                  <Text style={styles.secondaryBtnText}>Not now</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        {/* Bottom Continue Button for Steps 0-2 */}
        {(step < 3 || locationAllowed === false) && (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.primaryBtn} onPress={handleNext}>
              <Text style={styles.primaryBtnText}>Continue</Text>
            </TouchableOpacity>
          </View>
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
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  backBtn: {
    padding: 4,
  },
  backText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  dotsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  dot: {
    flex: 1,
    height: 4,
    borderRadius: 2,
  },
  content: {
    padding: 24,
  },
  stepContainer: {
    gap: 20,
  },
  centerStep: {
    alignItems: 'center',
    paddingTop: 30,
  },
  header: {
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mute,
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignSelf: 'center',
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 12,
  },
  avatarText: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.mute,
  },
  nameInput: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 10,
    padding: 14,
    fontSize: 15,
    backgroundColor: Colors.white,
    color: Colors.ink,
    textAlign: 'center',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginTop: 8,
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
  locationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.panel,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  locationGlyph: {
    fontSize: 26,
    color: Colors.gold,
  },
  locationNote: {
    backgroundColor: Colors.panel,
    padding: 12,
    borderRadius: 10,
    width: '100%',
  },
  locationNoteText: {
    fontSize: 13,
    color: Colors.goldDark,
    textAlign: 'center',
  },
  locationActions: {
    width: '100%',
    gap: 10,
    marginTop: 14,
  },
  primaryBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  secondaryBtn: {
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: Colors.mute,
    fontSize: 15,
    fontWeight: '600',
  },
  footer: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.line,
    backgroundColor: Colors.background,
  },
});
