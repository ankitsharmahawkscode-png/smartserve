import { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Select } from '../../components/Fields.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDateTime } from '../../utils/format.js';

const short = (meta) => {
  if (!meta || !Object.keys(meta).length) return '';
  const text = JSON.stringify(meta);
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
};

export default function AdminAudit() {
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/audit', { page, area: area || undefined });

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-1">Activity log</h1>
      <p className="text-ink-muted mb-6">Every important action, who did it and when.</p>
      <div className="max-w-xs mb-6">
        <Select label="Show" value={area} onChange={(e) => { setArea(e.target.value); setPage(1); }}>
          <option value="">Everything</option>
          <option value="booking">Bookings</option>
          <option value="payment">Payments and refunds</option>
          <option value="review">Reviews</option>
          <option value="auth">Security events</option>
        </Select>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No activity yet">Actions such as approvals, assignments and cancellations appear here.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[760px] text-left">
            <thead className="text-sm text-ink-muted"><tr>{['When', 'Who', 'Action', 'Record', 'Details'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map((a) => (
                <tr key={a._id} className="border-t border-line align-top">
                  <td className="p-3 whitespace-nowrap">{prettyDateTime(a.createdAt)}</td>
                  <td className="p-3">{a.actor ? `${a.actor.name} (${a.actor.role})` : <span className="text-ink-muted">System</span>}</td>
                  <td className="p-3 font-semibold">{a.action}</td>
                  <td className="p-3">{a.entity} <span className="text-sm text-ink-muted">...{String(a.entityId || '').slice(-6)}</span></td>
                  <td className="p-3 text-sm text-ink-muted break-all">{short(a.meta)}</td>
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