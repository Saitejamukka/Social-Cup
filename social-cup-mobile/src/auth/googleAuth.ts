import { useMemo } from 'react';
import { Platform } from 'react-native';
import * as AuthSession from 'expo-auth-session';
import * as WebBrowser from 'expo-web-browser';
import * as Crypto from 'expo-crypto';

WebBrowser.maybeCompleteAuthSession();

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

function clientIdForPlatform(): string {
  const ios = process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID;
  const android = process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID;
  const web = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID;
  const clientId = Platform.select({ ios, android, default: web }) || web || '';
  return clientId;
}

/**
 * Google's OIDC implicit flow (response_type=id_token) hands back a verifiable ID
 * token directly — no client secret needed. This works as-is on web (a normal
 * HTTPS/localhost redirect). Google no longer allows the old custom-URL-scheme
 * redirect this same flow used on native iOS/Android — those platforms need the
 * official @react-native-google-signin/google-signin SDK (a native module, so it
 * requires a custom dev build instead of Expo Go) before shipping for real.
 */
export function useGoogleAuthRequest() {
  const clientId = clientIdForPlatform();
  const redirectUri = Platform.OS === 'web' ? AuthSession.makeRedirectUri() : AuthSession.makeRedirectUri({ scheme: 'socialcup' });
  const nonce = useMemo(() => Crypto.randomUUID(), []);

  const [request, response, promptAsync] = AuthSession.useAuthRequest(
    {
      clientId,
      responseType: AuthSession.ResponseType.IdToken,
      // PKCE (code_challenge) only applies to the authorization-code flow — Google
      // rejects it outright on the implicit id_token flow we use here.
      usePKCE: false,
      scopes: ['openid', 'profile', 'email'],
      redirectUri,
      extraParams: { nonce },
    },
    discovery
  );

  return { request, response, promptAsync, isConfigured: Boolean(clientId) };
}

export function extractGoogleIdToken(response: AuthSession.AuthSessionResult | null): string | null {
  if (!response || response.type !== 'success') return null;
  return response.params.id_token ?? null;
}
