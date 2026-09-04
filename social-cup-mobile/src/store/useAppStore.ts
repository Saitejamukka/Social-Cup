import { create } from 'zustand';
import { api, ApiUser, ApiCafe, ApiDiaryEntry, ApiRedemption, getToken } from '../api/client';

interface AppState {
  // ---- Auth / session (backed by the real API) ----
  user: ApiUser | null;
  authLoading: boolean;
  authError: string | null;
  bootstrapAuth: () => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  updateProfile: (data: { name?: string; neighborhood?: string; preferences?: string[] }) => Promise<void>;
  subscribe: () => Promise<void>;
  cancelMembership: () => Promise<void>;
  deleteAccount: () => Promise<void>;

  // ---- Cafes (fetched from the real API) ----
  cafes: ApiCafe[];
  cafesLoading: boolean;
  fetchCafes: (params?: { neighborhood?: string; search?: string }) => Promise<void>;
  getCafe: (id: string) => ApiCafe | undefined;

  // ---- Drink diary (fetched from the real API) ----
  diary: ApiDiaryEntry[];
  diaryLoading: boolean;
  fetchDiary: () => Promise<void>;

  // ---- Active redemption (the member's live code, backed by the API) ----
  activeRedemption: ApiRedemption | null;
  generateRedemption: (cafeId: string, drinkId: string) => Promise<ApiRedemption>;
  cancelActiveRedemption: () => Promise<void>;
  refreshActiveRedemption: () => Promise<ApiRedemption | null>;

  // ---- Onboarding draft (collected before the profile is saved) ----
  draftPreferences: string[];
  toggleDraftPreference: (pref: string) => void;
  draftNeighborhood: string;
  setDraftNeighborhood: (n: string) => void;

  // ---- Local-only UI preferences (no backend — out of scope for phase 1) ----
  locationAllowed: boolean | null;
  setLocationAllowed: (allowed: boolean | null) => void;
  offlineSim: boolean;
  setOfflineSim: (offline: boolean) => void;
  savedCafeIds: string[];
  toggleSaveCafe: (cafeId: string) => void;
  // Connections/meetup are Phase 2 (out of scope) per the PRD — kept as inert local
  // state only so the existing Social screen still renders; never backed by the API.
  connectionsSelected: Record<string, boolean>;
  toggleConnection: (name: string) => void;
  meetupSent: boolean;
  sendMeetupInvite: () => void;
  resetMeetupInvite: () => void;
  notifReminders: boolean;
  notifRenewals: boolean;
  toggleNotifReminders: () => void;
  toggleNotifRenewals: () => void;

  // ---- Rate modal ----
  rateModalOpen: boolean;
  rateCafeId: string | null;
  rateDrinkId: string | null;
  rateStars: number;
  rateNote: string;
  openRateModal: (cafeId: string, drinkId: string, stars?: number, note?: string) => void;
  closeRateModal: () => void;
  setRateStars: (stars: number) => void;
  setRateNote: (note: string) => void;
  submitRating: () => Promise<void>;
}

export const useAppStore = create<AppState>((set, get) => ({
  user: null,
  authLoading: true,
  authError: null,

  bootstrapAuth: async () => {
    set({ authLoading: true });
    const token = await getToken();
    if (!token) {
      set({ user: null, authLoading: false });
      return;
    }
    try {
      const user = await api.me();
      set({ user, authLoading: false });
    } catch {
      await api.logout();
      set({ user: null, authLoading: false });
    }
  },

  login: async (email, password) => {
    set({ authError: null });
    try {
      const user = await api.login(email, password);
      set({ user });
    } catch (err: any) {
      set({ authError: err.message || 'Login failed' });
      throw err;
    }
  },

  register: async (email, password, name) => {
    set({ authError: null });
    try {
      const user = await api.register(email, password, name);
      set({ user });
    } catch (err: any) {
      set({ authError: err.message || 'Sign up failed' });
      throw err;
    }
  },

  logout: async () => {
    await api.logout();
    set({ user: null, activeRedemption: null, diary: [] });
  },

  refreshUser: async () => {
    const user = await api.me();
    set({ user });
  },

  updateProfile: async (data) => {
    const user = await api.updateProfile(data);
    set({ user });
  },

  subscribe: async () => {
    const user = await api.subscribe();
    set({ user });
  },

  cancelMembership: async () => {
    const user = await api.cancelMembership();
    set({ user });
  },

  deleteAccount: async () => {
    await api.deleteAccount();
    set({ user: null, activeRedemption: null, diary: [] });
  },

  cafes: [],
  cafesLoading: false,
  fetchCafes: async (params) => {
    set({ cafesLoading: true });
    try {
      const cafes = await api.listCafes(params);
      set({ cafes, cafesLoading: false });
    } catch {
      set({ cafesLoading: false });
    }
  },
  getCafe: (id) => get().cafes.find((c) => c.id === id),

  diary: [],
  diaryLoading: false,
  fetchDiary: async () => {
    set({ diaryLoading: true });
    try {
      const diary = await api.getDiary();
      set({ diary, diaryLoading: false });
    } catch {
      set({ diaryLoading: false });
    }
  },

  activeRedemption: null,
  generateRedemption: async (cafeId, drinkId) => {
    const { redemption } = await api.generateRedemption(cafeId, drinkId);
    set({ activeRedemption: redemption });
    return redemption;
  },
  cancelActiveRedemption: async () => {
    const current = get().activeRedemption;
    if (current) await api.cancelRedemption(current.id);
    set({ activeRedemption: null });
  },
  refreshActiveRedemption: async () => {
    if (!get().user) return null;
    const redemption = await api.getActiveRedemption();
    set({ activeRedemption: redemption });
    return redemption;
  },

  draftPreferences: [],
  toggleDraftPreference: (pref) =>
    set((state) => ({
      draftPreferences: state.draftPreferences.includes(pref)
        ? state.draftPreferences.filter((p) => p !== pref)
        : [...state.draftPreferences, pref],
    })),
  draftNeighborhood: 'Bishop Arts',
  setDraftNeighborhood: (draftNeighborhood) => set({ draftNeighborhood }),

  locationAllowed: null,
  setLocationAllowed: (locationAllowed) => set({ locationAllowed }),
  offlineSim: false,
  setOfflineSim: (offlineSim) => set({ offlineSim }),
  savedCafeIds: [],
  toggleSaveCafe: (cafeId) =>
    set((state) => ({
      savedCafeIds: state.savedCafeIds.includes(cafeId)
        ? state.savedCafeIds.filter((id) => id !== cafeId)
        : [...state.savedCafeIds, cafeId],
    })),
  connectionsSelected: {},
  toggleConnection: (name) =>
    set((state) => ({ connectionsSelected: { ...state.connectionsSelected, [name]: !state.connectionsSelected[name] } })),
  meetupSent: false,
  sendMeetupInvite: () => set({ meetupSent: true }),
  resetMeetupInvite: () => set({ meetupSent: false }),

  notifReminders: true,
  notifRenewals: true,
  toggleNotifReminders: () => set((state) => ({ notifReminders: !state.notifReminders })),
  toggleNotifRenewals: () => set((state) => ({ notifRenewals: !state.notifRenewals })),

  rateModalOpen: false,
  rateCafeId: null,
  rateDrinkId: null,
  rateStars: 0,
  rateNote: '',
  openRateModal: (cafeId, drinkId, stars = 0, note = '') =>
    set({ rateModalOpen: true, rateCafeId: cafeId, rateDrinkId: drinkId, rateStars: stars, rateNote: note || '' }),
  closeRateModal: () => set({ rateModalOpen: false, rateCafeId: null, rateDrinkId: null, rateStars: 0, rateNote: '' }),
  setRateStars: (rateStars) => set({ rateStars }),
  setRateNote: (rateNote) => set({ rateNote }),
  submitRating: async () => {
    const { rateCafeId, rateDrinkId, rateStars, rateNote } = get();
    if (!rateCafeId || !rateDrinkId || rateStars === 0) return;
    await api.submitReview(rateCafeId, rateDrinkId, rateStars, rateNote || undefined);
    set({ rateModalOpen: false, rateCafeId: null, rateDrinkId: null, rateStars: 0, rateNote: '' });
    await get().fetchDiary();
    await get().fetchCafes();
  },
}));
