import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import useSeo from '../../hooks/useSeo.js';
import Input from '../../components/Input.jsx';
import { Select, Textarea } from '../../components/Fields.jsx';
import { Button } from '../../components/ui.jsx';

// Check this in server/src/routes/public.routes.js: it is the path the Contact page posts to
const ENDPOINT = '/contact';

const TYPES = ['Office', 'Housing society', 'Shop or showroom', 'Hotel or restaurant', 'School or clinic', 'Other'];
const SERVICES = ['AC servicing', 'Plumbing', 'Electrical work', 'Deep cleaning', 'Appliance repair', 'Pest control', 'Painting'];

// Edit these so they only say what you can really offer
const BENEFITS = [
  { icon: '📅', title: 'Scheduled visits', text: 'Plan regular service visits for your premises.' },
  { icon: '👤', title: 'One point of contact', text: 'Talk to one team for all your service needs.' },
  { icon: '✅', title: 'Approved technicians', text: 'Our technicians are reviewed before they take jobs.' },
  { icon: '₹', title: 'Clear pricing', text: 'We explain the cost before the work starts.' },
];

const EMPTY = { company: '', name: '', email: '', phone: '', city: '', type: '', services: [], message: '', website: '' };
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function ForBusiness() {
  const [f, setF] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [done, setDone] = useState(false);

  useSeo({
    title: 'Home Services for Business | SmartServe',
    description: 'Regular AC, plumbing, electrical and cleaning services for offices, societies, shops and more. Send us an enquiry.',
    path: '/for-business',
  });

  const set = (k) => (e) => {
    setF((p) => ({ ...p, [k]: e.target.value }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
  };
  const toggle = (s) => {
    setF((p) => ({ ...p, services: p.services.includes(s) ? p.services.filter((x) => x !== s) : [...p.services, s] }));
    if (errs.services) setErrs((x) => ({ ...x, services: undefined }));
  };

  const submit = async (e) => {
    e.preventDefault();
    const x = {};
    if (f.company.trim().length < 2) x.company = 'Enter the organisation name';
    if (f.name.trim().length < 2) x.name = 'Enter your name';
    if (!EMAIL_RE.test(f.email.trim())) x.email = 'Enter a valid email address';
    if (!PHONE_RE.test(f.phone.trim())) x.phone = 'Enter a valid phone number';
    if (f.city.trim().length < 2) x.city = 'Enter the city';
    if (!f.type) x.type = 'Choose the type of place';
    if (f.services.length === 0) x.services = 'Select at least one service';
    setErrs(x);
    if (Object.keys(x).length) {
      setNotice('Please fix the highlighted fields.');
      return;
    }

    setBusy(true);
    setNotice('');
    const message = [
      'Business enquiry',
      `Organisation: ${f.company.trim()} (${f.type})`,
      `City: ${f.city.trim()}`,
      `Services needed: ${f.services.join(', ')}`,
      f.message.trim() && `Details: ${f.message.trim()}`,
    ].filter(Boolean).join('\n');

    try {
      await api.post(ENDPOINT, {
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
        message,
        website: f.website, // hidden spam trap, stays empty for real people
      });
      setDone(true);
      setF(EMPTY);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (err) {
      const resp = err.response?.data;
      const details = resp?.errors?.map((er) => `${er.field || ''} ${er.message || ''}`.trim()).join(' | ');
      setNotice(`${resp?.message || 'Something went wrong. Please try again.'}${details ? `: ${details}` : ''}`);
    } finally {
      setBusy(false);
    }
  };

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-4xl px-4 py-14 text-center sm:px-6">
          <p className="text-sm font-extrabold uppercase tracking-widest text-white/70">For business</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">
            Home services for offices, societies and shops
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-white/80">
            Need regular servicing for more than one place? Tell us what you need and our team will get back to you.
          </p>
          <a href="#enquiry" className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-bold text-brand-dark transition hover:bg-gray-200">
            Send an enquiry
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {BENEFITS.map((b) => (
            <div key={b.title} className="rounded-xl border border-line p-5 text-center">
              <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-brand-tint text-xl" aria-hidden="true">{b.icon}</span>
              <h2 className="mt-3 font-bold">{b.title}</h2>
              <p className="mt-1 text-sm text-ink-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="enquiry" className="mx-auto max-w-3xl scroll-mt-20 px-4 sm:px-6">
        <div className="rounded-2xl border border-line bg-white p-6 shadow-lg sm:p-10">
          {done ? (
            <div className="text-center" role="status">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700" aria-hidden="true">✓</div>
              <h2 className="text-2xl font-extrabold">Thank you!</h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-muted">
                We received your enquiry and will contact you on the email or phone number you gave us.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">Back to home</Link>
                <button type="button" onClick={() => setDone(false)} className="rounded-full border border-line-strong px-6 py-3 text-sm font-bold hover:bg-gray-50">
                  Send another enquiry
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 className="mb-8 text-center text-2xl font-extrabold">Tell us what you need</h2>

              {notice && <div role="alert" className="mb-6 rounded-lg bg-red-50 p-4 text-sm font-semibold text-red-800">{notice}</div>}

              <form onSubmit={submit} noValidate className="flex flex-col gap-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input label="Organisation name" value={f.company} onChange={set('company')} error={errs.company} maxLength={100} />
                  <Select label="Type of place" value={f.type} onChange={set('type')} error={errs.type}>
                    <option value="">Choose one</option>
                    {TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </Select>
                  <Input label="Your name" value={f.name} onChange={set('name')} error={errs.name} maxLength={80} autoComplete="name" />
                  <Input label="City" value={f.city} onChange={set('city')} error={errs.city} maxLength={80} />
                  <Input label="Email" type="email" value={f.email} onChange={set('email')} error={errs.email} autoComplete="email" />
                  <Input label="Phone" type="tel" value={f.phone} onChange={set('phone')} error={errs.phone} placeholder="+91 98765 43210" autoComplete="tel" />
                </div>

                <div>
                  <p className="mb-2 text-sm font-semibold text-ink-muted">Services you need *</p>
                  <div className="flex flex-wrap gap-2">
                    {SERVICES.map((s) => {
                      const on = f.services.includes(s);
                      return (
                        <button
                          key={s}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggle(s)}
                          className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                            on ? 'border-brand bg-brand text-white' : 'border-line-strong bg-white text-ink-muted hover:border-brand'
                          }`}
                        >
                          {on && '✓ '}{s}
                        </button>
                      );
                    })}
                  </div>
                  {errs.services && <p className="mt-2 text-sm font-semibold text-red-600">{errs.services}</p>}
                </div>

                <div>
                  <Textarea label="Anything else we should know? (optional)" rows={4} maxLength={1000} value={f.message} onChange={set('message')} />
                  <p className="mt-1 text-xs text-ink-muted">{f.message.length}/1000</p>
                </div>

                {/* Spam trap: people never see or fill this */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>Website<input type="text" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} /></label>
                </div>

                <Button type="submit" disabled={busy} className="mt-2 min-h-[48px] w-full">
                  {busy ? 'Sending...' : 'Send enquiry'}
                </Button>
                <p className="text-center text-xs text-ink-muted">
                  By sending this you agree to our <Link to="/privacy-policy" className="underline hover:text-brand">Privacy Policy</Link>.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}