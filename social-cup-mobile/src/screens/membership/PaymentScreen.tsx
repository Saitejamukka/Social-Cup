import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC<Props> = ({ navigation }) => {
  const [stage, setStage] = useState<'form' | 'processing' | 'success'>('form');
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');
  const { setAccount, setCredits } = useAppStore();

  const handlePay = () => {
    setStage('processing');
    setTimeout(() => {
      setAccount('member');
      setCredits(30);
      setStage('success');
    }, 1200);
  };

  const handleFinish = () => {
    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {stage !== 'success' && (
          <TouchableOpacity
            style={styles.backBtn}
            onPress={() => navigation.goBack()}
            disabled={stage === 'processing'}
          >
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}

        {/* STAGE 1: FORM */}
        {stage === 'form' && (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Payment</Text>

            <View style={styles.walletGroup}>
              <TouchableOpacity style={styles.applePayBtn} onPress={handlePay}>
                <Text style={styles.applePayText}>Pay with Apple Pay</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.googlePayBtn} onPress={handlePay}>
                <Text style={styles.googlePayText}>Pay with Google Pay</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.dividerRow}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>or pay with card</Text>
              <View style={styles.dividerLine} />
            </View>

            <View style={styles.inputsGroup}>
              <TextInput
                style={styles.input}
                placeholder="Card number"
                placeholderTextColor={Colors.pale}
                value={cardNumber}
                onChangeText={setCardNumber}
                keyboardType="numeric"
              />

              <View style={styles.rowInputs}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="MM / YY"
                  placeholderTextColor={Colors.pale}
                  value={expiry}
                  onChangeText={setExpiry}
                />
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  placeholder="CVC"
                  placeholderTextColor={Colors.pale}
                  value={cvc}
                  onChangeText={setCvc}
                  keyboardType="numeric"
                  secureTextEntry
                />
              </View>
            </View>

            <TouchableOpacity style={styles.payBtn} onPress={handlePay}>
              <Text style={styles.payBtnText}>Pay $24.99</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* STAGE 2: PROCESSING */}
        {stage === 'processing' && (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={Colors.gold} />
            <Text style={styles.processingText}>Confirming payment…</Text>
          </View>
        )}

        {/* STAGE 3: SUCCESS */}
        {stage === 'success' && (
          <View style={styles.centerBox}>
            <View style={styles.successBadge}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.title}>You're a member!</Text>
            <Text style={styles.successSub}>
              30 drink credits have been added to your account.
            </Text>

            <TouchableOpacity style={styles.doneBtn} onPress={handleFinish}>
              <Text style={styles.doneBtnText}>Done</Text>
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
    padding: 24,
  },
  backBtn: {
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  backBtnText: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.ink,
  },
  formContainer: {
    gap: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  walletGroup: {
    gap: 10,
  },
  applePayBtn: {
    backgroundColor: Colors.ink,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  applePayText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
  googlePayBtn: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  googlePayText: {
    color: Colors.ink,
    fontSize: 14,
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.line,
  },
  dividerText: {
    fontSize: 12,
    color: Colors.pale,
  },
  inputsGroup: {
    gap: 12,
  },
  input: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 10,
    padding: 13,
    fontSize: 14,
    color: Colors.ink,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  payBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  payBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
  },
  processingText: {
    fontSize: 14,
    color: Colors.mute,
  },
  successBadge: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  successCheck: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '700',
  },
  successSub: {
    fontSize: 14,
    lineHeight: 20,
    color: Colors.mute,
    textAlign: 'center',
  },
  doneBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 12,
    marginTop: 10,
  },
  doneBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
});
