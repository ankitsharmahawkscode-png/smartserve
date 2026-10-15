import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button, Card, StatusBadge } from '../../components/ui.jsx';
import Input, { Alert } from '../../components/Input.jsx';
import { Textarea } from '../../components/Fields.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettyDateTime, prettySlot } from '../../utils/format.js';

const Row = ({ label, children }) => (
  <div className="min-w-0 py-3 border-b border-line last:border-0">
    <dt className="text-xs sm:text-sm text-ink-muted mb-1">{label}</dt>
    <dd className="font-semibold text-sm sm:text-base break-words">{children}</dd>
  </div>
);

export default function JobDetail() {
  const { id } = useParams();
  const { data, loading, error, reload } = useFetch(`/tech/jobs/${id}`);
  const [dialog, setDialog] = useState(null); // 'reject' | 'complete'
  const [reason, setReason] = useState('');
  const [amount, setAmount] = useState('');
  const [notice, setNotice] = useState('');
  const act = useAction();

  if (loading) return <Spinner />;
  if (error) return <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8"><ErrorState message={error} onRetry={reload} /></div>;
  const b = data.booking;
  const needsAmount = b.service?.pricingType === 'estimate';

  const send = async (call, msg) => {
    if (await act.run(call)) { setDialog(null); setNotice(msg); reload(); }
  };
  const accept = () => send(() => api.patch(`/tech/jobs/${id}/respond`, { accept: true }), 'Job accepted');
  const reject = () => send(() => api.patch(`/tech/jobs/${id}/respond`, { accept: false, ...(reason.trim() && { reason: reason.trim() }) }), 'Job rejected');
  const start = () => send(() => api.patch(`/tech/jobs/${id}/status`, { status: 'IN_PROGRESS' }), 'Job started');
  const complete = () => {
    if (needsAmount && (amount === '' || Number(amount) < 0)) return act.setError('Enter the final amount');
    return send(() => api.patch(`/tech/jobs/${id}/status`, { status: 'COMPLETED', ...(amount !== '' && { finalPrice: Number(amount) }) }), 'Job completed');
  };
  const close = () => { setDialog(null); act.setError(''); };

  return (
    <div className="min-h-screen bg-gray-50/70">
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-8">
        <p className="mb-4">
          <Link to="/technician/jobs" className="inline-flex items-center gap-2 text-sm font-semibold underline underline-offset-4 text-brand hover:text-brand-dark">
            ← Back to assigned jobs
          </Link>
        </p>

        {notice && <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 p-3 sm:p-4 text-sm sm:text-base font-semibold text-green-800">{notice}</div>}
        {!dialog && act.error && <div className="mb-5"><Alert>{act.error}</Alert></div>}

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 rounded-2xl border border-line bg-white p-4 sm:p-6">
          <div className="min-w-0">
            <p className="text-xs font-bold uppercase tracking-wider text-ink-muted mb-2">Job details</p>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight break-words">{b.bookingNo}</h1>
            <p className="text-sm text-ink-muted mt-2">{b.service?.name}</p>
          </div>
          <div className="self-start sm:self-center shrink-0">
            <StatusBadge status={b.status} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_280px] gap-5 lg:gap-6 items-start">
          <div className="min-w-0 flex flex-col gap-5">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-extrabold mb-4">Booking information</h2>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
                <Row label="Service">{b.service?.name}</Row>
                <Row label="When">{prettyDate(b.date)}, {prettySlot(b.slot)}</Row>
                <Row label="Customer">{b.customer?.name}</Row>
                <Row label="Phone">{b.customer?.phone ? <a className="underline underline-offset-4 text-brand break-words" href={`tel:${b.customer.phone}`}>{b.customer.phone}</a> : 'Not provided'}</Row>
                <Row label="Address">{[b.address.line1, b.address.line2, b.address.city, b.address.pincode].filter(Boolean).join(', ')}</Row>
                <Row label="Customer notes">{b.notes || 'None'}</Row>
                <Row label="Estimated price">{inr(b.estimatedPrice)}</Row>
                <Row label="Payment">{b.paymentMethod === 'cod' ? 'Collect cash on service' : 'Online'}</Row>
                {b.finalPrice != null && <Row label="Final amount">{inr(b.finalPrice)}</Row>}
              </dl>
            </Card>

            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-extrabold mb-4">Progress history</h2>
              <ol className="flex flex-col gap-4">
                {b.statusHistory.map((h, i) => (
                  <li key={i} className="flex flex-wrap items-center gap-3 border-b border-line last:border-0 pb-3 last:pb-0">
                    <StatusBadge status={h.to} />
                    <span className="text-xs sm:text-sm text-ink-muted">{prettyDateTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            </Card>
          </div>

          <aside className="min-w-0 lg:sticky lg:top-6">
            <Card className="p-4 sm:p-6">
              <h2 className="text-lg sm:text-xl font-extrabold mb-4">Job actions</h2>

              <div className="rounded-xl bg-gray-50 border border-line p-4 mb-5">
                <p className="text-sm text-ink-muted">Estimated price</p>
                <p className="text-2xl sm:text-3xl font-extrabold mt-2 break-words">{inr(b.finalPrice ?? b.estimatedPrice)}</p>
                <p className="text-xs text-ink-muted mt-2">Payment: {b.paymentMethod === 'cod' ? 'Cash on service' : 'Online'}</p>
              </div>

              <div className="flex flex-col gap-3 [&_button]:w-full">
                {b.status === 'ASSIGNED' && <>
                  <Button onClick={accept} disabled={act.busy}>Accept job</Button>
                  <Button variant="secondary" onClick={() => setDialog('reject')}>Reject job</Button>
                </>}
                {b.status === 'ACCEPTED' && <Button onClick={start} disabled={act.busy}>Start job</Button>}
                {b.status === 'IN_PROGRESS' && <Button onClick={() => { setAmount(needsAmount ? '' : String(b.estimatedPrice)); setDialog('complete'); }}>Complete job</Button>}
              </div>
            </Card>
          </aside>
        </div>

        <ConfirmDialog open={dialog === 'reject'} title="Reject this job?" confirmLabel="Reject job" cancelLabel="Keep job" onConfirm={reject} onCancel={close} busy={act.busy}>
          {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
          <p className="text-sm text-ink-muted mb-3">The admin will be able to assign it to someone else.</p>
          <Textarea label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} maxLength={300} />
        </ConfirmDialog>

        <ConfirmDialog open={dialog === 'complete'} title="Complete this job" confirmLabel="Mark completed" cancelLabel="Not yet" onConfirm={complete} onCancel={close} busy={act.busy}>
          {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
          <Input label={needsAmount ? 'Final amount charged (INR)' : 'Amount (INR)'} type="number" min="0" value={amount} onChange={(e) => setAmount(e.target.value)} />
        </ConfirmDialog>
      </main>
    </div>
  );
}