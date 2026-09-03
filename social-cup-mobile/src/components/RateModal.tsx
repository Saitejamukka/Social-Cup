import React from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Pressable,
} from 'react-native';
import { Colors } from '../theme/colors';
import { useAppStore } from '../store/useAppStore';
import { CAFES } from '../data/mockData';

export const RateModal: React.FC = () => {
  const {
    rateModalOpen,
    rateCafeId,
    rateDrinkId,
    rateStars,
    rateNote,
    setRateStars,
    setRateNote,
    submitRating,
    closeRateModal,
  } = useAppStore();

  if (!rateModalOpen) return null;

  const cafe = CAFES.find((c) => c.id === rateCafeId);
  const drink = cafe?.drinks.find((d) => d.id === rateDrinkId);

  return (
    <Modal visible={rateModalOpen} transparent animationType="slide">
      <Pressable style={styles.overlay} onPress={closeRateModal}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          <View style={styles.header}>
            <Text style={styles.drinkName}>{drink?.name || 'Rate drink'}</Text>
            <Text style={styles.cafeName}>{cafe?.name || 'Partner Cafe'}</Text>
          </View>

          {/* Star Rating Selection */}
          <View style={styles.starsRow}>
            {[1, 2, 3, 4, 5].map((star) => (
              <TouchableOpacity
                key={star}
                onPress={() => setRateStars(star)}
                style={styles.starButton}
              >
                <Text
                  style={[
                    styles.starIcon,
                    { color: star <= rateStars ? Colors.gold : Colors.line },
                  ]}
                >
                  ★
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Review Note */}
          <TextInput
            style={styles.input}
            placeholder="Add a note (optional)"
            placeholderTextColor={Colors.pale}
            value={rateNote}
            onChangeText={setRateNote}
            maxLength={140}
            multiline
          />
          <Text style={styles.charCount}>{rateNote.length}/140</Text>

          {/* Submit */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              { backgroundColor: rateStars > 0 ? Colors.gold : Colors.panel },
            ]}
            onPress={submitRating}
            disabled={rateStars === 0}
          >
            <Text style={styles.submitBtnText}>Submit rating</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.cancelBtn} onPress={closeRateModal}>
            <Text style={styles.cancelBtnText}>Cancel</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(36, 28, 22, 0.55)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 16,
  },
  header: {
    alignItems: 'center',
    gap: 4,
  },
  drinkName: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  cafeName: {
    fontSize: 13,
    color: Colors.mute,
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginVertical: 4,
  },
  starButton: {
    padding: 4,
  },
  starIcon: {
    fontSize: 34,
  },
  input: {
    minHeight: 68,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 14,
    color: Colors.ink,
    textAlignVertical: 'top',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: Colors.pale,
    marginTop: -8,
  },
  submitBtn: {
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 4,
  },
  cancelBtnText: {
    color: Colors.mute,
    fontSize: 13,
  },
});
