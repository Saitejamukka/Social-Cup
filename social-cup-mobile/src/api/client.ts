import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// Android emulators can't reach the host machine via localhost — 10.0.2.2 is the
// documented loopback alias. iOS simulator and web both resolve localhost fine.
const DEFAULT_API_URL = Platform.OS === 'android' ? 'http://10.0.2.2:4000' : 'http://localhost:4000';
const API_URL = process.env.EXPO_PUBLIC_API_URL || DEFAULT_API_URL;

const TOKEN_KEY = 'sc_token';
let cachedToken: string | null | undefined;

export async function getToken(): Promise<string | null> {
  if (cachedToken === undefined) {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  }
  return cachedToken;
}

export async function setToken(token: string | null) {
  cachedToken = token;
  if (token) await AsyncStorage.setItem(TOKEN_KEY, token);
  else await AsyncStorage.removeItem(TOKEN_KEY);
}

export class ApiError extends Error {}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : null;

  if (!res.ok) {
    throw new ApiError((body && body.error) || `Request failed (${res.status})`);
  }
  return body as T;
}

export interface ApiUser {
  id: string;
  email: string;
  name: string;
  role: 'CUSTOMER' | 'BARISTA' | 'ADMIN';
  accountStatus: 'VISITOR' | 'MEMBER' | 'EXPIRED' | 'CANCELED';
  credits: number;
  neighborhood: string | null;
  preferences: string[];
}

export interface ApiDrink {
  id: string;
  name: string;
  description: string;
  creditsCost: number;
  retailPrice: number;
  isSignature: boolean;
  category: string;
  image: string | null;
  rating: number | null;
  ratingCount: number;
}

export interface ApiCafe {
  id: string;
  name: string;
  neighborhood: string;
  address: string;
  hours: string;
  open: boolean;
  price: string;
  isFeatured: boolean;
  tags: string[];
  image: string | null;
  gallery: string[];
  rating: number | null;
  ratingCount: number;
  lowestCreditPrice: number | null;
  drinks: ApiDrink[];
}

export interface ApiRedemption {
  id: string;
  code: string;
  backupCode: string;
  cafeId: string;
  drinkId: string;
  creditsCost: number;
  status: 'PENDING' | 'REDEEMED' | 'EXPIRED' | 'VOIDED';
  expiresAt: string;
  redeemedAt: string | null;
}

export interface ApiDiaryEntry {
  id: string;
  cafeId: string;
  cafeName: string;
  drinkId: string;
  drinkName: string;
  stars: number;
  note: string | null;
  date: string;
}

export const api = {
  async register(email: string, password: string, name: string) {
    const r = await request<{ token: string; user: ApiUser }>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, name }),
    });
    await setToken(r.token);
    return r.user;
  },

  async login(email: string, password: string) {
    const r = await request<{ token: string; user: ApiUser }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    await setToken(r.token);
    return r.user;
  },

  async logout() {
    await setToken(null);
  },

  me: () => request<{ user: ApiUser }>('/api/auth/me').then((r) => r.user),

  updateProfile: (data: { name?: string; neighborhood?: string; preferences?: string[] }) =>
    request<{ user: ApiUser }>('/api/auth/profile', { method: 'PATCH', body: JSON.stringify(data) }).then((r) => r.user),

  subscribe: () => request<{ user: ApiUser }>('/api/auth/subscribe', { method: 'POST' }).then((r) => r.user),

  cancelMembership: () => request<{ user: ApiUser }>('/api/auth/cancel', { method: 'POST' }).then((r) => r.user),

  deleteAccount: async () => {
    await request('/api/auth/account', { method: 'DELETE' });
    await setToken(null);
  },

  listCafes: (params: { neighborhood?: string; search?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<{ cafes: ApiCafe[] }>(`/api/cafes${qs ? `?${qs}` : ''}`).then((r) => r.cafes);
  },

  getCafe: (id: string) => request<{ cafe: ApiCafe }>(`/api/cafes/${id}`).then((r) => r.cafe),

  generateRedemption: (cafeId: string, drinkId: string) =>
    request<{ redemption: ApiRedemption; projectedRemainingCredits: number }>('/api/redemptions/generate', {
      method: 'POST',
      body: JSON.stringify({ cafeId, drinkId }),
    }),

  cancelRedemption: (id: string) => request('/api/redemptions/cancel', { method: 'POST', body: JSON.stringify({ id }) }),

  getActiveRedemption: () => request<{ redemption: ApiRedemption | null }>('/api/redemptions/active').then((r) => r.redemption),

  getRedemption: (id: string) => request<{ redemption: ApiRedemption }>(`/api/redemptions/${id}`).then((r) => r.redemption),

  submitReview: (cafeId: string, drinkId: string, stars: number, note?: string) =>
    request('/api/reviews', { method: 'POST', body: JSON.stringify({ cafeId, drinkId, stars, note }) }),

  getDiary: () => request<{ diary: ApiDiaryEntry[] }>('/api/reviews/me').then((r) => r.diary),
};
