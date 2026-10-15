import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import useDebounced from '../../hooks/useDebounced.js';
import { Button } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Customers</h1>
      <div className="max-w-sm mb-6"><Input label="Search by name, email or phone" value={q} onChange={(e) => { setQ(e.target.value); setPage(1); }} /></div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No customers found">Customers appear here after they register.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[640px] text-left">
            <thead className="text-sm text-ink-muted"><tr>
              {['Customer', 'Phone', 'Joined', 'Status', 'Action'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.items.map((c) => (
                <tr key={c._id} className="border-t border-line">
                  <td className="p-3 font-semibold">{c.name}<br /><span className="text-sm font-normal text-ink-muted">{c.email}</span></td>
                  <td className="p-3">{c.phone || '-'}</td>
                  <td className="p-3">{new Date(c.createdAt).toLocaleDateString('en-IN')}</td>
                  <td className="p-3">{c.isActive ? 'Active' : 'Deactivated'}</td>
                  <td className="p-3"><Button variant="secondary" disabled={action.busy} onClick={() => toggle(c)}>{c.isActive ? 'Deactivate' : 'Activate'}</Button></td>
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