import { useEffect, useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/States.jsx';

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const PRESET_SKILLS = ['AC Repair', 'Plumbing', 'Electrical', 'Carpentry', 'Home Cleaning', 'Appliance Repair'];
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;

const inputCls =
  'w-full rounded border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-800 placeholder-gray-400 outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 disabled:bg-gray-50 disabled:text-gray-500';

// Crops to a square, shrinks to 320px and returns a small JPEG data URL (about 30 KB)
const resizeImage = (file, size = 320) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, (img.width - s) / 2, (img.height - s) / 2, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };
    img.src = url;
  });

const Field = ({ label, hint, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-bold text-gray-500">{label}</span>
    {children}
    {hint && !error && <span className="mt-1.5 block text-[11px] text-gray-400">{hint}</span>}
    {error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
  </label>
);

const Section = ({ title, subtitle, children }) => (
  <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
    <h2 className="text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">{title}</h2>
    {subtitle && <p className="mt-1 text-xs text-gray-400">{subtitle}</p>}
    <div className="mt-4">{children}</div>
  </section>
);

function Avatar({ src, name, className = '' }) {
  if (src) return <img src={src} alt={name || 'Technician'} className={`object-cover ${className}`} />;
  const initials =
    (name || 'T').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase() || 'T';
  return (
    <div className={`flex items-center justify-center bg-[#0B1F3A] font-bold text-white ${className}`}>
      {initials}
    </div>
  );
}

// Type and press Enter (or comma) to add. Click × to remove.
function ChipInput({ items, onChange, placeholder, max = 20, maxLen = 60 }) {
  const [text, setText] = useState('');

  const add = (raw) => {
    const next = [...items];
    raw
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
      .forEach((v) => {
        if (v.length <= maxLen && next.length < max && !next.some((x) => x.toLowerCase() === v.toLowerCase())) {
          next.push(v);
        }
      });
    if (next.length !== items.length) onChange(next);
    setText('');
  };

  return (
    <div className="flex min-h-[44px] flex-wrap gap-2 rounded border border-gray-300 bg-white p-2 focus-within:border-[#d97706] focus-within:ring-2 focus-within:ring-[#d97706]/20">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="inline-flex items-center gap-1 rounded-full bg-[#d97706] px-3 py-1 text-xs font-semibold text-white">
          {it}
          <button
            type="button"
            onClick={() => onChange(items.filter((_, idx) => idx !== i))}
            aria-label={`Remove ${it}`}
            className="text-base leading-none hover:text-red-200"
          >
            ×
          </button>
        </span>
      ))}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ',') {
            e.preventDefault();
            add(text);
          } else if (e.key === 'Backspace' && !text && items.length) {
            onChange(items.slice(0, -1));
          }
        }}
        onBlur={() => text.trim() && add(text)}
        placeholder={items.length >= max ? `Maximum ${max} reached` : placeholder}
        disabled={items.length >= max}
        className="min-w-[140px] flex-1 bg-transparent py-1 text-sm outline-none"
      />
    </div>
  );
}

const toForm = (p) => ({
  phone: p.phone || '',
  city: p.city || '',
  bio: p.bio || '',
  experienceYears: String(p.experienceYears ?? 0),
  skills: p.skills || [],
  serviceAreas: p.serviceAreas || [],
  workingDays: p.workingDays || [],
  workStart: p.workStart || '09:00',
  workEnd: p.workEnd || '19:00',
  avatar: p.avatar || '',
});

function Editor({ initial, stats, apiMissing }) {
  const { setUser } = useAuth();

  const [base, setBase] = useState(() => toForm(initial));
  const [f, setF] = useState(() => toForm(initial));
  const [isAvailable, setIsAvailable] = useState(!!initial.isAvailable);
  const [toggling, setToggling] = useState(false);
  const [skillText, setSkillText] = useState('');
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState(
    apiMissing ? { type: 'error', text: 'Profile API not found yet. Add the backend routes, then saving will work.' } : null
  );

  const set = (k, v) => setF((p) => ({ ...p, [k]: v }));
  const dirty = JSON.stringify(f) !== JSON.stringify(base);

  // Warn before leaving with unsaved changes
  useEffect(() => {
    if (!dirty) return undefined;
    const warn = (e) => { e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  // ----- completeness -----
  const checks = [
    ['profile photo', !!f.avatar],
    ['phone number', PHONE_RE.test(f.phone.trim())],
    ['city', !!f.city.trim()],
    ['a short bio (30+ characters)', f.bio.trim().length >= 30],
    ['years of experience', Number(f.experienceYears) > 0],
    ['at least one skill', f.skills.length > 0],
    ['service areas', f.serviceAreas.length > 0],
    ['working days', f.workingDays.length > 0],
  ];
  const done = checks.filter((c) => c[1]).length;
  const percent = Math.round((done / checks.length) * 100);
  const missing = checks.filter((c) => !c[1]).map((c) => c[0]);

  // ----- skills -----
  const allSkills = [...new Set([...PRESET_SKILLS, ...f.skills])];
  const toggleSkill = (s) =>
    set('skills', f.skills.includes(s) ? f.skills.filter((x) => x !== s) : [...f.skills, s]);
  const addSkill = () => {
    const v = skillText.trim();
    setSkillText('');
    if (!v || v.length > 40 || f.skills.length >= 20) return;
    if (!f.skills.some((s) => s.toLowerCase() === v.toLowerCase())) set('skills', [...f.skills, v]);
  };

  const toggleDay = (d) =>
    set('workingDays', DAYS.filter((x) => (x === d ? !f.workingDays.includes(d) : f.workingDays.includes(x))));

  // ----- photo -----
  const onPhoto = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setNotice({ type: 'error', text: 'Please choose a JPG, PNG or WebP image' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setNotice({ type: 'error', text: 'Image must be 2 MB or smaller' });
      return;
    }
    try {
      set('avatar', await resizeImage(file));
      setNotice(null);
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // ----- availability: saves straight away -----
  const toggleAvailability = async () => {
    const next = !isAvailable;
    setIsAvailable(next);
    setToggling(true);
    try {
     await api.put('/technician/availability', { isAvailable: next });
      if (typeof setUser === 'function') {
        setUser((u) => ({ ...u, technician: { ...u.technician, isAvailable: next } }));
      }
      setNotice({ type: 'ok', text: next ? 'You are now available for jobs' : 'You are now unavailable' });
    } catch (err) {
      setIsAvailable(!next);
      setNotice({ type: 'error', text: err.response?.data?.message || 'Could not update availability' });
    } finally {
      setToggling(false);
    }
  };

  // ----- save -----
  const save = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.phone.trim() && !PHONE_RE.test(f.phone.trim())) x.phone = 'Enter a valid phone number';
    const years = Number(f.experienceYears || 0);
    if (!Number.isInteger(years) || years < 0 || years > 60) x.experienceYears = 'Enter a whole number from 0 to 60';
    if (f.workStart >= f.workEnd) x.workEnd = 'End time must be after start time';
    setErrs(x);
    if (Object.keys(x).length) {
      setNotice({ type: 'error', text: 'Please fix the highlighted fields' });
      return;
    }

    setBusy(true);
    setNotice(null);
    const payload = {
      phone: f.phone.trim(),
      city: f.city.trim(),
      bio: f.bio.trim(),
      experienceYears: years,
      skills: f.skills,
      serviceAreas: f.serviceAreas,
      workingDays: f.workingDays,
      workStart: f.workStart,
      workEnd: f.workEnd,
      avatar: f.avatar,
    };
    try {
      await api.put('/technician/profile', payload);
      setBase({ ...f, experienceYears: String(years) });
      setF((p) => ({ ...p, experienceYears: String(years) }));
      if (typeof setUser === 'function') {
        setUser((u) => ({
          ...u,
          phone: payload.phone,
          technician: { ...u.technician, skills: payload.skills },
        }));
      }
      setNotice({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      const resp = err.response?.data;
      const details = resp?.errors
        ?.map((er) => `${er.field || ''} ${er.message || ''}`.trim())
        .join(' | ');
      setNotice({ type: 'error', text: `${resp?.message || 'Error saving profile'}${details ? ': ' + details : ''}` });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eceff2] px-4 py-6 pb-28 sm:px-6">
      <form onSubmit={save} noValidate className="mx-auto flex max-w-4xl flex-col gap-5">
        <h1 className="text-2xl font-extrabold text-gray-800 sm:text-3xl">Technician Profile</h1>

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

        {/* ===== Header: photo, name, stats ===== */}
        <section className="overflow-hidden rounded-xl bg-white shadow-sm">
          <div className="flex flex-col gap-5 bg-[#fffdf0] p-5 sm:flex-row sm:items-center sm:p-6">
            <Avatar src={f.avatar} name={initial.name} className="h-24 w-24 shrink-0 rounded-full border border-gray-200 text-3xl" />
            <div className="min-w-0 flex-1">
              <h2 className="break-words text-xl font-extrabold text-[#111]">{initial.name}</h2>
              <p className="mt-0.5 break-all text-sm text-gray-600">{initial.email}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-bold ${
                    isAvailable ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-600'
                  }`}
                >
                  {isAvailable ? 'Available for jobs' : 'Unavailable'}
                </span>
                <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1 text-xs font-bold text-gray-700 hover:bg-gray-50">
                  <span>↑</span> {f.avatar ? 'Change photo' : 'Upload photo'}
                  <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto} className="hidden" />
                </label>
                {f.avatar && (
                  <button type="button" onClick={() => set('avatar', '')} className="text-xs font-semibold text-red-600 hover:text-red-800">
                    Remove
                  </button>
                )}
              </div>
              <p className="mt-1.5 text-[10px] text-gray-400">JPG, PNG or WebP · Max 2 MB</p>
            </div>
          </div>

          <div className="grid grid-cols-3 divide-x divide-gray-100 border-t border-gray-100">
            <div className="p-4 text-center">
              <p className="text-2xl font-extrabold text-[#111]">{stats?.jobsCompleted ?? 0}</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Jobs completed</p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-extrabold text-[#111]">
                {stats?.rating != null ? `★ ${stats.rating}` : '—'}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
                {stats?.reviews ? `${stats.reviews} review${stats.reviews > 1 ? 's' : ''}` : 'No reviews yet'}
              </p>
            </div>
            <div className="p-4 text-center">
              <p className="text-2xl font-extrabold text-[#111]">{initial.commissionPct ?? 0}%</p>
              <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">Your commission</p>
            </div>
          </div>
        </section>

        {/* ===== Completeness ===== */}
        <section className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-bold text-gray-800">Profile strength</h2>
            <span className="text-sm font-extrabold text-[#d97706]">{percent}%</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-gray-100">
            <div className="h-full rounded-full bg-[#d97706] transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            {missing.length === 0
              ? 'Your profile is complete. Customers can see that you are a trusted professional.'
              : `Add ${missing.slice(0, 3).join(', ')}${missing.length > 3 ? ` and ${missing.length - 3} more` : ''} to complete it.`}
          </p>
        </section>

        {/* ===== Work status ===== */}
        <Section title="Work status" subtitle="You are only assigned new jobs while you are available. This saves instantly.">
          <div className="flex items-center justify-between gap-4">
            <span className={`text-sm font-bold ${isAvailable ? 'text-green-600' : 'text-gray-500'}`}>
              {isAvailable ? 'Available' : 'Unavailable'}
            </span>
            <button
              type="button"
              role="switch"
              aria-checked={isAvailable}
              aria-label="Available for jobs"
              disabled={toggling}
              onClick={toggleAvailability}
              className={`relative h-7 w-14 rounded-full transition-colors disabled:opacity-60 ${
                isAvailable ? 'bg-green-500' : 'bg-gray-300'
              }`}
            >
              <span
                className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${
                  isAvailable ? 'translate-x-7' : ''
                }`}
              />
            </button>
          </div>
        </Section>

        {/* ===== Personal info ===== */}
        <Section title="Personal info" subtitle="Your name and email are managed by the admin. Contact them to change either.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Full name"><input value={initial.name || ''} disabled className={inputCls} /></Field>
            <Field label="Email"><input value={initial.email || ''} disabled className={inputCls} /></Field>
            <Field label="Phone number" error={errs.phone}>
              <input type="tel" value={f.phone} onChange={(e) => set('phone', e.target.value)} className={inputCls} placeholder="+91 98765 43210" />
            </Field>
            <Field label="City">
              <input value={f.city} onChange={(e) => set('city', e.target.value)} maxLength={80} className={inputCls} placeholder="e.g. Jaipur" />
            </Field>
            <Field label="Years of experience" error={errs.experienceYears}>
              <input type="number" min="0" max="60" value={f.experienceYears} onChange={(e) => set('experienceYears', e.target.value)} className={inputCls} />
            </Field>
          </div>
          <div className="mt-4">
            <Field label="About you" hint={`${f.bio.length}/600 · Shown to the team. Mention your trade, experience and what you do best.`}>
              <textarea
                rows={4}
                value={f.bio}
                onChange={(e) => set('bio', e.target.value)}
                maxLength={600}
                placeholder="e.g. 6 years of experience in split AC installation, gas refilling and repair."
                className={`${inputCls} resize-y`}
              />
            </Field>
          </div>
        </Section>

        {/* ===== Skills ===== */}
        <Section title="Skills / services I provide" subtitle="Tap to select. These also show in the admin technician list.">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {allSkills.map((s) => {
              const on = f.skills.includes(s);
              return (
                <button
                  key={s}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleSkill(s)}
                  className={`rounded-lg border p-3 text-center text-sm font-semibold transition-colors ${
                    on ? 'border-[#d97706] bg-[#fff8eb] text-[#b45309]' : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {on && <span className="mr-1">✓</span>}{s}
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex gap-2">
            <input
              value={skillText}
              onChange={(e) => setSkillText(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }}
              maxLength={40}
              placeholder="Add another skill, e.g. Geyser repair"
              className={inputCls}
            />
            <button type="button" onClick={addSkill} className="shrink-0 rounded border border-gray-300 px-4 text-sm font-bold text-gray-700 hover:bg-gray-50">
              Add
            </button>
          </div>
        </Section>

        {/* ===== Service areas ===== */}
        <Section title="Service areas" subtitle="Localities, areas or pincodes where you can take jobs. Press Enter to add.">
          <ChipInput
            items={f.serviceAreas}
            onChange={(v) => set('serviceAreas', v)}
            placeholder="e.g. Malviya Nagar, 302017"
          />
          <p className="mt-1.5 text-[11px] text-gray-400">{f.serviceAreas.length}/20 areas</p>
        </Section>

        {/* ===== Working hours ===== */}
        <Section title="Working days and hours">
          <div className="flex flex-wrap gap-2">
            {DAYS.map((d) => {
              const on = f.workingDays.includes(d);
              return (
                <button
                  key={d}
                  type="button"
                  aria-pressed={on}
                  onClick={() => toggleDay(d)}
                  className={`min-w-[52px] rounded-full border px-3 py-2 text-xs font-bold transition-colors ${
                    on ? 'border-[#0B1F3A] bg-[#0B1F3A] text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  {d}
                </button>
              );
            })}
          </div>
          <div className="mt-4 grid max-w-md grid-cols-2 gap-4">
            <Field label="Start time">
              <input type="time" value={f.workStart} onChange={(e) => set('workStart', e.target.value)} className={inputCls} />
            </Field>
            <Field label="End time" error={errs.workEnd}>
              <input type="time" value={f.workEnd} onChange={(e) => set('workEnd', e.target.value)} className={inputCls} />
            </Field>
          </div>
        </Section>
      </form>

      {/* ===== Sticky save bar ===== */}
      <div
        className={`fixed inset-x-0 bottom-0 z-30 border-t border-gray-200 bg-white/95 px-4 py-3 shadow-lg backdrop-blur transition-transform sm:px-6 ${
          dirty ? 'translate-y-0' : 'translate-y-full'
        }`}
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-3">
          <p className="text-sm font-semibold text-gray-700">You have unsaved changes</p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => { setF(base); setErrs({}); }}
              className="rounded border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
            >
              Discard
            </button>
            <button
              type="button"
              disabled={busy}
              onClick={save}
              className="rounded bg-[#d97706] px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-[#b45309] disabled:opacity-60"
            >
              {busy ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function TechProfile() {
  const { user } = useAuth();
  const prof = useFetch('/technician/profile');

  if (prof.loading) {
    return <div className="flex justify-center p-10"><Spinner /></div>;
  }

  // If the API is not deployed yet, fall back to the logged-in user so the page still opens
  const initial =
    prof.data?.profile || {
      name: user?.name || '',
      email: user?.email || '',
      phone: user?.phone || '',
      skills: user?.technician?.skills || [],
      isAvailable: user?.technician?.isAvailable ?? false,
      commissionPct: user?.technician?.commissionPct ?? 0,
      workingDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'],
    };

  return <Editor initial={initial} stats={prof.data?.stats} apiMissing={!!prof.error} />;
}