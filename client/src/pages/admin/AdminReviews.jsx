import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Alert } from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';
import Stars from '../../components/Stars.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import {
  PageCard, DataTable, TableFooter, serverPaging, fmtDateTime,
  EyeIcon, EyeOffIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

export default function AdminReviews() {
  const [hidden, setHidden] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/reviews', { page, hidden: hidden || undefined });
  const [notice, setNotice] = useState('');
  const act = useAction();

  const toggle = async (r) => {
    if (await act.run(() => api.patch(`/admin/reviews/${r._id}`, { isHidden: !r.isHidden }))) {
      setNotice(r.isHidden ? 'Review is visible again' : 'Review hidden');
      reload();
    }
  };

  const items = data?.items || [];
  const { perPage, total, totalPages } = serverPaging(data, items.length);
  const startIdx = (page - 1) * perPage;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">
          {notice}
        </div>
      )}
      {act.error && <div className="mb-4"><Alert>{act.error}</Alert></div>}

      <PageCard title="Reviews">
        <div className="mb-5 max-w-xs">
          <Select label="Show" value={hidden} onChange={(e) => { setHidden(e.target.value); setPage(1); }}>
            <option value="">All reviews</option>
            <option value="false">Visible</option>
            <option value="true">Hidden</option>
          </Select>
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <EmptyState title="No reviews yet">Customer reviews appear here after completed jobs.</EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <DataTable
              minWidth={1050}
              columns={['S.No', 'Service', 'Rating', 'Comment', 'Customer', 'Technician', 'Date', 'Status', 'Action']}
            >
              {items.map((r, i) => (
                <tr key={r._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={td}>
                    <span className="font-semibold text-gray-800">{r.service?.name || '—'}</span>
                    <span className="block text-gray-500">{r.booking?.bookingNo}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}><Stars value={r.rating} /></td>
                  <td className={`${td} max-w-[280px]`}>
                    {r.comment || <span className="text-gray-400">No comment</span>}
                  </td>
                  <td className={td}>{r.customer?.name || '—'}</td>
                  <td className={td}>{r.technician?.name || '—'}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(r.createdAt)}</td>
                  <td className={td}>
                    <span className={r.isHidden ? 'text-gray-500' : 'text-green-700'}>
                      {r.isHidden ? 'Hidden' : 'Visible'}
                    </span>
                  </td>
                  <td className={tdLast}>
                    <button
                      type="button"
                      disabled={act.busy}
                      onClick={() => toggle(r)}
                      title={r.isHidden ? 'Show review' : 'Hide review'}
                      aria-label={r.isHidden ? 'Show review' : 'Hide review'}
                      className={`${actionBtn} ${r.isHidden ? 'bg-cyan-400' : 'bg-amber-400'}`}
                    >
                      {r.isHidden ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </td>
                </tr>
              ))}
            </DataTable>
            <TableFooter
              page={page} onPage={setPage} total={total}
              perPage={perPage} totalPages={totalPages} shown={items.length}
            />
          </>
        )}
      </PageCard>
    </div>
  );
}