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
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            name: `${category.name} services`,
            itemListElement: services.slice(0, 20).map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${window.location.origin}/services/${s._id}`,
              name: s.name,
            })),
          }
        : undefined,
  });

  if (loading) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="h-8 w-48 bg-gray-100 rounded animate-pulse mb-2" />
        <div className="h-4 w-72 bg-gray-100 rounded animate-pulse mb-6" />
        <SkeletonCards n={6} />
      </main>
    );
  }

  if (error) {
    return (
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
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
            <nav
              aria-label="Breadcrumb"
              className="text-xs sm:text-sm text-ink-muted mb-3"
            >
              <Link to="/" className="hover:text-brand-dark">
                Home
              </Link>
              <span className="mx-2">/</span>
              <Link to="/services" className="hover:text-brand-dark">
                Services
              </Link>
              <span className="mx-2">/</span>
              <span className="text-ink">{category.name}</span>
            </nav>

            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold">
              {category.name}
            </h1>

            {category.description && (
              <p className="mt-2 text-sm sm:text-base text-ink-muted max-w-2xl">
                {category.description}
              </p>
            )}

            <p className="mt-3 text-sm text-ink-muted">
              {services.length}{' '}
              {services.length === 1 ? 'service' : 'services'} available
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

                      <h2 className="text-base sm:text-xl font-extrabold break-words">
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

          {/* Back to all services */}
          <div className="mt-10 text-center">
            <Link
              to="/services"
              className="inline-flex items-center gap-2 font-semibold text-brand underline underline-offset-4 hover:text-brand-dark"
            >
              <span aria-hidden="true">←</span> See all services
            </Link>
          </div>
        </section>
      </main>
    </MotionConfig>
  );
}