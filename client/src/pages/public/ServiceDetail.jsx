import { Link, useParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import useSeo, { clip } from '../../hooks/useSeo.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import Stars from '../../components/Stars.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { company } from '../../content.js';
import { inr } from '../../utils/format.js';

export default function ServiceDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(`/services/${id}`);
  const reviews = useFetch(`/services/${id}/reviews`);
  const s = data?.service;
  const summary = reviews.data?.summary;

  // Search-engine data for this service. Ratings are only included when real, visible reviews exist.
  const origin = window.location.origin;
  const here = s ? `${origin}/services/${s._id}` : '';
  useSeo(s
    ? {
      title: `${s.name}${s.category?.name ? ` | ${s.category.name}` : ''}`,
      description: clip(s.description) || `Book ${s.name} online with ${company.name}. Choose a time slot and pay in cash or online.`,
      path: `/services/${s._id}`,
      image: s.image,
      jsonLd: [
        {
          '@type': 'Service',
          name: s.name,
          description: clip(s.description, 300) || s.name,
          ...(s.category?.name && { serviceType: s.category.name }),
          ...(s.image && { image: s.image }),
          provider: { '@type': 'Organization', name: company.name, url: origin },
          offers: {
            '@type': 'Offer',
            url: here,
            price: s.basePrice,
            priceCurrency: 'INR',
            availability: s.isAvailable ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
            ...(s.pricingType === 'estimate' && { description: 'Estimated starting price. The final amount is confirmed after the job.' }),
          },
          ...(summary?.count > 0 && { aggregateRating: { '@type': 'AggregateRating', ratingValue: summary.average, reviewCount: summary.count } }),
        },
        {
          '@type': 'BreadcrumbList',
          itemListElement: [
            { '@type': 'ListItem', position: 1, name: 'Home', item: `${origin}/` },
            { '@type': 'ListItem', position: 2, name: 'Services', item: `${origin}/services` },
            ...(s.category?.slug ? [{ '@type': 'ListItem', position: 3, name: s.category.name, item: `${origin}/services?category=${encodeURIComponent(s.category.slug)}` }] : []),
            { '@type': 'ListItem', position: s.category?.slug ? 4 : 3, name: s.name, item: here },
          ],
        },
      ],
    }
    : { title: error ? 'Service not found' : 'Service', noindex: Boolean(error) });

  if (loading) return <Spinner />;
  if (error) return <div className="max-w-3xl mx-auto p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const bookPath = `/customer/book/${s._id}`;

  let action;
  if (!s.isAvailable) action = <p className="font-semibold text-red-800">This service is currently unavailable.</p>;
  else if (!user) action = <LinkButton to="/login" state={{ from: bookPath }}>Log in to book</LinkButton>;
  else if (user.role === 'customer') action = <LinkButton to={bookPath}>Book this service</LinkButton>;
  else action = <p className="text-ink-muted">Log in with a customer account to book.</p>;

  return (
    <main className="max-w-4xl mx-auto px-6 py-8">
      <nav aria-label="Breadcrumb" className="text-sm text-ink-muted mb-2">
        <Link to="/services" className="underline">Services</Link>
        {s.category?.name && <> / <Link to={`/services?category=${encodeURIComponent(s.category.slug)}`} className="underline">{s.category.name}</Link></>}
      </nav>
      <h1 className="text-3xl sm:text-4xl font-extrabold mb-2">{s.name}</h1>
      {summary?.count > 0 && <p className="mb-4"><Stars value={summary.average} /> <span className="text-ink-muted">{summary.average} ({summary.count} {summary.count === 1 ? 'review' : 'reviews'})</span></p>}
      {s.image
        ? <img src={s.image} alt={s.name} className="h-64 w-full object-cover rounded-card mb-6" />
        : <div className="h-64 rounded-card bg-brand-tint mb-6" aria-hidden="true" />}
      <div className="grid gap-6 md:grid-cols-[1fr_280px] items-start">
        <Card>
          <h2 className="text-xl font-extrabold mb-2">About this service</h2>
          <p className="leading-relaxed whitespace-pre-line">{s.description || 'Details will be confirmed by our team.'}</p>
          {s.pricingType === 'estimate' && (
            <p className="mt-4 text-sm text-ink-muted">The price shown is an estimate. Your technician confirms the final amount after the job.</p>
          )}
        </Card>
        <Card>
          <p className="text-sm text-ink-muted">{s.pricingType === 'fixed' ? 'Price' : 'Estimated price from'}</p>
          <p className="text-3xl font-extrabold mb-1">{inr(s.basePrice)}</p>
          <p className="text-sm text-ink-muted mb-4">About {s.durationMins} minutes</p>
          {action}
        </Card>
      </div>

      <section className="mt-8" aria-labelledby="reviews-heading">
        <h2 id="reviews-heading" className="text-2xl font-extrabold mb-3">Customer reviews</h2>
        {reviews.loading && <p role="status" className="text-ink-muted">Loading reviews...</p>}
        {reviews.data && reviews.data.items.length === 0 && <p className="text-ink-muted">No reviews yet.</p>}
        {reviews.data && reviews.data.items.length > 0 && (
          <ul className="flex flex-col gap-3">
            {reviews.data.items.map((r) => (
              <li key={r._id}><Card>
                <Stars value={r.rating} /> <span className="font-semibold ml-2">{r.author}</span>
                {r.comment && <p className="mt-2">{r.comment}</p>}
              </Card></li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}