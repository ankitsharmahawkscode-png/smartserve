import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { motion, MotionConfig } from 'motion/react';
import useFetch from '../../hooks/useFetch.js';
import { Card } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { company } from '../../content.js';
import { inr } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

const STEPS = [
  ['1', 'Choose', 'Pick a service and a time slot that suits you.'],
  ['2', 'We confirm and assign', 'Our team confirms your booking and a technician accepts the job.'],
  ['3', 'Pay and review', 'Pay in cash or online, then rate the job.'],
];

const FEATURES = [
  ['Pick your slot', 'See open time slots for your date and book in minutes.'],
  ['Follow your job', 'Track every step from confirmation to completion.'],
  ['Pay your way', 'Cash on service or secure online payment.'],
  ['Rate every job', 'Your reviews help others choose with confidence.'],
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const sectionMotion = {
  initial: 'hidden',
  whileInView: 'visible',
  viewport: { once: true, amount: 0.12 },
  variants: fadeUp,
  transition: { duration: 0.6, ease: 'easeOut' },
};

export default function Home() {
  const cats = useFetch('/categories');
  const list = useFetch('/services', { limit: 6 });
  const origin = window.location.origin;

  // Refs for the category chips carousel
  const chipsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const updateArrows = () => {
    const el = chipsRef.current;
    if (!el) return;
    setCanScrollLeft(el.scrollLeft > 4);
    setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  };

  useEffect(() => {
    updateArrows();
    const el = chipsRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateArrows, { passive: true });
    window.addEventListener('resize', updateArrows);
    return () => {
      el.removeEventListener('scroll', updateArrows);
      window.removeEventListener('resize', updateArrows);
    };
  }, [cats.data]);

  const scrollChips = (direction) => {
    const el = chipsRef.current;
    if (!el) return;
    const amount = el.clientWidth * 0.7;
    el.scrollBy({
      left: direction === 'left' ? -amount : amount,
      behavior: 'smooth',
    });
  };

  useSeo({
    path: '/',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'HomeAndConstructionBusiness',
      name: company.name,
      url: origin,
      logo: `${origin}/logo.png`,
      image: `${origin}/og-image.png`,
      description: 'AC repair, plumbing, electrical work, home cleaning and appliance repair, booked online.',
      ...(company.phone && { telephone: company.phone }),
      ...(company.email && { email: company.email }),
      ...(company.address && { address: { '@type': 'PostalAddress', streetAddress: company.address } }),
      ...(company.serviceArea && { areaServed: company.serviceArea }),
    },
  });

  const arrowBtn =
    'hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-line-strong bg-white text-brand-dark hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-dark disabled:hover:border-line-strong shrink-0';

  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full overflow-hidden">

        {/* HERO SECTION */}
        <section className="bg-brand-tint">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 lg:py-20">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-center">

              <motion.div
                initial={{ opacity: 0, x: -40 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.75, ease: 'easeOut' }}
                className="text-center md:text-left order-2 md:order-1"
              >
                <p className="font-extrabold text-accent-text tracking-wider uppercase text-xs sm:text-sm">
                  {company.tagline}
                </p>

                <h1 className="text-2xl sm:text-4xl lg:text-5xl xl:text-6xl font-extrabold leading-tight tracking-tight mt-3">
                  Home services, booked online in minutes.
                </h1>

                <p className="text-sm sm:text-lg text-ink-muted mt-4 max-w-xl mx-auto md:mx-0 leading-relaxed">
                  AC repair, plumbing, electrical work, cleaning and appliance
                  repair. Choose a time, track your technician and pay your way.
                </p>

                <motion.div
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.25 }}
                  className="flex flex-col sm:flex-row justify-center md:justify-start gap-3 mt-6 sm:mt-8"
                >
                  <div className="w-full sm:w-auto">
                    <LinkButton to="/services">Book a service</LinkButton>
                  </div>
                  <div className="w-full sm:w-auto">
                    <LinkButton to="/about" variant="secondary">About us</LinkButton>
                  </div>
                </motion.div>

                <div className="flex flex-wrap justify-center md:justify-start gap-x-5 gap-y-2 mt-6 text-xs sm:text-sm text-ink-muted">
                  {['Easy online booking', 'Track your booking'].map((item) => (
                    <span key={item} className="inline-flex items-center gap-2">
                      <svg
                        className="w-4 h-4 text-brand-dark shrink-0"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M16.704 5.29a1 1 0 0 1 .006 1.414l-7.07 7.13a1 1 0 0 1-1.42 0l-3.54-3.57a1 1 0 1 1 1.42-1.41l2.83 2.85 6.36-6.41a1 1 0 0 1 1.414-.004Z"
                          clipRule="evenodd"
                        />
                      </svg>
                      {item}
                    </span>
                  ))}
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.85, x: 25 }}
                animate={{ opacity: 1, scale: 1, x: 0 }}
                transition={{ duration: 0.8, delay: 0.15 }}
                className="flex justify-center items-center mt-2 md:mt-0 order-1 md:order-2"
              >
                <motion.img
                  src="/logo-icon.png"
                  alt=""
                  aria-hidden="true"
                  fetchPriority="high"
                  className="w-28 xs:w-36 sm:w-48 md:w-56 lg:w-72 xl:w-80 h-auto object-contain"
                  animate={{ y: [0, -9, 0] }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              </motion.div>

            </div>
          </div>
        </section>

        {/* POPULAR SERVICES */}
        <section
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16"
          aria-labelledby="popular"
        >
          <motion.div
            {...sectionMotion}
            className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-6"
          >
            <div>
              <p className="text-xs sm:text-sm font-semibold text-ink-muted mb-1">
                WHAT WE OFFER
              </p>
              <h2
                id="popular"
                className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
              >
                Popular services
              </h2>
            </div>

            <Link
              to="/services"
              className="inline-flex items-center gap-2 self-start sm:self-auto text-sm sm:text-base font-semibold text-brand underline underline-offset-4 hover:text-brand-dark focus:outline-none focus-visible:ring-2 focus-visible:ring-brand rounded"
            >
              See all services <span aria-hidden="true">→</span>
            </Link>
          </motion.div>

          {/* CATEGORIES — carousel with arrows */}
          {cats.data?.items?.length > 0 && (
            <motion.div {...sectionMotion} className="mb-5 sm:mb-6">
              <div className="flex items-center gap-2">
                {/* Left arrow */}
                <button
                  type="button"
                  aria-label="Scroll categories left"
                  className={arrowBtn}
                  onClick={() => scrollChips('left')}
                  disabled={!canScrollLeft}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15 19l-7-7 7-7"
                    />
                  </svg>
                </button>

                {/* Scrollable chips row */}
                <div className="relative flex-1 min-w-0">
                  <ul
                    ref={chipsRef}
                    className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x"
                  >
                    {cats.data.items.map((c) => (
                      <li key={c._id} className="shrink-0 snap-start">
                       <Link
  to={`/category/${encodeURIComponent(c.slug)}`}
  className="inline-flex items-center justify-center min-h-[44px] px-4 py-2 rounded-full border border-line-strong bg-white font-semibold text-sm sm:text-base hover:border-brand hover:bg-brand-tint transition-colors whitespace-nowrap focus:outline-none focus-visible:ring-2 focus-visible:ring-brand"
>
  {c.name}
</Link>
                      </li>
                    ))}
                  </ul>

                  {/* Right fade */}
                  {canScrollRight && (
                    <div
                      className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-ground to-transparent"
                      aria-hidden="true"
                    />
                  )}

                  {/* Left fade */}
                  {canScrollLeft && (
                    <div
                      className="pointer-events-none absolute left-0 top-0 bottom-1 w-10 bg-gradient-to-r from-ground to-transparent"
                      aria-hidden="true"
                    />
                  )}
                </div>

                {/* Right arrow */}
                <button
                  type="button"
                  aria-label="Scroll categories right"
                  className={arrowBtn}
                  onClick={() => scrollChips('right')}
                  disabled={!canScrollRight}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2.2}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </button>
              </div>
            </motion.div>
          )}

          {/* LOADING STATE */}
          {list.loading && (
            <div
              role="status"
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              <span className="sr-only">Loading services...</span>
              {[1, 2, 3].map((item) => (
                <div
                  key={item}
                  className="h-40 rounded-xl bg-gray-100 animate-pulse"
                />
              ))}
            </div>
          )}

          {/* ERROR STATE */}
          {list.error && (
            <div
              role="alert"
              className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-800 text-sm sm:text-base"
            >
              We could not load services right now. Please try again shortly.
            </div>
          )}

          {/* EMPTY STATE */}
          {!list.loading &&
            !list.error &&
            list.data &&
            list.data.items.length === 0 && (
              <p className="text-ink-muted py-6 text-sm sm:text-base">
                Services will appear here soon.
              </p>
            )}

          {/* SERVICE CARDS */}
          {!list.loading &&
            !list.error &&
            list.data?.items?.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
                {list.data.items.map((s, index) => (
                  <motion.div
                    key={s._id}
                    initial={{ opacity: 0, y: 28 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, amount: 0.15 }}
                    transition={{
                      duration: 0.5,
                      delay: index * 0.08,
                    }}
                    whileHover={{ y: -6 }}
                    className="h-full min-w-0"
                  >
                    <Card className="flex flex-col h-full min-w-0 transition-shadow duration-300 hover:shadow-lg">
                      {s.image ? (
                        <img
                          src={s.image}
                          alt={s.name}
                          loading="lazy"
                          className="w-full h-36 sm:h-40 object-cover rounded-xl mb-4"
                        />
                      ) : (
                        <div
                          className="w-full h-24 sm:h-28 rounded-xl bg-brand-tint mb-4 flex items-center justify-center"
                          aria-hidden="true"
                        >
                          <svg
                            className="w-10 h-10 text-brand-dark/40"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={1.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M9 12h6m-6 4h6m2 5H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5.586a1 1 0 0 1 .707.293l4.414 4.414a1 1 0 0 1 .293.707V19a2 2 0 0 1-2 2Z"
                            />
                          </svg>
                        </div>
                      )}

                      <div className="flex flex-col flex-1">
                        <p className="text-xs sm:text-sm text-ink-muted mb-1">
                          {s.category?.name || 'Home service'}
                        </p>

                        <h3 className="text-base sm:text-xl font-extrabold break-words">
                          {s.name}
                        </h3>

                        <p className="text-ink-muted mt-2 mb-5 text-sm sm:text-base">
                          <span className="text-xs sm:text-sm">
                            {s.pricingType === 'fixed' ? 'Fixed price' : 'From'}
                          </span>{' '}
                          <span className="font-bold text-brand-dark">
                            {inr(s.basePrice)}
                          </span>
                        </p>

                        <Link
                          to={`/services/${s._id}`}
                          className="mt-auto inline-flex items-center justify-center w-full min-h-[44px] px-4 py-3 rounded-full border border-brand bg-white text-brand-dark font-semibold text-sm sm:text-base hover:bg-brand hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                        >
                          View details
                          <span className="ml-2" aria-hidden="true">→</span>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
        </section>

        {/* HOW IT WORKS */}
        <section className="bg-brand-dark text-white">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16">
            <motion.div
              {...sectionMotion}
              className="max-w-2xl mb-8 sm:mb-10"
            >
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-white/70 mb-2">
                SIMPLE AND CONVENIENT
              </p>

              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
                How it works
              </h2>

              <p className="mt-3 text-white/80 text-sm sm:text-base">
                Getting help for your home is easy. Book, track and pay in just
                a few simple steps.
              </p>
            </motion.div>

            <ol className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
              {STEPS.map(([n, title, text], index) => (
                <motion.li
                  key={n}
                  initial={{ opacity: 0, y: 25 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.2 }}
                  transition={{ duration: 0.5, delay: index * 0.15 }}
                  whileHover={{ y: -5 }}
                  className="flex gap-3 sm:gap-4 p-4 sm:p-5 rounded-xl border border-white/15 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  <span
                    className="shrink-0 h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-accent text-brand-dark font-extrabold text-base sm:text-lg flex items-center justify-center"
                    aria-hidden="true"
                  >
                    {n}
                  </span>

                  <div className="min-w-0">
                    <h3 className="font-extrabold text-base sm:text-xl mb-2">
                      {title}
                    </h3>

                    <p className="text-sm sm:text-base text-white/85 leading-relaxed">
                      {text}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* FEATURES */}
        <section
          className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-12 lg:py-16"
          aria-labelledby="why"
        >
          <motion.div
            {...sectionMotion}
            className="text-center max-w-2xl mx-auto mb-8 sm:mb-10"
          >
            <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-ink-muted mb-2">
              THE BETTER WAY TO BOOK
            </p>

            <h2
              id="why"
              className="text-2xl sm:text-3xl lg:text-4xl font-extrabold"
            >
              Why book with us
            </h2>

            <p className="mt-3 text-sm sm:text-base text-ink-muted">
              Everything you need to manage your home service in one place.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
            {FEATURES.map(([title, text], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 25 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.45, delay: index * 0.1 }}
                whileHover={{ y: -5 }}
                className="h-full"
              >
                <Card className="h-full transition-shadow duration-300 hover:shadow-lg">
                  <div
                    className="h-11 w-11 rounded-xl bg-brand-tint text-brand-dark flex items-center justify-center font-extrabold text-lg mb-4"
                    aria-hidden="true"
                  >
                    {index + 1}
                  </div>

                  <h3 className="font-extrabold text-base sm:text-lg mb-2">
                    {title}
                  </h3>

                  <p className="text-sm sm:text-base text-ink-muted leading-relaxed">
                    {text}
                  </p>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* CALL TO ACTION */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.6 }}
            className="mt-10 sm:mt-12 rounded-2xl bg-brand-tint px-4 sm:px-8 py-8 sm:py-10 text-center"
          >
            <h3 className="text-lg sm:text-2xl font-extrabold">
              Ready to get started?
            </h3>

            <p className="text-sm sm:text-base text-ink-muted mt-2 mb-5 max-w-lg mx-auto">
              Create your free account and book the service you need.
            </p>

            <div className="flex justify-center">
              <LinkButton to="/register">
                Create your free account
              </LinkButton>
            </div>
          </motion.div>
        </section>
      </main>
    </MotionConfig>
  );
}