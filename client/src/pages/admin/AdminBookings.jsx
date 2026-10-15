import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import useDebounced from '../../hooks/useDebounced.js';
import { Button, StatusBadge } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Select, Textarea } from '../../components/Fields.jsx';
import Modal from '../../components/Modal.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';

const STATUSES = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'];
const CAN_CANCEL = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED'];

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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Bookings</h1>
      <div className="grid gap-4 sm:grid-cols-3 mb-6">
        <Select label="Status" value={status} onChange={reset(setStatus)}>
          <option value="">All</option>
          {STATUSES.map((s) => <option key={s} value={s}>{s.replace('_', ' ').toLowerCase()}</option>)}
        </Select>
        <Input label="Date" type="date" value={date} onChange={reset(setDate)} />
        <Input label="Booking number" value={q} onChange={reset(setQ)} placeholder="BK-0001" />
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {action.error && <div className="mb-4"><Alert>{action.error}</Alert></div>}

      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No bookings match">Change the filters to see more.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[860px] text-left">
            <thead className="text-sm text-ink-muted"><tr>
              {['Booking', 'Customer', 'Service', 'When', 'Technician', 'Amount', 'Status', 'Actions'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {data.items.map((b) => (
                <tr key={b._id} className="border-t border-line align-top">
                  <td className="p-3 font-semibold">{b.bookingNo}</td>
                  <td className="p-3">{b.customer?.name}<br /><span className="text-sm text-ink-muted">{b.customer?.phone}</span></td>
                  <td className="p-3">{b.service?.name}</td>
                  <td className="p-3">{prettyDate(b.date)}<br /><span className="text-sm text-ink-muted">{prettySlot(b.slot)}</span></td>
                  <td className="p-3">{b.technician?.name || <span className="text-ink-muted">Unassigned</span>}</td>
                  <td className="p-3">{inr(b.finalPrice ?? b.estimatedPrice)}</td>
                  <td className="p-3"><StatusBadge status={b.status} /></td>
                  <td className="p-3">
                    <div className="flex flex-wrap gap-2">
                      {b.status === 'PENDING' && <Button disabled={action.busy} onClick={() => approve(b)}>Approve</Button>}
                      {(b.status === 'CONFIRMED' || b.status === 'ASSIGNED') && (
                        <Button onClick={() => setDialog({ type: 'assign', b })}>{b.status === 'ASSIGNED' ? 'Reassign' : 'Assign'}</Button>
                      )}
                      {CAN_CANCEL.includes(b.status) && <Button variant="secondary" onClick={() => setDialog({ type: 'cancel', b })}>Cancel</Button>}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination data={data} onPage={setPage} />

      {dialog?.type === 'assign' && <AssignModal booking={dialog.b} onClose={() => setDialog(null)} onDone={done} />}
      {dialog?.type === 'cancel' && <CancelModal booking={dialog.b} onClose={() => setDialog(null)} onDone={done} />}
    </div>
  );
}