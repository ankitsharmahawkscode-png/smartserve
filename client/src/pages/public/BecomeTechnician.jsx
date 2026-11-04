import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/client.js';
import useSeo from '../../hooks/useSeo.js';
import { Button } from '../../components/ui.jsx';
import Input from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';

const SKILL_OPTIONS = ['AC Repair', 'Plumbing', 'Electrical', 'Appliance Repair', 'Carpentry', 'Home Cleaning', 'Pest Control', 'Painting'];

// Make sure every claim below is true for your business before you publish
const BENEFITS = [
  { icon: '💼', title: 'More Jobs', text: 'Get access to a constant stream of service requests in your city.' },
  { icon: '💰', title: 'Weekly Payouts', text: 'Transparent and timely payments directly to your bank account.' },
  { icon: '📚', title: 'Free Training', text: 'Upgrade your skills with our free training and certification programs.' },
];

const STEPS = [
  { title: 'Apply online', text: 'Fill in the short form below.' },
  { title: 'We review', text: 'Our team checks your details and may call you.' },
  { title: 'Get approved', text: 'You get access to the technician dashboard.' },
  { title: 'Start earning', text: 'Accept jobs near you and track your earnings.' },
];

const EMPTY = { name: '', email: '', phone: '', city: '', experienceYears: '', skills: [], message: '', website: '' };
const PHONE_RE = /^\+?[0-9\s-]{10,15}$/;
const EMAIL_RE = /^\S+@\S+\.\S+$/;

export default function BecomeTechnician() {
  const [form, setForm] = useState(EMPTY);
  const [errs, setErrs] = useState({});
  const [notice, setNotice] = useState('');
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(null); // holds the applicant's name after success

  useSeo({
    title: 'Become a Technician | Join SmartServe',
    description: 'Join SmartServe as a professional technician. Get more jobs, flexible hours and grow your career. Apply today!',
    path: '/become-a-technician',
  });

  const set = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    if (errs[k]) setErrs((x) => ({ ...x, [k]: undefined }));
  };

  const toggleSkill = (skill) => {
    setForm((f) => ({
      ...f,
      skills: f.skills.includes(skill) ? f.skills.filter((s) => s !== skill) : [...f.skills, skill],
    }));
    if (errs.skills) setErrs((x) => ({ ...x, skills: undefined }));
  };

  const validate = () => {
    const x = {};
    if (form.name.trim().length < 2) x.name = 'Enter your full name';
    if (!EMAIL_RE.test(form.email.trim())) x.email = 'Enter a valid email address';
    if (!PHONE_RE.test(form.phone.trim())) x.phone = 'Enter a valid phone number';
    if (form.city.trim().length < 2) x.city = 'Enter your city';
    const years = Number(form.experienceYears);
    if (form.experienceYears === '' || !Number.isInteger(years) || years < 0 || years > 60) {
      x.experienceYears = 'Enter a whole number from 0 to 60';
    }
    if (form.skills.length === 0) x.skills = 'Select at least one skill';
    return x;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const x = validate();
    setErrs(x);
    if (Object.keys(x).length) {
      setNotice('Please fix the highlighted fields.');
      return;
    }

    setBusy(true);
    setNotice('');
    try {
      await api.post('/applications', {
        name: form.name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        experienceYears: Number(form.experienceYears),
        skills: form.skills,
        ...(form.message.trim() && { message: form.message.trim() }),
        website: form.website, // hidden spam trap, stays empty for real people
      });
      setDone(form.name.trim().split(/\s+/)[0]);
      setForm(EMPTY);
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
    <main className="w-full bg-white">
      {/* Hero */}
      <section className="bg-brand-dark text-white py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-4">
            Become a SmartServe Technician
          </h1>
          <p className="text-base sm:text-lg text-white/80 leading-relaxed max-w-2xl mx-auto">
            Join our team of skilled professionals. Get more jobs, flexible hours, and grow your career with us.
          </p>
          <a
            href="#apply"
            className="mt-7 inline-block rounded-full bg-white px-7 py-3 text-sm font-bold text-brand-dark transition hover:bg-gray-200"
          >
            Apply now
          </a>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-12 bg-gray-50 border-b border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          {BENEFITS.map((b) => (
            <div key={b.title} className="bg-white p-6 rounded-xl shadow-sm border border-line text-center">
              <div className="w-12 h-12 mx-auto bg-brand-tint text-brand-dark rounded-full flex items-center justify-center mb-4 text-xl" aria-hidden="true">
                {b.icon}
              </div>
              <h3 className="font-bold mb-2">{b.title}</h3>
              <p className="text-sm text-ink-muted">{b.text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h2 className="text-center text-2xl font-extrabold mb-8">How it works</h2>
        <ol className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-xl border border-line p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold">{s.title}</h3>
              <p className="mt-1 text-sm text-ink-muted">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Form or success */}
      <section id="apply" className="scroll-mt-20 px-4 pb-14 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-lg border border-line">
          {done ? (
            <div className="text-center" role="status">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700" aria-hidden="true">
                ✓
              </div>
              <h2 className="text-2xl font-extrabold">Thank you, {done}!</h2>
              <p className="mx-auto mt-3 max-w-md leading-relaxed text-ink-muted">
                We received your application. Our team will review it and contact you on the phone number or email you
                gave us if it is a good fit.
              </p>
              <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row">
                <Link to="/" className="rounded-full bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-dark">
                  Back to home
                </Link>
                <Link to="/careers" className="rounded-full border border-line-strong px-6 py-3 text-sm font-bold text-gray-800 hover:bg-gray-50">
                  See careers
                </Link>
              </div>
              <button
                type="button"
                onClick={() => setDone(null)}
                className="mt-5 text-sm font-semibold text-brand underline underline-offset-4"
              >
                Submit another application
              </button>
            </div>
          ) : (
            <>
              <h2 className="text-2xl font-extrabold text-center mb-8">Apply Now</h2>

              {notice && (
                <div role="alert" className="p-4 rounded-lg mb-6 text-sm font-semibold bg-red-50 text-red-800">
                  {notice}
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Input label="Full Name" value={form.name} onChange={set('name')} error={errs.name} maxLength={80} autoComplete="name" />
                  <Input label="Email" type="email" value={form.email} onChange={set('email')} error={errs.email} autoComplete="email" />
                  <Input label="Phone" type="tel" value={form.phone} onChange={set('phone')} error={errs.phone} placeholder="+91 98765 43210" autoComplete="tel" />
                  <Input label="City" value={form.city} onChange={set('city')} error={errs.city} maxLength={80} />
                </div>

                <Input
                  label="Years of Experience"
                  type="number"
                  min="0"
                  max="60"
                  value={form.experienceYears}
                  onChange={set('experienceYears')}
                  error={errs.experienceYears}
                />

                <div>
                  <label className="block text-sm font-semibold text-ink-muted mb-2">Select Your Skills *</label>
                  <div className="flex flex-wrap gap-2">
                    {SKILL_OPTIONS.map((skill) => {
                      const on = form.skills.includes(skill);
                      return (
                        <button
                          key={skill}
                          type="button"
                          aria-pressed={on}
                          onClick={() => toggleSkill(skill)}
                          className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                            on ? 'bg-brand text-white border-brand' : 'bg-white text-ink-muted border-line-strong hover:border-brand'
                          }`}
                        >
                          {on && '✓ '}{skill}
                        </button>
                      );
                    })}
                  </div>
                  {errs.skills && <p className="mt-2 text-sm font-semibold text-red-600">{errs.skills}</p>}
                </div>

                <div>
                  <Textarea
                    label="Why should we hire you? (Optional)"
                    rows={3}
                    maxLength={1000}
                    value={form.message}
                    onChange={set('message')}
                  />
                  <p className="mt-1 text-xs text-ink-muted">{form.message.length}/1000</p>
                </div>

                {/* Spam trap: people never see or fill this */}
                <div aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 overflow-hidden">
                  <label>
                    Website
                    <input type="text" tabIndex={-1} autoComplete="off" value={form.website} onChange={set('website')} />
                  </label>
                </div>

                <Button type="submit" disabled={busy} className="w-full min-h-[48px] mt-2">
                  {busy ? 'Submitting...' : 'Submit Application'}
                </Button>

                <p className="text-center text-xs text-ink-muted">
                  By applying you agree to our{' '}
                  <Link to="/privacy-policy" className="underline hover:text-brand">Privacy Policy</Link> and{' '}
                  <Link to="/terms" className="underline hover:text-brand">Terms</Link>.
                </p>
              </form>
            </>
          )}
        </div>
      </section>
    </main>
  );
}