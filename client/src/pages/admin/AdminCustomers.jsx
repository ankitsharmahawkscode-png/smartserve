import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import useDebounced from '../../hooks/useDebounced.js';
import Input, { Alert } from '../../components/Input.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import {
  PageCard, DataTable, TableFooter, serverPaging, fmtDateTime,
  LockIcon, UnlockIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

export default function AdminCustomers() {
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(q.trim());
  const { data, loading, error, reload } = useFetch('/admin/customers', { page, q: term || undefined });
  const [notice, setNotice] = useState('');
  const action = useAction();

  const toggle = async (c) => {
    if (await action.run(() => api.patch(`/admin/customers/${c._id}/status`, { isActive: !c.isActive }))) {
      setNotice(c.isActive ? `${c.name} deactivated` : `${c.name} activated`);
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
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}

      <PageCard title="Customers">
        <div className="mb-5 max-w-sm">
          <Input
            label="Search by name, email or phone"
            value={q}
            onChange={(e) => { setQ(e.target.value); setPage(1); }}
          />
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <EmptyState title="No customers found">Customers appear here after they register.</EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <DataTable minWidth={760} columns={['S.No', 'Customer', 'Phone', 'Joined', 'Status', 'Action']}>
              {items.map((c, i) => (
                <tr key={c._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={td}>
                    <span className="font-semibold text-gray-800">{c.name}</span>
                    <span className="block text-gray-500">{c.email}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{c.phone || '—'}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(c.createdAt)}</td>
                  <td className={td}>
                    <span className={c.isActive ? 'text-green-700' : 'text-red-600'}>
                      {c.isActive ? 'Active' : 'Deactivated'}
                    </span>
                  </td>
                  <td className={tdLast}>
                    <button
                      type="button"
                      disabled={action.busy}
                      onClick={() => toggle(c)}
                      title={c.isActive ? 'Deactivate account' : 'Activate account'}
                      aria-label={c.isActive ? 'Deactivate account' : 'Activate account'}
                      className={`${actionBtn} bg-cyan-400`}
                    >
                      {c.isActive ? <LockIcon /> : <UnlockIcon />}
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