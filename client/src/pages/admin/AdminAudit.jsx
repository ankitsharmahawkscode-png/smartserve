import { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Select } from '../../components/Fields.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import {
  PageCard, DataTable, TableFooter, serverPaging, fmtDateTime, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const short = (meta) => {
  if (!meta || !Object.keys(meta).length) return '';
  const text = JSON.stringify(meta);
  return text.length > 110 ? `${text.slice(0, 110)}...` : text;
};

export default function AdminAudit() {
  const [area, setArea] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/audit', { page, area: area || undefined });

  const items = data?.items || [];
  const { perPage, total, totalPages } = serverPaging(data, items.length);
  const startIdx = (page - 1) * perPage;

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      <PageCard title="Activity Log" subtitle="Every important action, who did it and when.">
        <div className="mb-5 max-w-xs">
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
        {data && items.length === 0 && (
          <EmptyState title="No activity yet">
            Actions such as approvals, assignments and cancellations appear here.
          </EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <DataTable minWidth={900} columns={['S.No', 'When', 'Who', 'Action', 'Record', 'Details']}>
              {items.map((a, i) => (
                <tr key={a._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(a.createdAt)}</td>
                  <td className={td}>
                    {a.actor ? `${a.actor.name} (${a.actor.role})` : <span className="text-gray-400">System</span>}
                  </td>
                  <td className={`${td} font-semibold text-gray-800`}>{a.action}</td>
                  <td className={td}>
                    {a.entity}{' '}
                    <span className="text-gray-400">...{String(a.entityId || '').slice(-6)}</span>
                  </td>
                  <td className={`${tdLast} break-all text-gray-500`}>{short(a.meta) || '—'}</td>
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