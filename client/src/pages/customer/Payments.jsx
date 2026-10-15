import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDateTime } from '../../utils/format.js';

export default function Payments() {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/payments/mine', { page });
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Payments</h1>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No payments yet">Online payments appear here. Cash payments are recorded when your job is completed.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-sm text-ink-muted"><tr>{['Date', 'Booking', 'Method', 'Amount', 'Status'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id} className="border-t border-line">
                  <td className="p-3">{prettyDateTime(p.createdAt)}</td>
                  <td className="p-3"><Link className="underline text-brand" to={`/customer/bookings/${p.booking?._id}`}>{p.booking?.bookingNo}</Link><br /><span className="text-sm text-ink-muted">{p.booking?.service?.name}</span></td>
                  <td className="p-3">{p.provider === 'cash' ? 'Cash' : 'Online'}</td>
                  <td className="p-3 font-semibold">{inr(p.amount)}</td>
                  <td className="p-3">{p.status === 'refunded' ? `Refunded ${inr(p.refundAmount)}` : 'Paid'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination data={data} onPage={setPage} />
    </div>
  );
}