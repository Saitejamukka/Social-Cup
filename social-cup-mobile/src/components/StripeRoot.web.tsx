import React from 'react';

// Web build: @stripe/stripe-react-native has no web implementation, so this platform
// file (picked automatically by Metro on web) skips it entirely rather than crashing.
export function StripeRoot({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
