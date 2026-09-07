import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { useAppStore } from '../../store/useAppStore';
import { StripeSubscribeParams } from '../../api/client';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC<Props> = ({ navigation }) => {
  const [stage, setStage] = useState<'loading' | 'ready' | 'processing' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const startSubscription = useAppStore((s) => s.startSubscription);
  const { initPaymentSheet, presentPaymentSheet } = useStripe();
  // initPaymentSheet must run exactly once per fetched PaymentIntent — re-running it
  // (e.g. from a StrictMode double-render) against an already-initialized sheet errors.
  const initialized = useRef(false);

  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    (async () => {
      try {
        const result = await startSubscription();
        if ('reactivated' in result) {
          setStage('success');
          return;
        }

        const params = result as StripeSubscribeParams;
        const { error: initError } = await initPaymentSheet({
          merchantDisplayName: 'Social Cup',
          customerId: params.customerId,
          customerEphemeralKeySecret: params.ephemeralKeySecret,
          paymentIntentClientSecret: params.paymentIntentClientSecret,
          googlePay: {
            merchantCountryCode: 'US',
            testEnv: params.publishableKey.startsWith('pk_test_'),
          },
        });
        if (initError) {
          setError(initError.message);
          return;
        }
        setStage('ready');
      } catch (err: any) {
        setError(err.message || 'Could not start checkout');
      }
    })();
  }, []);

  const handlePay = async () => {
    setStage('processing');
    setError(null);
    const { error: presentError } = await presentPaymentSheet();
    if (presentError) {
      if (presentError.code !== 'Canceled') {
        setError(presentError.message);
      }
      setStage('ready');
      return;
    }
    await useAppStore.getState().refreshUser();
    setStage('success');
  };

  const handleFinish = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {stage !== 'success' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>
        )}

        {(stage === 'loading' || stage === 'ready' || stage === 'processing') && (
          <View style={styles.formContainer}>
            <Text style={styles.title}>Membership</Text>
            <Text style={styles.subtitle}>$24.99/month · 30 drink credits</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {stage === 'loading' ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Colors.gold} />
              </View>
            ) : (
              <TouchableOpacity
                style={styles.payBtn}
                onPress={handlePay}
                disabled={stage === 'processing'}
              >
                {stage === 'processing' ? (
                  <ActivityIndicator color={Colors.ink} />
                ) : (
                  <Text style={styles.payBtnText}>Subscribe — $24.99/month</Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}

        {stage === 'success' && (
          <View style={styles.centerBox}>
            <View style={styles.successBadge}>
              <Text style={styles.successCheck}>✓</Text>
            </View>
            <Text style={styles.title}>You're a member!</Text>
            <Text style={styles.successSub}>30 drink credits have been added to your account.</Text>

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
    flex: 1,
    gap: 20,
    marginTop: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.ink,
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mute,
  },
  payBtn: {
    backgroundColor: Colors.gold,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 'auto',
  },
  payBtnText: {
    color: Colors.ink,
    fontSize: 15,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 12,
    color: Colors.danger,
    textAlign: 'center',
  },
  centerBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    padding: 32,
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
