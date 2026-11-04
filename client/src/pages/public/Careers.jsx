import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

// ===== EDIT THESE =====
const NAME = company?.name || 'Technical Workers';
const EMAIL = company?.email || 'careers@yourdomain.com';
const APPLY_PATH = '/become-a-technician';

const ROLES = [
  { title: 'AC Technician', desc: 'Install, service, gas refill and repair of split and window air conditioners.' },
  { title: 'Plumber', desc: 'Leak fixing, tap and pipe fitting, bathroom and kitchen plumbing work.' },
  { title: 'Electrician', desc: 'Wiring, switchboards, fans, lights and safe fault finding at homes.' },
  { title: 'Appliance Repair Technician', desc: 'Washing machines, refrigerators, microwaves, water purifiers and more.' },
  { title: 'Home Cleaning Professional', desc: 'Deep cleaning of homes, kitchens, bathrooms and sofas.' },
];

const REQUIREMENTS = [
  'At least 1 year of hands-on experience in your trade (freshers with training are welcome to apply).',
  'Your own basic tools, and a smartphone with internet to use the dashboard.',
  'Polite, punctual and comfortable talking to customers.',
  'A valid ID proof and a working phone number.',
];

const COMMISSION_NOTE = 'You earn a commission on every completed job.'; // add your % here if you want to show it
// ======================

const Svg = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-6 w-6">
    {children}
  </svg>
);

const BENEFITS = [
  {
    title: 'Jobs come to you',
    text: 'Assigned jobs appear in your dashboard with the address, time and details. Accept the ones that suit you.',
    icon: <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>,
  },
  {
    title: 'Clear earnings',
    text: `${COMMISSION_NOTE} Every job and every rupee is tracked on your Earnings page.`,
    icon: <Svg><path d="M12 1v22" /><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></Svg>,
  },
  {
    title: 'Flexible availability',
    text: 'Mark yourself available or unavailable whenever you need a break, and we only assign you when you are free.',
    icon: <Svg><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></Svg>,
  },
  {
    title: 'Verified and trusted',
    text: 'Customers see you as a verified technician, and good reviews help you get more work.',
    icon: <Svg><path d="M12 2l8 3v6c0 5-3.5 9-8 11-4.5-2-8-6-8-11V5l8-3Z" /><path d="M9 12l2 2 4-4" /></Svg>,
  },
];

const STEPS = [
  { title: 'Apply online', text: 'Fill in the short form with your trade, experience and city.' },
  { title: 'We review', text: 'Our team checks your details and may call you to talk about your work.' },
  { title: 'Get approved', text: 'Approved applicants get access to the technician dashboard.' },
  { title: 'Start earning', text: 'Accept jobs near you, complete them, and track your earnings.' },
];

export default function Careers() {
  useSeo({
    title: `Careers | ${NAME}`,
    description: `Join ${NAME} as an AC, plumbing, electrical, appliance repair or cleaning professional. Get jobs delivered to your phone and track your earnings.`,
    path: '/careers',
  });

  return (
    <main className="bg-white pb-20">
      {/* Hero */}
      <section className="border-b border-gray-100 bg-[#fffdf0]">
        <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6 sm:py-16">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-700">Careers</p>
          <h1 className="mt-3 max-w-[720px] text-3xl font-extrabold leading-tight text-[#111] sm:text-5xl">
            Build your career with {NAME}
          </h1>
          <p className="mt-4 max-w-[620px] text-[15px] leading-relaxed text-gray-700 sm:text-base">
            We connect skilled technicians with customers who need reliable home services. Join us, get jobs on your
            phone, and grow your own work.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              to={APPLY_PATH}
              className="rounded bg-[#d97706] px-6 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b45309]"
            >
              Apply as a technician
            </Link>
            <a
              href="#roles"
              className="rounded border border-gray-300 bg-white px-6 py-3 text-sm font-bold text-gray-800 transition-colors hover:bg-gray-50"
            >
              See open roles
            </a>
          </div>
        </div>
      </section>

      {/* Why join */}
      <section className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-[#d97706]">
          <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Why work with us
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          {BENEFITS.map((b) => (
            <div key={b.title} className="flex gap-4 rounded-lg border border-gray-200 p-5">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#fff8eb] text-[#d97706]">
                {b.icon}
              </span>
              <div>
                <h3 className="font-bold text-[#111]">{b.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-gray-600">{b.text}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Roles */}
      <section id="roles" className="scroll-mt-24 bg-[#f7f4ee]">
        <div className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
          <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-[#d97706]">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Roles we hire for
          </h2>
          <div className="flex flex-col gap-3">
            {ROLES.map((r) => (
              <div
                key={r.title}
                className="flex flex-col gap-3 rounded-lg bg-white p-5 shadow-sm sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-[#111]">{r.title}</h3>
                  <p className="mt-1 text-sm text-gray-600">{r.desc}</p>
                </div>
                <Link
                  to={APPLY_PATH}
                  className="shrink-0 self-start rounded border border-[#d97706] px-4 py-2 text-sm font-bold text-[#d97706] transition-colors hover:bg-[#d97706] hover:text-white sm:self-center"
                >
                  Apply
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How hiring works */}
      <section className="mx-auto max-w-[1000px] px-4 py-12 sm:px-6">
        <h2 className="mb-6 flex items-center gap-2 text-lg font-bold text-[#d97706]">
          <span className="h-2 w-2 rounded-full bg-[#d97706]" /> How hiring works
        </h2>
        <ol className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {STEPS.map((s, i) => (
            <li key={s.title} className="rounded-lg border border-gray-200 p-5">
              <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white">
                {i + 1}
              </span>
              <h3 className="mt-3 font-bold text-[#111]">{s.title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-gray-600">{s.text}</p>
            </li>
          ))}
        </ol>
      </section>

      {/* Requirements */}
      <section className="mx-auto max-w-[1000px] px-4 sm:px-6">
        <div className="rounded-lg border border-gray-200 p-6">
          <h2 className="mb-4 text-lg font-bold text-[#111]">What we look for</h2>
          <ul className="space-y-2.5">
            {REQUIREMENTS.map((r) => (
              <li key={r} className="flex gap-3 text-[15px] leading-relaxed text-gray-700">
                <span className="mt-0.5 text-[#d97706]" aria-hidden="true">✓</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* Final call to action */}
      <section className="mx-auto mt-12 max-w-[1000px] px-4 sm:px-6">
        <div className="rounded-xl bg-[#0B1F3A] p-8 text-center text-white sm:p-10">
          <h2 className="text-2xl font-extrabold">Ready to get started?</h2>
          <p className="mx-auto mt-2 max-w-[520px] text-sm leading-relaxed text-white/75">
            The application takes a couple of minutes. We read every one and contact you if it is a fit.
          </p>
          <Link
            to={APPLY_PATH}
            className="mt-6 inline-block rounded bg-[#d97706] px-7 py-3 text-sm font-bold text-white transition-colors hover:bg-[#b45309]"
          >
            Apply now
          </Link>
          <p className="mt-6 text-xs text-white/60">
            Looking for an office, support or content role? Write to us at{' '}
            <a href={`mailto:${EMAIL}`} className="underline hover:text-white">{EMAIL}</a>{' '}
            or use the <Link to="/contact" className="underline hover:text-white">contact page</Link>.
          </p>
        </div>
      </section>
    </main>
  );
}