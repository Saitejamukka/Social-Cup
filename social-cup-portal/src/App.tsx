import { useCallback, useEffect, useState } from 'react';
import { api, setAuthToken, getAuthToken } from './api';

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

// Shared style helpers so the markup below stays readable.
const card: React.CSSProperties = { backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px' };
const input: React.CSSProperties = { padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px', width: '100%' };
const primaryBtn: React.CSSProperties = { padding: '10px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer' };
const secondaryBtn: React.CSSProperties = { padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' };

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
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FCFCF8' }}>
      <header style={{ height: '60px', backgroundColor: '#2B3320', color: '#FFFFFF', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #39442A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '19px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Social Cup Portal</span>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: session.kind === 'ADMIN' ? '#6B7A3B' : '#4F5C29', color: '#FFFFFF' }}>
            {session.kind === 'ADMIN' ? '👑 HQ Admin' : `☕ Barista (${session.cafeName})`}
          </span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {session.kind === 'ADMIN' ? session.email : session.neighborhood}
          </span>
          <button onClick={signOut} style={{ background: '#39442A', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: '6px' }}>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBF6', fontSize: '14px', color: '#6E7359' }}>
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
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBF6', padding: '20px' }}>
      <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #DEE3D0', padding: '36px', boxShadow: '0 8px 30px rgba(43,51,32,0.06)' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Source Serif 4, serif', color: '#2B3320' }}>Social Cup</div>
          <div style={{ fontSize: '13px', color: '#6E7359', marginTop: '6px' }}>Business & Staff Unified Portal</div>
        </div>

        <div style={{ display: 'flex', backgroundColor: '#EEF1E3', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
          <button type="button" onClick={() => { setTab('barista'); setError(null); }} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: tab === 'barista' ? '#FFFFFF' : 'transparent', color: '#2B3320', boxShadow: tab === 'barista' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>
            ☕ Cafe Staff Portal
          </button>
          <button type="button" onClick={() => { setTab('admin'); setError(null); }} style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: tab === 'admin' ? '#FFFFFF' : 'transparent', color: '#2B3320', boxShadow: tab === 'admin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}>
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
            <button type="submit" disabled={submitting} style={{ marginTop: '10px', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Signing in…' : 'Sign In as HQ Admin →'}
            </button>
          </form>
        ) : (
          <form onSubmit={submitBarista} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <Field label="Counter Station">
              <select value={selectedCafeId} onChange={(e) => setSelectedCafeId(e.target.value)} style={input}>
                {cafes.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} — {c.neighborhood}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Cafe PIN">
              <input type="password" inputMode="numeric" maxLength={4} value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))} required style={input} />
            </Field>
            {error && <ErrorText text={error} />}
            <button type="submit" disabled={submitting} style={{ marginTop: '10px', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: submitting ? 'default' : 'pointer', opacity: submitting ? 0.7 : 1 }}>
              {submitting ? 'Checking…' : 'Sign In to Cafe Counter Station →'}
            </button>
          </form>
        )}

        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#FAFBF6', borderRadius: '8px', border: '1px dashed #DEE3D0', fontSize: '12px', color: '#6E7359', lineHeight: '18px' }}>
          🔒 A cafe PIN is entered once per device; this browser stays trusted until an admin resets that cafe's PIN.
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6E7359', marginBottom: '6px' }}>{label}</label>
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

type AdminTab = 'dashboard' | 'cafes' | 'menu' | 'members' | 'redemptions' | 'payouts';

function AdminSurface() {
  const [tab, setTab] = useState<AdminTab>('dashboard');

  return (
    <div style={{ display: 'flex', flex: 1 }}>
      <div style={{ width: '220px', backgroundColor: '#242C1B', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
        {([
          { key: 'dashboard', label: '📊 Dashboard' },
          { key: 'cafes', label: '☕ Dallas Cafes' },
          { key: 'menu', label: '🏷️ Menu & Pricing' },
          { key: 'members', label: '👥 Members' },
          { key: 'redemptions', label: '📋 Redemption Log' },
          { key: 'payouts', label: '💳 Payouts' },
        ] as { key: AdminTab; label: string }[]).map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} style={{ textAlign: 'left', padding: '11px 14px', borderRadius: '8px', border: 'none', fontWeight: 600, fontSize: '13px', cursor: 'pointer', backgroundColor: tab === t.key ? '#39442A' : 'transparent', color: tab === t.key ? '#A2B074' : 'rgba(255,255,255,0.7)' }}>
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
        {tab === 'dashboard' && <DashboardTab />}
        {tab === 'cafes' && <CafesTab />}
        {tab === 'menu' && <MenuTab />}
        {tab === 'members' && <MembersTab />}
        {tab === 'redemptions' && <RedemptionsTab />}
        {tab === 'payouts' && <PayoutsTab />}
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '20px' }}>{children}</div>;
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
        <div style={{ color: '#6E7359', fontSize: '13px' }}>Loading metrics…</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
          {rows.map((s, i) => (
            <div key={i} style={{ ...card, padding: '20px' }}>
              <div style={{ fontSize: '12px', color: '#6E7359' }}>{s.label}</div>
              <div style={{ fontSize: '26px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginTop: '6px', color: '#2B3320' }}>{s.value}</div>
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

  const refresh = useCallback(() => {
    setLoading(true);
    api.adminListCafes().then((r) => setCafes(r.cafes)).finally(() => setLoading(false));
  }, []);

  useEffect(refresh, [refresh]);

  const toggleFeatured = async (c: any) => {
    await api.adminUpdateCafe(c.id, { isFeatured: !c.isFeatured });
    refresh();
  };

  const saveCafe = async (data: any) => {
    if (editingCafe.id === 'new') {
      await api.adminCreateCafe(data);
    } else {
      await api.adminUpdateCafe(editingCafe.id, data);
    }
    setEditingCafe(null);
    refresh();
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
        <button onClick={() => setEditingCafe({ id: 'new', name: '', neighborhood: 'Bishop Arts', address: '', hours: '', payoutRate: 3.5, isFeatured: false, vibeTags: [] })} style={primaryBtn}>
          + Add New Cafe
        </button>
      </div>

      {loading ? (
        <div style={{ color: '#6E7359', fontSize: '13px' }}>Loading cafes…</div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
            <div>Cafe</div><div>Neighborhood</div><div>Payout Rate</div><div>Featured</div><div>Action</div>
          </div>
          {cafes.map((c) => (
            <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ fontWeight: 600 }}>{c.name}</div>
              <div style={{ color: '#6E7359' }}>{c.neighborhood}</div>
              <div>${c.payoutRate.toFixed(2)}/cr</div>
              <div>
                <button onClick={() => toggleFeatured(c)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.isFeatured ? '#6B7A3B' : '#A6AC94' }}>
                  {c.isFeatured ? '★' : '☆'}
                </button>
              </div>
              <div>
                <button onClick={() => setEditingCafe(c)} style={secondaryBtn}>Edit Details</button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editingCafe && (
        <CafeDrawer
          cafe={editingCafe}
          onClose={() => { setEditingCafe(null); setPinMessage(null); }}
          onSave={saveCafe}
          onResetPin={editingCafe.id !== 'new' ? resetPin : undefined}
          pinMessage={pinMessage}
        />
      )}
    </div>
  );
}

function CafeDrawer({ cafe, onClose, onSave, onResetPin, pinMessage }: { cafe: any; onClose: () => void; onSave: (data: any) => void; onResetPin?: () => void; pinMessage: string | null }) {
  const [form, setForm] = useState({
    name: cafe.name || '',
    neighborhood: cafe.neighborhood || '',
    address: cafe.address || '',
    hours: cafe.hours || '',
    payoutRate: cafe.payoutRate ?? 3.5,
  });

  return (
    <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: '#FFFFFF', borderLeft: '1px solid #DEE3D0', padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 60, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', overflowY: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>{cafe.id === 'new' ? 'Add Cafe' : 'Edit Cafe Details'}</div>
        <button onClick={onClose} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
      </div>
      <input placeholder="Cafe Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} style={input} />
      <input placeholder="Neighborhood" value={form.neighborhood} onChange={(e) => setForm({ ...form, neighborhood: e.target.value })} style={input} />
      <input placeholder="Address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} style={input} />
      <input placeholder="Hours" value={form.hours} onChange={(e) => setForm({ ...form, hours: e.target.value })} style={input} />
      <div>
        <div style={{ fontSize: '12px', color: '#6E7359', marginBottom: '4px' }}>Payout Rate ($/credit)</div>
        <input type="number" step="0.25" value={form.payoutRate} onChange={(e) => setForm({ ...form, payoutRate: Number(e.target.value) })} style={input} />
      </div>

      {onResetPin && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', padding: '10px 0', borderTop: '1px solid #EEF1E3', borderBottom: '1px solid #EEF1E3' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Barista Counter PIN</span>
            <button onClick={onResetPin} style={secondaryBtn}>Reset PIN</button>
          </div>
          {pinMessage && <div style={{ fontSize: '12px', color: '#4F7A3E' }}>{pinMessage}</div>}
        </div>
      )}

      <button onClick={() => onSave(form)} style={{ marginTop: 'auto', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#6B7A3B', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
        Save Changes
      </button>
    </div>
  );
}

function MenuTab() {
  const [cafes, setCafes] = useState<any[]>([]);
  const [selectedCafeId, setSelectedCafeId] = useState('');
  const [addingDrink, setAddingDrink] = useState(false);
  const [newDrink, setNewDrink] = useState({ name: '', retailPrice: 6, creditsCost: 6 });

  const [calcRetail, setCalcRetail] = useState(6.0);
  const [calcCredits, setCalcCredits] = useState(6);
  const [calcPayoutRate, setCalcPayoutRate] = useState(3.5);

  const refresh = useCallback(() => {
    api.adminListCafes().then((r) => {
      setCafes(r.cafes);
      if (!selectedCafeId && r.cafes[0]) setSelectedCafeId(r.cafes[0].id);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
    await api.adminCreateDrink(selectedCafeId, newDrink);
    setNewDrink({ name: '', retailPrice: 6, creditsCost: 6 });
    setAddingDrink(false);
    refresh();
  };

  return (
    <div>
      <SectionTitle>Drink Catalog &amp; Financial Calculator</SectionTitle>
      <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
        {cafes.map((c) => (
          <button key={c.id} onClick={() => setSelectedCafeId(c.id)} style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid ' + (selectedCafeId === c.id ? '#2B3320' : '#DEE3D0'), backgroundColor: selectedCafeId === c.id ? '#2B3320' : '#FFFFFF', color: selectedCafeId === c.id ? '#FFFFFF' : '#2B3320', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
            {c.name}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '20px' }}>
        <div style={{ flex: 1.4, ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', backgroundColor: '#FAFBF6', fontSize: '10px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
            <div>Drink</div><div>Retail</div><div>Credits</div><div>Signature</div><div>Enabled</div>
          </div>
          {drinks.map((d) => (
            <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ fontWeight: 600 }}>{d.name}</div>
              <div>${d.retailPrice.toFixed(2)}</div>
              <div>{d.creditsCost} cr</div>
              <div>
                <button onClick={() => toggleDrinkField(d, 'isSignature')} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.isSignature ? '#6B7A3B' : '#A6AC94' }}>
                  {d.isSignature ? '★' : '☆'}
                </button>
              </div>
              <div>
                <button onClick={() => toggleDrinkField(d, 'isEnabled')} style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.isEnabled ? '#4F7A3E' : '#A6AC94' }}>
                  {d.isEnabled ? '●' : '○'}
                </button>
              </div>
            </div>
          ))}

          <div style={{ padding: '14px 16px', borderTop: '1px solid #EEF1E3' }}>
            {!addingDrink ? (
              <button onClick={() => setAddingDrink(true)} style={secondaryBtn}>+ Add Drink</button>
            ) : (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <input placeholder="Drink name" value={newDrink.name} onChange={(e) => setNewDrink({ ...newDrink, name: e.target.value })} style={{ ...input, width: '160px' }} />
                <input type="number" step="0.25" placeholder="Retail $" value={newDrink.retailPrice} onChange={(e) => setNewDrink({ ...newDrink, retailPrice: Number(e.target.value) })} style={{ ...input, width: '90px' }} />
                <input type="number" placeholder="Credits" value={newDrink.creditsCost} onChange={(e) => setNewDrink({ ...newDrink, creditsCost: Number(e.target.value) })} style={{ ...input, width: '80px' }} />
                <button onClick={submitNewDrink} style={primaryBtn}>Save</button>
                <button onClick={() => setAddingDrink(false)} style={secondaryBtn}>Cancel</button>
              </div>
            )}
          </div>
        </div>

        <div style={{ flex: 1, ...card, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div style={{ fontSize: '15px', fontWeight: 600 }}>Live Pricing Calculator</div>
          <div>
            <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Retail Drink Price ($)</div>
            <input type="number" step="0.25" value={calcRetail} onChange={(e) => setCalcRetail(Number(e.target.value))} style={input} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Credit Cost (cr)</div>
            <input type="number" step="1" value={calcCredits} onChange={(e) => setCalcCredits(Number(e.target.value))} style={input} />
          </div>
          <div>
            <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Cafe Payout Rate ($/credit)</div>
            <input type="number" step="0.25" value={calcPayoutRate} onChange={(e) => setCalcPayoutRate(Number(e.target.value))} style={input} />
          </div>
          <div style={{ height: '1px', backgroundColor: '#EEF1E3' }} />
          <Row label="Member Value" value={calcDollarValue} color="#2B3320" />
          <Row label="Member Savings" value={calcSavings} color="#4F7A3E" />
          <Row label="Cafe Payout" value={calcPayout} color="#2B3320" />
          <Row label="Social Cup Platform Margin" value={calcMargin} color="#6B7A3B" />
        </div>
      </div>
    </div>
  );
}

function Row({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
      <span style={{ color: '#6E7359' }}>{label}</span>
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

  const toggleStatus = async (m: any) => {
    await api.adminSetMemberStatus(m.id, m.status === 'MEMBER' ? 'CANCELED' : 'MEMBER');
    refresh();
  };

  return (
    <div>
      <SectionTitle>Active Subscriber Directory</SectionTitle>
      {loading ? (
        <div style={{ color: '#6E7359', fontSize: '13px' }}>Loading members…</div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr 0.8fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
            <div>Name</div><div>Email</div><div>Status</div><div>Joined</div><div>Credits</div><div>Action</div>
          </div>
          {members.map((m) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1.4fr 1fr 1fr 1fr 0.8fr', padding: '14px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ fontWeight: 600 }}>{m.name}</div>
              <div style={{ color: '#6E7359', fontSize: '12px' }}>{m.email}</div>
              <div>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: m.status === 'MEMBER' ? '#E9EEDD' : '#F6E3DF', color: m.status === 'MEMBER' ? '#4F7A3E' : '#B84C3E' }}>
                  {m.status}
                </span>
              </div>
              <div>{new Date(m.joined).toLocaleDateString()}</div>
              <div>{m.credits}</div>
              <div>
                <button onClick={() => toggleStatus(m)} style={secondaryBtn}>
                  {m.status === 'MEMBER' ? 'Deactivate' : 'Reactivate'}
                </button>
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
        <div style={{ color: '#6E7359', fontSize: '13px' }}>Loading redemptions…</div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr 0.6fr 0.7fr 0.7fr 0.7fr 0.8fr 0.9fr 0.7fr', padding: '12px 14px', backgroundColor: '#FAFBF6', fontSize: '10px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
            <div>Member</div><div>Cafe</div><div>Drink</div><div>Credits</div><div>Value</div><div>Payout</div><div>Margin</div><div>Status</div><div>Time</div><div>Action</div>
          </div>
          {redemptions.map((r) => (
            <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.1fr 1.2fr 1.1fr 0.6fr 0.7fr 0.7fr 0.7fr 0.8fr 0.9fr 0.7fr', padding: '14px 14px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '12px' }}>
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
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Void this redemption?</div>
            <div style={{ fontSize: '13px', color: '#6E7359', lineHeight: '18px' }}>
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
        <div style={{ color: '#6E7359', fontSize: '13px' }}>Loading payouts…</div>
      ) : payouts.length === 0 ? (
        <div style={{ color: '#6E7359', fontSize: '13px' }}>No redemptions recorded for this period yet.</div>
      ) : (
        <div style={{ ...card, overflow: 'hidden' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
            <div>Cafe</div><div>Redemptions</div><div>Credits</div><div>Amount Owed</div><div>Status</div><div>Action</div>
          </div>
          {payouts.map((p) => (
            <div key={p.cafeId} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
              <div style={{ fontWeight: 600 }}>{p.cafe}</div>
              <div>{p.redemptions}</div>
              <div>{p.totalCredits}</div>
              <div style={{ fontWeight: 600 }}>${p.amountOwed.toFixed(2)}</div>
              <div>
                <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: p.status === 'PAID' ? '#E9EEDD' : '#EEF1E3', color: p.status === 'PAID' ? '#4F7A3E' : '#4F5C29' }}>
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
            <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Record payment to {payTarget.cafe}</div>
            <div style={{ fontSize: '13px', color: '#6E7359' }}>Amount: ${payTarget.amountOwed.toFixed(2)} for {period}</div>
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

  const submitScan = async () => {
    if (!manualCode) return;
    const result = await guard(() => api.baristaScan(session.cafeId, manualCode, session.deviceToken)).catch((err: Error) => {
      setScanResult({ errorMsg: err.message });
      setScanState('error');
      return undefined;
    });
    if (result) {
      setScanResult({ member: result.member.name, drink: result.drink.name, credits: result.credits });
      setScanState('success');
      setManualCode('');
    }
  };

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1E2417', color: '#FAFBF6' }}>
      <div style={{ padding: '14px 24px', backgroundColor: '#2B3320', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #39442A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={{ fontSize: '12px', color: '#A2B074' }}>Counter Station:</span>
          <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{session.cafeName}</span>
          <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#39442A', color: '#A2B074', fontWeight: 600 }}>{session.neighborhood}</span>
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
                <div style={{ position: 'relative', width: '280px', height: '280px', backgroundColor: '#000000', borderRadius: '20px', overflow: 'hidden', border: '2px solid #39442A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div className="sc-scanline-anim" />
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0 20px' }}>
                    Point camera at customer's 5-minute QR code
                  </div>
                  <Corner style={{ top: 12, left: 12, borderTop: '3px solid #6B7A3B', borderLeft: '3px solid #6B7A3B' }} />
                  <Corner style={{ top: 12, right: 12, borderTop: '3px solid #6B7A3B', borderRight: '3px solid #6B7A3B' }} />
                  <Corner style={{ bottom: 12, left: 12, borderBottom: '3px solid #6B7A3B', borderLeft: '3px solid #6B7A3B' }} />
                  <Corner style={{ bottom: 12, right: 12, borderBottom: '3px solid #6B7A3B', borderRight: '3px solid #6B7A3B' }} />
                </div>

                <div style={{ width: '100%', marginTop: '16px', display: 'flex', gap: '8px' }}>
                  <input
                    type="text"
                    placeholder="4-digit code or 6-char backup code"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    onKeyDown={(e) => e.key === 'Enter' && submitScan()}
                    style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #39442A', backgroundColor: '#2B3320', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                  />
                  <button onClick={submitScan} style={{ padding: '12px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#6B7A3B', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}>
                    Verify
                  </button>
                </div>
              </div>
            )}

            {scanState === 'success' && (
              <div style={{ width: '100%', backgroundColor: '#4F7A3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Redemption Approved!</div>
                <div style={{ fontSize: '15px', marginTop: '10px' }}><strong>{scanResult.member}</strong></div>
                <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>{scanResult.drink}</div>
                <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>{scanResult.credits} credits deducted</div>
                <button onClick={() => setScanState('idle')} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#2B3320', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Scan Next Customer
                </button>
              </div>
            )}

            {scanState === 'error' && (
              <div style={{ width: '100%', backgroundColor: '#B84C3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                <div style={{ fontSize: '48px', marginBottom: '8px' }}>✕</div>
                <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Scan Rejected</div>
                <div style={{ fontSize: '14px', marginTop: '10px' }}>{scanResult.errorMsg}</div>
                <button onClick={() => setScanState('idle')} style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#2B3320', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}>
                  Try Again
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'today' && (
          <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#2B3320', borderRadius: '16px', border: '1px solid #39442A', overflow: 'hidden' }}>
            <div style={{ padding: '18px 24px', borderBottom: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Today's Counter Redemptions</div>
              <div style={{ fontSize: '12px', color: '#A2B074' }}>Total: {today.length} drinks</div>
            </div>
            {today.length === 0 ? (
              <div style={{ padding: '24px', fontSize: '13px', color: '#A2B074' }}>No redemptions yet today.</div>
            ) : (
              today.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                  <div>
                    <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.drink}</div>
                    <div style={{ fontSize: '12px', color: '#A2B074' }}>{item.member} · {new Date(item.time).toLocaleTimeString()}</div>
                  </div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#A2B074' }}>{item.credits} cr</div>
                </div>
              ))
            )}
          </div>
        )}

        {tab === 'earnings' && earnings && (
          <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#2B3320', borderRadius: '16px', border: '1px solid #39442A', padding: '28px' }}>
            <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '8px' }}>{session.cafeName} — Monthly Earnings</div>
            <div style={{ fontSize: '12px', color: '#A2B074', marginBottom: '20px' }}>Billing period: {earnings.period}</div>
            <EarningsRow label="Total Drinks Redeemed" value={`${earnings.totalDrinks} drinks`} />
            <EarningsRow label="Total Credits Earned" value={`${earnings.totalCredits} credits`} />
            <EarningsRow label="Payout Amount Owed" value={`$${earnings.amountOwed.toFixed(2)}`} big />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A2B074' }}>
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
  return { padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: active ? '#6B7A3B' : 'transparent', color: '#FFFFFF' };
}

function EarningsRow({ label, value, big }: { label: string; value: string; big?: boolean }) {
  return (
    <div style={{ backgroundColor: '#1E2417', padding: '16px', borderRadius: '10px', border: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
      <span style={{ fontSize: '13px', color: '#A2B074' }}>{label}</span>
      <span style={{ fontSize: big ? '22px' : '18px', fontWeight: 700, color: big ? '#6B7A3B' : '#FFFFFF' }}>{value}</span>
    </div>
  );
}
