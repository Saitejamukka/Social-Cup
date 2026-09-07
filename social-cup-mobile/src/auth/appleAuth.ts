import { Platform } from 'react-native';
import * as AppleAuthentication from 'expo-apple-authentication';

export async function isAppleAuthAvailable(): Promise<boolean> {
  if (Platform.OS !== 'ios') return false;
  return AppleAuthentication.isAvailableAsync();
}

export interface AppleSignInResult {
  identityToken: string;
  // Apple only returns the name on the very first authorization for a given app —
  // every subsequent sign-in gets null, so the caller must persist it from here.
  name: string | null;
}

/** Throws if the user cancels — callers should let that fail silently. */
export async function signInWithApple(): Promise<AppleSignInResult> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });

  if (!credential.identityToken) {
    throw new Error('Apple did not return an identity token');
  }

  const name = credential.fullName
    ? [credential.fullName.givenName, credential.fullName.familyName].filter(Boolean).join(' ').trim() || null
    : null;

  return { identityToken: credential.identityToken, name };
}

export function isAppleCancellation(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'ERR_REQUEST_CANCELED');
}
