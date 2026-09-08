import React, { useEffect, useRef, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView, ScrollView, ActivityIndicator } from 'react-native';
import { loadStripe, Stripe as StripeJs } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Colors } from '../../theme/colors';
import { Fonts } from '../../theme/typography';
import { useAppStore } from '../../store/useAppStore';
import { StripeSubscribeParams } from '../../api/client';
import { FadeSlideIn } from '../../components/FadeSlideIn';
import { PopIn } from '../../components/PopIn';
import { AnimatedPressable } from '../../components/AnimatedPressable';

type Props = NativeStackScreenProps<RootStackParamList, 'Payment'>;

// Stripe's native PaymentSheet (used on iOS/Android — see PaymentScreen.tsx) has no web
// implementation, so the web preview uses Stripe.js + Elements instead. Both confirm the
// exact same PaymentIntent created by POST /api/billing/subscribe, so this exercises the
// real backend subscribe -> webhook -> credit-grant flow, just with a web-native card form
// in place of the native sheet.
const CheckoutForm: React.FC<{ onSuccess: () => void }> = ({ onSuccess }) => {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handlePay = async () => {
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: 'if_required',
    });

    if (confirmError) {
      setError(confirmError.message ?? 'Payment failed');
      setSubmitting(false);
      return;
    }

    setConfirming(true);
    await useAppStore.getState().waitForMembership();
    onSuccess();
  };

  return (
    <ScrollView contentContainerStyle={styles.formContainer} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Membership</Text>
      <Text style={styles.subtitle}>$24.99/month · 30 drink credits</Text>

      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.elementBox}>
        <PaymentElement />
      </View>

      <AnimatedPressable style={styles.payBtn} onPress={handlePay} disabled={submitting || !stripe}>
        {submitting ? (
          <>
            <ActivityIndicator color={Colors.ink} />
            {confirming && <Text style={styles.payBtnText}>Confirming your membership…</Text>}
          </>
        ) : (
          <Text style={styles.payBtnText}>Subscribe — $24.99/month</Text>
        )}
      </AnimatedPressable>
    </ScrollView>
  );
};

export const PaymentScreen: React.FC<Props> = ({ navigation }) => {
  const [stage, setStage] = useState<'loading' | 'ready' | 'success'>('loading');
  const [error, setError] = useState<string | null>(null);
  const [stripePromise, setStripePromise] = useState<Promise<StripeJs | null> | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const startSubscription = useAppStore((s) => s.startSubscription);
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
        setStripePromise(loadStripe(params.publishableKey));
        setClientSecret(params.paymentIntentClientSecret);
        setStage('ready');
      } catch (err: any) {
        setError(err.message || 'Could not start checkout');
      }
    })();
  }, []);

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

        {stage === 'loading' && (
          <View style={styles.centerBox}>
            {error ? <Text style={styles.errorText}>{error}</Text> : <ActivityIndicator size="large" color={Colors.gold} />}
          </View>
        )}

        {stage === 'ready' && stripePromise && clientSecret && (
          <FadeSlideIn style={{ flex: 1 }}>
            <Elements stripe={stripePromise} options={{ clientSecret }}>
              <CheckoutForm onSuccess={() => setStage('success')} />
            </Elements>
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

              <AnimatedPressable style={styles.doneBtn} onPress={handleFinish}>
                <Text style={styles.doneBtnText}>Done</Text>
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
    fontFamily: Fonts.display,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.mute,
  },
  elementBox: {
    borderWidth: 1,
    borderColor: Colors.line,
    borderRadius: 12,
    padding: 16,
    backgroundColor: Colors.white,
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
