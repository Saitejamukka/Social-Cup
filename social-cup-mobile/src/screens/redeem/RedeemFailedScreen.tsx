import React from 'react';
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
import { FAIL_REASONS } from '../../data/mockData';

type Props = NativeStackScreenProps<RootStackParamList, 'RedeemFailed'>;

export const RedeemFailedScreen: React.FC<Props> = ({ route, navigation }) => {
  const { cafeId, reason = 'expired' } = route.params;
  const currentReason = FAIL_REASONS[reason];

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.iconCircle}>
          <Text style={styles.iconGlyph}>✕</Text>
        </View>

        <Text style={styles.title}>{currentReason.title}</Text>
        <Text style={styles.message}>{currentReason.message}</Text>

        <TouchableOpacity
          style={styles.retryBtn}
          onPress={() => navigation.navigate('CafeDetail', { cafeId })}
        >
          <Text style={styles.retryBtnText}>Try again</Text>
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
    flexGrow: 1,
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dangerBg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconGlyph: {
    fontSize: 32,
    color: Colors.danger,
    fontWeight: '700',
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mute,
    textAlign: 'center',
    maxWidth: 280,
  },
  retryBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    paddingHorizontal: 36,
    borderRadius: 12,
    marginTop: 14,
  },
  retryBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
