import { Link } from 'react-router-dom';
import LinkButton from '../../components/LinkButton.jsx';
import useSeo from '../../hooks/useSeo.js';
export default function NotFound() {
  useSeo({ title: 'Page not found', noindex: true });
  return (
    <main className="min-h-[70vh] flex items-center justify-center px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
      <section className="w-full max-w-2xl mx-auto text-center">
        {/* 404 Illustration */}
        <div className="relative inline-flex items-center justify-center mb-6">
          <div
            className="absolute w-36 h-36 sm:w-48 sm:h-48
              rounded-full bg-brand-tint"
            aria-hidden="true"
          />

          <div className="relative flex items-center justify-center gap-2 sm:gap-4">
            <span className="text-7xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight text-brand">
              4
            </span>

            <div
              className="w-16 h-16 sm:w-24 sm:h-24 lg:w-28 lg:h-28
                rounded-full bg-white border-4 border-brand
                flex items-center justify-center shadow-sm"
              aria-hidden="true"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-8 h-8 sm:w-12 sm:h-12 text-brand-dark"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.7}
              >
                <circle cx="11" cy="11" r="7" />
                <path
                  strokeLinecap="round"
                  d="m16 16 4 4"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M8.5 9.5h.01M13.5 9.5h.01M9 13c1.2 1 2.8 1 4 0"
                />
              </svg>
            </div>

            <span className="text-7xl sm:text-8xl lg:text-9xl font-extrabold tracking-tight text-brand">
              4
            </span>
          </div>
        </div>

        {/* Error Message */}
        <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text mb-3">
          Error 404
        </p>

        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
          Oops! Page not found
        </h1>

        <p className="text-sm sm:text-base lg:text-lg text-ink-muted leading-relaxed mt-4 max-w-lg mx-auto">
          The page you&apos;re looking for may have been moved, deleted,
          or the link might be incorrect. Don&apos;t worry — let&apos;s
          help you find your way back.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 mt-8">
          <LinkButton to="/">
            Back to home
          </LinkButton>

          <LinkButton to="/services" variant="secondary">
            Explore services
          </LinkButton>
        </div>

        {/* Helpful Link */}
        <div className="mt-8 pt-6 border-t border-line">
          <p className="text-sm text-ink-muted">
            Still need help?{' '}
            <Link
              to="/contact"
              className="font-semibold text-brand underline underline-offset-4
                hover:text-brand-dark focus:outline-none
                focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              Contact us
            </Link>
          </p>
        </div>
      </section>
    </main>
  );
}