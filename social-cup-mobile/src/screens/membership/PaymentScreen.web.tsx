import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

// Stripe's PaymentSheet is a native-only component (no web implementation), so the web
// preview build can't collect a real card here — see StripeRoot.web.tsx. Test the real
// checkout in the native Android/iOS build instead.
export const PaymentScreen: React.FC<Props> = ({ navigation }) => (
  <SafeAreaView style={styles.safeArea}>
    <View style={styles.container}>
      <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
        <Text style={styles.backBtnText}>←</Text>
      </TouchableOpacity>
      <View style={styles.centerBox}>
        <Text style={styles.title}>Payment isn't available in the web preview</Text>
        <Text style={styles.subtitle}>
          Stripe's payment sheet only runs in the native Android or iOS app. Open Social Cup on a device or emulator to subscribe.
        </Text>
      </View>
    </View>
  </SafeAreaView>
);

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.background },
  container: { flex: 1, padding: 24 },
  backBtn: { paddingVertical: 4, alignSelf: 'flex-start' },
  backBtnText: { fontSize: 22, fontWeight: '600', color: Colors.ink },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12, padding: 32 },
  title: { fontSize: 20, fontWeight: '600', color: Colors.ink, textAlign: 'center', fontFamily: Fonts.display },
  subtitle: { fontSize: 14, color: Colors.mute, textAlign: 'center', lineHeight: 20 },
});
