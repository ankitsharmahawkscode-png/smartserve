import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Spinner } from '../../components/States.jsx';
import { prettyPostDate } from '../../utils/format.js';

const slugify = (s) =>
  (s || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');

const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const isUrl = (v) => /^https?:\/\/\S+\.\S+/.test(v);

const readMinutes = (html) => {
  const words = String(html || '').replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

// Crops to a square, shrinks to 320px and returns a small JPEG data URL (about 30 KB)
const resizeImage = (file, size = 320) =>
  new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const s = Math.min(img.width, img.height);
      const sx = (img.width - s) / 2;
      const sy = (img.height - s) / 2;
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, size, size);
      ctx.drawImage(img, sx, sy, s, s, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL('image/jpeg', 0.85));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Could not read this image'));
    };
    img.src = url;
  });

const SOCIALS = [
  { key: 'linkedin', label: 'LinkedIn', placeholder: 'https://linkedin.com/in/your-name' },
  { key: 'twitter', label: 'X / Twitter', placeholder: 'https://x.com/your-handle' },
  { key: 'facebook', label: 'Facebook', placeholder: 'https://facebook.com/your-page' },
  { key: 'instagram', label: 'Instagram', placeholder: 'https://instagram.com/your-handle' },
  { key: 'website', label: 'Website', placeholder: 'https://example.com' },
];

const inputCls =
  'w-full rounded border border-gray-300 bg-white px-3 py-2 text-[13px] text-gray-800 placeholder-gray-400 outline-none focus:border-[#d97706] focus:ring-2 focus:ring-[#d97706]/20 disabled:bg-gray-50 disabled:text-gray-400';

const Field = ({ label, required, hint, error, children }) => (
  <label className="block">
    <span className="mb-1.5 block text-[11px] font-bold text-gray-500">
      {label}
      {required && <span className="ml-1 text-red-500">*</span>}
    </span>
    {children}
    {hint && !error && <span className="mt-1.5 block text-[10px] text-gray-400">{hint}</span>}
    {error && <span className="mt-1 block text-[11px] font-semibold text-red-600">{error}</span>}
  </label>
);

const SectionTitle = ({ children }) => (
  <h2 className="mb-4 border-b border-gray-200 pb-2 text-[11px] font-extrabold uppercase tracking-[0.12em] text-gray-500">
    {children}
  </h2>
);

function Avatar({ src, name, className = '' }) {
  if (src) return <img src={src} alt={name || 'Author'} className={`object-cover ${className}`} />;
  const initials =
    (name || 'A')
      .split(/\s+/)
      .map((w) => w[0])
      .slice(0, 2)
      .join('')
      .toUpperCase() || 'A';
  return (
    <div className={`flex items-center justify-center bg-[#0B1F3A] font-bold text-white ${className}`}>
      {initials}
    </div>
  );
}

function ProfileEditor({ initial, user, blogs, apiMissing }) {
  const { setUser } = useAuth();
  const uid = user?._id || user?.id;

  const [f, setF] = useState({
    name: initial.name || user?.name || '',
    phone: initial.phone || user?.phone || '',
    slug: initial.slug || slugify(initial.name || user?.name || ''),
    designation: initial.designation || '',
    workplace: initial.workplace || '',
    location: initial.location || '',
    avatar: initial.avatar || '',
    about: initial.about?.length ? initial.about : [''],
    social: {
      linkedin: initial.social?.linkedin || '',
      twitter: initial.social?.twitter || '',
      facebook: initial.social?.facebook || '',
      instagram: initial.social?.instagram || '',
      website: initial.social?.website || '',
    },
  });
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [errs, setErrs] = useState({});
  const [notice, setNotice] = useState(
    apiMissing ? { type: 'error', text: 'Profile API not found yet. Add the backend routes, then Save will work.' } : null
  );
  const [busy, setBusy] = useState(false);

  const email = initial.email || user?.email || '';
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value });

  const onName = (e) => {
    const name = e.target.value;
    setF({ ...f, name, slug: slugTouched ? f.slug : slugify(name) });
  };
  const onSlug = (e) => {
    setSlugTouched(true);
    setF({ ...f, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') });
  };

  const setSocial = (k) => (e) => setF({ ...f, social: { ...f.social, [k]: e.target.value } });
  const setPara = (i, v) => setF({ ...f, about: f.about.map((p, idx) => (idx === i ? v : p)) });
  const addPara = () => setF({ ...f, about: [...f.about, ''] });
  const removePara = (i) => setF({ ...f, about: f.about.filter((_, idx) => idx !== i) });

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
      const dataUrl = await resizeImage(file);
      setF((prev) => ({ ...prev, avatar: dataUrl }));
      setNotice(null);
    } catch (err) {
      setNotice({ type: 'error', text: err.message });
    }
  };

  // ----- live data for the preview -----
  const items = Array.isArray(blogs?.items) ? blogs.items : [];
  const mine = items
    .filter((p) => p.isPublished && uid && String(p.author?._id ?? p.author) === String(uid))
    .sort(
      (a, b) =>
        new Date(b.publishedAt || b.createdAt).getTime() - new Date(a.publishedAt || a.createdAt).getTime()
    );
  const recent = mine.slice(0, 3);
  const firstName = f.name.trim().split(/\s+/)[0] || 'Author';
  const paragraphs = f.about.map((p) => p.trim()).filter(Boolean);
  const socials = SOCIALS.filter((s) => f.social[s.key].trim());

  const validate = () => {
    const x = {};
    if (f.name.trim().length < 2) x.name = 'Enter the author name';
    if (!f.slug.trim()) x.slug = 'Enter a slug';
    else if (!SLUG_RE.test(f.slug.trim())) x.slug = 'Use lowercase letters, numbers and single hyphens';
    if (f.designation.trim().length < 2) x.designation = 'Enter a designation';
    if (f.phone.trim() && !/^\+?[0-9\s-]{10,15}$/.test(f.phone.trim())) x.phone = 'Enter a valid phone number';
    SOCIALS.forEach((s) => {
      const v = f.social[s.key].trim();
      if (v && !isUrl(v)) x[s.key] = 'Enter a full link starting with https://';
    });
    return x;
  };

  const save = async (e) => {
    e.preventDefault();
    const x = validate();
    setErrs(x);
    if (Object.keys(x).length) {
      setNotice({ type: 'error', text: 'Please fix the highlighted fields' });
      return;
    }
    setBusy(true);
    setNotice(null);

    // Every field is always sent, so clearing a value really removes it
    const payload = {
      name: f.name.trim(),
      phone: f.phone.trim(),
      slug: f.slug.trim(),
      designation: f.designation.trim(),
      workplace: f.workplace.trim(),
      location: f.location.trim(),
      avatar: f.avatar,
      about: paragraphs,
      social: Object.fromEntries(SOCIALS.map((s) => [s.key, f.social[s.key].trim()])),
    };

    try {
      await api.put('/admin/profile', payload);
      if (typeof setUser === 'function') {
        setUser((u) => ({ ...u, name: payload.name, phone: payload.phone }));
      }
      setNotice({ type: 'ok', text: 'Profile saved' });
    } catch (err) {
      const resp = err.response?.data;
      const details = resp?.errors
        ?.map((er) => `${er.field || ''} ${er.message || ''}`.trim())
        .join(' | ');
      setNotice({
        type: 'error',
        text: `${resp?.message || 'Error saving profile'}${details ? ': ' + details : ''}`,
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eceff2] px-4 py-6 sm:px-6">
      <div className="mx-auto max-w-[1300px]">
        <h1 className="text-lg font-bold text-gray-700">Profile Details</h1>
        <p className="mb-5 mt-1 text-xs text-gray-500">
          Fill in the details — the preview updates live on the right.
        </p>

        {notice && (
          <div
            role="status"
            className={`mb-4 rounded-lg p-3 text-sm font-semibold ${
              notice.type === 'ok' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-700'
            }`}
          >
            {notice.text}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-2">
          {/* ================= FORM ================= */}
          <form onSubmit={save} noValidate className="rounded-xl bg-white p-5 shadow-sm sm:p-6">
            <SectionTitle>Basic information</SectionTitle>

            <div className="grid gap-x-5 gap-y-5 sm:grid-cols-2">
              <Field label="E-mail">
                <input value={email} disabled className={inputCls} />
              </Field>
              <Field label="Author name" required error={errs.name}>
                <input value={f.name} onChange={onName} className={inputCls} maxLength={80} />
              </Field>

              <Field label="Author slug" required error={errs.slug} hint="Auto-generated · lowercase & hyphens only">
                <input value={f.slug} onChange={onSlug} className={inputCls} maxLength={60} />
              </Field>
              <Field label="Designation" required error={errs.designation}>
                <input
                  value={f.designation}
                  onChange={set('designation')}
                  className={inputCls}
                  maxLength={80}
                  placeholder="e.g. Senior Editor"
                />
              </Field>

              <Field label="Workplace">
                <input
                  value={f.workplace}
                  onChange={set('workplace')}
                  className={inputCls}
                  maxLength={100}
                  placeholder="e.g. SmartServe"
                />
              </Field>
              <Field label="City / Country">
                <input
                  value={f.location}
                  onChange={set('location')}
                  className={inputCls}
                  maxLength={100}
                  placeholder="e.g. Jaipur, India"
                />
              </Field>

              <Field label="Phone (optional)" error={errs.phone}>
                <input value={f.phone} onChange={set('phone')} className={inputCls} type="tel" />
              </Field>
            </div>

            {/* Profile picture */}
            <div className="mt-6 rounded-lg border border-gray-200 p-5">
              <SectionTitle>Profile picture</SectionTitle>
              <div className="flex items-center gap-4">
                <Avatar src={f.avatar} name={f.name} className="h-16 w-16 shrink-0 rounded-full border border-gray-200 text-lg" />
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <label className="inline-flex cursor-pointer items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-50">
                      <span>↑</span> Upload photo
                      <input type="file" accept="image/png,image/jpeg,image/webp" onChange={onPhoto} className="hidden" />
                    </label>
                    {f.avatar && (
                      <button
                        type="button"
                        onClick={() => setF({ ...f, avatar: '' })}
                        className="text-xs font-semibold text-red-600 hover:text-red-800"
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <p className="mt-2 text-[10px] text-gray-400">JPG, PNG or WebP · Max 2 MB</p>
                </div>
              </div>
            </div>

            {/* About */}
            <div className="mt-6 rounded-lg border border-gray-200 p-5">
              <SectionTitle>About (paragraphs)</SectionTitle>
              <div className="flex flex-col gap-3">
                {f.about.map((p, i) => (
                  <div key={i} className="rounded-lg bg-[#f0ebe4] p-4">
                    <div className="mb-2 flex items-center justify-between">
                      <span className="text-[11px] font-bold text-gray-700">Paragraph {i + 1}</span>
                      <button
                        type="button"
                        onClick={() => removePara(i)}
                        aria-label={`Remove paragraph ${i + 1}`}
                        className="text-lg leading-none text-gray-400 hover:text-red-600"
                      >
                        ×
                      </button>
                    </div>
                    <textarea
                      rows={4}
                      value={p}
                      onChange={(e) => setPara(i, e.target.value)}
                      maxLength={1500}
                      placeholder="Write a paragraph about the author..."
                      className={`${inputCls} resize-y`}
                    />
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addPara}
                disabled={f.about.length >= 10}
                className="mt-3 text-xs font-bold text-[#d97706] underline hover:text-[#b45309] disabled:opacity-50"
              >
                + Add paragraph
              </button>
            </div>

            {/* Social links */}
            <div className="mt-6 rounded-lg border border-gray-200 p-5">
              <SectionTitle>Social links</SectionTitle>
              <div className="grid gap-x-5 gap-y-4 sm:grid-cols-2">
                {SOCIALS.map((s) => (
                  <Field key={s.key} label={s.label} error={errs[s.key]}>
                    <input
                      value={f.social[s.key]}
                      onChange={setSocial(s.key)}
                      className={inputCls}
                      placeholder={s.placeholder}
                      type="url"
                    />
                  </Field>
                ))}
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="submit"
                disabled={busy}
                className="rounded bg-[#d97706] px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-[#b45309] disabled:opacity-60"
              >
                {busy ? 'Saving...' : 'Save profile'}
              </button>
            </div>
          </form>

          {/* ================= LIVE PREVIEW ================= */}
          <aside className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm lg:sticky lg:top-4 lg:self-start">
            <div className="flex items-center gap-2 bg-[#1a1a2e] px-4 py-2 text-[10px] font-extrabold uppercase tracking-widest text-sky-300">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" /> Live preview
            </div>

            {/* Header */}
            <div className="flex items-start justify-between gap-4 bg-[#fffdf0] px-6 py-8 sm:px-7">
              <div className="min-w-0">
                <p className="text-[9px] font-extrabold uppercase tracking-[0.18em] text-gray-800">Author profile</p>
                <h2 className="mt-3 break-words text-2xl font-extrabold text-[#111] sm:text-[28px]">
                  {f.name.trim() || 'Author name'}
                </h2>
                <p className="mt-2 text-xs text-gray-800">{f.designation.trim() || 'Designation'}</p>
                {(f.workplace.trim() || f.location.trim()) && (
                  <p className="mt-1 text-[11px] text-gray-500">
                    {[f.workplace.trim(), f.location.trim()].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              <div className="relative h-[88px] w-[88px] shrink-0 overflow-hidden rounded-md bg-[#14142b]">
                <Avatar src={f.avatar} name={f.name} className="h-full w-full text-2xl" />
                <div className="absolute inset-x-0 bottom-0 bg-[#14142b]/90 py-0.5 text-center text-[8px] font-bold text-amber-400">
                  ✓ Verified Author
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="flex border-y border-gray-100">
              <div className="px-10 py-4 text-center">
                <p className="text-2xl font-extrabold text-[#111]">{mine.length}</p>
                <p className="mt-0.5 text-[9px] font-semibold uppercase tracking-wide text-gray-500">
                  Articles published
                </p>
              </div>
            </div>

            {/* Body */}
            <div className="grid gap-6 p-6 sm:grid-cols-[1fr_220px] sm:p-7">
              <div className="min-w-0">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold text-[#d97706]">
                  <span className="h-2 w-2 rounded-full bg-[#d97706]" /> About {firstName}
                </h3>
                {paragraphs.length ? (
                  <div className="space-y-3 text-[13px] leading-relaxed text-gray-700">
                    {paragraphs.map((p, i) => (
                      <p key={i} className="break-words">{p}</p>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-500">Add paragraphs in the form…</p>
                )}

                <h3 className="mb-3 mt-7 flex items-center gap-2 text-sm font-bold text-[#d97706]">
                  <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Recent articles
                </h3>
                {recent.length ? (
                  <div className="flex flex-col gap-2">
                    {recent.map((p) => (
                      <a
                        key={p._id}
                        href={`/blog/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between gap-3 rounded-md bg-[#f0ebe4] px-3 py-3 hover:bg-[#e8e1d7]"
                      >
                        <div className="min-w-0">
                          <p className="truncate text-xs font-bold text-[#111]">{p.title}</p>
                          <p className="mt-1 text-[10px] text-gray-500">
                            {prettyPostDate(p.publishedAt || p.createdAt)} · {readMinutes(p.content)} min read
                          </p>
                        </div>
                        <span className="text-blue-600">→</span>
                      </a>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs italic text-gray-500">Published articles will appear here.</p>
                )}
              </div>

              <div className="h-fit overflow-hidden rounded-lg border border-gray-200">
                <div className="bg-[#f0ebe4] px-4 py-2.5 text-[11px] font-extrabold uppercase tracking-wide text-gray-600">
                  Contact
                </div>
                <div className="px-4 py-3">
                  {socials.length ? (
                    <ul className="space-y-2">
                      {socials.map((s) => (
                        <li key={s.key}>
                          <a
                            href={f.social[s.key]}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs font-semibold text-blue-700 hover:underline"
                          >
                            {s.label}
                          </a>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-xs italic text-gray-400">Add social links…</p>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

export default function AdminProfile() {
  const { user } = useAuth();
  const prof = useFetch('/admin/profile');
  const blogs = useFetch('/admin/blogs');

  if (prof.loading) {
    return (
      <div className="p-10 flex justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <ProfileEditor
      initial={prof.data?.profile || {}}
      user={user}
      blogs={blogs.data}
      apiMissing={!!prof.error}
    />
  );
}