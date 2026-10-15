import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { Button, Card, StatusBadge } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';

const FILTERS = [['', 'All'], ['PENDING', 'Pending'], ['CONFIRMED', 'Confirmed'], ['ASSIGNED', 'Assigned'], ['ACCEPTED', 'Accepted'], ['IN_PROGRESS', 'In progress'], ['COMPLETED', 'Completed'], ['CANCELLED', 'Cancelled']];

export default function MyBookings() {
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/bookings', { page, status: status || undefined });

  return (
    <div className="max-w-5xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-extrabold">My bookings</h1>
        <LinkButton to="/services">Book a service</LinkButton>
      </div>
      <div className="mb-4">
        <label htmlFor="status" className="block text-sm font-semibold text-ink-muted mb-1">Filter by status</label>
        <select id="status" value={status} onChange={(e) => { setStatus(e.target.value); setPage(1); }}
          className="min-h-[44px] px-3 rounded-[10px] border border-[#AEB9B6] bg-white">
          {FILTERS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      </div>

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && (
        <EmptyState title="No bookings yet">
          <Link to="/services" className="underline text-brand">Browse services</Link> to make your first booking.
        </EmptyState>
      )}
      {data && data.items.length > 0 && (
        <>
          <ul className="flex flex-col gap-3">
            {data.items.map((b) => (
              <li key={b._id}>
                <Card className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm text-ink-muted">{b.bookingNo}</p>
                    <p className="font-extrabold">{b.service?.name}</p>
                    <p className="text-ink-muted">{prettyDate(b.date)}, {prettySlot(b.slot)}</p>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="font-semibold">{inr(b.finalPrice ?? b.estimatedPrice)}</span>
                    <StatusBadge status={b.status} />
                    <LinkButton variant="secondary" to={`/customer/bookings/${b._id}`} aria-label={`View booking ${b.bookingNo}`}>View</LinkButton>
                  </div>
                </Card>
              </li>
            ))}
          </ul>
          {data.pages > 1 && (
            <div className="flex items-center justify-center gap-4 mt-6">
              <Button variant="secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <span className="text-ink-muted">Page {data.page} of {data.pages}</span>
              <Button variant="secondary" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}