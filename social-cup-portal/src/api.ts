const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

let authToken: string | null = localStorage.getItem('sc_admin_token');

export function setAuthToken(token: string | null) {
  authToken = token;
  if (token) localStorage.setItem('sc_admin_token', token);
  else localStorage.removeItem('sc_admin_token');
}

export function getAuthToken() {
  return authToken;
}

async function request<T>(
  path: string,
  options: RequestInit & { deviceToken?: string } = {}
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (authToken) headers['Authorization'] = `Bearer ${authToken}`;
  if (options.deviceToken) headers['X-Device-Token'] = options.deviceToken;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const contentType = res.headers.get('content-type') || '';
  const body = contentType.includes('application/json') ? await res.json() : await res.text();

  if (!res.ok) {
    const message = typeof body === 'object' && body && 'error' in body ? (body as any).error : 'Request failed';
    throw new Error(message);
  }
  return body as T;
}

// ---------------- Auth ----------------
export const api = {
  login: (email: string, password: string) =>
    request<{ success: true; token: string; user: any }>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  me: () => request<{ success: true; user: any }>('/api/auth/me'),

  // ---------------- Public ----------------
  listPublicCafes: () => request<{ success: true; cafes: any[] }>('/api/cafes'),

  // ---------------- Admin: dashboard ----------------
  adminMetrics: () => request<{ success: true; metrics: any }>('/api/admin/metrics'),

  // ---------------- Admin: cafes ----------------
  adminListCafes: () => request<{ success: true; cafes: any[] }>('/api/admin/cafes'),
  adminCreateCafe: (data: any) =>
    request<{ success: true; cafe: any }>('/api/admin/cafes', { method: 'POST', body: JSON.stringify(data) }),
  adminUpdateCafe: (id: string, data: any) =>
    request<{ success: true; cafe: any }>(`/api/admin/cafes/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminDeleteCafe: (id: string) => request<{ success: true }>(`/api/admin/cafes/${id}`, { method: 'DELETE' }),
  adminResetPin: (id: string) =>
    request<{ success: true; pinCode: string }>(`/api/admin/cafes/${id}/reset-pin`, { method: 'POST' }),

  // ---------------- Admin: drinks ----------------
  adminCreateDrink: (cafeId: string, data: any) =>
    request<{ success: true; drink: any }>(`/api/admin/cafes/${cafeId}/drinks`, {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  adminUpdateDrink: (id: string, data: any) =>
    request<{ success: true; drink: any }>(`/api/admin/drinks/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  adminDeleteDrink: (id: string) => request<{ success: true }>(`/api/admin/drinks/${id}`, { method: 'DELETE' }),

  // ---------------- Admin: members ----------------
  adminListMembers: () => request<{ success: true; members: any[] }>('/api/admin/members'),
  adminSetMemberStatus: (id: string, status: string) =>
    request<{ success: true; member: any }>(`/api/admin/members/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  // ---------------- Admin: redemptions ----------------
  adminListRedemptions: (params: { cafeId?: string; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return request<{ success: true; redemptions: any[] }>(`/api/admin/redemptions${qs ? `?${qs}` : ''}`);
  },
  adminVoidRedemption: (id: string, reason: string) =>
    request<{ success: true }>(`/api/admin/redemptions/${id}/void`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    }),
  adminExportRedemptionsUrl: (params: { cafeId?: string; from?: string; to?: string } = {}) => {
    const qs = new URLSearchParams(Object.entries(params).filter(([, v]) => v) as [string, string][]).toString();
    return `${API_URL}/api/admin/redemptions/export${qs ? `?${qs}` : ''}`;
  },

  // ---------------- Admin: payouts ----------------
  adminListPayouts: (period: string) =>
    request<{ success: true; payouts: any[] }>(`/api/admin/payouts?period=${period}`),
  adminPayCafe: (cafeId: string, period: string, amount: number, reference: string) =>
    request<{ success: true; payout: any }>(`/api/admin/payouts/${cafeId}/pay`, {
      method: 'POST',
      body: JSON.stringify({ period, amount, reference }),
    }),

  // ---------------- Barista ----------------
  baristaVerifyPin: (cafeId: string, pin: string) =>
    request<{ success: true; deviceToken: string; cafe: any }>('/api/barista/verify-pin', {
      method: 'POST',
      body: JSON.stringify({ cafeId, pin }),
    }),
  baristaScan: (cafeId: string, code: string, deviceToken: string) =>
    request<{ success: true; member: any; drink: any; credits: number }>('/api/barista/scan', {
      method: 'POST',
      deviceToken,
      body: JSON.stringify({ cafeId, code }),
    }),
  baristaToday: (cafeId: string, deviceToken: string) =>
    request<{ success: true; redemptions: any[] }>(`/api/barista/today?cafeId=${cafeId}`, { deviceToken }),
  baristaEarnings: (cafeId: string, deviceToken: string) =>
    request<{ success: true; earnings: any }>(`/api/barista/earnings?cafeId=${cafeId}`, { deviceToken }),
};

export class ApiError extends Error {}
