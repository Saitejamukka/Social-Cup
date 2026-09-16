import { useCallback, useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { api, setAuthToken, getAuthToken } from './api';
import { loadPlacesLibrary, placesApiKey } from './googleMaps';

type AdminSession = { kind: 'ADMIN'; name: string; email: string };
type BaristaSession = { kind: 'BARISTA'; cafeId: string; cafeName: string; neighborhood: string; deviceToken: string };
type Session = AdminSession | BaristaSession | null;

const BARISTA_STORAGE_KEY = 'sc_barista_session';
const currentPeriod = () => new Date().toISOString().slice(0, 7);

function saveBaristaSession(s: BaristaSession) {
  localStorage.setItem(BARISTA_STORAGE_KEY, JSON.stringify(s));
}
function clearBaristaSession() {
  localStorage.removeItem(BARISTA_STORAGE_KEY);
}

// ADM-006: the whole portal is styled with inline objects rather than a
// stylesheet, so real `@media` breakpoints aren't available — this tracks the
// viewport in JS instead and feeds a boolean into the few layout spots
// (sidebar, header, dashboard grid) that need to reflow below ~1024px.
function useIsNarrow(breakpoint = 1024): boolean {
  const [isNarrow, setIsNarrow] = useState(
    () => typeof window !== 'undefined' && window.innerWidth < breakpoint
  );
  useEffect(() => {
    const mql = window.matchMedia(`(max-width: ${breakpoint - 1}px)`);
    const onChange = () => setIsNarrow(mql.matches);
    onChange();
    mql.addEventListener('change', onChange);
    return () => mql.removeEventListener('change', onChange);
  }, [breakpoint]);
  return isNarrow;
}

// Shared style helpers so the markup below stays readable.
const card: React.CSSProperties = { backgroundColor: '#FFFFFF', border: '1px solid #DEE3C9', borderRadius: '12px' };
const input: React.CSSProperties = { padding: '11px', borderRadius: '8px', border: '1px solid #DEE3C9', fontSize: '13px', width: '100%' };
const primaryBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: '999px', border: 'none', backgroundColor: '#687451', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(53,42,36,0.15)' };
const secondaryBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3C9', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };

export default function App() {
  const [session, setSession] = useState<Session>(null);
  const [bootstrapping, setBootstrapping] = useState(true);

  useEffect(() => {
    (async () => {
      if (getAuthToken()) {
        try {
          const { user } = await api.me();
          if (user.role === 'ADMIN') {
            setSession({ kind: 'ADMIN', name: user.name, email: user.email });
            setBootstrapping(false);
            return;
          }
        } catch {
          setAuthToken(null);
        }
      }
      const raw = localStorage.getItem(BARISTA_STORAGE_KEY);
      if (raw) {
        try {
          setSession({ kind: 'BARISTA', ...JSON.parse(raw) });
        } catch {
          clearBaristaSession();
        }
      }
      setBootstrapping(false);
    })();
  }, []);

  const signOut = () => {
    setAuthToken(null);
    clearBaristaSession();
    setSession(null);
  };

  // Whenever a barista call fails because the PIN was reset elsewhere, drop back to login.
  const onDeviceRevoked = useCallback(() => {
    clearBaristaSession();
    setSession(null);
  }, []);

  if (bootstrapping) {
    return <CenteredMessage text="Loading Social Cup Portal…" />;
  }

  if (!session) {
    return <LoginScreen onAdminLogin={(s) => setSession(s)} onBaristaLogin={(s) => setSession(s)} />;
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#F9F5EA' }}>
      <header style={{ minHeight: '60px', backgroundColor: '#352A24', color: '#FFFFFF', padding: '10px 16px', display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '8px', borderBottom: '1px solid #4E5A3F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap', minWidth: 0 }}>
          <span style={{ fontSize: '17px', fontWeight: 700, fontFamily: 'Playfair Display, serif', whiteSpace: 'nowrap' }}>Social Cup Portal</span>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: session.kind === 'ADMIN' ? '#687451' : '#4E5A3F', color: '#FFFFFF', whiteSpace: 'nowrap' }}>
            {session.kind === 'ADMIN' ? '👑 HQ Admin' : `☕ Barista (${session.cafeName})`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: '160px' }}>
            {session.kind === 'ADMIN' ? session.email : session.neighborhood}
          </span>
          <button onClick={signOut} style={{ background: '#4E5A3F', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: '6px', flexShrink: 0 }}>
            Sign out
          </button>
        </div>
      </header>

      {session.kind === 'ADMIN' ? <AdminSurface /> : <BaristaSurface session={session} onDeviceRevoked={onDeviceRevoked} />}
    </div>
  );
}

function CenteredMessage({ text }: { text: string }) {
  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F5EA', fontSize: '14px', color: '#6F6555' }}>
      {text}
    </div>
  );
}

// ============================================================
// Login
// ============================================================

function LoginScreen({
  onAdminLogin,
  onBaristaLogin,
}: {
  onAdminLogin: (s: AdminSession) => void;
  onBaristaLogin: (s: BaristaSession) => void;
}) {
  const [tab, setTab] = useState<'admin' | 'barista'>('admin');
  const [email, setEmail] = useState('admin@socialcup.app');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [cafes, setCafes] = useState<{ id: string; name: string; neighborhood: string }[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState('');
  const [pin, setPin] = useState('');

  useEffect(() => {
    if (tab === 'barista' && cafes.length === 0) {
      api
        .listPublicCafes()
        .then(({ cafes }) => {
          setCafes(cafes);
          if (cafes[0]) setSelectedCafeId(cafes[0].id);
        })
        .catch(() => setError('Could not reach the Social Cup server.'));
    }
  }, [tab]);

  const submitAdmin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const { token, user } = await api.login(email, password);
      if (user.role !== 'ADMIN') {
        setError('This account is not an HQ administrator.');
        return;
      }
      setAuthToken(token);
      onAdminLogin({ kind: 'ADMIN', name: user.name, email: user.email });
    } catch (err: any) {
      setError(err.message || 'Sign in failed');
    } finally {
      setSubmitting(false);
    }
  };

  const submitBarista = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!selectedCafeId || pin.length !== 4) {
      setError('Choose a cafe and enter the 4-digit PIN.');
      return;
    }
    setSubmitting(true);
    try {
      const { deviceToken, cafe } = await api.baristaVerifyPin(selectedCafeId, pin);
      const session: BaristaSession = { kind: 'BARISTA', cafeId: cafe.id, cafeName: cafe.name, neighborhood: cafe.neighborhood, deviceToken };
      saveBaristaSession(session);
      onBaristaLogin(session);
    } catch (err: any) {
      setError(err.message || 'Incorrect PIN');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#F9F5EA', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #DEE3C9', padding: '36px', boxShadow: '0 8px 30px rgba(43,51,32,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Playfair Display, serif', color: '#352A24' }}>Social Cup</div>
          <div style={{ fontSize: '13px', color: '#6F6555', marginTop: '6px' }}>Business & Staff Unified Portal</div>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#E8EBD9', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
          <button type="button" onClick={() => { setTab('barista'); setError(null); }} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: tab === 'barista' ? '#FFFFFF' : 'transparent', color: '#352A24', boxShadow: tab === 'barista' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>
            ☕ Cafe Staff Portal
          </button>
          <button type="button" onClick={() => { setTab('admin'); setError(null); }} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: tab === 'admin' ? '#FFFFFF' : 'transparent', color: '#352A24', boxShadow: tab === 'admin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>
            👑 HQ Administration
          </button>
        </div>

        {tab === 'admin' ? (
          <form onSubmit={submitAdmin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Admin Email">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required style={input} />
            </Field>
            <Field label="Password">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={input} />
            </Field>
            {error && <ErrorText text={error} />}
            <button type="submit" disabled={submitting} style={{ marginTop: '10px', padding: '14px', borderRadius: '999px', border: 'none', backgroundColor: '#687451', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 10px rgba(53,42,36,0.15)' }}>
              {submitting ? 'Signing in…' : 'Sign In as HQ Admin →'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitBarista} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Counter Station">
              <select value={selectedCafeId} onChange={(e) => setSelectedCafeId(e.target.value)} style={input}>
                {cafes.map((c) => {
                  // BAR-003: <option> text is rendered by the OS, not styleable
                  // CSS-ellipsis — an absurdly long cafe name has to be truncated
                  // in the string itself rather than with overflow/text-overflow.
                  const label = c.name.length > 60 ? `${c.name.slice(0, 60)}…` : c.name;
                  return (
                    <option key={c.id} value={c.id}>
                      {label} — {c.neighborhood}
                    </option>
                  );
                })}
              </select>
            </Field>
            <Field label="Cafe PIN">
              <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required style={input} />
            </Field>
            {error && <ErrorText text={error} />}
            <button type="submit" disabled={submitting} style={{ marginTop: '10px', padding: '14px', borderRadius: '999px', border: 'none', backgroundColor: '#687451', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1, boxShadow: '0 4px 10px rgba(53,42,36,0.15)' }}>
              {submitting ? 'Checking…' : 'Sign In to Cafe Counter Station →'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#F9F5EA', borderRadius: '8px', border: '1px dashed #DEE3C9', fontSize: '12px', color: '#6F6555', lineHeight: '18px' }}>
          🔒 A cafe PIN is entered once per device; this browser stays trusted until an admin resets that cafe's PIN.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6F6555', marginBottom: '6px' }}>{label}</label>
      {children}
    </div>
  );
}

function ErrorText({ text }: { text: string }) {
  return <div style={{ fontSize: '12px', color: '#B84C3E', backgroundColor: '#FBEEEC', padding: '10px 12px', borderRadius: '8px' }}>{text}</div>;
}

// ============================================================
// Admin surface
// ============================================================

type AdminTab = 'dashboard' | 'cafes' | 'menu' | 'members' | 'redemptions' | 'payouts' | 'settings';

function AdminSurface() {
  const [tab, setTab] = useState<AdminTab>('dashboard');
  const isNarrow = useIsNarrow();

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'dashboard', label: 'Dashboard', icon: '📊' },
    { key: 'cafes', label: 'Dallas Cafes', icon: '☕' },
    { key: 'menu', label: 'Menu & Pricing', icon: '🏷️' },
    { key: 'members', label: 'Members', icon: '👥' },
    { key: 'redemptions', label: 'Redemption Log', icon: '📋' },
    { key: 'payouts', label: 'Payouts', icon: '💳' },
    { key: 'settings', label: 'Settings', icon: '⚙️' },
  ];

  return (
    <div style={{ display: 'flex', flex: 1, flexDirection: isNarrow ? 'column' : 'row', minWidth: 0 }}>
      {/* ADM-006: a fixed 220px sidebar pushed the main content off-screen below
          ~1024px — below that width this becomes a horizontally-scrolling icon
          strip along the top instead of a sidebar that eats half the viewport. */}
      <div
        style={
          isNarrow
            ? { display: 'flex', overflowX: 'auto', backgroundColor: '#2A211C', padding: '8px', gap: '4px' }
            : { width: '220px', flexShrink: 0, backgroundColor: '#2A211C', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }
        }
      >
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={
              isNarrow
                ? { flexShrink: 0, textAlign: 'center', padding: '8px 12px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '11px', cursor: 'pointer', backgroundColor: tab === t.key ? '#4E5A3F' : 'transparent', color: tab === t.key ? '#B7C49A' : 'rgba(255,255,255,0.7)', whiteSpace: 'nowrap' }
                : { textAlign: 'left', padding: '11px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', backgroundColor: tab === t.key ? '#4E5A3F' : 'transparent', color: tab === t.key ? '#B7C49A' : 'rgba(255,255,255,0.7)' }
            }
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, minWidth: 0, padding: isNarrow ? '18px' : '32px 36px', overflowY: 'auto', overflowX: 'auto' }}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'cafes' && <CafesTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'members' && <MembersTab />}
        {tab === 'redemptions' && <RedemptionsTab />}
        {tab === 'payouts' && <PayoutsTab />}
        {tab === 'settings' && <SettingsTab />}
      </div>
    </div>
  );
}

function SettingsTab() {
  const [settings, setSettings] = useState<any | null>(null);

  useEffect(() => {
    api.adminGetSettings().then((r) => setSettings(r.settings)).catch(() => setSettings(null));
  }, []);

  return (
    <div>
      <SectionTitle>Settings</SectionTitle>
      {!settings ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading settings…</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '480px' }}>
          <div style={card}>
            <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Credit value</div>
            <div style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>
              1 credit = ${settings.creditValueUsd.toFixed(2)}
            </div>
          </div>
          <div style={card}>
            <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Membership plan (held in Stripe — read only)</div>
            <div style={{ fontSize: '22px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>
              ${settings.planPriceUsd?.toFixed(2) ?? '—'} / {settings.planInterval ?? '—'}
            </div>
            <div style={{ fontSize: '13px', color: '#6F6555', marginTop: '4px' }}>
              {settings.planName} · {settings.creditsPerMonth} credits per {settings.planInterval}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Playfair Display, serif', marginBottom: '20px' }}>{children}</div>;
}

function DashboardTab() {
  const [metrics, setMetrics] = useState<Record<string, number> | null>(null);

  useEffect(() => {
    api.adminMetrics().then((r) => setMetrics(r.metrics)).catch(() => setMetrics(null));
  }, []);

  const rows = metrics
    ? [
        { label: 'Active members', value: String(metrics.activeMembers) },
        { label: 'Partner cafes', value: String(metrics.partnerCafes) },
        { label: 'Redemptions this month', value: String(metrics.redemptionsThisMonth) },
        { label: 'Credits redeemed', value: String(metrics.creditsRedeemed) },
        { label: 'Total owed to cafes', value: `$${metrics.totalOwed.toFixed(2)}` },
        { label: 'Total margin', value: `$${metrics.totalMargin.toFixed(2)}` },
      ]
    : [];

  return (
    <div>
      <SectionTitle>HQ Executive Dashboard</SectionTitle>
      {!metrics ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading metrics…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' }}>
          {rows.map((s, i) => (
            <div key={i} style={{ ...card, padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6F6555' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 600, fontFamily: 'Playfair Display, serif', marginTop: '6px', color: '#352A24' }}>{s.value}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CafesTab() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingCafe, setEditingCafe] = useState<any | null>(null);
  const [pinMessage, setPinMessage] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    api.adminListCafes().then((r) => setCafes(r.cafes)).finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const toggleFeatured = async (c: any) => {
    await api.adminUpdateCafe(c.id, { isFeatured: !c.isFeatured });
    refresh();
  };

  const openNewCafe = () => {
    setSaveError(null);
    setEditingCafe({ id: 'new', name: '', neighborhood: 'Bishop Arts', address: '', hours: '', payoutRate: 3.5, isFeatured: false, vibeTags: [] });
  };

  const saveCafe = async (data: any) => {
    setSaving(true);
    setSaveError(null);
    try {
      if (editingCafe.id === 'new') {
        await api.adminCreateCafe(data);
      } else {
        await api.adminUpdateCafe(editingCafe.id, data);
      }
      setEditingCafe(null);
      refresh();
    } catch (err: any) {
      // ADM-001: the backend already rejected this correctly (400 on blank
      // required fields) — the bug was the drawer silently swallowing that and
      // just sitting there. Surface it instead of closing/discarding the form.
      setSaveError(err.message || 'Could not save this cafe. Please check the fields and try again.');
    } finally {
      setSaving(false);
    }
  };

  const deleteCafe = async (c: any) => {
    if (!window.confirm(`Delete ${c.name}? This cannot be undone unless it has redemption history, in which case the delete will be refused.`)) return;
    try {
      await api.adminDeleteCafe(c.id);
      refresh();
    } catch (err: any) {
      window.alert(err.message || 'Could not delete this cafe.');
    }
  };

  const resetPin = async () => {
    const { pinCode } = await api.adminResetPin(editingCafe.id);
    setPinMessage(`New PIN: ${pinCode} — share this with the cafe manager. Every device previously trusted for this cafe has been signed out.`);
    refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <SectionTitle>Partner Cafes Management</SectionTitle>
        <button onClick={openNewCafe} style={primaryBtn}>
          + Add New Cafe
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading cafes…</div>
      ) : (
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 0.6fr', padding: '12px 18px', backgroundColor: '#F9F5EA', fontSize: '11px', fontWeight: 700, color: '#6F6555', textTransform: 'uppercase', minWidth: '640px' }}>
            <div>Cafe</div><div>Neighborhood</div><div>Payout Rate</div><div>Featured</div><div>Action</div><div>Delete</div>
          </div>
          {cafes.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr 0.6fr', padding: '12px 18px', borderTop: '1px solid #E8EBD9', alignItems: 'center', fontSize: '13px', minWidth: '640px' }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ color: '#6F6555' }}>{c.neighborhood}</div>
              <div>${c.payoutRate.toFixed(2)}/cr</div>
              <div>
                <button onClick={() => toggleFeatured(c)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.isFeatured ? '#687451' : '#A39C87' }}>
                  {c.isFeatured ? '★' : '☆'}
                </button>
              </div>
              <div>
                <button onClick={() => { setSaveError(null); setEditingCafe(c); }} style={secondaryBtn}>Edit Details</button>
              </div>
              <div>
                <button onClick={() => deleteCafe(c)} style={{ ...secondaryBtn, color: '#B84C3E', borderColor: '#E9C6C0' }}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCafe && (
        <CafeDrawer
          cafe={editingCafe}
          onClose={() => { setEditingCafe(null); setPinMessage(null); setSaveError(null); }}
          onSave={saveCafe}
          onResetPin={editingCafe.id !== 'new' ? resetPin : undefined}
          pinMessage={pinMessage}
          error={saveError}
          saving={saving}
        />
      )}
    </div>
  );
}

// Google Places autofill (PRD architecture doc: "used only to autofill a cafe address
// in the admin panel"). Entirely optional — renders nothing if VITE_GOOGLE_PLACES_API_KEY
// isn't configured, leaving the plain Address input below as the only way to enter it.
function AddressAutocomplete({ onSelect }: { onSelect: (data: { address: string; lat: number; lng: number }) => void }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [unavailable, setUnavailable] = useState(!placesApiKey());

  useEffect(() => {
    if (!placesApiKey() || !containerRef.current) return;
    let element: google.maps.places.PlaceAutocompleteElement | null = null;
    let cancelled = false;

    loadPlacesLibrary()
      .then(({ PlaceAutocompleteElement }) => {
        if (cancelled || !containerRef.current) return;
        element = new PlaceAutocompleteElement({ includedRegionCodes: ['us'] });
        element.addEventListener('gmp-select', async (event) => {
          const place = event.placePrediction.toPlace();
          await place.fetchFields({ fields: ['formattedAddress', 'location'] });
          if (place.formattedAddress && place.location) {
            onSelect({ address: place.formattedAddress, lat: place.location.lat(), lng: place.location.lng() });
          }
        });
        containerRef.current.appendChild(element);
      })
      .catch(() => setUnavailable(true));

    return () => {
      cancelled = true;
      element?.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (unavailable) return null;

  return (
    <div>
      <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Search for the address (autofills below)</div>
      <div ref={containerRef} />
    </div>
  );
}

function CafeDrawer({
  cafe,
  onClose,
  onSave,
  onResetPin,
  pinMessage,
  error,
  saving,
}: {
  cafe: any;
  onClose: () => void;
  onSave: (data: any) => void;
  onResetPin?: () => void;
  pinMessage: string | null;
  error?: string | null;
  saving?: boolean;
}) {
  const [form, setForm] = useState({
    name: cafe.name || '',
    neighborhood: cafe.neighborhood || '',
    address: cafe.address || '',
    latitude: cafe.latitude ?? '',
    longitude: cafe.longitude ?? '',
    hours: cafe.hours || '',
    payoutRate: cafe.payoutRate ?? 3.5,
    image: cafe.image || '',
    gallery: (cafe.gallery as string[]) || [],
    vibeTags: (cafe.vibeTags as string[]) || [],
    perkLine: cafe.perkLine || '',
  });
  const [newTag, setNewTag] = useState('');
  const [newGalleryUrl, setNewGalleryUrl] = useState('');

  const addTag = () => {
    const tag = newTag.trim();
    if (tag && !form.vibeTags.includes(tag)) {
      setForm({ ...form, vibeTags: [...form.vibeTags, tag] });
    }
    setNewTag('');
  };

  const removeTag = (tag: string) => setForm({ ...form, vibeTags: form.vibeTags.filter((t) => t !== tag) });

  const addGalleryUrl = () => {
    const url = newGalleryUrl.trim();
    if (url && !form.gallery.includes(url)) {
      setForm({ ...form, gallery: [...form.gallery, url] });
    }
    setNewGalleryUrl('');
  };

  const removeGalleryUrl = (url: string) => setForm({ ...form, gallery: form.gallery.filter((u) => u !== url) });

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: 'min(400px, 100vw)', backgroundColor: '#FFFFFF', borderLeft: '1px solid #DEE3C9', padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 60, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>{cafe.id === 'new' ? 'Add Cafe' : 'Edit Cafe Details'}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
      </div>
      <input placeholder="Cafe Name" value={form.name} maxLength={200} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
      <input placeholder="Neighborhood" value={form.neighborhood} maxLength={100} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} style={input} />
      <AddressAutocomplete
        onSelect={({ address, lat, lng }) => setForm({ ...form, address, latitude: lat, longitude: lng })}
      />
      <input placeholder="Address" value={form.address} maxLength={300} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} />
      <div style={{ display: 'flex', gap: '10px' }}>
        <input
          type="number"
          step="0.0001"
          min={-90}
          max={90}
          placeholder="Latitude"
          value={form.latitude}
          onChange={(e) => setForm({ ...form, latitude: e.target.value === '' ? '' : Number(e.target.value) })}
          style={{ ...input, flex: 1 }}
        />
        <input
          type="number"
          step="0.0001"
          min={-180}
          max={180}
          placeholder="Longitude"
          value={form.longitude}
          onChange={(e) => setForm({ ...form, longitude: e.target.value === '' ? '' : Number(e.target.value) })}
          style={{ ...input, flex: 1 }}
        />
      </div>
      <input placeholder="Hours" value={form.hours} maxLength={200} onChange={(e) => setForm({ ...form, hours: e.target.value })} style={input} />
      <div>
        <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Payout Rate ($/credit)</div>
        <input type="number" step="0.25" min={0.01} max={100} value={form.payoutRate} onChange={(e) => setForm({ ...form, payoutRate: Number(e.target.value) })} style={input} />
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Perk line</div>
        <input
          placeholder="e.g. Free WiFi + 10% off pastries"
          value={form.perkLine}
          maxLength={200}
          onChange={(e) => setForm({ ...form, perkLine: e.target.value })}
          style={input}
        />
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Cover photo URL</div>
        <input type="url" placeholder="https://…" value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} style={input} />
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Vibe tags</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginBottom: '8px' }}>
          {form.vibeTags.map((tag) => (
            <span key={tag} style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '999px', backgroundColor: '#E8EBD9', fontSize: '12px', fontWeight: 600, color: '#352A24' }}>
              {tag}
              <button onClick={() => removeTag(tag)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#6F6555', lineHeight: 1 }}>✕</button>
            </span>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="Add a tag and press Enter"
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
            style={{ ...input, flex: 1 }}
          />
          <button onClick={addTag} style={secondaryBtn}>Add</button>
        </div>
      </div>

      <div>
        <div style={{ fontSize: '12px', color: '#6F6555', marginBottom: '4px' }}>Gallery photo URLs</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '8px' }}>
          {form.gallery.map((url) => (
            <div key={url} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 10px', borderRadius: '6px', backgroundColor: '#F9F5EA', border: '1px solid #E8EBD9' }}>
              <span style={{ flex: 1, fontSize: '11px', color: '#6F6555', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{url}</span>
              <button onClick={() => removeGalleryUrl(url)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '13px', color: '#B84C3E' }}>✕</button>
            </div>
          ))}
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <input
            placeholder="Paste an image URL and press Enter"
            value={newGalleryUrl}
            onChange={(e) => setNewGalleryUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addGalleryUrl())}
            style={{ ...input, flex: 1 }}
          />
          <button onClick={addGalleryUrl} style={secondaryBtn}>Add</button>
        </div>
      </div>

      {onResetPin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderTop: '1px solid #E8EBD9', borderBottom: '1px solid #E8EBD9' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Barista Counter PIN</span>
            <button onClick={onResetPin} style={secondaryBtn}>Reset PIN</button>
          </div>
          {pinMessage && <div style={{ fontSize: '12px', color: '#4F7A3E' }}>{pinMessage}</div>}
        </div>
      )}

      {error && <ErrorText text={error} />}

      <button
        onClick={() => onSave(form)}
        disabled={saving}
        style={{ marginTop: 'auto', padding: '14px', borderRadius: '999px', border: 'none', backgroundColor: '#687451', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: saving ? 'default' : 'pointer', opacity: saving ? 0.7 : 1, boxShadow: '0 4px 10px rgba(53,42,36,0.15)' }}
      >
        {saving ? 'Saving…' : 'Save Changes'}
      </button>
    </div>
  );
}

function MenuTab() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState('');
  const [addingDrink, setAddingDrink] = useState(false);
  const [newDrink, setNewDrink] = useState({ name: '', retailPrice: 6, creditsCost: 6, image: '' });
  const [editingImageId, setEditingImageId] = useState<string | null>(null);
  const [imageDraft, setImageDraft] = useState('');
  const [drinkError, setDrinkError] = useState<string | null>(null);

  const [calcRetail, setCalcRetail] = useState(6.0);
  const [calcCredits, setCalcCredits] = useState(6);
  const [calcPayoutRate, setCalcPayoutRate] = useState(3.5);

  const refresh = useCallback(() => {
    api.adminListCafes().then((r) => {
      setCafes(r.cafes);
      // Functional update reads the *current* selection at call time, rather than
      // whatever selectedCafeId was when this useCallback closure was first created
      // (an empty string) — otherwise every refresh() (e.g. after any edit) would
      // wrongly treat nothing as selected and snap back to the alphabetically-first cafe.
      setSelectedCafeId((prev) => prev || r.cafes[0]?.id || '');
    });
  }, []);

  useEffect(refresh, [refresh]);

  const selectedCafe = cafes.find((c) => c.id === selectedCafeId);
  const drinks: any[] = selectedCafe?.drinks || [];

  const calcDollarValue = `$${Number(calcCredits).toFixed(2)}`;
  const calcSavings = `$${Math.max(0, Number(calcRetail) - Number(calcCredits)).toFixed(2)}`;
  const calcPayout = `$${(Number(calcCredits) * Number(calcPayoutRate)).toFixed(2)}`;
  const calcMargin = `$${(Number(calcCredits) - Number(calcCredits) * Number(calcPayoutRate)).toFixed(2)}`;

  const toggleDrinkField = async (d: any, field: 'isSignature' | 'isEnabled') => {
    await api.adminUpdateDrink(d.id, { [field]: !d[field] });
    refresh();
  };

  const submitNewDrink = async () => {
    if (!newDrink.name) return;
    setDrinkError(null);
    try {
      await api.adminCreateDrink(selectedCafeId, newDrink);
      setNewDrink({ name: '', retailPrice: 6, creditsCost: 6, image: '' });
      setAddingDrink(false);
      refresh();
    } catch (err: any) {
      setDrinkError(err.message || 'Could not add this drink.');
    }
  };

  const deleteDrink = async (d: any) => {
    if (!window.confirm(`Delete ${d.name}? This cannot be undone.`)) return;
    try {
      await api.adminDeleteDrink(d.id);
      refresh();
    } catch (err: any) {
      window.alert(err.message || 'Could not delete this drink — disable it instead if it has redemption history.');
    }
  };

  const startEditingImage = (d: any) => {
    setEditingImageId(d.id);
    setImageDraft(d.image || '');
  };

  const saveImage = async (drinkId: string) => {
    await api.adminUpdateDrink(drinkId, { image: imageDraft.trim() || null });
    setEditingImageId(null);
    refresh();
  };

  return (
    <div>
      <SectionTitle>Drink Catalog &amp; Financial Calculator</SectionTitle>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {cafes.map((c) => (
          <button key={c.id} onClick={() => setSelectedCafeId(c.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid ' + (selectedCafeId === c.id ? '#352A24' : '#DEE3C9'), backgroundColor: selectedCafeId === c.id ? '#352A24' : '#FFFFFF', color: selectedCafeId === c.id ? '#FFFFFF' : '#352A24', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1.4, ...card, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.6fr 1fr 1fr 1fr 0.8fr 0.6fr', padding: '12px 16px', backgroundColor: '#F9F5EA', fontSize: '10px', fontWeight: 700, color: '#6F6555', textTransform: 'uppercase', minWidth: '560px' }}>
            <div>Photo</div><div>Drink</div><div>Retail</div><div>Credits</div><div>Signature</div><div>Enabled</div><div>Delete</div>
          </div>
          {drinks.map((d) => (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '0.6fr 1.6fr 1fr 1fr 1fr 0.8fr 0.6fr', padding: '12px 16px', borderTop: '1px solid #E8EBD9', alignItems: 'center', fontSize: '13px', minWidth: '560px' }}>
              <div>
                {editingImageId === d.id ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', gridColumn: '1 / -1' }}>
                    <input
                      autoFocus
                      placeholder="Image URL"
                      value={imageDraft}
                      onChange={(e) => setImageDraft(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && saveImage(d.id)}
                      style={{ ...input, fontSize: '11px', padding: '6px 8px' }}
                    />
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => saveImage(d.id)} style={{ ...primaryBtn, padding: '4px 10px', fontSize: '11px' }}>Save</button>
                      <button onClick={() => setEditingImageId(null)} style={{ ...secondaryBtn, padding: '4px 10px', fontSize: '11px' }}>Cancel</button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditingImage(d)}
                    title="Click to set photo URL"
                    style={{ padding: 0, border: '1px solid #DEE3C9', borderRadius: '8px', overflow: 'hidden', width: '44px', height: '44px', cursor: 'pointer', background: d.image ? `url(${d.image}) center/cover no-repeat` : '#F9F5EA', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                  >
                    {!d.image && <span style={{ fontSize: '16px', opacity: 0.4 }}>☕</span>}
                  </button>
                )}
              </div>
              {editingImageId !== d.id && (
                <>
                  <div style={{ fontWeight: 600 }}>{d.name}</div>
                  <div>${d.retailPrice.toFixed(2)}</div>
                  <div>{d.creditsCost} cr</div>
                  <div>
                    <button onClick={() => toggleDrinkField(d, 'isSignature')} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.isSignature ? '#687451' : '#A39C87' }}>
                      {d.isSignature ? '★' : '☆'}
                    </button>
                  </div>
                  <div>
                    <button onClick={() => toggleDrinkField(d, 'isEnabled')} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.isEnabled ? '#4F7A3E' : '#A39C87' }}>
                      {d.isEnabled ? '●' : '○'}
                    </button>
                  </div>
                  <div>
                    <button onClick={() => deleteDrink(d)} style={{ background: 'none', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', color: '#B84C3E' }}>
                      Delete
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}

          <div style={{ padding: '14px 16px', borderTop: '1px solid #E8EBD9' }}>
            {!addingDrink ? (
              <button onClick={() => { setAddingDrink(true); setDrinkError(null); }} style={secondaryBtn}>+ Add Drink</button>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <input placeholder="Drink name" value={newDrink.name} maxLength={200} onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })} style={{ ...input, width: '160px' }} />
                  <input type="number" step="0.25" min={0.01} max={1000} placeholder="Retail $" value={newDrink.retailPrice} onChange={(e) => setNewDrink({ ...newDrink, retailPrice: Number(e.target.value) })} style={{ ...input, width: '90px' }} />
                  <input type="number" min={1} max={1000} placeholder="Credits" value={newDrink.creditsCost} onChange={(e) => setNewDrink({ ...newDrink, creditsCost: Number(e.target.value) })} style={{ ...input, width: '80px' }} />
                  <input type="url" placeholder="Photo URL (optional)" value={newDrink.image} onChange={(e) => setNewDrink({ ...newDrink, image: e.target.value })} style={{ ...input, width: '200px' }} />
                  <button onClick={submitNewDrink} style={primaryBtn}>Save</button>
                  <button onClick={() => { setAddingDrink(false); setDrinkError(null); }} style={secondaryBtn}>Cancel</button>
                </div>
                {drinkError && <ErrorText text={drinkError} />}
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, ...card, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Live Pricing Calculator</div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6555', marginBottom: '4px' }}>Retail Drink Price ($)</div>
            <input type="number" step="0.25" min={0} max={1000} value={calcRetail} onChange={(e) => setCalcRetail(Number(e.target.value))} style={input} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6555', marginBottom: '4px' }}>Credit Cost (cr)</div>
            <input type="number" step="1" min={0} max={1000} value={calcCredits} onChange={(e) => setCalcCredits(Number(e.target.value))} style={input} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6F6555', marginBottom: '4px' }}>Cafe Payout Rate ($/credit)</div>
            <input type="number" step="0.25" min={0} max={100} value={calcPayoutRate} onChange={(e) => setCalcPayoutRate(Number(e.target.value))} style={input} />
          </div>
          <div style={{ height: '1px', backgroundColor: '#E8EBD9' }} />
          <Row label="Member Value" value={calcDollarValue} color="#352A24" />
          <Row label="Member Savings" value={calcSavings} color="#4F7A3E" />
          <Row label="Cafe Payout" value={calcPayout} color="#352A24" />
          <Row label="Social Cup Platform Margin" value={calcMargin} color="#687451" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: '#6F6555' }}>{label}</span>
      <span style={{ fontWeight: 700, color }}>{value}</span>
    </div>
  );
}

function MembersTab() {
  const [members, setMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(() => {
    setLoading(true);
    api.adminListMembers().then((r) => setMembers(r.members)).finally(() => setLoading(false));
  }, []);
  useEffect(refresh, [refresh]);

  // ADM-002: this used to also offer "Reactivate", which sent status:'MEMBER' —
  // flipping any visitor straight to a paid membership with zero payment. Real
  // membership can only ever come from a Stripe payment the member makes
  // themselves; this admin action is deactivation-only now, matching what the
  // backend actually allows.
  const deactivate = async (m: any) => {
    if (!window.confirm(`Deactivate ${m.name}'s membership? They'll lose access to redeeming until they resubscribe.`)) return;
    await api.adminSetMemberStatus(m.id, 'CANCELED');
    refresh();
  };

  return (
    <div>
      <SectionTitle>Active Subscriber Directory</SectionTitle>
      {loading ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading members…</div>
      ) : (
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr 0.8fr', padding: '12px 18px', backgroundColor: '#F9F5EA', fontSize: '11px', fontWeight: 700, color: '#6F6555', textTransform: 'uppercase', minWidth: '700px' }}>
            <div>Name</div><div>Email</div><div>Status</div><div>Joined</div><div>Credits</div><div>Action</div>
          </div>
          {members.map((m) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr 0.8fr', padding: '14px 18px', borderTop: '1px solid #E8EBD9', alignItems: 'center', fontSize: '13px', minWidth: '700px' }}>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ color: '#6F6555', fontSize: '12px' }}>{m.email}</div>
              <div>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: m.status === 'MEMBER' ? '#E8EBD9' : '#F6E3DF', color: m.status === 'MEMBER' ? '#4F7A3E' : '#B84C3E' }}>
                  {m.status}
                </span>
              </div>
              <div>{new Date(m.joined).toLocaleDateString()}</div>
              <div>{m.credits}</div>
              <div>
                {m.status === 'MEMBER' ? (
                  <button onClick={() => deactivate(m)} style={secondaryBtn}>Deactivate</button>
                ) : (
                  <span style={{ fontSize: '11px', color: '#A39C87' }} title="Membership can only be granted by the member paying through the app">
                    —
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function RedemptionsTab() {
  const [redemptions, setRedemptions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [voidTarget, setVoidTarget] = useState<any | null>(null);
  const [voidReason, setVoidReason] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    api.adminListRedemptions().then((r) => setRedemptions(r.redemptions)).finally(() => setLoading(false));
  }, []);
  useEffect(refresh, [refresh]);

  const confirmVoid = async () => {
    if (!voidTarget || !voidReason.trim()) return;
    await api.adminVoidRedemption(voidTarget.id, voidReason.trim());
    setVoidTarget(null);
    setVoidReason('');
    refresh();
  };

  const exportCsv = async () => {
    const res = await fetch(api.adminExportRedemptionsUrl(), { headers: { Authorization: `Bearer ${getAuthToken()}` } });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'redemptions.csv';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <SectionTitle>Redemption Audit Trail</SectionTitle>
        <button onClick={exportCsv} style={primaryBtn}>Export CSV</button>
      </div>

      {loading ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading redemptions…</div>
      ) : (
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr 0.6fr 0.7fr 0.7fr 0.7fr 0.8fr 0.9fr 0.7fr', padding: '12px 14px', backgroundColor: '#F9F5EA', fontSize: '10px', fontWeight: 700, color: '#6F6555', textTransform: 'uppercase', minWidth: '900px' }}>
            <div>Member</div><div>Cafe</div><div>Drink</div><div>Credits</div><div>Value</div><div>Payout</div><div>Margin</div><div>Status</div><div>Time</div><div>Action</div>
          </div>
          {redemptions.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr 0.6fr 0.7fr 0.7fr 0.7fr 0.8fr 0.9fr 0.7fr', padding: '14px 14px', borderTop: '1px solid #E8EBD9', alignItems: 'center', fontSize: '12px', minWidth: '900px' }}>
              <div>{r.member}</div><div>{r.cafe}</div><div>{r.drink}</div><div>{r.credits}</div>
              <div>${r.memberValue}</div><div>{r.cafePayout !== null ? `$${r.cafePayout}` : '—'}</div><div>{r.margin !== null ? `$${r.margin}` : '—'}</div>
              <div>{r.status}{r.status === 'VOIDED' && r.voidReason ? ` (${r.voidReason})` : ''}</div>
              <div>{new Date(r.time).toLocaleString()}</div>
              <div>
                {r.status === 'REDEEMED' && (
                  <button onClick={() => setVoidTarget(r)} style={{ ...secondaryBtn, padding: '4px 8px', fontSize: '10px', color: '#B84C3E' }}>Void</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {voidTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,51,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
          <div style={{ width: '400px', backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>Void this redemption?</div>
            <div style={{ fontSize: '13px', color: '#6F6555', lineHeight: '18px' }}>
              Credits will be refunded to {voidTarget.member} and removed from {voidTarget.cafe}'s payout.
            </div>
            <textarea placeholder="Reason for voiding (required)" value={voidReason} onChange={(e) => setVoidReason(e.target.value)} style={{ ...input, minHeight: '70px', resize: 'vertical' }} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => { setVoidTarget(null); setVoidReason(''); }} style={secondaryBtn}>Cancel</button>
              <button onClick={confirmVoid} disabled={!voidReason.trim()} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#B84C3E', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: voidReason.trim() ? 'pointer' : 'default', opacity: voidReason.trim() ? 1 : 0.5 }}>
                Void redemption
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function PayoutsTab() {
  const [period, setPeriod] = useState(currentPeriod());
  const [payouts, setPayouts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [payTarget, setPayTarget] = useState<any | null>(null);
  const [reference, setReference] = useState('');

  const refresh = useCallback(() => {
    setLoading(true);
    api.adminListPayouts(period).then((r) => setPayouts(r.payouts)).finally(() => setLoading(false));
  }, [period]);
  useEffect(refresh, [refresh]);

  const confirmPay = async () => {
    if (!payTarget) return;
    await api.adminPayCafe(payTarget.cafeId, period, payTarget.amountOwed, reference);
    setPayTarget(null);
    setReference('');
    refresh();
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
        <SectionTitle>Monthly Cafe Payout Batches</SectionTitle>
        <input type="month" value={period} onChange={(e) => setPeriod(e.target.value)} style={{ ...input, width: '160px' }} />
      </div>

      {loading ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>Loading payouts…</div>
      ) : payouts.length === 0 ? (
        <div style={{ color: '#6F6555', fontSize: '13px' }}>No redemptions recorded for this period yet.</div>
      ) : (
        <div style={{ ...card, overflow: 'auto' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 18px', backgroundColor: '#F9F5EA', fontSize: '11px', fontWeight: 700, color: '#6F6555', textTransform: 'uppercase', minWidth: '700px' }}>
            <div>Cafe</div><div>Redemptions</div><div>Credits</div><div>Amount Owed</div><div>Status</div><div>Action</div>
          </div>
          {payouts.map((p) => (
            <div key={p.cafeId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 18px', borderTop: '1px solid #E8EBD9', alignItems: 'center', fontSize: '13px', minWidth: '700px' }}>
              <div style={{ fontWeight: 600 }}>{p.cafe}</div>
              <div>{p.redemptions}</div>
              <div>{p.totalCredits}</div>
              <div style={{ fontWeight: 600 }}>${p.amountOwed.toFixed(2)}</div>
              <div>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: p.status === 'PAID' ? '#E8EBD9' : '#E8EBD9', color: p.status === 'PAID' ? '#4F7A3E' : '#4E5A3F' }}>
                  {p.status}
                </span>
              </div>
              <div>
                <button onClick={() => setPayTarget(p)} disabled={p.status === 'PAID'} style={{ ...secondaryBtn, cursor: p.status === 'PAID' ? 'default' : 'pointer', opacity: p.status === 'PAID' ? 0.5 : 1 }}>
                  {p.status === 'PAID' ? 'Paid' : 'Record payment'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {payTarget && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,51,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
          <div style={{ width: '380px', backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>Record payment to {payTarget.cafe}</div>
            <div style={{ fontSize: '13px', color: '#6F6555' }}>Amount: ${payTarget.amountOwed.toFixed(2)} for {period}</div>
            <input placeholder="Bank transfer reference" value={reference} onChange={(e) => setReference(e.target.value)} style={input} />
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
              <button onClick={() => setPayTarget(null)} style={secondaryBtn}>Cancel</button>
              <button onClick={confirmPay} style={primaryBtn}>Confirm payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// Barista surface
// ============================================================

function BaristaSurface({ session, onDeviceRevoked }: { session: BaristaSession; onDeviceRevoked: () => void }) {
  const [tab, setTab] = useState<'scan' | 'today' | 'earnings'>('scan');
  const [manualCode, setManualCode] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<{ member?: string; drink?: string; credits?: number; errorMsg?: string }>({});
  const [today, setToday] = useState<any[]>([]);
  const [earnings, setEarnings] = useState<any | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  // A decoded frame fires the scan immediately, but the camera loop keeps running
  // until the resulting state change (success/error) actually stops it a render
  // later — this guards against submitting the same decoded code twice in that gap.
  const submittingRef = useRef(false);

  const guard = useCallback(
    async <T,>(fn: () => Promise<T>): Promise<T | undefined> => {
      try {
        return await fn();
      } catch (err: any) {
        if (String(err.message || '').toLowerCase().includes('trusted')) {
          onDeviceRevoked();
          return undefined;
        }
        throw err;
      }
    },
    [onDeviceRevoked]
  );

  const loadToday = useCallback(() => {
    guard(() => api.baristaToday(session.cafeId, session.deviceToken)).then((r) => r && setToday(r.redemptions));
  }, [guard, session]);

  const loadEarnings = useCallback(() => {
    guard(() => api.baristaEarnings(session.cafeId, session.deviceToken)).then((r) => r && setEarnings(r.earnings));
  }, [guard, session]);

  useEffect(() => {
    if (tab === 'today') loadToday();
    if (tab === 'earnings') loadEarnings();
  }, [tab, loadToday, loadEarnings]);

  // BAR-004: a session restored from localStorage rendered the full Scanner UI
  // as "logged in" with no check that the device is still actually trusted —
  // e.g. after an admin resets this cafe's PIN elsewhere. This makes the same
  // call the Today tab already makes (which `guard` already routes through
  // onDeviceRevoked on a trust failure) once on mount, regardless of which tab
  // is active, so a revoked device gets bounced back to login immediately
  // rather than only on its first real scan attempt.
  useEffect(() => {
    loadToday();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const submitScan = async (codeOverride?: string) => {
    const codeToSubmit = codeOverride ?? manualCode;
    if (!codeToSubmit) return;
    const result = await guard(() => api.baristaScan(session.cafeId, codeToSubmit, session.deviceToken)).catch((err: Error) => {
      setScanResult({ errorMsg: err.message });
      setScanState('error');
      return undefined;
    });
    // BAR-001: the field only cleared on the success path — a rejected code
    // (or a QR scan's decoded string) was left sitting in the box for the next
    // customer instead of a blank field to type into.
    setManualCode('');
    if (result) {
      setScanResult({ member: result.member.name, drink: result.drink.name, credits: result.credits });
      setScanState('success');
    }
  };

  const stopCamera = useCallback(() => {
    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }, []);

  const scanLoop = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState !== video.HAVE_ENOUGH_DATA) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      rafRef.current = requestAnimationFrame(scanLoop);
      return;
    }
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const decoded = jsQR(imageData.data, imageData.width, imageData.height);

    if (decoded?.data && !submittingRef.current) {
      submittingRef.current = true;
      stopCamera();
      submitScan(decoded.data).finally(() => {
        submittingRef.current = false;
      });
      return;
    }
    rafRef.current = requestAnimationFrame(scanLoop);
  }, [stopCamera]);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      rafRef.current = requestAnimationFrame(scanLoop);
    } catch {
      setCameraError("Camera not available — type the customer's code below instead.");
    }
  }, [scanLoop]);

  useEffect(() => {
    if (tab === 'scan' && scanState === 'idle') {
      startCamera();
    } else {
      stopCamera();
    }
    return stopCamera;
  }, [tab, scanState, startCamera, stopCamera]);

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#231C17', color: '#F9F5EA' }}>
      <div style={{ padding: '14px 24px', backgroundColor: '#352A24', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #4E5A3F' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#B7C49A' }}>Counter Station:</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{session.cafeName}</span>
          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#4E5A3F', color: '#B7C49A', fontWeight: 600 }}>{session.neighborhood}</span>
        </div>
        <div style={{ display: 'flex', gap: '6px' }}>
          <button onClick={() => { setTab('scan'); setScanState('idle'); }} style={tabBtn(tab === 'scan')}>📷 Scanner</button>
          <button onClick={() => setTab('today')} style={tabBtn(tab === 'today')}>Today ({today.length})</button>
          <button onClick={() => setTab('earnings')} style={tabBtn(tab === 'earnings')}>💵 Cafe Earnings</button>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
        {tab === 'scan' && (
          <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
            {scanState === 'idle' && (
              <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ position: 'relative', width: '280px', height: '280px', backgroundColor: '#000000', borderRadius: '20px', overflow: 'hidden', border: '2px solid #4E5A3F', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {cameraError ? (
                    <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.6)', textAlign: 'center', padding: '0 20px' }}>
                      {cameraError}
                    </div>
                  ) : (
                    <>
                      <video ref={videoRef} muted playsInline style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      <canvas ref={canvasRef} style={{ display: 'none' }} />
                      <div className="sc-scanline-anim" />
                    </>
                  )}
                  <Corner style={{ top: 12, left: 12, borderTop: '3px solid #687451', borderLeft: '3px solid #687451' }} />
                  <Corner style={{ top: 12, right: 12, borderTop: '3px solid #687451', borderRight: '3px solid #687451' }} />
                  <Corner style={{ bottom: 12, left: 12, borderBottom: '3px solid #687451', borderLeft: '3px solid #687451' }} />
                  <Corner style={{ bottom: 12, right: 12, borderBottom: '3px solid #687451', borderRight: '3px solid #687451' }} />
                </div>

                <div style={{ width: '100%', marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    className="sc-scan-input"
                    placeholder="4-digit code or 6-char backup code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && submitScan()}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #4E5A3F', backgroundColor: '#352A24', color: '#FFFFFF', fontSize: '13px' }}
                  />
                  <button onClick={() => submitScan()} style={{ padding: '12px 18px', borderRadius: '999px', border: 'none', backgroundColor: '#687451', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer', boxShadow: '0 4px 10px rgba(53,42,36,0.15)' }}>
                    Verify
                  </button>
                </div>
              </div>
            )}

            {scanState === 'success' && (
              <div style={{ width: '100%', backgroundColor: '#4F7A3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>Redemption Approved!</div>
                <div style={{ fontSize: '15px', marginTop: '10px' }}><strong>{scanResult.member}</strong></div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>{scanResult.drink}</div>
                <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>{scanResult.credits} credits deducted</div>
                <button onClick={() => setScanState('idle')} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#352A24', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Scan Next Customer
                </button>
              </div>
            )}

            {scanState === 'error' && (
              <div style={{ width: '100%', backgroundColor: '#B84C3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✕</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Playfair Display, serif' }}>Scan Rejected</div>
                <div style={{ fontSize: '14px', marginTop: '10px' }}>{scanResult.errorMsg}</div>
                <button onClick={() => setScanState('idle')} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#352A24', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'today' && (
          <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#352A24', borderRadius: '16px', border: '1px solid #4E5A3F', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #4E5A3F', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Playfair Display, serif' }}>Today's Counter Redemptions</div>
              <div style={{ fontSize: '12px', color: '#B7C49A' }}>Total: {today.length} drinks</div>
            </div>
            {today.length === 0 ? (
              <div style={{ padding: '24px', fontSize: '13px', color: '#B7C49A' }}>No redemptions yet today.</div>
            ) : (
              today.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.drink}</div>
                    <div style={{ fontSize: '12px', color: '#B7C49A' }}>{item.member} · {new Date(item.time).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#B7C49A' }}>{item.credits} cr</div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'earnings' && earnings && (
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#352A24', borderRadius: '16px', border: '1px solid #4E5A3F', padding: '28px' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Playfair Display, serif', marginBottom: '8px' }}>{session.cafeName} — Monthly Earnings</div>
            <div style={{ fontSize: '12px', color: '#B7C49A', marginBottom: '20px' }}>Billing period: {earnings.period}</div>
            <EarningsRow label="Total Drinks Redeemed" value={`${earnings.totalDrinks} drinks`} />
            <EarningsRow label="Total Credits Earned" value={`${earnings.totalCredits} credits`} />
            <EarningsRow label="Payout Amount Owed" value={`$${earnings.amountOwed.toFixed(2)}`} big />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#B7C49A' }}>
              <span>Status: {earnings.status === 'PAID' ? 'Paid' : 'Pending payment'}</span>
              {earnings.paidAt && <span>Paid: {new Date(earnings.paidAt).toLocaleDateString()}</span>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Corner({ style }: { style: React.CSSProperties }) {
  return <div style={{ position: 'absolute', width: 24, height: 24, ...style }} />;
}

function tabBtn(active: boolean): React.CSSProperties {
  return { padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: active ? '#687451' : 'transparent', color: '#FFFFFF' };
}

function EarningsRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div style={{ backgroundColor: '#231C17', padding: '16px', borderRadius: '10px', border: '1px solid #4E5A3F', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <span style={{ fontSize: '13px', color: '#B7C49A' }}>{label}</span>
      <span style={{ fontSize: big ? '22px' : '18px', fontWeight: 700, color: big ? '#687451' : '#FFFFFF' }}>{value}</span>
    </div>
  );
}
