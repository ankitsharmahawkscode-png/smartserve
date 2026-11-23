import { useMemo, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import useSeo from '../../hooks/useSeo.js';
import Stars from '../../components/Stars.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyPostDate } from '../../utils/format.js';
import { company } from '../../content.js';

const absUrl = (u) => {
  if (!u) return undefined;
  try {
    return new URL(u, window.location.origin).href;
  } catch {
    return undefined;
  }
};

const durationLabel = (m) => {
  const n = Number(m);
  if (!n) return '';
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60);
  const r = n % 60;
  return `${h} hr${r ? ` ${r} min` : ''}`;
};

const STEPS = [
  ['Choose a slot', 'Pick a date and a time that suits you.'],
  ['Technician assigned', 'We confirm your booking and assign an approved technician.'],
  ['Job done', 'Pay for the job and share your feedback.'],
];

function Price({ service, big = false }) {
  const fixed = service.pricingType === 'fixed';
  return (
    <div>
      <p className={`${big ? 'text-4xl' : 'text-3xl'} font-extrabold text-brand-dark`}>
        {!fixed && <span className="mr-1.5 text-base font-semibold text-ink-muted">From</span>}
        {inr(service.basePrice)}
      </p>
      <p className="mt-1 text-xs text-ink-muted">
        {fixed ? 'Fixed price' : 'Estimate. The final amount is confirmed after the job.'}
      </p>
    </div>
  );
}

function BookButton({ service, className = '' }) {
  if (!service.isAvailable) {
    return (
      <span
        className={`flex min-h-[48px] cursor-not-allowed items-center justify-center rounded-xl bg-gray-200 px-6 text-sm font-bold text-gray-500 ${className}`}
      >
        Currently unavailable
      </span>
    );
  }
  return (
    <Link
      to={`/customer/book/${service._id}`}
      className={`flex min-h-[48px] items-center justify-center rounded-xl bg-brand px-6 text-sm font-bold text-white shadow-sm transition-colors hover:bg-brand-dark ${className}`}
    >
      Book now
    </Link>
  );
}

export default function ServiceDetail() {
  const { id } = useParams();
  const svc = useFetch(`/services/${id}`);
  const cfg = useFetch('/settings/public');
  const rev = useFetch(`/services/${id}/reviews`);
  const rel = useFetch(`/services/${id}/related`);
  const [showAll, setShowAll] = useState(false);
  const [copied, setCopied] = useState(false);

  const service = svc.data?.service;
  const settings = cfg.data?.settings;

  // Reviews: works whether the API returns { items }, { reviews } or a plain list
  const reviewInfo = useMemo(() => {
    const d = rev.data?.data ?? rev.data ?? {};
    const list = Array.isArray(d.items) ? d.items : Array.isArray(d.reviews) ? d.reviews : Array.isArray(d) ? d : [];
    const rated = list.filter((r) => Number(r.rating) > 0);
    const sum = rated.reduce((s, r) => s + Number(r.rating), 0);
    const avg = Number(d.average ?? d.avg ?? d.averageRating) || (rated.length ? sum / rated.length : 0);
    const total = Math.max(Number(d.total ?? d.count) || 0, list.length);
    const dist = [5, 4, 3, 2, 1].map((n) => ({
      n,
      c: rated.filter((r) => Math.round(Number(r.rating)) === n).length,
    }));
    return { list, rated: rated.length, avg, total, dist };
  }, [rev.data]);

  const descText = (service?.description || '').replace(/\s+/g, ' ').trim();
  const cover = absUrl(service?.image);

  useSeo({
    title: service ? `${service.name} | SmartServe` : 'Service',
    description: descText
      ? descText.slice(0, 155)
      : service
        ? `Book ${service.name} online. Choose a time slot that suits you.`
        : '',
    path: `/services/${id}`,
    image: cover,
    jsonLd: service
      ? {
          '@context': 'https://schema.org',
          '@type': 'Service',
          name: service.name,
          description: descText || undefined,
          image: cover ? [cover] : undefined,
          serviceType: service.category?.name || undefined,
          provider: { '@type': 'Organization', name: company?.name },
          offers: {
            '@type': 'Offer',
            price: String(service.basePrice ?? 0),
            priceCurrency: 'INR',
            availability: service.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
          },
          aggregateRating: reviewInfo.rated
            ? {
                '@type': 'AggregateRating',
                ratingValue: reviewInfo.avg.toFixed(1),
                reviewCount: reviewInfo.total,
              }
            : undefined,
        }
      : undefined,
  });

  if (svc.loading && !svc.data) {
    return <div className="flex justify-center p-16"><Spinner /></div>;
  }
  if (svc.error || !service) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-12">
        <ErrorState message={svc.error || 'Service not found'} onRetry={svc.reload} />
        <p className="mt-6 text-center">
          <Link to="/services" className="font-semibold text-brand underline underline-offset-4">
            ← Back to all services
          </Link>
        </p>
      </div>
    );
  }

  // ----- facts that come from your own settings -----
  const free = settings?.cancellation?.freeHoursBefore;
  const fee = settings?.cancellation?.feePercent;
  const cancelText =
    free != null ? `Free cancellation until ${free} hours before your slot` : 'Easy cancellation from your dashboard';
  const cod = !!settings?.codEnabled;
  const online = !!settings?.onlineEnabled;
  const payText = !settings
    ? 'Choose how to pay when you book'
    : cod && online
      ? 'Pay online or in cash'
      : cod
        ? 'Pay in cash after the service'
        : online
          ? 'Pay online'
          : 'Choose how to pay when you book';

  const trust = [
    ['✅', 'Approved technicians', 'Every technician is reviewed by our team.'],
    ['📅', 'Pick your own slot', 'Choose the date and time that works for you.'],
    ['🛡️', 'Clear cancellation', cancelText],
    ['💳', 'Flexible payment', payText],
  ];

  const faqs = [
    {
      q: 'How is the price decided?',
      a:
        service.pricingType === 'fixed'
          ? `${service.name} has a fixed price of ${inr(service.basePrice)}. Spare parts or extra work are charged only after the technician explains them to you.`
          : `${inr(service.basePrice)} is the starting estimate. The technician inspects the job and confirms the final amount with you. Spare parts and extra work are charged only after they are explained.`,
    },
    {
      q: 'Can I cancel my booking?',
      a:
        free != null
          ? `Yes, from My bookings in your dashboard until work has started. Cancelling at least ${free} hours before your slot is free${fee != null ? `, and a ${fee}% fee applies after that` : ''}.`
          : 'Yes, from My bookings in your dashboard until work has started.',
    },
    { q: 'How can I pay?', a: `${payText}. You choose when you book.` },
    {
      q: 'What happens after I book?',
      a: 'We confirm your booking and assign an approved technician. You can follow the status from your booking page.',
    },
  ];

  const related = (rel.data?.items || []).filter((x) => x._id !== service._id).slice(0, 4);
  const shownReviews = showAll ? reviewInfo.list : reviewInfo.list.slice(0, 4);
  const paragraphs = (service.description || '').split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const categoryLink = service.category?.slug ? `/category/${service.category.slug}` : '/services';
  const pageUrl = typeof window !== 'undefined' ? window.location.href : '';

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* ignore */
    }
  };

  return (
    <main className="bg-white pb-16">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav aria-label="Breadcrumb" className="py-4 text-sm text-ink-muted">
          <ol className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <li><Link to="/" className="hover:text-brand-dark hover:underline">Home</Link></li>
            <li aria-hidden="true">›</li>
            <li><Link to="/services" className="hover:text-brand-dark hover:underline">Services</Link></li>
            {service.category?.name && (
              <>
                <li aria-hidden="true">›</li>
                <li><Link to={categoryLink} className="hover:text-brand-dark hover:underline">{service.category.name}</Link></li>
              </>
            )}
            <li aria-hidden="true">›</li>
            <li aria-current="page" className="font-semibold text-[#111]">{service.name}</li>
          </ol>
        </nav>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_380px] lg:items-start lg:gap-10">
          {/* ================= LEFT ================= */}
          <div className="min-w-0">
            {/* Hero image */}
            <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-gradient-to-br from-brand-tint to-white ring-1 ring-line">
              <div className="absolute inset-0 flex items-center justify-center text-7xl opacity-60" aria-hidden="true">🛠️</div>
              {service.image && (
                <img
                  src={service.image}
                  alt={service.name}
                  className="absolute inset-0 h-full w-full object-cover"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
              )}
              <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                {service.category?.name && (
                  <span className="rounded-full bg-white/95 px-3 py-1 text-xs font-bold text-brand-dark shadow-sm">
                    {service.category.name}
                  </span>
                )}
                {!service.isAvailable && (
                  <span className="rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white shadow-sm">
                    Unavailable
                  </span>
                )}
              </div>
            </div>

            {/* Title block */}
            <header className="mt-6">
              <h1 className="text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">{service.name}</h1>

              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                {reviewInfo.rated > 0 && (
                  <a href="#reviews" className="inline-flex items-center gap-2 hover:underline">
                    <Stars value={reviewInfo.avg} />
                    <span className="font-bold">{reviewInfo.avg.toFixed(1)}</span>
                    <span className="text-ink-muted">({reviewInfo.total} {reviewInfo.total === 1 ? 'review' : 'reviews'})</span>
                  </a>
                )}
                {service.durationMins ? (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                    ⏱ About {durationLabel(service.durationMins)}
                  </span>
                ) : null}
                <span className="inline-flex items-center rounded-full bg-gray-100 px-3 py-1 font-semibold text-gray-700">
                  {service.pricingType === 'fixed' ? 'Fixed price' : 'Estimate'}
                </span>
              </div>

              {/* Mobile price and button (desktop uses the side card) */}
              <div className="mt-5 flex items-center justify-between gap-4 rounded-2xl border border-line bg-gray-50 p-4 lg:hidden">
                <Price service={service} />
                <BookButton service={service} className="shrink-0" />
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(`${service.name}: ${pageUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
                >
                  Share on WhatsApp
                </a>
                <button
                  type="button"
                  onClick={copyLink}
                  className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
                >
                  {copied ? 'Link copied ✓' : 'Copy link'}
                </button>
              </div>
            </header>

            {/* Trust points */}
            <section aria-label="What you get" className="mt-8 grid gap-3 sm:grid-cols-2">
              {trust.map(([icon, title, text]) => (
                <div key={title} className="flex gap-3 rounded-xl border border-line p-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-tint text-lg" aria-hidden="true">
                    {icon}
                  </span>
                  <div className="min-w-0">
                    <p className="font-bold">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-ink-muted">{text}</p>
                  </div>
                </div>
              ))}
            </section>

            {/* About */}
            {paragraphs.length > 0 && (
              <section className="mt-10" aria-labelledby="about-service">
                <h2 id="about-service" className="mb-3 text-xl font-extrabold sm:text-2xl">About this service</h2>
                <div className="space-y-4 leading-relaxed text-gray-700">
                  {paragraphs.map((p, i) => (
                    <p key={i} className="whitespace-pre-line break-words">{p}</p>
                  ))}
                </div>
              </section>
            )}

            {/* How it works */}
            <section className="mt-10" aria-labelledby="how-it-works">
              <h2 id="how-it-works" className="mb-4 text-xl font-extrabold sm:text-2xl">How it works</h2>
              <ol className="grid gap-3 sm:grid-cols-3">
                {STEPS.map(([title, text], i) => (
                  <li key={title} className="rounded-xl bg-gray-50 p-4">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-dark text-sm font-bold text-white">
                      {i + 1}
                    </span>
                    <p className="mt-3 font-bold">{title}</p>
                    <p className="mt-1 text-sm leading-relaxed text-ink-muted">{text}</p>
                  </li>
                ))}
              </ol>
            </section>

            {/* Reviews */}
            <section id="reviews" className="mt-10 scroll-mt-24" aria-labelledby="reviews-title">
              <h2 id="reviews-title" className="mb-4 text-xl font-extrabold sm:text-2xl">Customer reviews</h2>

              {reviewInfo.list.length === 0 ? (
                <div className="rounded-xl border border-dashed border-line-strong p-8 text-center">
                  <p className="text-3xl" aria-hidden="true">⭐</p>
                  <p className="mt-2 font-bold">No reviews yet</p>
                  <p className="mt-1 text-sm text-ink-muted">Reviews appear here after customers complete a booking.</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-6 rounded-2xl border border-line p-5 sm:grid-cols-[180px_1fr] sm:p-6">
                    <div className="text-center sm:border-r sm:border-line sm:pr-6">
                      <p className="text-5xl font-extrabold text-brand-dark">{reviewInfo.avg.toFixed(1)}</p>
                      <div className="mt-2 flex justify-center"><Stars value={reviewInfo.avg} /></div>
                      <p className="mt-2 text-sm text-ink-muted">
                        {reviewInfo.total} {reviewInfo.total === 1 ? 'review' : 'reviews'}
                      </p>
                    </div>
                    <ul className="flex flex-col justify-center gap-2" aria-label="Rating breakdown">
                      {reviewInfo.dist.map((row) => {
                        const pct = reviewInfo.rated ? Math.round((row.c / reviewInfo.rated) * 100) : 0;
                        return (
                          <li key={row.n} className="flex items-center gap-3 text-sm">
                            <span className="w-8 shrink-0 font-semibold">{row.n} ★</span>
                            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
                              <span className="block h-full rounded-full bg-[#d97706]" style={{ width: `${pct}%` }} />
                            </span>
                            <span className="w-8 shrink-0 text-right text-ink-muted">{row.c}</span>
                          </li>
                        );
                      })}
                    </ul>
                  </div>

                  <ul className="mt-5 flex flex-col gap-3">
                    {shownReviews.map((r, i) => {
                      const full = r.customer?.name || r.customerName || r.user?.name || 'Customer';
                      const parts = String(full).trim().split(/\s+/);
                      const short = parts.length > 1 ? `${parts[0]} ${parts[parts.length - 1][0]}.` : parts[0];
                      return (
                        <li key={r._id || i} className="rounded-xl border border-line p-4">
                          <div className="flex items-start gap-3">
                            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] text-sm font-bold text-white" aria-hidden="true">
                              {parts[0][0]?.toUpperCase()}
                            </span>
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
                                <p className="font-bold">{short}</p>
                                <p className="text-xs text-ink-muted">{prettyPostDate(r.createdAt)}</p>
                              </div>
                              <div className="mt-1 flex flex-wrap items-center gap-2">
                                <Stars value={r.rating} />
                                <span className="rounded-full bg-green-50 px-2 py-0.5 text-[11px] font-semibold text-green-700">
                                  Verified booking
                                </span>
                              </div>
                              {r.comment && <p className="mt-2 break-words text-sm leading-relaxed text-gray-700">{r.comment}</p>}
                            </div>
                          </div>
                        </li>
                      );
                    })}
                  </ul>

                  {reviewInfo.list.length > 4 && (
                    <button
                      type="button"
                      onClick={() => setShowAll((s) => !s)}
                      className="mt-4 rounded-full border border-line-strong px-5 py-2 text-sm font-bold hover:bg-gray-50"
                    >
                      {showAll ? 'Show fewer reviews' : `Show all ${reviewInfo.list.length} reviews`}
                    </button>
                  )}
                </>
              )}
            </section>

            {/* FAQ */}
            <section className="mt-10" aria-labelledby="service-faq">
              <h2 id="service-faq" className="mb-4 text-xl font-extrabold sm:text-2xl">Frequently asked questions</h2>
              <div className="divide-y divide-line rounded-2xl border border-line">
                {faqs.map((f) => (
                  <details key={f.q} className="group px-5 py-4">
                    <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                      {f.q}
                      <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                    </summary>
                    <p className="mt-3 pr-6 leading-relaxed text-ink-muted">{f.a}</p>
                  </details>
                ))}
              </div>
              <p className="mt-3 text-sm">
                <Link to="/faq" className="font-semibold text-brand underline underline-offset-4">
                  More questions about booking and payments →
                </Link>
              </p>
            </section>
          </div>

          {/* ================= RIGHT: booking card (desktop) ================= */}
          <aside className="hidden lg:sticky lg:top-24 lg:block" aria-label="Book this service">
            <div className="overflow-hidden rounded-2xl border border-line bg-white shadow-lg">
              <div className="bg-brand-dark px-6 py-3 text-xs font-bold uppercase tracking-widest text-white/80">
                Book this service
              </div>
              <div className="p-6">
                <Price service={service} big />

                <BookButton service={service} className="mt-5 w-full" />
                <Link
                  to="/contact"
                  className="mt-3 flex min-h-[44px] items-center justify-center rounded-xl border border-line-strong text-sm font-bold hover:bg-gray-50"
                >
                  Ask a question
                </Link>

                <ul className="mt-5 space-y-3 border-t border-line pt-5 text-sm">
                  {service.durationMins ? (
                    <li className="flex gap-3"><span aria-hidden="true">⏱</span><span>About {durationLabel(service.durationMins)}</span></li>
                  ) : null}
                  <li className="flex gap-3"><span aria-hidden="true">🛡️</span><span>{cancelText}</span></li>
                  <li className="flex gap-3"><span aria-hidden="true">💳</span><span>{payText}</span></li>
                  <li className="flex gap-3"><span aria-hidden="true">✅</span><span>Approved technicians</span></li>
                </ul>
              </div>
            </div>
          </aside>
        </div>

        {/* Related */}
        {related.length > 0 && (
          <section className="mt-14" aria-labelledby="related-title">
            <h2 id="related-title" className="mb-4 text-xl font-extrabold sm:text-2xl">You may also need</h2>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {related.map((x) => (
                <Link
                  key={x._id}
                  to={`/services/${x._id}`}
                  className="group overflow-hidden rounded-xl border border-line bg-white transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
                >
                  <div className="relative aspect-[16/10] bg-gradient-to-br from-brand-tint to-white">
                    <div className="absolute inset-0 flex items-center justify-center text-4xl opacity-60" aria-hidden="true">🛠️</div>
                    {x.image && (
                      <img
                        src={x.image}
                        alt=""
                        loading="lazy"
                        className="absolute inset-0 h-full w-full object-cover"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                    )}
                  </div>
                  <div className="p-4">
                    <p className="font-bold group-hover:text-brand-dark">{x.name}</p>
                    <p className="mt-1 text-sm text-ink-muted">
                      {x.pricingType === 'fixed' ? '' : 'From '}
                      <span className="font-bold text-brand-dark">{inr(x.basePrice)}</span>
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Closing call to action */}
        <section className="mt-14">
          <div className="rounded-2xl bg-brand-dark px-6 py-10 text-center text-white sm:px-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">Ready to book {service.name}?</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">
              Pick a time slot that suits you. We will confirm your booking and send an approved technician.
            </p>
            <div className="mx-auto mt-6 flex max-w-sm flex-col gap-3 sm:max-w-none sm:flex-row sm:justify-center">
              {service.isAvailable ? (
                <Link
                  to={`/customer/book/${service._id}`}
                  className="flex min-h-[48px] items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-brand-dark transition hover:bg-gray-200"
                >
                  Book now
                </Link>
              ) : (
                <Link
                  to="/services"
                  className="flex min-h-[48px] items-center justify-center rounded-xl bg-white px-8 text-sm font-bold text-brand-dark transition hover:bg-gray-200"
                >
                  See other services
                </Link>
              )}
              <Link
                to="/contact"
                className="flex min-h-[48px] items-center justify-center rounded-xl border border-white/40 px-8 text-sm font-bold text-white transition hover:bg-white/10"
              >
                Contact us
              </Link>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}