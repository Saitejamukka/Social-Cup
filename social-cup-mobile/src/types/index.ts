// These mock-data types back only the Social/Meetup screen, which is Phase 2
// (out of scope per the PRD) and intentionally not wired to the real API.
export interface Drink {
  id: string;
  name: string;
  desc: string;
  credits: number;
  retail: number;
  rating: number;
  signature: boolean;
  type: string;
  image?: string;
}

export interface Cafe {
  id: string;
  name: string;
  neighborhood: string;
  distance: string;
  address: string;
  hours: string;
  open: boolean;
  rating: number;
  price: string;
  tags: string[];
  drinks: Drink[];
  image?: string;
  gallery?: string[];
}

export interface ActivityItem {
  id: string;
  name: string;
  text: string;
  when: string;
}

export type FailReasonKey = 'expired' | 'canceled';

export interface FailReason {
  label: string;
  title: string;
  message: string;
}
