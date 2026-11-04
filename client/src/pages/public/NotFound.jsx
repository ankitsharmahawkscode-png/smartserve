import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import LinkButton from '../../components/LinkButton.jsx';
import useSeo from '../../hooks/useSeo.js';
import { useAuth } from '../../context/AuthContext.jsx';

const QUICK_LINKS = [
  { to: '/services', icon: '🛠️', title: 'Services', text: 'Browse and book a service' },
  { to: '/blog', icon: '📰', title: 'Blog', text: 'Tips and guides for your home' },
  { to: '/faq', icon: '❓', title: 'FAQ', text: 'Quick answers to common questions' },
  { to: '/about', icon: '🏠', title: 'About us', text: 'Who we are and how we work' },
  { to: '/careers', icon: '💼', title: 'Careers', text: 'Join us as a technician' },
  { to: '/contact', icon: '💬', title: 'Contact', text: 'Talk to our team' },
];

// Small tools that float around the illustration
const FLOATERS = [
  { icon: '🔧', cls: 'left-0 top-2 sm:-left-6', delay: '0s' },
  { icon: '💡', cls: 'right-2 top-0 sm:-right-4', delay: '1.2s' },
  { icon: '🚿', cls: 'bottom-2 left-2 sm:-left-2', delay: '2.1s' },
  { icon: '❄️', cls: 'bottom-0 right-0 sm:-right-6', delay: '0.7s' },
];

export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true });

  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [q, setQ] = useState('');

  const goBack = () => {
    if (window.history.length > 1) navigate(-1);
    else navigate('/');
  };

  const search = (e) => {
    e.preventDefault();
    const term = q.trim();
    navigate(term ? `/services?q=${encodeURIComponent(term)}` : '/services');
  };

  return (
    <main className="relative overflow-hidden bg-gradient-to-b from-brand-tint/60 to-white">
      <style>{`
        @keyframes nf-float {
          0%, 100% { transform: translateY(0) rotate(0deg); }
          50% { transform: translateY(-14px) rotate(6deg); }
        }
        .nf-float { animation: nf-float 5s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .nf-float { animation: none !important; }
        }
      `}</style>

      {/* Soft decorative circles */}
      <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-brand/10" aria-hidden="true" />
      <div className="pointer-events-none absolute -bottom-32 -right-24 h-80 w-80 rounded-full bg-brand/10" aria-hidden="true" />

      <section className="relative mx-auto w-full max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16 lg:py-20">
        {/* Illustration */}
        <div className="relative mx-auto mb-8 inline-flex items-center justify-center px-10 py-6 sm:px-16">
          {FLOATERS.map((f) => (
            <span
              key={f.icon}
              className={`nf-float absolute text-2xl sm:text-3xl ${f.cls}`}
              style={{ animationDelay: f.delay }}
              aria-hidden="true"
            >
              {f.icon}
            </span>
          ))}

          <div className="relative flex items-center justify-center gap-1 sm:gap-3" aria-hidden="true">
            <span className="text-7xl font-extrabold tracking-tight text-brand drop-shadow-sm sm:text-8xl lg:text-9xl">4</span>

            <div className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-brand bg-white shadow-lg sm:h-28 sm:w-28 lg:h-32 lg:w-32">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-10 w-10 text-brand-dark motion-safe:animate-[spin_14s_linear_infinite] sm:h-14 sm:w-14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.6}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="3" />
                <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z" />
              </svg>
            </div>

            <span className="text-7xl font-extrabold tracking-tight text-brand drop-shadow-sm sm:text-8xl lg:text-9xl">4</span>
          </div>
        </div>

        {/* Message */}
        <p className="mb-3 text-sm font-extrabold uppercase tracking-widest text-accent-text">Error 404</p>

        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
          Looks like this page needs a repair
        </h1>

        <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-ink-muted sm:text-base lg:text-lg">
          The page you&apos;re looking for may have been moved or deleted, or the link might be incorrect.
          Let&apos;s help you find your way back.
        </p>

        {location.pathname && location.pathname !== '/' && (
          <p className="mx-auto mt-4 max-w-full">
            <code className="inline-block max-w-full break-all rounded-lg bg-white/80 px-3 py-1.5 text-xs text-gray-600 shadow-sm ring-1 ring-line">
              {location.pathname}
            </code>
          </p>
        )}

        {/* Search */}
        <form onSubmit={search} role="search" className="mx-auto mt-8 flex max-w-md gap-2">
          <label htmlFor="nf-search" className="sr-only">Search for a service</label>
          <input
            id="nf-search"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search for a service, e.g. AC repair"
            className="min-h-[46px] w-full rounded-full border border-line-strong bg-white px-5 text-sm shadow-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
          <button
            type="submit"
            className="min-h-[46px] shrink-0 rounded-full bg-brand px-6 text-sm font-bold text-white transition-colors hover:bg-brand-dark"
          >
            Search
          </button>
        </form>

        {/* Actions */}
        <div className="mt-6 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center [&_a]:justify-center">
          <LinkButton to="/">Back to home</LinkButton>
          {user && <LinkButton to={`/${user.role}`} variant="secondary">Go to my dashboard</LinkButton>}
          <button
            type="button"
            onClick={goBack}
            className="min-h-[44px] rounded-full border border-line-strong bg-white px-5 text-sm font-semibold text-gray-800 transition-colors hover:bg-gray-50"
          >
            ← Go back
          </button>
        </div>

        {/* Quick links */}
        <div className="mt-12 text-left">
          <p className="mb-4 text-center text-sm font-bold uppercase tracking-widest text-ink-muted">
            Popular pages
          </p>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {QUICK_LINKS.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="group flex items-center gap-3 rounded-xl border border-line bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
              >
                <span
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xl"
                  aria-hidden="true"
                >
                  {l.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold text-[#111] group-hover:text-brand-dark">{l.title}</span>
                  <span className="block text-xs text-ink-muted">{l.text}</span>
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Help */}
        <div className="mt-10 border-t border-line pt-6">
          <p className="text-sm text-ink-muted">
            Still need help?{' '}
            <Link
              to="/contact"
              className="rounded font-semibold text-brand underline underline-offset-4 hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
            >
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}