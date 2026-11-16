import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import useSeo from '../../hooks/useSeo.js';
import { ErrorState, Spinner, EmptyState } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';

export default function Pricing() {
  const { data, loading, error, reload } = useFetch('/services');
  const [q, setQ] = useState('');

  useSeo({
    title: 'Pricing | SmartServe',
    description: 'See the price of every home service, from AC repair to plumbing, electrical work and cleaning.',
    path: '/pricing',
  });

  // Works whether the API returns { items }, { services } or a plain array
  const all = useMemo(() => {
    const d = data?.data ?? data;
    const list = Array.isArray(d?.items) ? d.items : Array.isArray(d?.services) ? d.services : Array.isArray(d) ? d : [];
    return list.filter((s) => s && s.isAvailable !== false);
  }, [data]);

  const groups = useMemo(() => {
    const t = q.trim().toLowerCase();
    const map = new Map();
    all
      .filter((s) => !t || `${s.name} ${s.category?.name || ''}`.toLowerCase().includes(t))
      .forEach((s) => {
        const key = s.category?.name || 'Other services';
        if (!map.has(key)) map.set(key, []);
        map.get(key).push(s);
      });
    return [...map.entries()];
  }, [all, q]);

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-4xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">Pricing</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Clear prices before you book</h1>
          <p className="mx-auto mt-3 max-w-xl text-ink-muted">
            Fixed prices are what you pay. For estimate services, the final amount is confirmed after the technician
            inspects the job.
          </p>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-4 py-10 sm:px-6">
        <div className="mb-6">
          <label htmlFor="price-q" className="sr-only">Search services</label>
          <input
            id="price-q"
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search a service, e.g. AC"
            className="min-h-[46px] w-full rounded-full border border-line-strong px-5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
          />
        </div>

        {loading && <div className="flex justify-center p-10"><Spinner /></div>}
        {error && <ErrorState message={error} onRetry={reload} />}
        {!loading && !error && groups.length === 0 && (
          <EmptyState title="No services found">Try a different search.</EmptyState>
        )}

        <div className="flex flex-col gap-8">
          {groups.map(([cat, list]) => (
            <div key={cat}>
              <h2 className="mb-3 flex items-center gap-2 text-lg font-bold text-[#d97706]">
                <span className="h-2 w-2 rounded-full bg-[#d97706]" /> {cat}
              </h2>
              <div className="overflow-hidden rounded-xl border border-line">
                {list.map((s) => (
                  <div key={s._id} className="flex flex-col gap-3 border-b border-line p-4 last:border-0 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <Link to={`/services/${s._id}`} className="font-bold hover:text-brand-dark hover:underline">
                        {s.name}
                      </Link>
                      {s.durationMins ? <p className="text-xs text-ink-muted">About {s.durationMins} min</p> : null}
                    </div>
                    <div className="flex items-center justify-between gap-4 sm:justify-end">
                      <div className="text-right">
                        <p className="text-lg font-extrabold text-brand-dark">
                          {s.pricingType === 'fixed' ? '' : 'From '}{inr(s.basePrice)}
                        </p>
                        <p className="text-[11px] text-ink-muted">{s.pricingType === 'fixed' ? 'Fixed price' : 'Estimate'}</p>
                      </div>
                      <Link
                        to={`/customer/book/${s._id}`}
                        className="rounded-full bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
                      >
                        Book
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <p className="mt-8 text-xs leading-relaxed text-ink-muted">
          Prices can change, and spare parts or extra work are charged only after the technician explains them to you.
          See our <Link to="/refund-policy" className="underline">Refund &amp; Cancellation Policy</Link> for fees.
        </p>
      </section>
    </main>
  );
}