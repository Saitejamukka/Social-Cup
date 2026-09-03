import { create } from 'zustand';
import { AccountType, DiaryEntry, FailReasonKey } from '../types';
import { CAFES } from '../data/mockData';

interface AppState {
  // User & Account
  account: AccountType;
  userName: string;
  credits: number;
  homeNeighborhood: string;
  preferences: string[];
  locationAllowed: boolean | null;
  offlineSim: boolean;
  savedCafeIds: string[];
  diaryEntries: DiaryEntry[];
  notifReminders: boolean;
  notifRenewals: boolean;

  // Social & Meetup
  connectionsSelected: Record<string, boolean>;
  meetupSent: boolean;

  // Active Redemption
  selectedCafeId: string;
  selectedDrinkId: string | null;
  redeemCode: string;
  backupCode: string;
  timerSeconds: number;
  failReasonKey: FailReasonKey;

  // Rating Modal
  rateModalOpen: boolean;
  rateCafeId: string | null;
  rateDrinkId: string | null;
  rateStars: number;
  rateNote: string;

  // Actions
  setAccount: (account: AccountType) => void;
  setCredits: (credits: number) => void;
  setUserName: (name: string) => void;
  setHomeNeighborhood: (neighborhood: string) => void;
  togglePreference: (pref: string) => void;
  setLocationAllowed: (allowed: boolean | null) => void;
  setOfflineSim: (offline: boolean) => void;
  toggleSaveCafe: (cafeId: string) => void;

  // Redemption actions
  setSelectedCafeId: (cafeId: string) => void;
  setSelectedDrinkId: (drinkId: string | null) => void;
  generateRedemptionCode: (drinkCredits: number) => void;
  cancelRedemptionCode: (drinkCredits: number) => void;
  tickTimer: () => void;
  resetTimer: () => void;
  setFailReasonKey: (key: FailReasonKey) => void;

  // Diary & Rating actions
  openRateModal: (cafeId: string, drinkId: string, stars?: number, note?: string) => void;
  closeRateModal: () => void;
  setRateStars: (stars: number) => void;
  setRateNote: (note: string) => void;
  submitRating: () => void;

  // Notification toggles
  toggleNotifReminders: () => void;
  toggleNotifRenewals: () => void;

  // Social actions
  toggleConnection: (name: string) => void;
  sendMeetupInvite: () => void;
  resetMeetupInvite: () => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  // Defaults matching prototype
  account: 'visitor',
  userName: 'Jordan Avery',
  credits: 22,
  homeNeighborhood: 'Bishop Arts',
  preferences: ['Specialty brew', 'Cold brew'],
  locationAllowed: true,
  offlineSim: false,
  savedCafeIds: ['true-black', 'concu', 'subko-coffee'],
  diaryEntries: [
    {
      id: 'd1',
      cafeId: 'roastery-coffee-house',
      drinkId: 'cascara-brew',
      date: 'Aug 28',
      stars: 5,
      note: 'The best cascara in town.',
    },
    {
      id: 'd2',
      cafeId: 'true-black',
      drinkId: 'sea-salt-cold-brew',
      date: 'Aug 21',
      stars: 5,
      note: 'Signature sea salt caramel cold brew.',
    },
    {
      id: 'd3',
      cafeId: 'concu',
      drinkId: 'valrhona-hot-chocolate',
      date: 'Aug 14',
      stars: 5,
      note: 'Unmatched chocolate quality.',
    },
  ],
  notifReminders: true,
  notifRenewals: true,

  connectionsSelected: {},
  meetupSent: false,

  selectedCafeId: 'roastery-coffee-house',
  selectedDrinkId: 'cascara-brew',
  redeemCode: '4821',
  backupCode: '7K9X2B',
  timerSeconds: 300,
  failReasonKey: 'expired',

  rateModalOpen: false,
  rateCafeId: null,
  rateDrinkId: null,
  rateStars: 0,
  rateNote: '',

  setAccount: (account) =>
    set({
      account,
      credits: account === 'member' ? 30 : account === 'visitor' ? 22 : 0,
    }),
  setCredits: (credits) => set({ credits }),
  setUserName: (userName) => set({ userName }),
  setHomeNeighborhood: (homeNeighborhood) => set({ homeNeighborhood }),
  togglePreference: (pref) =>
    set((state) => ({
      preferences: state.preferences.includes(pref)
        ? state.preferences.filter((p) => p !== pref)
        : [...state.preferences, pref],
    })),
  setLocationAllowed: (locationAllowed) => set({ locationAllowed }),
  setOfflineSim: (offlineSim) => set({ offlineSim }),
  toggleSaveCafe: (cafeId) =>
    set((state) => ({
      savedCafeIds: state.savedCafeIds.includes(cafeId)
        ? state.savedCafeIds.filter((id) => id !== cafeId)
        : [...state.savedCafeIds, cafeId],
    })),

  setSelectedCafeId: (selectedCafeId) => set({ selectedCafeId }),
  setSelectedDrinkId: (selectedDrinkId) => set({ selectedDrinkId }),
  generateRedemptionCode: (drinkCredits) => {
    const randomCode = String(Math.floor(1000 + Math.random() * 9000));
    const randomBackup = Math.random().toString(36).substring(2, 8).toUpperCase();
    set((state) => ({
      redeemCode: randomCode,
      backupCode: randomBackup,
      credits: Math.max(0, state.credits - drinkCredits),
      timerSeconds: 300,
    }));
  },
  cancelRedemptionCode: (drinkCredits) => {
    set((state) => ({
      credits: state.credits + drinkCredits,
    }));
  },
  tickTimer: () =>
    set((state) => ({
      timerSeconds: Math.max(0, state.timerSeconds - 1),
    })),
  resetTimer: () => set({ timerSeconds: 300 }),
  setFailReasonKey: (failReasonKey) => set({ failReasonKey }),

  openRateModal: (cafeId, drinkId, stars = 0, note = '') =>
    set({
      rateModalOpen: true,
      rateCafeId: cafeId,
      rateDrinkId: drinkId,
      rateStars: stars,
      rateNote: note,
    }),
  closeRateModal: () =>
    set({
      rateModalOpen: false,
      rateCafeId: null,
      rateDrinkId: null,
      rateStars: 0,
      rateNote: '',
    }),
  setRateStars: (rateStars) => set({ rateStars }),
  setRateNote: (rateNote) => set({ rateNote }),
  submitRating: () => {
    const { rateCafeId, rateDrinkId, rateStars, rateNote, diaryEntries } = get();
    if (!rateCafeId || !rateDrinkId) return;

    const existingIndex = diaryEntries.findIndex(
      (e) => e.cafeId === rateCafeId && e.drinkId === rateDrinkId
    );

    let updated = [...diaryEntries];
    if (existingIndex >= 0) {
      updated[existingIndex] = {
        ...updated[existingIndex],
        stars: rateStars,
        note: rateNote,
        date: 'Today',
      };
    } else {
      updated.unshift({
        id: 'd_' + Date.now(),
        cafeId: rateCafeId,
        drinkId: rateDrinkId,
        date: 'Today',
        stars: rateStars,
        note: rateNote,
      });
    }

    set({
      diaryEntries: updated,
      rateModalOpen: false,
      rateCafeId: null,
      rateDrinkId: null,
      rateStars: 0,
      rateNote: '',
    });
  },

  toggleNotifReminders: () => set((state) => ({ notifReminders: !state.notifReminders })),
  toggleNotifRenewals: () => set((state) => ({ notifRenewals: !state.notifRenewals })),

  toggleConnection: (name) =>
    set((state) => ({
      connectionsSelected: {
        ...state.connectionsSelected,
        [name]: !state.connectionsSelected[name],
      },
    })),
  sendMeetupInvite: () => set({ meetupSent: true }),
  resetMeetupInvite: () => set({ meetupSent: false }),
}));
