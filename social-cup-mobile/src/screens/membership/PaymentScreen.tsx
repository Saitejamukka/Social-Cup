import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ActivityIndicator } from 'react-native';
import { useStripe } from '@stripe/stripe-react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { BackButton } from '../../components/BackButton';
import { PillButton } from '../../theme/buttons';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { StripeSubscribeParams } from '../../api/client';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { PopIn } from '../../components/PopIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

export const PaymentScreen: React.FC<Props> = ({ navigation }) => {
  const [stage, setStage] = useState<'loading' | 'ready' | 'processing' | 'confirming' | 'success'>('loading');
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
    // Stripe confirms the payment client-side immediately, but our accountStatus/credits
    // only update once Stripe's webhook reaches the backend a moment later — poll until
    // that catches up instead of showing a stale Visitor state right after paying.
    setStage('confirming');
    await useAppStore.getState().waitForMembership();
    setStage('success');
  };

  const handleFinish = () => {
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {stage !== 'success' && (
          <BackButton style={styles.backBtn} onPress={() => navigation.goBack()} />
        )}

        {(stage === 'loading' || stage === 'ready' || stage === 'processing' || stage === 'confirming') && (
          <FadeSlideIn style={styles.formContainer}>
            <Text style={styles.title}>Membership</Text>
            <Text style={styles.subtitle}>$24.99/month · 30 drink credits</Text>

            {error && <Text style={styles.errorText}>{error}</Text>}

            {stage === 'loading' ? (
              <View style={styles.centerBox}>
                <ActivityIndicator size="large" color={Colors.gold} />
              </View>
            ) : (
              <AnimatedPressable
                style={[PillButton.primary, styles.payBtn]}
                onPress={handlePay}
                disabled={stage === 'processing' || stage === 'confirming'}
              >
                {stage === 'processing' ? (
                  <ActivityIndicator color={Colors.white} />
                ) : stage === 'confirming' ? (
                  <>
                    <ActivityIndicator color={Colors.white} />
                    <Text style={PillButton.primaryText}>Confirming your membership…</Text>
                  </>
                ) : (
                  <Text style={PillButton.primaryText}>Subscribe — $24.99/month</Text>
                )}
              </AnimatedPressable>
            )}
          </FadeSlideIn>
        )}

        {stage === 'success' && (
          <View style={styles.centerBox}>
            <PopIn style={styles.successBadge}>
              <Text style={styles.successCheck}>✓</Text>
            </PopIn>
            <FadeSlideIn delay={150} style={{ alignItems: 'center', gap: 16 }}>
              <Text style={styles.title}>You're a member!</Text>
              <Text style={styles.successSub}>30 drink credits have been added to your account.</Text>

              <AnimatedPressable style={[PillButton.primary, styles.doneBtn]} onPress={handleFinish}>
                <Text style={PillButton.primaryText}>Done</Text>
              </AnimatedPressable>
            </FadeSlideIn>
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
    alignSelf: 'flex-start',
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
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mute,
  },
  payBtn: {
    marginTop: 'auto',
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
    paddingHorizontal: 40,
    marginTop: 10,
  },
});
