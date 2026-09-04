export type RootStackParamList = {
  Welcome: undefined;
  Signup: undefined;
  Login: undefined;
  VerifyEmail: undefined;
  Onboarding: undefined;
  MainTabs: undefined;
  CafeDetail: { cafeId: string };
  RedeemPicker: { cafeId: string };
  RedeemConfirm: { cafeId: string; drinkId: string };
  RedeemCode: { cafeId: string; drinkId: string };
  RedeemSuccess: { cafeId: string; drinkId: string };
  RedeemFailed: { cafeId: string; reason?: 'expired' | 'canceled' };
  Membership: undefined;
  Payment: undefined;
  Social: undefined;
};

export type TabParamList = {
  DiscoverTab: undefined;
  ExploreTab: undefined;
  DiaryTab: undefined;
  ProfileTab: undefined;
};
