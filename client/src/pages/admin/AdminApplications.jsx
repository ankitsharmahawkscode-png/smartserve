import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import {
  PageCard, DataTable, TableFooter, fmtDateTime,
  CheckIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const PAGE_SIZE = 10;

const STATUS_STYLE = {
  approved: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800',
  pending: 'bg-yellow-100 text-yellow-800',
};

export default function AdminApplications() {
  const { data, loading, error, reload } = useFetch('/admin/applications');
  const [busyId, setBusyId] = useState(null);
  const [notice, setNotice] = useState('');
  const [page, setPage] = useState(1);

  const handleApprove = async (id) => {
    if (!window.confirm('Approve this technician? They will get access to the technician dashboard.')) return;
    setBusyId(id);
    setNotice('');
    try {
      await api.post(`/admin/applications/${id}/approve`);
      setNotice('Application approved! User is now a technician.');
      reload();
    } catch (err) {
      setNotice(err.response?.data?.message || 'Error approving application');
    } finally {
      setBusyId(null);
    }
  };

  if (loading) return <div className="p-6"><Spinner /></div>;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;

  const apps = data?.items || [];

  // Pagination (client side)
  const total = apps.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * PAGE_SIZE;
  const pageItems = apps.slice(startIdx, startIdx + PAGE_SIZE);

  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 text-sm font-semibold text-brand-dark sm:text-base">
          {notice}
        </div>
      )}

      <PageCard title="Technician Applications">
        {total === 0 ? (
          <EmptyState title="No applications yet">
            Applications from the "Become a Technician" page will appear here.
          </EmptyState>
        ) : (
          <>
            <DataTable
              minWidth={1100}
              columns={['S.No', 'Applicant', 'Phone', 'City', 'Experience', 'Skills', 'Message', 'Applied', 'Status', 'Action']}
            >
              {pageItems.map((app, i) => (
                <tr key={app._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={td}>
                    <span className="font-semibold text-gray-800">{app.name}</span>
                    <span className="block text-gray-500">{app.email}</span>
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{app.phone || '—'}</td>
                  <td className={td}>{app.city || '—'}</td>
                  <td className={`${td} whitespace-nowrap`}>
                    {app.experienceYears != null ? `${app.experienceYears} yrs` : '—'}
                  </td>
                  <td className={`${td} max-w-[220px]`}>
                    {app.skills?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {app.skills.map((s, idx) => (
                          <span key={idx} className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                            {s}
                          </span>
                        ))}
                      </div>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`${td} max-w-[240px]`}>
                    {app.message ? (
                      <span className="line-clamp-3 italic" title={app.message}>"{app.message}"</span>
                    ) : (
                      '—'
                    )}
                  </td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(app.createdAt)}</td>
                  <td className={td}>
                    <span
                      className={`rounded-full px-2 py-1 text-xs font-bold ${
                        STATUS_STYLE[app.status] || STATUS_STYLE.pending
                      }`}
                    >
                      {String(app.status || 'pending').toUpperCase()}
                    </span>
                  </td>
                  <td className={tdLast}>
                    {app.status === 'pending' ? (
                      <button
                        type="button"
                        onClick={() => handleApprove(app._id)}
                        disabled={busyId === app._id}
                        title="Approve application"
                        aria-label="Approve application"
                        className={`${actionBtn} bg-[#5bc0a5]`}
                      >
                        <CheckIcon />
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
                  </td>
                </tr>
              ))}
            </DataTable>
            <TableFooter
              page={current} onPage={setPage} total={total}
              perPage={PAGE_SIZE} totalPages={totalPages} shown={pageItems.length}
            />
          </>
        )}
      </PageCard>
    </div>
  );
}