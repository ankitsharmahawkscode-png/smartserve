import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card } from '../../components/ui.jsx';
import { Alert } from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';
import Stars from '../../components/Stars.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDateTime } from '../../utils/format.js';

export default function AdminReviews() {
  const [hidden, setHidden] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/reviews', { page, hidden: hidden || undefined });
  const [notice, setNotice] = useState('');
  const act = useAction();

  const toggle = async (r) => {
    if (await act.run(() => api.patch(`/admin/reviews/${r._id}`, { isHidden: !r.isHidden }))) { setNotice(r.isHidden ? 'Review is visible again' : 'Review hidden'); reload(); }
  };

  // ✅ S.No offset
  const perPage = data?.perPage ?? data?.limit ?? 10;
  const offset = (page - 1) * perPage;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Reviews</h1>
      <div className="max-w-xs mb-6">
        <Select label="Show" value={hidden} onChange={(e) => { setHidden(e.target.value); setPage(1); }}>
          <option value="">All reviews</option>
          <option value="false">Visible</option>
          <option value="true">Hidden</option>
        </Select>
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {act.error && <div className="mb-4"><Alert>{act.error}</Alert></div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No reviews yet">Customer reviews appear here after completed jobs.</EmptyState>}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((r, index) => (
            <li key={r._id}><Card>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="font-extrabold flex items-center gap-2">
                    <span className="shrink-0 inline-flex items-center justify-center w-7 h-7 rounded-full bg-brand-tint text-brand-dark text-xs font-bold">
                      {offset + index + 1}
                    </span>
                    {r.service?.name} <span className="font-normal text-ink-muted">({r.booking?.bookingNo})</span>
                  </p>
                  <Stars value={r.rating} />
                  <p className="mt-2">{r.comment || <span className="text-ink-muted">No comment</span>}</p>
                  <p className="mt-2 text-sm text-ink-muted">{r.customer?.name}, {prettyDateTime(r.createdAt)}{r.technician ? `, technician ${r.technician.name}` : ''}{r.isHidden ? ', hidden' : ''}</p>
                </div>
                <Button variant="secondary" disabled={act.busy} onClick={() => toggle(r)}>{r.isHidden ? 'Show' : 'Hide'}</Button>
              </div>
            </Card></li>
          ))}
        </ul>
      )}
      <Pagination data={data} onPage={setPage} />
    </div>
  );
}