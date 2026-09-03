import { useState } from 'react';

// Real Dallas Partner Cafes
const INITIAL_CAFES = [
  { id: 'roastery', name: 'Roastery Coffee House', neighborhood: 'Bishop Arts', address: '408 N Bishop Ave, Dallas', hours: '8am–10pm daily', tags: 'Garden patio, Third wave, Specialty brew', payout: 3.50, featured: true, pin: '4821', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80' },
  { id: 'niloufer', name: 'Café Niloufer', neighborhood: 'Deep Ellum', address: '2639 Main St, Dallas', hours: '6:30am–11pm daily', tags: 'Heritage, Iconic, Maska Bun', payout: 3.50, featured: true, pin: '4821', image: 'https://images.unsplash.com/photo-1576092768241-dec231879fc3?w=400&auto=format&fit=crop&q=80' },
  { id: 'concu', name: 'Conçu', neighborhood: 'Uptown', address: '2800 Routh St, Dallas', hours: '9am–10:30pm daily', tags: 'French patisserie, Chic, Dessert bar', payout: 3.50, featured: true, pin: '4821', image: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=400&auto=format&fit=crop&q=80' },
  { id: 'true-black', name: 'True Black Specialty Coffee', neighborhood: 'Knox-Henderson', address: '3102 Knox St, Dallas', hours: '7:30am–9pm daily', tags: 'Minimalist, Third wave, Study spot', payout: 3.50, featured: true, pin: '4821', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=400&auto=format&fit=crop&q=80' },
  { id: 'subko', name: 'Subko Coffee', neighborhood: 'Lower Greenville', address: '2008 Greenville Ave, Dallas', hours: '7:30am–10pm daily', tags: 'Craft roastery, Artisanal, Bakehouse', payout: 3.50, featured: false, pin: '4821', image: 'https://images.unsplash.com/photo-1497636577773-f1231844b336?w=400&auto=format&fit=crop&q=80' },
  { id: 'blue-tokai', name: 'Blue Tokai Coffee Roasters', neighborhood: 'Design District', address: '1405 Dragon St, Dallas', hours: '7am–9pm daily', tags: 'Work cafe, Roastery, Single estate', payout: 3.50, featured: false, pin: '4821', image: 'https://images.unsplash.com/photo-1453614512568-c4024d13c247?w=400&auto=format&fit=crop&q=80' },
];

const INITIAL_DRINKS: Record<string, Array<{ id: string; name: string; retail: number; credits: number; signature: boolean; enabled: boolean }>> = {
  roastery: [
    { id: 'd1', name: 'Cascara Brew', retail: 6.50, credits: 6, signature: true, enabled: true },
    { id: 'd2', name: 'Monsoon Malabar Pour Over', retail: 5.50, credits: 5, signature: false, enabled: true },
    { id: 'd3', name: 'Cranberry Iced Coffee', retail: 6.25, credits: 6, signature: true, enabled: true },
  ],
  niloufer: [
    { id: 'd4', name: 'Niloufer Special Irani Chai', retail: 3.50, credits: 3, signature: true, enabled: true },
    { id: 'd5', name: 'Niloufer Decoction Filter Coffee', retail: 4.00, credits: 4, signature: false, enabled: true },
  ],
  concu: [
    { id: 'd6', name: 'Valrhona Hot Chocolate', retail: 6.75, credits: 6, signature: true, enabled: true },
    { id: 'd7', name: 'Madagascar Vanilla Bean Latte', retail: 5.75, credits: 5, signature: false, enabled: true },
  ],
  'true-black': [
    { id: 'd8', name: 'Sea Salt Caramel Cold Brew', retail: 6.50, credits: 6, signature: true, enabled: true },
    { id: 'd9', name: 'True Cortado', retail: 4.75, credits: 4, signature: false, enabled: true },
  ],
};

type Role = 'ADMIN' | 'BARISTA';

export default function App() {
  const [currentUser, setCurrentUser] = useState<{ email: string; name: string; role: Role; cafeId?: string } | null>({
    email: 'admin@socialcup.app',
    name: 'Admin HQ',
    role: 'ADMIN',
  });

  // Login form state
  const [loginEmail, setLoginEmail] = useState('admin@socialcup.app');
  const [loginPassword, setLoginPassword] = useState('••••••••');
  const [selectedPreset, setSelectedPreset] = useState<'admin' | 'roastery' | 'niloufer'>('admin');

  // Admin Section Navigation
  const [adminTab, setAdminTab] = useState<'dashboard' | 'cafes' | 'menu' | 'members' | 'redemptions' | 'payouts'>('dashboard');
  const [cafes, setCafes] = useState(INITIAL_CAFES);
  const [editingCafe, setEditingCafe] = useState<typeof INITIAL_CAFES[0] | null>(null);
  const [selectedMenuCafe, setSelectedMenuCafe] = useState('roastery');
  const [drinks, setDrinks] = useState(INITIAL_DRINKS);

  // Live Pricing Calculator State
  const [calcRetail, setCalcRetail] = useState(6.00);
  const [calcCredits, setCalcCredits] = useState(6);
  const [calcPayoutRate, setCalcPayoutRate] = useState(3.50);

  // Members state
  const [members, setMembers] = useState([
    { id: 'm1', name: 'Jordan Avery', plan: 'Standard $24.99', status: 'Active', joined: 'Mar 2026', credits: '22/30' },
    { id: 'm2', name: 'Priya Nair', plan: 'Standard $24.99', status: 'Active', joined: 'Feb 2026', credits: '19/30' },
    { id: 'm3', name: 'Chris Delgado', plan: 'Standard $24.99', status: 'Active', joined: 'Jan 2026', credits: '25/30' },
    { id: 'm4', name: 'Maya Park', plan: 'Standard $24.99', status: 'Active', joined: 'Mar 2026', credits: '14/30' },
    { id: 'm5', name: 'Sam Rivera', plan: 'Standard $24.99', status: 'Paused', joined: 'Apr 2026', credits: '30/30' },
  ]);

  // Admin Redemptions Log & Void
  const [redemptions, setRedemptions] = useState([
    { id: 'r1', member: 'Jordan Avery', cafe: 'Roastery Coffee House', drink: 'Cascara Brew', credits: 6, value: '$6.00', payout: '$21.00', margin: '-$15.00', time: '9:14 AM' },
    { id: 'r2', member: 'Priya Nair', cafe: 'True Black Specialty Coffee', drink: 'Sea Salt Caramel Cold Brew', credits: 6, value: '$6.00', payout: '$21.00', margin: '-$15.00', time: '9:40 AM' },
    { id: 'r3', member: 'Chris Delgado', cafe: 'Conçu', drink: 'Valrhona Hot Chocolate', credits: 6, value: '$6.00', payout: '$21.00', margin: '-$15.00', time: '10:02 AM' },
    { id: 'r4', member: 'Maya Park', cafe: 'Café Niloufer', drink: 'Niloufer Special Irani Chai', credits: 3, value: '$3.00', payout: '$10.50', margin: '-$7.50', time: '10:31 AM' },
  ]);
  const [voidModalId, setVoidModalId] = useState<string | null>(null);

  // Admin Payouts
  const [payouts, setPayouts] = useState([
    { id: 'p1', cafe: 'Roastery Coffee House', redemptions: 42, credits: 248, amount: '$868.00', status: 'Pending' },
    { id: 'p2', cafe: 'Café Niloufer', redemptions: 56, credits: 198, amount: '$693.00', status: 'Pending' },
    { id: 'p3', cafe: 'Conçu', redemptions: 38, credits: 218, amount: '$763.00', status: 'Paid' },
    { id: 'p4', cafe: 'True Black Specialty Coffee', redemptions: 34, credits: 196, amount: '$686.00', status: 'Pending' },
  ]);

  // ---------------- BARISTA STATE ----------------
  const [baristaCafeId, setBaristaCafeId] = useState('roastery');
  const activeCafe = cafes.find(c => c.id === baristaCafeId) || cafes[0];
  const [baristaTab, setBaristaTab] = useState<'scan' | 'today' | 'payouts'>('scan');
  const [pinEntered, setPinEntered] = useState('');
  const [pinUnlocked, setPinUnlocked] = useState(true);
  const [pinError, setPinError] = useState(false);

  // Barista scan simulation
  const [manualCode, setManualCode] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'success' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<{ member?: string; drink?: string; credits?: number; errorMsg?: string }>({});
  const [todayRedemptions, setTodayRedemptions] = useState([
    { id: 't1', member: 'Maya Park', drink: 'Cascara Brew', credits: 6, time: '11:42 AM' },
    { id: 't2', member: 'Chris Delgado', drink: 'Sea Salt Caramel Cold Brew', credits: 6, time: '10:15 AM' },
    { id: 't3', member: 'Priya Nair', drink: 'Niloufer Special Irani Chai', credits: 3, time: '9:08 AM' },
  ]);

  // Calculations for live pricing
  const calcDollarValue = `$${Number(calcCredits).toFixed(2)}`;
  const calcSavings = `$${Math.max(0, Number(calcRetail) - Number(calcCredits)).toFixed(2)}`;
  const calcPayout = `$${(Number(calcCredits) * Number(calcPayoutRate)).toFixed(2)}`;
  const calcMargin = `$${(Number(calcCredits) - Number(calcCredits) * Number(calcPayoutRate)).toFixed(2)}`;

  // Handle Login Presets
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPreset === 'admin') {
      setCurrentUser({ email: 'admin@socialcup.app', name: 'Admin HQ', role: 'ADMIN' });
    } else if (selectedPreset === 'roastery') {
      setBaristaCafeId('roastery');
      setCurrentUser({ email: 'barista@roastery.com', name: 'Roastery Staff', role: 'BARISTA', cafeId: 'roastery' });
    } else {
      setBaristaCafeId('niloufer');
      setCurrentUser({ email: 'staff@niloufer.com', name: 'Niloufer Staff', role: 'BARISTA', cafeId: 'niloufer' });
    }
  };

  const handlePinPress = (digit: string) => {
    if (pinEntered.length < 4) {
      const next = pinEntered + digit;
      setPinEntered(next);
      if (next.length === 4) {
        if (next === activeCafe.pin) {
          setPinUnlocked(true);
          setPinError(false);
        } else {
          setPinError(true);
          setTimeout(() => {
            setPinEntered('');
            setPinError(false);
          }, 800);
        }
      }
    }
  };

  const simulateScan = (type: 'valid' | 'expired' | 'used' | 'wrongCafe' | 'invalid') => {
    if (type === 'valid') {
      const newEntry = {
        id: 't_' + Date.now(),
        member: 'Jordan Avery',
        drink: 'Cascara Brew',
        credits: 6,
        time: 'Just now',
      };
      setTodayRedemptions([newEntry, ...todayRedemptions]);
      setScanResult({ member: 'Jordan Avery', drink: 'Cascara Brew', credits: 6 });
      setScanState('success');
    } else {
      const messages: Record<string, string> = {
        expired: 'Code expired — generated more than 5 minutes ago.',
        used: 'Code already redeemed.',
        wrongCafe: 'Wrong cafe — generated for another location.',
        invalid: 'Invalid 4-digit code.',
      };
      setScanResult({ errorMsg: messages[type] });
      setScanState('error');
    }
  };

  // ---------------- RENDER LOGIN SCREEN ----------------
  if (!currentUser) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#FAFBF6', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '420px', backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #DEE3D0', padding: '36px', boxShadow: '0 8px 30px rgba(43,51,32,0.06)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '28px', fontWeight: 700, fontFamily: 'Source Serif 4, serif', color: '#2B3320' }}>Social Cup</div>
            <div style={{ fontSize: '13px', color: '#6E7359', marginTop: '6px' }}>Business & Staff Unified Portal</div>
          </div>

          <div style={{ display: 'flex', backgroundColor: '#EEF1E3', borderRadius: '10px', padding: '4px', marginBottom: '22px' }}>
            <button
              type="button"
              onClick={() => { setSelectedPreset('roastery'); setLoginEmail('barista@roastery.com'); }}
              style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedPreset === 'roastery' ? '#FFFFFF' : 'transparent', color: '#2B3320', boxShadow: selectedPreset === 'roastery' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
            >
              ☕ Cafe Staff Portal
            </button>
            <button
              type="button"
              onClick={() => { setSelectedPreset('admin'); setLoginEmail('admin@socialcup.app'); }}
              style={{ flex: 1, padding: '10px 6px', border: 'none', borderRadius: '8px', fontSize: '12px', fontWeight: 700, cursor: 'pointer', backgroundColor: selectedPreset === 'admin' ? '#FFFFFF' : 'transparent', color: '#2B3320', boxShadow: selectedPreset === 'admin' ? '0 2px 6px rgba(0,0,0,0.08)' : 'none' }}
            >
              👑 HQ Administration
            </button>
          </div>

          <form onSubmit={handleLoginSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6E7359', marginBottom: '6px' }}>
                {selectedPreset === 'admin' ? 'Admin Email' : 'Cafe Staff Email'}
              </label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '14px', outline: 'none' }} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', color: '#6E7359', marginBottom: '6px' }}>Password</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} required style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '14px', outline: 'none' }} />
            </div>
            <button type="submit" style={{ marginTop: '10px', padding: '14px', borderRadius: '10px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
              {selectedPreset === 'admin' ? 'Sign In as HQ Admin →' : 'Sign In to Cafe Counter Station →'}
            </button>
          </form>

          <div style={{ marginTop: '20px', padding: '12px', backgroundColor: '#FAFBF6', borderRadius: '8px', border: '1px dashed #DEE3D0', fontSize: '12px', color: '#6E7359', lineHeight: '18px' }}>
            🔒 <strong>Strict RBAC Enforcement:</strong> Cafe staff accounts are strictly locked to their single counter station with zero access to admin data.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#FCFCF8' }}>
      {/* GLOBAL TOP NAVIGATION */}
      <header style={{ height: '60px', backgroundColor: '#2B3320', color: '#FFFFFF', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #39442A' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <span style={{ fontSize: '19px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Social Cup Portal</span>
          <span style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', padding: '4px 10px', borderRadius: '20px', backgroundColor: currentUser.role === 'ADMIN' ? '#6B7A3B' : '#4F5C29', color: '#FFFFFF' }}>
            {currentUser.role === 'ADMIN' ? '👑 HQ Admin' : `☕ Barista (${activeCafe.name})`}
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)' }}>
            {currentUser.name} ({currentUser.email})
          </span>
          <button
            onClick={() => setCurrentUser(null)}
            style={{ background: '#39442A', border: '1px solid rgba(255,255,255,0.2)', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer', padding: '6px 14px', borderRadius: '6px' }}
          >
            Sign out
          </button>
        </div>
      </header>

      {/* ========================================================= */}
      {/* 1. ADMIN SURFACE (Role === 'ADMIN')                      */}
      {/* ========================================================= */}
      {currentUser.role === 'ADMIN' && (
        <div style={{ display: 'flex', flex: 1 }}>
          {/* Sidebar */}
          <div style={{ width: '220px', backgroundColor: '#242C1B', padding: '20px 12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {[
              { key: 'dashboard', label: '📊 Dashboard' },
              { key: 'cafes', label: '☕ Dallas Cafes' },
              { key: 'menu', label: '🏷️ Menu & Pricing' },
              { key: 'members', label: '👥 Members' },
              { key: 'redemptions', label: '📋 Redemption Log' },
              { key: 'payouts', label: '💳 Payouts' },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setAdminTab(tab.key as any)}
                style={{
                  textAlign: 'left',
                  padding: '11px 14px',
                  borderRadius: '8px',
                  border: 'none',
                  fontWeight: 600,
                  fontSize: '13px',
                  cursor: 'pointer',
                  backgroundColor: adminTab === tab.key ? '#39442A' : 'transparent',
                  color: adminTab === tab.key ? '#A2B074' : 'rgba(255,255,255,0.7)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Admin Main Body */}
          <div style={{ flex: 1, padding: '32px 36px', overflowY: 'auto' }}>
            {/* 1.1 DASHBOARD */}
            {adminTab === 'dashboard' && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '20px' }}>HQ Executive Dashboard</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
                  {[
                    { label: 'Active subscribers', value: '1,284' },
                    { label: 'Monthly Recurring Revenue', value: '$32,058' },
                    { label: 'Redemptions today', value: '96' },
                    { label: 'Partner cafes in Dallas', value: '30+' },
                    { label: 'Avg. credits used/mo', value: '22.4' },
                    { label: 'Churn rate (30d)', value: '3.1%' },
                  ].map((s, i) => (
                    <div key={i} style={{ backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ fontSize: '12px', color: '#6E7359' }}>{s.label}</div>
                      <div style={{ fontSize: '26px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginTop: '6px', color: '#2B3320' }}>{s.value}</div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1.2 CAFES & DRAWER */}
            {adminTab === 'cafes' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Partner Cafes Management</div>
                  <button
                    onClick={() => setEditingCafe({ id: 'new', name: '', neighborhood: 'Bishop Arts', address: '', hours: '', tags: '', payout: 3.50, featured: false, pin: '4821', image: 'https://images.unsplash.com/photo-1554118811-1e0d58224f24?w=400&auto=format&fit=crop&q=80' })}
                    style={{ padding: '9px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}
                  >
                    + Add New Cafe
                  </button>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
                    <div>Cafe & Photo</div><div>Neighborhood</div><div>Payout Rate</div><div>Featured</div><div>Action</div>
                  </div>
                  {cafes.map((c) => (
                    <div key={c.id} style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr 1fr 1fr 1fr', padding: '12px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <img src={c.image} alt={c.name} style={{ width: '38px', height: '38px', borderRadius: '6px', objectFit: 'cover' }} />
                        <span style={{ fontWeight: 600 }}>{c.name}</span>
                      </div>
                      <div style={{ color: '#6E7359' }}>{c.neighborhood}</div>
                      <div>${c.payout.toFixed(2)}/cr</div>
                      <div>
                        <button
                          onClick={() => setCafes(cafes.map(x => x.id === c.id ? { ...x, featured: !x.featured } : x))}
                          style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer', color: c.featured ? '#6B7A3B' : '#A6AC94' }}
                        >
                          {c.featured ? '★' : '☆'}
                        </button>
                      </div>
                      <div>
                        <button
                          onClick={() => setEditingCafe(c)}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          Edit Details
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Cafe Editor Drawer */}
                {editingCafe && (
                  <div style={{ position: 'fixed', top: 0, right: 0, bottom: 0, width: '400px', backgroundColor: '#FFFFFF', borderLeft: '1px solid #DEE3D0', padding: '28px', display: 'flex', flexDirection: 'column', gap: '14px', zIndex: 60, boxShadow: '-4px 0 24px rgba(0,0,0,0.08)', overflowY: 'auto' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Edit Cafe Details</div>
                      <button onClick={() => setEditingCafe(null)} style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}>✕</button>
                    </div>
                    {editingCafe.image && (
                      <img src={editingCafe.image} alt={editingCafe.name} style={{ width: '100%', height: '140px', borderRadius: '8px', objectFit: 'cover' }} />
                    )}
                    <input type="text" placeholder="Cafe Name" defaultValue={editingCafe.name} style={{ padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    <input type="text" placeholder="Neighborhood" defaultValue={editingCafe.neighborhood} style={{ padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    <input type="text" placeholder="Address" defaultValue={editingCafe.address} style={{ padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    <input type="text" placeholder="Hours" defaultValue={editingCafe.hours} style={{ padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    <div>
                      <div style={{ fontSize: '12px', color: '#6E7359', marginBottom: '4px' }}>Payout Rate ($/credit)</div>
                      <input type="number" step="0.25" defaultValue={editingCafe.payout} style={{ width: '100%', padding: '11px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderTop: '1px solid #EEF1E3', borderBottom: '1px solid #EEF1E3' }}>
                      <span style={{ fontSize: '13px', fontWeight: 600 }}>Barista Counter PIN (4821)</span>
                      <button onClick={() => alert('PIN reset instructions sent to cafe manager.')} style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>
                        Reset PIN
                      </button>
                    </div>
                    <button onClick={() => setEditingCafe(null)} style={{ marginTop: 'auto', padding: '14px', borderRadius: '8px', border: 'none', backgroundColor: '#6B7A3B', color: '#FFFFFF', fontWeight: 600, fontSize: '14px', cursor: 'pointer' }}>
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* 1.3 MENU & LIVE PRICING CALCULATOR */}
            {adminTab === 'menu' && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '16px' }}>Drink Catalog & Financial Calculator</div>
                <div style={{ display: 'flex', gap: '8px', marginBottom: '18px', flexWrap: 'wrap' }}>
                  {cafes.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setSelectedMenuCafe(c.id)}
                      style={{
                        padding: '8px 16px',
                        borderRadius: '8px',
                        border: '1px solid ' + (selectedMenuCafe === c.id ? '#2B3320' : '#DEE3D0'),
                        backgroundColor: selectedMenuCafe === c.id ? '#2B3320' : '#FFFFFF',
                        color: selectedMenuCafe === c.id ? '#FFFFFF' : '#2B3320',
                        fontSize: '12px',
                        fontWeight: 600,
                        cursor: 'pointer'
                      }}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '20px' }}>
                  {/* Drinks catalog */}
                  <div style={{ flex: 1.4, backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', overflow: 'hidden' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', backgroundColor: '#FAFBF6', fontSize: '10px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
                      <div>Drink</div><div>Retail</div><div>Credits</div><div>Signature</div><div>Enabled</div>
                    </div>
                    {(drinks[selectedMenuCafe] || []).map((d) => (
                      <div key={d.id} style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr 1fr 0.8fr', padding: '12px 16px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
                        <div style={{ fontWeight: 600 }}>{d.name}</div>
                        <div>${d.retail.toFixed(2)}</div>
                        <div>{d.credits} cr</div>
                        <div>
                          <button
                            onClick={() => {
                              const updated = { ...drinks };
                              updated[selectedMenuCafe] = updated[selectedMenuCafe].map(x => x.id === d.id ? { ...x, signature: !x.signature } : x);
                              setDrinks(updated);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.signature ? '#6B7A3B' : '#A6AC94' }}
                          >
                            {d.signature ? '★' : '☆'}
                          </button>
                        </div>
                        <div>
                          <button
                            onClick={() => {
                              const updated = { ...drinks };
                              updated[selectedMenuCafe] = updated[selectedMenuCafe].map(x => x.id === d.id ? { ...x, enabled: !x.enabled } : x);
                              setDrinks(updated);
                            }}
                            style={{ background: 'none', border: 'none', fontSize: '16px', cursor: 'pointer', color: d.enabled ? '#4F7A3E' : '#A6AC94' }}
                          >
                            {d.enabled ? '●' : '○'}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Live Financial Calculator */}
                  <div style={{ flex: 1, backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div style={{ fontSize: '15px', fontWeight: 600 }}>Live Pricing Calculator</div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Retail Drink Price ($)</div>
                      <input type="number" step="0.25" value={calcRetail} onChange={(e) => setCalcRetail(Number(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Credit Cost (cr)</div>
                      <input type="number" step="1" value={calcCredits} onChange={(e) => setCalcCredits(Number(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    </div>
                    <div>
                      <div style={{ fontSize: '11px', color: '#6E7359', marginBottom: '4px' }}>Cafe Payout Rate ($/credit)</div>
                      <input type="number" step="0.25" value={calcPayoutRate} onChange={(e) => setCalcPayoutRate(Number(e.target.value))} style={{ width: '100%', padding: '9px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '13px' }} />
                    </div>
                    <div style={{ height: '1px', backgroundColor: '#EEF1E3' }} />
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#6E7359' }}>Member Savings</span>
                      <span style={{ fontWeight: 700, color: '#4F7A3E' }}>{calcSavings}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#6E7359' }}>Cafe Payout</span>
                      <span style={{ fontWeight: 700 }}>{calcPayout}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px' }}>
                      <span style={{ color: '#6E7359' }}>Social Cup Platform Margin</span>
                      <span style={{ fontWeight: 700, color: '#6B7A3B' }}>{calcMargin}</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* 1.4 MEMBERS */}
            {adminTab === 'members' && (
              <div>
                <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '20px' }}>Active Subscriber Directory</div>
                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 0.8fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
                    <div>Name</div><div>Plan</div><div>Status</div><div>Joined</div><div>Credits</div><div>Action</div>
                  </div>
                  {members.map((m) => (
                    <div key={m.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 0.8fr', padding: '14px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600 }}>{m.name}</div>
                      <div>{m.plan}</div>
                      <div>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: m.status === 'Active' ? '#E9EEDD' : '#F6E3DF', color: m.status === 'Active' ? '#4F7A3E' : '#B84C3E' }}>
                          {m.status}
                        </span>
                      </div>
                      <div>{m.joined}</div>
                      <div>{m.credits}</div>
                      <div>
                        <button
                          onClick={() => setMembers(members.map(x => x.id === m.id ? { ...x, status: x.status === 'Active' ? 'Paused' : 'Active' } : x))}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}
                        >
                          {m.status === 'Active' ? 'Pause' : 'Reactivate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* 1.5 REDEMPTIONS & VOID MODAL */}
            {adminTab === 'redemptions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Redemption Audit Trail</div>
                  <button onClick={() => alert('Exporting redemptions.csv...')} style={{ padding: '8px 14px', borderRadius: '8px', border: 'none', backgroundColor: '#2B3320', color: '#FFFFFF', fontWeight: 600, fontSize: '12px', cursor: 'pointer' }}>
                    Export CSV
                  </button>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1.2fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr', padding: '12px 14px', backgroundColor: '#FAFBF6', fontSize: '10px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
                    <div>Member</div><div>Cafe</div><div>Drink</div><div>Credits</div><div>Value</div><div>Payout</div><div>Margin</div><div>Time</div><div>Action</div>
                  </div>
                  {redemptions.map((r) => (
                    <div key={r.id} style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.3fr 1.2fr 0.7fr 0.8fr 0.8fr 0.8fr 0.8fr 0.7fr', padding: '14px 14px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '12px' }}>
                      <div>{r.member}</div><div>{r.cafe}</div><div>{r.drink}</div><div>{r.credits}</div><div>{r.value}</div><div>{r.payout}</div><div>{r.margin}</div><div>{r.time}</div>
                      <div>
                        <button
                          onClick={() => setVoidModalId(r.id)}
                          style={{ padding: '4px 8px', borderRadius: '6px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '10px', fontWeight: 600, color: '#B84C3E', cursor: 'pointer' }}
                        >
                          Void
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {voidModalId && (
                  <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(43,51,32,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 70 }}>
                    <div style={{ width: '380px', backgroundColor: '#FFFFFF', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Void this redemption?</div>
                      <div style={{ fontSize: '13px', color: '#6E7359', lineHeight: '18px' }}>
                        Credits will be refunded back to the member and deducted from the cafe's payout batch.
                      </div>
                      <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end' }}>
                        <button onClick={() => setVoidModalId(null)} style={{ padding: '9px 16px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                        <button onClick={() => { setRedemptions(redemptions.filter(x => x.id !== voidModalId)); setVoidModalId(null); }} style={{ padding: '9px 16px', borderRadius: '8px', border: 'none', backgroundColor: '#B84C3E', color: '#FFFFFF', fontSize: '12px', fontWeight: 600, cursor: 'pointer' }}>Void redemption</button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 1.6 PAYOUTS */}
            {adminTab === 'payouts' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
                  <div style={{ fontSize: '24px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Monthly Cafe Payout Batches</div>
                  <select style={{ padding: '8px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', fontSize: '12px' }}><option>August 2026</option><option>July 2026</option></select>
                </div>

                <div style={{ backgroundColor: '#FFFFFF', border: '1px solid #DEE3D0', borderRadius: '12px', overflow: 'hidden' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '12px 18px', backgroundColor: '#FAFBF6', fontSize: '11px', fontWeight: 700, color: '#6E7359', textTransform: 'uppercase' }}>
                    <div>Cafe</div><div>Redemptions</div><div>Credits</div><div>Amount Owed</div><div>Status</div><div>Action</div>
                  </div>
                  {payouts.map((p) => (
                    <div key={p.id} style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 1fr 1fr 1fr 1fr', padding: '14px 18px', borderTop: '1px solid #EEF1E3', alignItems: 'center', fontSize: '13px' }}>
                      <div style={{ fontWeight: 600 }}>{p.cafe}</div>
                      <div>{p.redemptions}</div>
                      <div>{p.credits}</div>
                      <div style={{ fontWeight: 600 }}>{p.amount}</div>
                      <div>
                        <span style={{ padding: '4px 10px', borderRadius: '6px', fontSize: '11px', fontWeight: 700, backgroundColor: p.status === 'Paid' ? '#E9EEDD' : '#EEF1E3', color: p.status === 'Paid' ? '#4F7A3E' : '#4F5C29' }}>
                          {p.status}
                        </span>
                      </div>
                      <div>
                        <button
                          onClick={() => setPayouts(payouts.map(x => x.id === p.id ? { ...x, status: 'Paid' } : x))}
                          disabled={p.status === 'Paid'}
                          style={{ padding: '6px 12px', borderRadius: '8px', border: '1px solid #DEE3D0', backgroundColor: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: p.status === 'Paid' ? 'default' : 'pointer', opacity: p.status === 'Paid' ? 0.5 : 1 }}
                        >
                          {p.status === 'Paid' ? 'Paid' : 'Record payment'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* 2. CAFE OWNER & BARISTA SURFACE (Role === 'BARISTA')       */}
      {/* ========================================================= */}
      {currentUser.role === 'BARISTA' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#1E2417', color: '#FAFBF6' }}>
          {/* Barista Station Info (Strictly Locked to This Cafe) */}
          <div style={{ padding: '14px 24px', backgroundColor: '#2B3320', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #39442A' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <span style={{ fontSize: '12px', color: '#A2B074' }}>Counter Station:</span>
              <span style={{ fontSize: '14px', fontWeight: 700, color: '#FFFFFF' }}>{activeCafe.name}</span>
              <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', backgroundColor: '#39442A', color: '#A2B074', fontWeight: 600 }}>{activeCafe.neighborhood}</span>
            </div>

            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                onClick={() => setBaristaTab('scan')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: baristaTab === 'scan' ? '#6B7A3B' : 'transparent', color: '#FFFFFF' }}
              >
                📷 QR Scanner
              </button>
              <button
                onClick={() => setBaristaTab('today')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: baristaTab === 'today' ? '#6B7A3B' : 'transparent', color: '#FFFFFF' }}
              >
                Today ({todayRedemptions.length})
              </button>
              <button
                onClick={() => setBaristaTab('payouts')}
                style={{ padding: '8px 16px', borderRadius: '6px', border: 'none', fontSize: '12px', fontWeight: 600, cursor: 'pointer', backgroundColor: baristaTab === 'payouts' ? '#6B7A3B' : 'transparent', color: '#FFFFFF' }}
              >
                💵 Cafe Earnings
              </button>
            </div>
          </div>

          {/* Barista Body */}
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            {/* PIN PAD LOCK SCREEN */}
            {!pinUnlocked ? (
              <div style={{ width: '100%', maxWidth: '320px', backgroundColor: '#2B3320', borderRadius: '18px', padding: '30px', textAlign: 'center', border: '1px solid #39442A' }}>
                <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Enter Station PIN</div>
                <div style={{ fontSize: '12px', color: '#A2B074', marginTop: '4px' }}>Default test PIN: <strong>4821</strong></div>

                {/* 4 Pin Dots */}
                <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', margin: '24px 0' }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ width: '14px', height: '14px', borderRadius: '7px', backgroundColor: i < pinEntered.length ? '#6B7A3B' : 'transparent', border: '2px solid ' + (pinError ? '#B84C3E' : '#A2B074') }} />
                  ))}
                </div>

                {/* Keypad */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
                  {['1', '2', '3', '4', '5', '6', '7', '8', '9', 'C', '0', '⌫'].map((k) => (
                    <button
                      key={k}
                      onClick={() => {
                        if (k === 'C') setPinEntered('');
                        else if (k === '⌫') setPinEntered(pinEntered.slice(0, -1));
                        else handlePinPress(k);
                      }}
                      style={{ padding: '16px', borderRadius: '10px', border: '1px solid #39442A', backgroundColor: '#1E2417', color: '#FFFFFF', fontSize: '16px', fontWeight: 600, cursor: 'pointer' }}
                    >
                      {k}
                    </button>
                  ))}
                </div>
              </div>
            ) : baristaTab === 'scan' ? (
              /* SCANNER VIEW */
              <div style={{ width: '100%', maxWidth: '420px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px' }}>
                {scanState === 'idle' && (
                  <div style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                    {/* Viewfinder Box */}
                    <div style={{ position: 'relative', width: '280px', height: '280px', backgroundColor: '#000000', borderRadius: '20px', overflow: 'hidden', border: '2px solid #39442A', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <div className="sc-scanline-anim" />
                      <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)', textAlign: 'center', padding: '0 20px' }}>
                        Point camera at customer's 5-minute QR code
                      </div>

                      {/* Corner Brackets */}
                      <div style={{ position: 'absolute', top: 12, left: 12, width: 24, height: 24, borderTop: '3px solid #6B7A3B', borderLeft: '3px solid #6B7A3B' }} />
                      <div style={{ position: 'absolute', top: 12, right: 12, width: 24, height: 24, borderTop: '3px solid #6B7A3B', borderRight: '3px solid #6B7A3B' }} />
                      <div style={{ position: 'absolute', bottom: 12, left: 12, width: 24, height: 24, borderBottom: '3px solid #6B7A3B', borderLeft: '3px solid #6B7A3B' }} />
                      <div style={{ position: 'absolute', bottom: 12, right: 12, width: 24, height: 24, borderBottom: '3px solid #6B7A3B', borderRight: '3px solid #6B7A3B' }} />
                    </div>

                    {/* Manual 6-char backup code */}
                    <div style={{ width: '100%', marginTop: '16px', display: 'flex', gap: '8px' }}>
                      <input
                        type="text"
                        placeholder="Manual 6-char code (e.g. AB49XY)"
                        value={manualCode}
                        onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                        style={{ flex: 1, padding: '12px', borderRadius: '8px', border: '1px solid #39442A', backgroundColor: '#2B3320', color: '#FFFFFF', fontSize: '13px', outline: 'none' }}
                      />
                      <button
                        onClick={() => { if (manualCode) simulateScan('valid'); }}
                        style={{ padding: '12px 18px', borderRadius: '8px', border: 'none', backgroundColor: '#6B7A3B', color: '#FFFFFF', fontWeight: 600, fontSize: '13px', cursor: 'pointer' }}
                      >
                        Verify
                      </button>
                    </div>

                    {/* Simulation triggers for pair testing */}
                    <div style={{ marginTop: '18px', width: '100%', backgroundColor: '#2B3320', padding: '14px', borderRadius: '12px', border: '1px solid #39442A' }}>
                      <div style={{ fontSize: '11px', color: '#A2B074', fontWeight: 700, textTransform: 'uppercase', marginBottom: '8px' }}>Test Simulation Triggers:</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        <button onClick={() => simulateScan('valid')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#4F7A3E', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>✓ Valid Scan</button>
                        <button onClick={() => simulateScan('expired')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#39442A', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Expired Code</button>
                        <button onClick={() => simulateScan('used')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#39442A', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Already Used</button>
                        <button onClick={() => simulateScan('wrongCafe')} style={{ padding: '6px 10px', borderRadius: '6px', border: 'none', backgroundColor: '#39442A', color: '#FFFFFF', fontSize: '11px', fontWeight: 600, cursor: 'pointer' }}>Wrong Cafe</button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Scan Success State */}
                {scanState === 'success' && (
                  <div style={{ width: '100%', backgroundColor: '#4F7A3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>✓</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Redemption Approved!</div>
                    <div style={{ fontSize: '15px', marginTop: '10px' }}><strong>{scanResult.member}</strong></div>
                    <div style={{ fontSize: '18px', fontWeight: 600, marginTop: '4px' }}>{scanResult.drink}</div>
                    <div style={{ fontSize: '13px', opacity: 0.9, marginTop: '6px' }}>{scanResult.credits} credits deducted</div>
                    <button
                      onClick={() => setScanState('idle')}
                      style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#2B3320', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                      Scan Next Customer
                    </button>
                  </div>
                )}

                {/* Scan Error State */}
                {scanState === 'error' && (
                  <div style={{ width: '100%', backgroundColor: '#B84C3E', borderRadius: '18px', padding: '36px', textAlign: 'center', color: '#FFFFFF' }}>
                    <div style={{ fontSize: '48px', marginBottom: '8px' }}>✕</div>
                    <div style={{ fontSize: '24px', fontWeight: 700, fontFamily: 'Source Serif 4, serif' }}>Scan Rejected</div>
                    <div style={{ fontSize: '14px', marginTop: '10px' }}>{scanResult.errorMsg}</div>
                    <button
                      onClick={() => setScanState('idle')}
                      style={{ marginTop: '24px', padding: '12px 28px', borderRadius: '10px', border: 'none', backgroundColor: '#FFFFFF', color: '#2B3320', fontWeight: 700, fontSize: '14px', cursor: 'pointer' }}
                    >
                      Try Again
                    </button>
                  </div>
                )}
              </div>
            ) : baristaTab === 'today' ? (
              /* TODAY'S REDEMPTIONS LOG */
              <div style={{ width: '100%', maxWidth: '640px', backgroundColor: '#2B3320', borderRadius: '16px', border: '1px solid #39442A', overflow: 'hidden' }}>
                <div style={{ padding: '18px 24px', borderBottom: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Source Serif 4, serif' }}>Today's Counter Redemptions</div>
                  <div style={{ fontSize: '12px', color: '#A2B074' }}>Total: {todayRedemptions.length} drinks</div>
                </div>
                {todayRedemptions.map((item) => (
                  <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '14px' }}>{item.drink}</div>
                      <div style={{ fontSize: '12px', color: '#A2B074' }}>{item.member} · {item.time}</div>
                    </div>
                    <div style={{ fontSize: '13px', fontWeight: 700, color: '#A2B074' }}>
                      {item.credits} cr
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* CAFE EARNINGS SUMMARY */
              <div style={{ width: '100%', maxWidth: '500px', backgroundColor: '#2B3320', borderRadius: '16px', border: '1px solid #39442A', padding: '28px' }}>
                <div style={{ fontSize: '20px', fontWeight: 600, fontFamily: 'Source Serif 4, serif', marginBottom: '8px' }}>{activeCafe.name} — Monthly Earnings</div>
                <div style={{ fontSize: '12px', color: '#A2B074', marginBottom: '20px' }}>Billing period: August 2026</div>

                <div style={{ backgroundColor: '#1E2417', padding: '16px', borderRadius: '10px', border: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', color: '#A2B074' }}>Total Drinks Redeemed</span>
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>42 drinks</span>
                </div>
                <div style={{ backgroundColor: '#1E2417', padding: '16px', borderRadius: '10px', border: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
                  <span style={{ fontSize: '13px', color: '#A2B074' }}>Total Credits Earned</span>
                  <span style={{ fontSize: '18px', fontWeight: 700 }}>248 credits</span>
                </div>
                <div style={{ backgroundColor: '#1E2417', padding: '16px', borderRadius: '10px', border: '1px solid #39442A', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <span style={{ fontSize: '13px', color: '#A2B074' }}>Payout Amount Owed</span>
                  <span style={{ fontSize: '22px', fontWeight: 700, color: '#6B7A3B' }}>$868.00</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#A2B074' }}>
                  <span>Status: Pending bank transfer</span>
                  <span>Est. Arrival: Sept 5, 2026</span>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
