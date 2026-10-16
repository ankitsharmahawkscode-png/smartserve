import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useDebounced from '../../hooks/useDebounced.js';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';
import { Button, Card } from '../../components/ui.jsx';
import { EmptyState, ErrorState, SkeletonCards } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';

const PAGE_SIZE = 9;

export default function Services() {
  const [params, setParams] = useSearchParams();
  const category = params.get('category') || '';
  const [q, setQ] = useState('');
  const term = useDebounced(q.trim());
  const cats = useFetch('/categories');

  const key = `${category}|${term}`;
  const [pageState, setPageState] = useState({ key, page: 1 });
  const page = pageState.key === key ? pageState.page : 1;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading');
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  // Refs for the chips carousel
  const chipsRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  // ---- Data fetching ----
  useEffect(() => {
    const id = ++latest.current;
    setError('');
    if (page === 1) setStatus('loading');
    else setLoadingMore(true);

    api
      .get('/services', {
        params: {
          category: category || undefined,
          q: term || undefined,
          page,
          limit: PAGE_SIZE,
        },
      })
      .then((res) => {
        if (id !== latest.current) return;
        const d = res.data.data;
        setItems((prev) => {
          if (page === 1) return d.items;
          const seen = new Set(prev.map((s) => s._id));
          return [...prev, ...d.items.filter((s) => !seen.has(s._id))];
        });
        setTotal(d.total);
        setStatus('idle');
      })
      .catch((e) => {
        if (id !== latest.current) return;
        setError(apiMessage(e));
        setStatus(page === 1 ? 'error' : 'idle');
      })
      .finally(() => {
        if (id === latest.current) setLoadingMore(false);
      });
  }, [category, term, page, attempt]);

  // ---- Chips carousel: track scroll state ----
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

  const catName = cats.data?.items.find((c) => c.slug === category)?.name;

  useSeo({
    title: catName
      ? /services$/i.test(catName)
        ? catName
        : `${catName} services`
      : 'Home services: AC repair, plumbing, electrical and more',
    description: catName
      ? `Book ${catName} online with ${company.name}. Choose a time slot, track your technician and pay in cash or online.`
      : 'Browse and book AC repair, plumbing, electrical, home cleaning and appliance repair services online.',
    path: `/services${category ? `?category=${encodeURIComponent(category)}` : ''}`,
    jsonLd:
      status === 'idle' && items.length
        ? {
            '@context': 'https://schema.org',
            '@type': 'ItemList',
            itemListElement: items.map((s, i) => ({
              '@type': 'ListItem',
              position: i + 1,
              url: `${window.location.origin}/services/${s._id}`,
              name: s.name,
            })),
          }
        : undefined,
  });

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug);
    else next.delete('category');
    setParams(next, { replace: true });
  };

  const clearFilters = () => {
    setQ('');
    setCategory('');
  };

  const loadMore = () =>
    error ? setAttempt((a) => a + 1) : setPageState({ key, page: page + 1 });

  const chip = (on) =>
    `shrink-0 min-h-[40px] sm:min-h-[44px] px-4 rounded-full border font-semibold text-sm sm:text-base whitespace-nowrap transition-colors ${
      on
        ? 'bg-brand text-white border-brand'
        : 'bg-white text-brand-dark border-line-strong hover:border-brand hover:bg-brand-tint'
    }`;

  const arrowBtn =
    'hidden md:flex items-center justify-center w-10 h-10 rounded-full border border-line-strong bg-white text-brand-dark hover:bg-brand hover:text-white hover:border-brand transition-colors disabled:opacity-30 disabled:cursor-not-allowed disabled:hover:bg-white disabled:hover:text-brand-dark disabled:hover:border-line-strong shrink-0';

  const filtered = Boolean(category || term);

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold mb-5 sm:mb-6">
        Services
      </h1>

      {/* Search */}
      <div className="w-full md:max-w-md mb-4 sm:mb-5">
        <label
          htmlFor="svc-search"
          className="block text-xs sm:text-sm font-semibold text-ink-muted mb-1"
        >
          Search
        </label>
        <input
          id="svc-search"
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search services"
          className="w-full min-h-[44px] px-4 rounded-full border border-line-strong bg-white text-sm sm:text-base focus:outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
        />
      </div>

      {/* Category chips — carousel with arrows (desktop) + swipe (mobile) */}
      <div className="mb-5 sm:mb-6">
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
            <div
              ref={chipsRef}
              className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x"
              role="group"
              aria-label="Filter by category"
            >
              <button
                type="button"
                className={chip(!category)}
                aria-pressed={!category}
                onClick={() => setCategory('')}
              >
                All
              </button>
              {cats.data?.items.map((c) => (
                <button
                  key={c._id}
                  type="button"
                  className={chip(category === c.slug)}
                  aria-pressed={category === c.slug}
                  onClick={() => setCategory(c.slug)}
                >
                  {c.name}
                </button>
              ))}
            </div>

            {/* Right fade (only while more content exists) */}
            {canScrollRight && (
              <div
                className="pointer-events-none absolute right-0 top-0 bottom-1 w-10 bg-gradient-to-l from-ground to-transparent"
                aria-hidden="true"
              />
            )}

            {/* Left fade (only while scrolled) */}
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
      </div>

      {/* Results count + Clear filters */}
      <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3 mb-4 min-h-[44px]">
        <p aria-live="polite" className="text-xs sm:text-sm text-ink-muted">
          {status === 'idle' && total > 0
            ? `Showing ${items.length} of ${total} services`
            : ''}
        </p>
        {filtered && (
          <button
            type="button"
            onClick={clearFilters}
            className="min-h-[44px] px-2 text-sm sm:text-base font-semibold text-brand underline"
          >
            Clear filters
          </button>
        )}
      </div>

      {/* Loading */}
      {status === 'loading' && <SkeletonCards n={6} />}

      {/* Error */}
      {status === 'error' && (
        <ErrorState message={error} onRetry={() => setAttempt((a) => a + 1)} />
      )}

      {/* Empty */}
      {status === 'idle' && items.length === 0 && (
        <EmptyState title="No services found">
          Try a different search or category.
        </EmptyState>
      )}

      {/* Grid */}
      {status === 'idle' && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <Card key={s._id} className="flex flex-col min-w-0">
                {s.image ? (
                  <img
                    src={s.image}
                    alt=""
                    loading="lazy"
                    className="h-32 sm:h-40 w-full object-cover rounded-[10px] mb-4"
                  />
                ) : (
                  <div
                    className="h-32 sm:h-40 rounded-[10px] bg-brand-tint mb-4 flex items-center justify-center"
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

                <p className="text-xs sm:text-sm text-ink-muted mb-1">
                  {s.category?.name}
                </p>
                <h2 className="text-base sm:text-lg font-extrabold break-words">
                  {s.name}
                </h2>
                <p className="text-sm sm:text-base text-ink-muted mb-4">
                  <span className="text-xs sm:text-sm">
                    {s.pricingType === 'fixed' ? 'Fixed price' : 'From'}
                  </span>{' '}
                  <span className="font-bold text-brand-dark">
                    {inr(s.basePrice)}
                  </span>
                  {!s.isAvailable && (
                    <span className="ml-2 font-semibold text-red-800 text-xs sm:text-sm">
                      Unavailable
                    </span>
                  )}
                </p>

                <Link
                  to={`/services/${s._id}`}
                  className="mt-auto inline-flex items-center justify-center min-h-[44px] px-5 rounded-full border border-brand bg-white text-brand-dark font-semibold text-sm sm:text-base hover:bg-brand hover:text-white transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2"
                >
                  View details
                  <span className="ml-2" aria-hidden="true">
                    →
                  </span>
                </Link>
              </Card>
            ))}
          </div>

          {items.length < total && (
            <div className="text-center mt-6 sm:mt-8">
              {error && (
                <p
                  role="alert"
                  className="text-red-800 mb-3 text-sm sm:text-base"
                >
                  {error}
                </p>
              )}
              <Button
                variant="secondary"
                onClick={loadMore}
                disabled={loadingMore}
                className="w-full sm:w-auto min-h-[44px]"
              >
                {loadingMore
                  ? 'Loading...'
                  : error
                  ? 'Try again'
                  : 'Load more services'}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}