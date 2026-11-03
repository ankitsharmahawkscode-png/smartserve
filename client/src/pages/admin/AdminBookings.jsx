import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import useDebounced from '../../hooks/useDebounced.js';
import { Button, StatusBadge } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Select, Textarea } from '../../components/Fields.jsx';
import Modal from '../../components/Modal.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';

const STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const CAN_CANCEL = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED'];

// "November 3, 2026 at 1:10 PM"
const fmtDateTime = (v) => {
  if (!v) return '—';
  const d = new Date(v);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString('en-US', { dateStyle: 'long', timeStyle: 'short' });
};

// ---------- small icons ----------
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    {children}
  </svg>
);
const CheckIcon = () => (
  <Icon><path d="M20 6 9 17l-5-5" /></Icon>
);
const UserPlusIcon = () => (
  <Icon><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M19 8v6" /><path d="M16 11h6" /></Icon>
);
const XIcon = () => (
  <Icon><path d="M18 6 6 18" /><path d="M6 6l12 12" /></Icon>
);

const actionBtn =
  'inline-flex h-8 w-9 items-center justify-center rounded text-white transition-opacity hover:opacity-85 disabled:opacity-50';

function AssignModal({ booking, onClose, onDone }) {
  const techs = useFetch('/admin/technicians', { assignable: 'true' });
  const [techId, setTechId] = useState(booking.technician?._id || '');
  const { busy, error, run } = useAction();
  const submit = async (e) => {
    e.preventDefault();
    if (!techId) return;
    if (await run(() => api.patch(`/admin/bookings/${booking._id}/assign`, { technicianId: techId }))) onDone('Technician assigned');
  };
  return (
    <Modal title={`Assign technician for ${booking.bookingNo}`} onClose={onClose}>
      <p className="text-ink-muted mb-4">{booking.service?.name}, {prettyDate(booking.date)}, {prettySlot(booking.slot)}</p>
      {techs.loading ? <Spinner /> : (
        <form onSubmit={submit} className="flex flex-col gap-4">
          {error && <Alert>{error}</Alert>}
          {techs.error && <Alert>{techs.error}</Alert>}
          <Select label="Technician" value={techId} onChange={(e) => setTechId(e.target.value)}>
            <option value="">Choose a technician</option>
            {techs.data?.items.map((t) => <option key={t._id} value={t._id}>{t.name}</option>)}
          </Select>
          {techs.data?.items.length === 0 && <p className="text-sm text-ink-muted">No available technicians. Add one or mark one as available.</p>}
          <div className="flex justify-end gap-3">
            <Button type="button" variant="secondary" onClick={onClose}>Close</Button>
            <Button type="submit" disabled={busy || !techId}>{busy ? 'Assigning...' : 'Assign'}</Button>
          </div>
        </form>
      )}
    </Modal>
  );
}

function CancelModal({ booking, onClose, onDone }) {
  const [reason, setReason] = useState('');
  const { busy, error, run } = useAction();
  const submit = async (e) => {
    e.preventDefault();
    if (await run(() => api.patch(`/admin/bookings/${booking._id}/cancel`, { reason: reason.trim() }))) onDone('Booking cancelled');
  };
  return (
    <Modal title={`Cancel ${booking.bookingNo}?`} onClose={onClose}>
      <form onSubmit={submit} className="flex flex-col gap-4">
        {error && <Alert>{error}</Alert>}
        <Textarea label="Reason (shown in the audit log)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        <div className="flex justify-end gap-3">
          <Button type="button" variant="secondary" onClick={onClose}>Keep booking</Button>
          <Button type="submit" disabled={busy || reason.trim().length < 3}>{busy ? 'Cancelling...' : 'Cancel booking'}</Button>
        </div>
      </form>
    </Modal>
  );
}

export default function AdminBookings() {
  const [status, setStatus] = useState('');
  const [date, setDate] = useState('');
  const [q, setQ] = useState('');
  const [page, setPage] = useState(1);
  const term = useDebounced(q.trim());
  const { data, loading, error, reload } = useFetch('/admin/bookings', { page, status: status || undefined, date: date || undefined, q: term || undefined });
  const [dialog, setDialog] = useState(null);
  const [notice, setNotice] = useState('');
  const action = useAction();

  const done = (msg) => { setDialog(null); setNotice(msg); reload(); };
  const approve = async (b) => { if (await action.run(() => api.patch(`/admin/bookings/${b._id}/approve`))) done('Booking confirmed'); };
  const reset = (fn) => (e) => { fn(e.target.value); setPage(1); };

  const items = data?.items || [];

  // Paging numbers (server-side). Reads whichever field names the API returns.
  const perPage = data?.perPage ?? data?.limit ?? 10;
  const total = data?.total ?? data?.totalItems ?? data?.count ?? items.length;
  const totalPages = Math.max(1, data?.totalPages ?? data?.pages ?? Math.ceil(total / perPage));
  const currentPage = Math.min(page, totalPages);
  const startIdx = (currentPage - 1) * perPage;

  const pageNumbers = [];
  const from = Math.max(1, Math.min(currentPage - 2, totalPages - 4));
  const to = Math.min(totalPages, from + 4);
  for (let i = from; i <= to; i++) pageNumbers.push(i);

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {notice && (
        <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">
          {notice}
        </div>
      )}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}

      <div className="rounded-lg border border-gray-200 bg-white p-4 sm:p-6 shadow">
        {/* Header */}
        <h1 className="mb-5 text-center text-2xl sm:text-3xl font-extrabold text-[#d97706]">
          Bookings
        </h1>

        {/* Filters */}
        <div className="mb-5 grid gap-4 sm:grid-cols-3">
          <Select label="Status" value={status} onChange={reset(setStatus)}>
            <option value="">All</option>
            {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>)}
          </Select>
          <Input label="Date" type="date" value={date} onChange={reset(setDate)} />
          <Input label="Booking number" value={q} onChange={reset(setQ)} placeholder="BK-0001" />
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <EmptyState title="No bookings match">Change the filters to see more.</EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <div className="overflow-x-auto rounded border border-gray-300">
              <table className="w-full min-w-[1100px] border-collapse text-left text-[13px] text-gray-600">
                <thead>
                  <tr className="border-b border-gray-300 text-gray-800">
                    {['S.No', 'Booking', 'Customer', 'Service', 'When', 'Created Date', 'Technician', 'Amount', 'Status', 'Action'].map((h) => (
                      <th key={h} className="border-r border-gray-200 px-3 py-3 font-bold last:border-r-0">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((b, i) => (
                    <tr
                      key={b._id}
                      className="border-b border-gray-200 even:bg-white odd:bg-[#f3f7fa] last:border-b-0"
                    >
                      <td className="border-r border-gray-200 px-3 py-3 align-top">{startIdx + i + 1}</td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap font-semibold text-gray-800">
                        {b.bookingNo}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">
                        {b.customer?.name}
                        <span className="block text-gray-500">{b.customer?.phone}</span>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">{b.service?.name}</td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                        {prettyDate(b.date)}
                        <span className="block text-gray-500">{prettySlot(b.slot)}</span>
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                        {fmtDateTime(b.createdAt)}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">
                        {b.technician?.name || <span className="text-gray-400">Unassigned</span>}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top whitespace-nowrap">
                        {inr(b.finalPrice ?? b.estimatedPrice)}
                      </td>
                      <td className="border-r border-gray-200 px-3 py-3 align-top">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex gap-1.5">
                          {b.status === 'PENDING' && (
                            <button
                              type="button"
                              disabled={action.busy}
                              onClick={() => approve(b)}
                              title="Approve"
                              aria-label="Approve"
                              className={`${actionBtn} bg-cyan-400`}
                            >
                              <CheckIcon />
                            </button>
                          )}
                          {(b.status === 'CONFIRMED' || b.status === 'ASSIGNED') && (
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'assign', b })}
                              title={b.status === 'ASSIGNED' ? 'Reassign technician' : 'Assign technician'}
                              aria-label={b.status === 'ASSIGNED' ? 'Reassign technician' : 'Assign technician'}
                              className={`${actionBtn} bg-[#5bc0a5]`}
                            >
                              <UserPlusIcon />
                            </button>
                          )}
                          {CAN_CANCEL.includes(b.status) && (
                            <button
                              type="button"
                              onClick={() => setDialog({ type: 'cancel', b })}
                              title="Cancel booking"
                              aria-label="Cancel booking"
                              className={`${actionBtn} bg-red-500`}
                            >
                              <XIcon />
                            </button>
                          )}
                          {!['PENDING', 'CONFIRMED', 'ASSIGNED', ...CAN_CANCEL].includes(b.status) && (
                            <span className="text-gray-400">—</span>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Footer: count + pagination */}
            <div className="mt-4 flex flex-col items-center justify-between gap-3 sm:flex-row">
              <p className="text-sm text-teal-600 underline">
                Showing {startIdx + 1} to {startIdx + items.length} of {total} entries
              </p>

              <div className="flex items-center gap-1 text-sm">
                <button
                  type="button"
                  onClick={() => setPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Previous
                </button>
                {pageNumbers.map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setPage(n)}
                    className={`min-w-[36px] rounded px-3 py-2 font-medium ${
                      n === currentPage ? 'bg-teal-600 text-white' : 'text-teal-700 hover:bg-gray-100'
                    }`}
                  >
                    {n}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="rounded bg-gray-500 px-4 py-2 font-medium text-white disabled:cursor-not-allowed disabled:opacity-50"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {dialog?.type === 'assign' && <AssignModal booking={dialog.b} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === 'cancel' && <CancelModal booking={dialog.b} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}