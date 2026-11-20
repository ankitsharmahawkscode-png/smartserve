import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Card, Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import Modal from '../../components/Modal.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import AddressFields, { EMPTY_ADDRESS, cleanAddress, validateAddress } from '../../components/AddressFields.jsx';

// ===== API paths: check these against server/src/routes/me.routes.js =====
const API = {
  me: () => api.get('/me'),
  saveProfile: (b) => api.patch('/me', b),
  addAddress: (b) => api.post('/me/addresses', b),
  updateAddress: (id, b) => api.put(`/me/addresses/${id}`, b),
  setDefault: (id) => api.patch(`/me/addresses/${id}`, { isDefault: true }),
  removeAddress: (id) => api.delete(`/me/addresses/${id}`),
  changePassword: (b) => api.post('/me/change-password', b),
};
// =========================================================================

const TABS = [
  ['details', 'Details'],
  ['addresses', 'Addresses'],
  ['security', 'Security'],
];

const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
const passwordOk = (p) => p.length >= 8 && p.length <= 72 && /[A-Za-z]/.test(p) && /\d/.test(p);

// Works whether the api client returns the axios response or the body
const unwrap = (res) => res?.data?.data ?? res?.data ?? res ?? {};

const errText = (err, fallback) => {
  const resp = err.response?.data;
  const details = resp?.errors?.map((e) => `${e.field || ''} ${e.message || ''}`.trim()).join(' | ');
  return `${resp?.message || fallback}${details ? ': ' + details : ''}`;
};

const fmtAddress = (a) => [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');

const fmtMonth = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? '' : d.toLocaleDateString('en-IN', { month: 'short', year: 'numeric' });
};
const fmtDateTime = (v) => {
  const d = new Date(v);
  return Number.isNaN(d.getTime())
    ? ''
    : d.toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
};

function PasswordMeter({ value }) {
  if (!value) return null;
  const rules = [
    ['At least 8 characters', value.length >= 8],
    ['A letter', /[A-Za-z]/.test(value)],
    ['A number', /\d/.test(value)],
  ];
  let score = 0;
  if (value.length >= 8) score += 1;
  if (value.length >= 12) score += 1;
  if (/[a-z]/.test(value) && /[A-Z]/.test(value)) score += 1;
  if (/\d/.test(value)) score += 1;
  if (/[^A-Za-z0-9]/.test(value)) score += 1;
  const level = score <= 1 ? 0 : score === 2 ? 1 : score === 3 ? 2 : 3;
  const labels = ['Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['bg-red-500', 'bg-amber-500', 'bg-lime-500', 'bg-green-600'];

  return (
    <div className="mt-2" aria-live="polite">
      <div className="flex gap-1" aria-hidden="true">
        {[0, 1, 2, 3].map((i) => (
          <span key={i} className={`h-1.5 flex-1 rounded-full ${i <= level ? colors[level] : 'bg-gray-200'}`} />
        ))}
      </div>
      <p className="mt-1 text-xs font-semibold text-ink-muted">Strength: {labels[level]}</p>
      <ul className="mt-1 space-y-0.5 text-xs">
        {rules.map(([text, ok]) => (
          <li key={text} className={ok ? 'text-green-700' : 'text-gray-500'}>
            {ok ? '✓' : '○'} {text}
          </li>
        ))}
      </ul>
    </div>
  );
}

function AddressModal({ title, value, onChange, errors, busy, onSave, onClose }) {
  return (
    <Modal title={title} onClose={onClose}>
      <AddressFields value={value} onChange={onChange} errors={errors} />
      <div className="mt-4 flex justify-end gap-3">
        <Button variant="secondary" onClick={onClose}>Close</Button>
        <Button onClick={onSave} disabled={busy}>{busy ? 'Saving...' : 'Save address'}</Button>
      </div>
    </Modal>
  );
}

export default function CustomerProfile() {
  const { user, setUser } = useAuth();
  const bookingsRes = useFetch('/bookings', { limit: 1 });

  const base = { name: user?.name || '', phone: user?.phone || '' };
  const [saved, setSaved] = useState(base);
  const [form, setForm] = useState(base);
  const [formErr, setFormErr] = useState({});
  const [savingDetails, setSavingDetails] = useState(false);

  const [addresses, setAddresses] = useState(user?.addresses || []);
  const [addOpen, setAddOpen] = useState(false);
  const [addr, setAddr] = useState(EMPTY_ADDRESS);
  const [addrErr, setAddrErr] = useState({});
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState(null); // { id, value }
  const [editErr, setEditErr] = useState({});
  const [editBusy, setEditBusy] = useState(false);
  const [removing, setRemoving] = useState(null);
  const [removeBusy, setRemoveBusy] = useState(false);
  const [busyId, setBusyId] = useState(null);

  const [pw, setPw] = useState({ current: '', next: '', confirm: '' });
  const [showPw, setShowPw] = useState(false);
  const [pwErr, setPwErr] = useState({});
  const [pwBusy, setPwBusy] = useState(false);

  const [notice, setNotice] = useState(null); // { type: 'ok' | 'error', text }
  const say = (type, text) => setNotice({ type, text });

  const initialTab = () => {
    const h = (typeof window !== 'undefined' ? window.location.hash : '').replace('#', '');
    return TABS.some(([k]) => k === h) ? h : 'details';
  };
  const [tab, setTab] = useState(initialTab);
  const go = (k) => {
    setTab(k);
    try {
      window.history.replaceState(window.history.state, '', `#${k}`);
    } catch {
      /* ignore */
    }
  };

  const dirty = form.name !== saved.name || form.phone !== saved.phone;

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // Success messages disappear on their own
  useEffect(() => {
    if (notice?.type !== 'ok') return undefined;
    const t = setTimeout(() => setNotice(null), 5000);
    return () => clearTimeout(t);
  }, [notice]);

  const sorted = [...addresses].sort((a, b) => Number(!!b.isDefault) - Number(!!a.isDefault));

  // ----- profile strength -----
  const checks = [
    ['your full name', saved.name.trim().length >= 2],
    ['a phone number', PHONE_RE.test(saved.phone.trim())],
    ['a saved address', addresses.length > 0],
    ['a default address', addresses.some((a) => a.isDefault)],
  ];
  const percent = Math.round((checks.filter((c) => c[1]).length / checks.length) * 100);
  const missing = checks.filter((c) => !c[1]).map((c) => c[0]);

  // Optional stat: only shows when the bookings API returns a total
  const bd = bookingsRes.data;
  const bookingCount = [bd?.total, bd?.totalItems, bd?.count].find((n) => typeof n === 'number');

  // After an address change, take the fresh list from the response, or reload /me
  const sync = async (res) => {
    const d = unwrap(res);
    let next = d.user || (d._id ? d : null);
    if (!next && Array.isArray(d.addresses)) next = { addresses: d.addresses };
    if (!next || !Array.isArray(next.addresses)) {
      try {
        const dd = unwrap(await API.me());
        next = dd.user || dd;
      } catch {
        next = null;
      }
    }
    if (next && Array.isArray(next.addresses)) {
      setAddresses(next.addresses);
      if (typeof setUser === 'function') setUser((u) => ({ ...u, addresses: next.addresses }));
    }
  };

  // ----- details -----
  const saveDetails = async () => {
    const x = {};
    if (form.name.trim().length < 2) x.name = 'Enter your full name';
    if (form.phone.trim() && !PHONE_RE.test(form.phone.trim())) x.phone = 'Enter a valid phone number';
    setFormErr(x);
    if (Object.keys(x).length) return;

    setSavingDetails(true);
    setNotice(null);
    const body = { name: form.name.trim(), phone: form.phone.trim() };
    try {
      await API.saveProfile(body);
      if (typeof setUser === 'function') setUser((u) => ({ ...u, ...body }));
      setSaved(body);
      setForm(body);
      say('ok', 'Your details are saved');
    } catch (err) {
      say('error', errText(err, 'Could not save your details'));
    } finally {
      setSavingDetails(false);
    }
  };

  // ----- addresses -----
  const addAddress = async () => {
    const e = validateAddress(addr) || {};
    setAddrErr(e);
    if (Object.keys(e).length) return;

    setAdding(true);
    setNotice(null);
    try {
      const body = { ...cleanAddress(addr), ...(addresses.length === 0 && { isDefault: true }) };
      await sync(await API.addAddress(body));
      setAddr(EMPTY_ADDRESS);
      setAddrErr({});
      setAddOpen(false);
      say('ok', 'Address added');
    } catch (err) {
      say('error', errText(err, 'Could not add the address'));
    } finally {
      setAdding(false);
    }
  };

  const saveEdit = async () => {
    const e = validateAddress(editing.value) || {};
    setEditErr(e);
    if (Object.keys(e).length) return;

    setEditBusy(true);
    try {
      await sync(await API.updateAddress(editing.id, cleanAddress(editing.value)));
      setEditing(null);
      say('ok', 'Address updated');
    } catch (err) {
      say('error', errText(err, 'Could not update the address'));
    } finally {
      setEditBusy(false);
    }
  };

  const makeDefault = async (a) => {
    setBusyId(a._id);
    setNotice(null);
    try {
      await sync(await API.setDefault(a._id));
      say('ok', 'Default address changed');
    } catch (err) {
      say('error', errText(err, 'Could not change the default address'));
    } finally {
      setBusyId(null);
    }
  };

  const confirmRemove = async () => {
    setRemoveBusy(true);
    try {
      await sync(await API.removeAddress(removing._id));
      setRemoving(null);
      say('ok', 'Address removed');
    } catch (err) {
      setRemoving(null);
      say('error', errText(err, 'Could not remove the address'));
    } finally {
      setRemoveBusy(false);
    }
  };

  // ----- password -----
  const changePassword = async () => {
    const x = {};
    if (!pw.current) x.current = 'Enter your current password';
    if (!passwordOk(pw.next)) x.next = 'At least 8 characters with a letter and a number';
    else if (pw.next === pw.current) x.next = 'New password must be different';
    if (pw.confirm !== pw.next) x.confirm = 'Passwords do not match';
    setPwErr(x);
    if (Object.keys(x).length) return;

    setPwBusy(true);
    setNotice(null);
    try {
      await API.changePassword({ currentPassword: pw.current, newPassword: pw.next });
      setPw({ current: '', next: '', confirm: '' });
      say('ok', 'Password changed');
    } catch (err) {
      say('error', errText(err, 'Could not change the password'));
    } finally {
      setPwBusy(false);
    }
  };

  const initials =
    (user?.name || 'U').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'U';
  const pwType = showPw ? 'text' : 'password';

  const stats = [
    ['Saved addresses', String(addresses.length)],
    bookingCount != null && ['Bookings', String(bookingCount)],
    user?.createdAt && fmtMonth(user.createdAt) && ['Member since', fmtMonth(user.createdAt)],
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-4 sm:p-6">
      <h1 className="text-2xl font-extrabold sm:text-3xl">My Profile</h1>

      {notice && (
        <div
          role="status"
          className={`rounded-lg p-3 text-sm font-semibold ${
            notice.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
          }`}
        >
          {notice.text}
        </div>
      )}

      {/* Header */}
      <Card className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-2xl font-bold text-white">
            {initials}
          </div>
          <div className="min-w-0 flex-1">
            <p className="break-words text-xl font-extrabold">{user?.name}</p>
            <p className="break-all text-sm text-ink-muted">{user?.email}</p>
            <div className="mt-3 flex flex-wrap gap-x-6 gap-y-2">
              {stats.map(([label, value]) => (
                <div key={label}>
                  <p className="text-lg font-extrabold leading-none">{value}</p>
                  <p className="mt-1 text-[11px] font-semibold uppercase tracking-wide text-ink-muted">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-5 border-t border-line pt-4">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm font-bold">Profile strength</p>
            <p className="text-sm font-extrabold text-[#d97706]">{percent}%</p>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#d97706] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-ink-muted">
            {missing.length === 0
              ? 'Your profile is complete. Booking will be quick and your technician can always reach you.'
              : `Add ${missing.join(', ')} to complete your profile.`}
          </p>
        </div>
      </Card>

      {/* Tabs */}
      <div role="tablist" aria-label="Profile sections" className="flex gap-1 rounded-xl bg-gray-100 p-1">
        {TABS.map(([key, label]) => (
          <button
            key={key}
            type="button"
            role="tab"
            id={`tab-${key}`}
            aria-selected={tab === key}
            aria-controls={`panel-${key}`}
            onClick={() => go(key)}
            className={`flex-1 rounded-lg px-3 py-2.5 text-sm font-bold transition-colors ${
              tab === key ? 'bg-white text-brand-dark shadow-sm' : 'text-ink-muted hover:text-brand-dark'
            }`}
          >
            {label}
            {key === 'addresses' && addresses.length > 0 && (
              <span className="ml-1.5 rounded-full bg-brand-tint px-1.5 py-0.5 text-[10px]">{addresses.length}</span>
            )}
          </button>
        ))}
      </div>

      {/* ===== Details ===== */}
      {tab === 'details' && (
        <div role="tabpanel" id="panel-details" aria-labelledby="tab-details" className="space-y-4">
          <Card className="p-5 sm:p-6">
            <h2 className="mb-4 text-lg font-bold">Basic Details</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Input
                label="Full Name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                error={formErr.name}
                maxLength={80}
                autoComplete="name"
              />
              <Input
                label="Phone Number"
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                error={formErr.phone}
                placeholder="+91 98765 43210"
                autoComplete="tel"
              />
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-semibold text-ink-muted">Email Address</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full rounded-lg border bg-gray-50 p-3 text-gray-500"
                />
                <p className="mt-1 text-xs text-ink-muted">Your email is used to log in and cannot be changed here.</p>
              </div>
            </div>
          </Card>

          {dirty && (
            <div className="sticky bottom-3 z-10 flex flex-col gap-3 rounded-xl border border-line bg-white/95 p-3 shadow-lg backdrop-blur sm:flex-row sm:items-center sm:justify-between">
              <p className="text-sm font-semibold text-gray-700">You have unsaved changes</p>
              <div className="flex gap-2">
                <Button
                  variant="secondary"
                  onClick={() => { setForm(saved); setFormErr({}); }}
                  disabled={savingDetails}
                >
                  Discard
                </Button>
                <Button onClick={saveDetails} disabled={savingDetails}>
                  {savingDetails ? 'Saving...' : 'Save Details'}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ===== Addresses ===== */}
      {tab === 'addresses' && (
        <div role="tabpanel" id="panel-addresses" aria-labelledby="tab-addresses">
          <Card className="p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold">Saved Addresses</h2>
                <p className="text-sm text-ink-muted">Pick one when you book. Your default is chosen automatically.</p>
              </div>
              <Button onClick={() => { setAddr(EMPTY_ADDRESS); setAddrErr({}); setAddOpen(true); }}>
                + Add address
              </Button>
            </div>

            {sorted.length === 0 ? (
              <div className="rounded-lg bg-gray-50 p-8 text-center">
                <p className="text-3xl" aria-hidden="true">📍</p>
                <p className="mt-2 font-bold">No saved addresses yet</p>
                <p className="mt-1 text-sm text-ink-muted">Add one to book services faster.</p>
              </div>
            ) : (
              <ul className="space-y-3">
                {sorted.map((a) => (
                  <li
                    key={a._id}
                    className={`flex flex-col justify-between gap-3 rounded-lg border p-4 sm:flex-row sm:items-center ${
                      a.isDefault ? 'border-brand bg-brand-tint/40' : 'bg-gray-50'
                    }`}
                  >
                    <div className="min-w-0">
                      <p className="flex flex-wrap items-center gap-2 font-bold">
                        {a.label || 'Address'}
                        {a.isDefault && (
                          <span className="rounded-full bg-brand px-2 py-0.5 text-xs font-semibold text-white">Default</span>
                        )}
                      </p>
                      <p className="mt-1 break-words text-sm text-gray-600">{fmtAddress(a)}</p>
                    </div>
                    <div className="flex shrink-0 flex-wrap gap-2">
                      {!a.isDefault && (
                        <Button
                          variant="secondary"
                          className="text-sm"
                          disabled={busyId === a._id}
                          onClick={() => makeDefault(a)}
                        >
                          {busyId === a._id ? 'Saving...' : 'Set Default'}
                        </Button>
                      )}
                      <Button
                        variant="secondary"
                        className="text-sm"
                        onClick={() => { setEditErr({}); setEditing({ id: a._id, value: { ...EMPTY_ADDRESS, ...a } }); }}
                      >
                        Edit
                      </Button>
                      <Button
                        variant="secondary"
                        className="border-red-200 text-sm text-red-600 hover:bg-red-50"
                        onClick={() => setRemoving(a)}
                      >
                        Remove
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </div>
      )}

      {/* ===== Security ===== */}
      {tab === 'security' && (
        <div role="tabpanel" id="panel-security" aria-labelledby="tab-security" className="space-y-4">
          <Card className="p-5 sm:p-6">
            <div className="mb-1 flex flex-wrap items-center justify-between gap-3">
              <h2 className="text-lg font-bold">Change Password</h2>
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                aria-pressed={showPw}
                className="text-sm font-semibold text-brand underline underline-offset-4"
              >
                {showPw ? 'Hide passwords' : 'Show passwords'}
              </button>
            </div>
            <p className="mb-4 text-sm text-ink-muted">Use at least 8 characters with a letter and a number.</p>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Input
                label="Current password"
                type={pwType}
                autoComplete="current-password"
                value={pw.current}
                onChange={(e) => setPw({ ...pw, current: e.target.value })}
                error={pwErr.current}
              />
              <div>
                <Input
                  label="New password"
                  type={pwType}
                  autoComplete="new-password"
                  value={pw.next}
                  onChange={(e) => setPw({ ...pw, next: e.target.value })}
                  error={pwErr.next}
                  maxLength={72}
                />
                <PasswordMeter value={pw.next} />
              </div>
              <Input
                label="Confirm new password"
                type={pwType}
                autoComplete="new-password"
                value={pw.confirm}
                onChange={(e) => setPw({ ...pw, confirm: e.target.value })}
                error={pwErr.confirm}
                maxLength={72}
              />
            </div>
            <Button className="mt-4" onClick={changePassword} disabled={pwBusy}>
              {pwBusy ? 'Changing...' : 'Change Password'}
            </Button>
          </Card>

          <Card className="p-5 sm:p-6">
            <h2 className="mb-3 text-lg font-bold">Account</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-xs text-ink-muted">Email</dt>
                <dd className="break-all font-semibold">{user?.email}</dd>
              </div>
              {user?.createdAt && fmtMonth(user.createdAt) && (
                <div>
                  <dt className="text-xs text-ink-muted">Member since</dt>
                  <dd className="font-semibold">{fmtMonth(user.createdAt)}</dd>
                </div>
              )}
              {user?.lastLoginAt && fmtDateTime(user.lastLoginAt) && (
                <div>
                  <dt className="text-xs text-ink-muted">Last login</dt>
                  <dd className="font-semibold">{fmtDateTime(user.lastLoginAt)}</dd>
                </div>
              )}
            </dl>
          </Card>
        </div>
      )}

      {/* Add address */}
      {addOpen && (
        <AddressModal
          title="Add a new address"
          value={addr}
          onChange={setAddr}
          errors={addrErr}
          busy={adding}
          onSave={addAddress}
          onClose={() => setAddOpen(false)}
        />
      )}

      {/* Edit address */}
      {editing && (
        <AddressModal
          title="Edit address"
          value={editing.value}
          onChange={(v) => setEditing({ ...editing, value: v })}
          errors={editErr}
          busy={editBusy}
          onSave={saveEdit}
          onClose={() => setEditing(null)}
        />
      )}

      {/* Remove address */}
      <ConfirmDialog
        open={!!removing}
        title="Remove this address?"
        confirmLabel="Remove"
        cancelLabel="Keep it"
        onConfirm={confirmRemove}
        onCancel={() => setRemoving(null)}
        busy={removeBusy}
      >
        {removing && (
          <>
            <p className="break-words text-sm text-ink-muted">{fmtAddress(removing)}</p>
            {removing.isDefault && addresses.length > 1 && (
              <Alert>This is your default address. Set another one as default afterwards.</Alert>
            )}
          </>
        )}
      </ConfirmDialog>
    </div>
  );
}