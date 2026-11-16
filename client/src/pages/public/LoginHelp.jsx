import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

const ITEMS = [
  {
    q: 'I forgot my password',
    a: 'Open the forgot-password page, enter the email you registered with, and we will send you a link to set a new password. Check your spam folder if it does not arrive within a few minutes.',
    to: '/forgot-password',
    cta: 'Reset my password',
  },
  {
    q: 'It says my email or password is wrong',
    a: 'Check for extra spaces and that Caps Lock is off. Use the Show button on the login page to see what you typed. If you are not sure which email you used, try the others you own.',
  },
  {
    q: 'My login is temporarily blocked',
    a: 'After several wrong attempts, login is paused for a short time to protect your account. Wait a little, then try again, or reset your password to be safe.',
    to: '/forgot-password',
    cta: 'Reset my password',
  },
  {
    q: 'I am a technician and my application was approved, but I cannot log in',
    a: 'When an application is approved, your account is created with a password you were never given. Use the forgot-password page with the same email you applied with to set your own password, then log in.',
    to: '/forgot-password',
    cta: 'Set my password',
  },
  {
    q: 'I have not been approved as a technician yet',
    a: 'Our team reviews every application and contacts approved applicants. You cannot log in as a technician until then.',
    to: '/become-a-technician',
    cta: 'About applying',
  },
  {
    q: 'I do not have an account',
    a: 'Create one in under a minute with your name, email and a password.',
    to: '/register',
    cta: 'Create an account',
  },
  {
    q: 'My account was deactivated',
    a: 'An account can be deactivated by our team. Contact us from the contact page with the email on the account and we will look into it.',
    to: '/contact',
    cta: 'Contact us',
  },
  {
    q: 'I did not get the reset email',
    a: 'Wait a few minutes and check your spam or promotions folder. Make sure the email is the one on your account. If it still does not arrive, contact us and we can help.',
    to: '/contact',
    cta: 'Contact us',
  },
];

export default function LoginHelp() {
  useSeo({
    title: 'Login Help | SmartServe',
    description: 'Fixes for common login problems: forgotten password, blocked login, technician accounts and more.',
    path: '/login-help',
  });

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">Account help</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Having trouble logging in?</h1>
          <p className="mt-3 text-ink-muted">Find your problem below and follow the fix.</p>
        </div>
      </section>

      <section className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
        <div className="divide-y divide-line rounded-2xl border border-line bg-white">
          {ITEMS.map((x) => (
            <details key={x.q} className="group px-5 py-4">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                {x.q}
                <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
              </summary>
              <p className="mt-3 pr-6 leading-relaxed text-ink-muted">{x.a}</p>
              {x.to && (
                <Link
                  to={x.to}
                  className="mt-3 inline-block rounded-full bg-brand px-5 py-2 text-sm font-bold text-white hover:bg-brand-dark"
                >
                  {x.cta}
                </Link>
              )}
            </details>
          ))}
        </div>

        <div className="mt-8 rounded-xl bg-[#f0ebe4] p-6 text-center">
          <p className="font-bold">Still stuck?</p>
          <p className="mt-1 text-sm text-gray-600">Write to us with your account email and we will help.</p>
          <Link to="/contact" className="mt-4 inline-block rounded-full bg-[#d97706] px-5 py-2 text-sm font-bold text-white hover:bg-[#b45309]">
            Contact support
          </Link>
        </div>

        <p className="mt-6 text-center text-sm">
          <Link to="/login" className="font-semibold text-brand underline underline-offset-4">← Back to log in</Link>
        </p>
      </section>
    </main>
  );
}