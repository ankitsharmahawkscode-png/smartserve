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
  const category = params.get('category') || ''; // kept in the address so links and the back button work
  const [q, setQ] = useState('');
  const term = useDebounced(q.trim());
  const cats = useFetch('/categories');

  // The page number belongs to one filter combination; a new combination starts again at page 1.
  const key = `${category}|${term}`;
  const [pageState, setPageState] = useState({ key, page: 1 });
  const page = pageState.key === key ? pageState.page : 1;

  const [items, setItems] = useState([]);
  const [total, setTotal] = useState(0);
  const [status, setStatus] = useState('loading'); // loading (first page) | idle | error (first page failed)
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const latest = useRef(0);

  useEffect(() => {
    const id = ++latest.current; // ignore answers that arrive after a newer request started
    setError('');
    if (page === 1) setStatus('loading'); else setLoadingMore(true);
    api.get('/services', { params: { category: category || undefined, q: term || undefined, page, limit: PAGE_SIZE } })
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
      .finally(() => { if (id === latest.current) setLoadingMore(false); });
  }, [category, term, page, attempt]);

  const catName = cats.data?.items.find((c) => c.slug === category)?.name;
  useSeo({
    title: catName ? (/services?$/i.test(catName) ? catName : `${catName} services`) : 'Home services: AC repair, plumbing, electrical and more',
    description: catName
      ? `Book ${catName} online with ${company.name}. Choose a time slot, track your technician and pay in cash or online.`
      : 'Browse and book AC repair, plumbing, electrical, home cleaning and appliance repair services online.',
    path: `/services${category ? `?category=${encodeURIComponent(category)}` : ''}`,
    jsonLd: status === 'idle' && items.length
      ? { '@context': 'https://schema.org', '@type': 'ItemList', itemListElement: items.map((s, i) => ({ '@type': 'ListItem', position: i + 1, url: `${window.location.origin}/services/${s._id}`, name: s.name })) }
      : undefined,
  });

  const setCategory = (slug) => {
    const next = new URLSearchParams(params);
    if (slug) next.set('category', slug); else next.delete('category');
    setParams(next, { replace: true });
  };
  const clearFilters = () => { setQ(''); setCategory(''); };
  const loadMore = () => (error ? setAttempt((a) => a + 1) : setPageState({ key, page: page + 1 }));

  const chip = (on) => `shrink-0 min-h-[44px] px-4 rounded-[10px] border font-semibold ${on ? 'bg-brand text-white border-brand' : 'bg-white border-line-strong hover:border-brand'}`;
  const filtered = Boolean(category || term);

  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-6">Services</h1>

      <div className="flex flex-col gap-4 mb-6">
        <div className="w-full md:max-w-md">
          <label htmlFor="svc-search" className="block text-sm font-semibold text-ink-muted mb-1">Search</label>
          <input id="svc-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search services"
            className="w-full min-h-[44px] px-3 rounded-[10px] border border-line-strong bg-white" />
        </div>

        {/* Phones: one dropdown. Tablets and larger: wrapping buttons. */}
        <div className="md:hidden">
          <label htmlFor="svc-category" className="block text-sm font-semibold text-ink-muted mb-1">Category</label>
          <select id="svc-category" value={category} onChange={(e) => setCategory(e.target.value)}
            className="w-full min-h-[44px] px-3 rounded-[10px] border border-line-strong bg-white">
            <option value="">All categories</option>
            {cats.data?.items.map((c) => <option key={c._id} value={c.slug}>{c.name}</option>)}
          </select>
        </div>
        <div className="hidden md:flex flex-wrap gap-2" role="group" aria-label="Filter by category">
          <button type="button" className={chip(!category)} aria-pressed={!category} onClick={() => setCategory('')}>All</button>
          {cats.data?.items.map((c) => (
            <button key={c._id} type="button" className={chip(category === c.slug)} aria-pressed={category === c.slug} onClick={() => setCategory(c.slug)}>{c.name}</button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 mb-4 min-h-[44px]">
        <p aria-live="polite" className="text-sm text-ink-muted">
          {status === 'idle' && total > 0 ? `Showing ${items.length} of ${total} services` : ''}
        </p>
        {filtered && <button type="button" onClick={clearFilters} className="min-h-[44px] px-2 font-semibold text-brand underline">Clear filters</button>}
      </div>

      {status === 'loading' && <SkeletonCards n={6} />}
      {status === 'error' && <ErrorState message={error} onRetry={() => setAttempt((a) => a + 1)} />}
      {status === 'idle' && items.length === 0 && (
        <EmptyState title="No services found">Try a different search or category.</EmptyState>
      )}
      {status === 'idle' && items.length > 0 && (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((s) => (
              <Card key={s._id} className="flex flex-col">
                {s.image
                  ? <img src={s.image} alt="" loading="lazy" className="h-28 w-full object-cover rounded-[10px] mb-4" />
                  : <div className="h-28 rounded-[10px] bg-brand-tint mb-4" aria-hidden="true" />}
                <p className="text-sm text-ink-muted">{s.category?.name}</p>
                <h2 className="text-lg font-extrabold">{s.name}</h2>
                <p className="text-ink-muted mb-4">
                  {s.pricingType === 'fixed' ? 'Fixed price' : 'From'} {inr(s.basePrice)}
                  {!s.isAvailable && <span className="ml-2 font-semibold text-red-800">Unavailable</span>}
                </p>
                <Link to={`/services/${s._id}`} className="mt-auto inline-flex items-center justify-center min-h-[44px] px-5 rounded-[10px] border border-brand bg-white text-brand-dark font-semibold">View details</Link>
              </Card>
            ))}
          </div>
          {items.length < total && (
            <div className="text-center mt-8">
              {error && <p role="alert" className="text-red-800 mb-3">{error}</p>}
              <Button variant="secondary" onClick={loadMore} disabled={loadingMore}>
                {loadingMore ? 'Loading...' : error ? 'Try again' : 'Load more services'}
              </Button>
            </div>
          )}
        </>
      )}
    </main>
  );
}