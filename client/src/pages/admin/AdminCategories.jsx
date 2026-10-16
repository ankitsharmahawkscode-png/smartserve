import { Link, useParams, Navigate } from 'react-router-dom';
import { motion, MotionConfig } from 'motion/react';
import useFetch from '../../hooks/useFetch.js';
import { Card } from '../../components/ui.jsx';
import { EmptyState, ErrorState, SkeletonCards } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

export default function CategoryPage() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useFetch(`/categories/${slug}`);

  const category = data?.category;
  const services = data?.services || [];

  useSeo({
    title:
      category?.seo?.title ||
      (category ? `${category.name} services — ${company.name}` : 'Category'),
    description:
      category?.seo?.description ||
      (category
        ? `Book ${category.name} online with ${company.name}. Choose a time slot, track your technician and pay in cash or online.`
        : ''),
    path: `/category/${slug}`,
    jsonLd:
      category && services.length
        ? [
            {
              '@context': 'https://schema.org',
              '@type': 'ItemList',
              name: `${category.name} services`,
              itemListElement: services.slice(0, 20).map((s, i) => ({
                '@type': 'ListItem',
                position: i + 1,
                url: `${window.location.origin}/services/${s._id}`,
                name: s.name,
              })),
            },
            category.faqs?.length && {
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: category.faqs.map((faq) => ({
                '@type': 'Question',
                name: faq.question,
                acceptedAnswer: { '@type': 'Answer', text: faq.answer },
              })),
            },
          ].filter(Boolean)
        : undefined,
  });

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="h-6 w-48 bg-gray-100 rounded animate-pulse mb-3" />
        <div className="h-8 w-64 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-80 bg-gray-100 rounded animate-pulse mb-6" />
        <SkeletonCards n={6} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <ErrorState message={error} onRetry={reload} />
      </main>
    );
  }

  if (!category) {
    return <Navigate to="/services" replace />;
  }

  return (
    <MotionConfig reducedMotion="user">
      <main className="w-full overflow-hidden">

        {/* Hero / breadcrumb */}
        <section className="bg-brand-tint">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            {/* Breadcrumb */}
            <nav
              aria-label="Breadcrumb"
              className="text-xs sm:text-sm text-ink-muted mb-3 flex flex-wrap items-center gap-1"
            >
              <Link to="/" className="hover:text-brand-dark">
                Home
              </Link>
              <span className="mx-1 sm:mx-2">/</span>
              <Link to="/services" className="hover:text-brand-dark">
                Services
              </Link>
              <span className="mx-1 sm:mx-2">/</span>
              <span className="text-ink truncate max-w-[60%]">{category.name}</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {category.name}
            </h1>

            {category.description && (
              <p className="mt-2 text-sm sm:text-base text-ink-muted max-w-2xl leading-relaxed">
                {category.description}
              </p>
            )}

            <p className="mt-3 text-xs sm:text-sm text-ink-muted">
              {services.length} {services.length === 1 ? 'service' : 'services'} available
            </p>
          </div>
        </section>

        {/* Service cards */}
        <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
          {services.length === 0 ? (
            <EmptyState title="No services in this category yet">
              Check back soon or browse other categories.
            </EmptyState>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 lg:gap-6">
              {services.map((s, index) => (
                <motion.div
                  key={s._id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.15 }}
                  transition={{ duration: 0.5, delay: index * 0.06 }}
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
                        {category.name}
                      </p>

                      <h2 className="text-base sm:text-lg font-extrabold break-words">
                        {s.name}
                      </h2>

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

          {/* Understanding section — responsive */}
          {category.longDescription && (
            <section className="mt-10 sm:mt-14 lg:mt-16">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-12">
                
                {/* Content — left */}
                <div className="lg:col-span-2">
                  <p className="text-xs sm:text-sm font-extrabold uppercase tracking-widest text-accent-text mb-2 sm:mb-3">
                    Understanding {category.name}
                  </p>

                  <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-brand-dark mb-5 sm:mb-6">
                    What is {category.name}?
                  </h2>

                  <div className="text-sm sm:text-base text-ink-muted leading-relaxed sm:leading-loose space-y-4">
                    {category.longDescription
                      .split(/\n\n+/)
                      .filter(Boolean)
                      .map((para, i) => (
                        <p key={i}>{para.trim()}</p>
                      ))}
                  </div>
                </div>

                {/* Info cards — right */}
                <aside className="lg:col-span-1">
                  <div className="lg:sticky lg:top-24 flex flex-col gap-3">
                    <div className="border border-line rounded-xl p-4 sm:p-5 bg-white">
                      <p className="font-extrabold text-brand-dark text-base sm:text-lg mb-1">
                        {services.length}
                      </p>
                      <p className="text-xs sm:text-sm text-ink-muted uppercase tracking-wider">
                        {services.length === 1 ? 'Service available' : 'Services available'}
                      </p>
                    </div>

                    <div className="border border-line rounded-xl p-4 sm:p-5 bg-white">
                      <p className="font-extrabold text-brand-dark text-base sm:text-lg mb-1">
                        Same-day
                      </p>
                      <p className="text-xs sm:text-sm text-ink-muted uppercase tracking-wider">
                        Booking available
                      </p>
                    </div>

                    <div className="border border-line rounded-xl p-4 sm:p-5 bg-white">
                      <p className="font-extrabold text-brand-dark text-base sm:text-lg mb-1">
                        Verified
                      </p>
                      <p className="text-xs sm:text-sm text-ink-muted uppercase tracking-wider">
                        Technicians
                      </p>
                    </div>

                    <div className="border border-line rounded-xl p-4 sm:p-5 bg-brand-tint">
                      <p className="font-extrabold text-brand-dark text-sm sm:text-base mb-2">
                        Need help?
                      </p>
                      <Link
                        to="/contact"
                        className="inline-flex items-center gap-1 text-brand-dark underline underline-offset-2 text-xs sm:text-sm font-semibold hover:text-brand"
                      >
                        Contact us →
                      </Link>
                    </div>
                  </div>
                </aside>
              </div>
            </section>
          )}

          {/* FAQs */}
          {category.faqs?.length > 0 && (
            <section className="mt-10 sm:mt-14 lg:mt-16">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-extrabold mb-5 sm:mb-6">
                Frequently asked questions
              </h2>

              <div className="flex flex-col gap-3">
                {category.faqs.map((faq, i) => (
                  <details
                    key={i}
                    className="group border border-line rounded-xl bg-white overflow-hidden transition-shadow hover:shadow-sm"
                  >
                    <summary className="flex items-center justify-between gap-3 p-4 sm:p-5 cursor-pointer list-none font-extrabold text-sm sm:text-base">
                      <span className="min-w-0 pr-2">{faq.question}</span>
                      <svg
                        className="w-4 h-4 sm:w-5 sm:h-5 shrink-0 text-brand-dark transition-transform group-open:rotate-180"
                        xmlns="http://www.w3.org/2000/svg"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                        aria-hidden="true"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <div className="px-4 sm:px-5 pb-4 sm:pb-5 text-sm sm:text-base text-ink-muted leading-relaxed border-t border-line/50 pt-4">
                      {faq.answer}
                    </div>
                  </details>
                ))}
              </div>
            </section>
          )}

          {/* Back to all services */}
          <div className="mt-10 sm:mt-12 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 min-h-[44px] px-5 text-sm sm:text-base font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
            >
              <span aria-hidden="true">←</span> See all services
            </Link>
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}