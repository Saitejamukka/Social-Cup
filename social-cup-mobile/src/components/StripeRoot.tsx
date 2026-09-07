import React from 'react';
import { StripeProvider } from '@stripe/stripe-react-native';

// Native only (see StripeRoot.web.tsx) — @stripe/stripe-react-native wraps the native
// iOS/Android SDKs and has no web implementation at all, so it must never load on web.
export function StripeRoot({ children }: { children: React.ReactElement }) {
  const publishableKey = process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY || '';

  return (
    <StripeProvider publishableKey={publishableKey} urlScheme="socialcup">
      {children}
    </StripeProvider>
  );
}
