import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import api, { apiMessage } from '../../api/client.js';
import { useAuth } from '../../context/AuthContext.jsx';
import useFetch from '../../hooks/useFetch.js';
import { Button, Card, StatusBadge } from '../../components/ui.jsx';
import { Alert } from '../../components/Input.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { payWithRazorpay } from '../../utils/razorpay.js';
import { inr, prettyDate, prettyDateTime, prettySlot } from '../../utils/format.js';
import { company } from '../../content.js';

const CANCELLABLE = ['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED'];
const PAYMENT_LABEL = { unpaid: 'Unpaid', paid: 'Paid', refund_pending: 'Refund pending', refunded: 'Refunded' };
const Row = ({ label, children }) => (
 <div className="py-3 border-b border-line last:border-b-0 min-w-0">
  <dt className="text-xs sm:text-sm text-ink-muted mb-1">{label}</dt>
  <dd className="font-semibold leading-relaxed break-words">{children}</dd>
</div>
);

export default function BookingDetail() {
  const { id } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch(`/bookings/${id}`);
  const cfg = useFetch('/settings/public');
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState('');
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState('');
  const [cancelError, setCancelError] = useState('');
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState('');

  if (loading) return <Spinner />;
  if (error) return <div className="max-w-3xl mx-auto p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const b = data.booking;
  const policy = cfg.data?.settings.cancellation;
  const canPay = b.paymentMethod === 'online' && b.paymentStatus === 'unpaid' && b.status !== 'CANCELLED'
    && (b.service?.pricingType === 'fixed' || b.status === 'COMPLETED');

  const doCancel = async () => {
    setBusy(true);
    setCancelError('');
    try {
      const res = await api.patch(`/bookings/${id}/cancel`, reason.trim() ? { reason: reason.trim() } : {});
      setNotice(res.data.message);
      setOpen(false);
      reload();
    } catch (e) {
      setCancelError(e.response?.data?.errors?.[0]?.message || apiMessage(e));
    } finally {
      setBusy(false);
    }
  };

  const payNow = async () => {
    setPaying(true);
    setPayError('');
    try {
      const { data: res } = await api.post('/payments/order', { bookingId: id });
      const o = res.data;
      const result = await payWithRazorpay({
        key: o.keyId, amount: o.amountPaise, currency: o.currency, order_id: o.orderId,name: company.name, description:`Booking ${o.bookingNo}`,
        prefill: { name: user.name, email: user.email, contact: user.phone },
      });
      // Only the server decides whether the payment is real.
      await api.post('/payments/verify', result);
      setNotice('Payment received. Thank you!');
      reload();
    } catch (e) {
      setPayError(e.response ? (e.response.data?.message || apiMessage(e)) : e.message);
    } finally {
      setPaying(false);
    }
  };

  return (
   <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
    <p className="mb-5 text-sm sm:text-base"><Link className="inline-flex items-center underline underline-offset-4 text-brand hover:text-brand-dark transition-colors"
 to="/customer/bookings">Back to my bookings</Link></p>
      {location.state?.created && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">Booking received. We will confirm it shortly.</div>}
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}

    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-5 border-b border-line">
  <div>
    <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
      Booking details
    </p>
    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight break-words">
      {b.bookingNo}
    </h1>
  </div>
        <StatusBadge status={b.status} />
      </div>

    <Card className="mb-5 p-4 sm:p-6 lg:p-7 rounded-2xl border border-line shadow-sm">
  <h2 className="text-lg sm:text-xl font-extrabold mb-4 pb-3 border-b border-line">
    Booking information
  </h2>
  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2">
          <Row label="Service">{b.service?.name}</Row>
          <Row label="When">{prettyDate(b.date)}, {prettySlot(b.slot)}</Row>
          <Row label="Address">{[b.address.line1, b.address.line2, b.address.city, b.address.pincode].filter(Boolean).join(', ')}</Row>
          <Row label="Technician">{b.technician ? `${b.technician.name}${b.technician.phone ? ` (${b.technician.phone})` : ''}` : 'Not assigned yet'}</Row>
          <Row label="Estimated price">{inr(b.estimatedPrice)}</Row>
          <Row label="Final price">{b.finalPrice != null ? inr(b.finalPrice) : 'Confirmed after the job'}</Row>
          <Row label="Payment">{b.paymentMethod === 'cod' ? 'Cash on service' : 'Online'} ({PAYMENT_LABEL[b.paymentStatus]})</Row>
          {b.notes && <Row label="Your notes">{b.notes}</Row>}
        </dl>
        {b.status === 'CANCELLED' && b.cancellation && (
          <p className="mt-5 rounded-xl border border-line bg-gray-50 p-4 text-sm text-ink-muted leading-relaxed break-words">
            Cancelled{b.cancellation.reason ? `: ${b.cancellation.reason}` : ''}.
            {b.cancellation.fee > 0 && ` Cancellation fee: ${inr(b.cancellation.fee)}.`}
            {b.paymentStatus === 'refund_pending' && ' Your refund will be processed soon.'}
          </p>
        )}
      </Card>

      {canPay && (
       <Card className="mb-5 p-5 sm:p-6 rounded-2xl border border-line shadow-sm">
  <h2 className="text-xl sm:text-2xl font-extrabold mb-2">
    Pay online
  </h2>
          <p className="text-sm sm:text-base text-ink-muted leading-relaxed mb-5">Pay {inr(b.finalPrice ?? b.estimatedPrice)} securely with Razorpay.</p>
          {payError && <div className="mb-3"><Alert>{payError}</Alert></div>}
        <Button className="w-full sm:w-auto min-h-[46px] justify-center rounded-xl" onClick={payNow} disabled={paying}>
{paying ? 'Opening payment...' : 'Pay now'}</Button>
        </Card>
      )}
      {b.status === 'COMPLETED' && (
      <p className="mb-5 rounded-xl border border-line bg-white p-4 sm:p-5">
<Link to="/customer/reviews" className="font-semibold text-brand underline underline-offset-4 hover:text-brand-dark transition-colors"
>Rate this service</Link></p>
      )}

    <Card className="mb-6 p-4 sm:p-6 lg:p-7 rounded-2xl border border-line shadow-sm">
  <h2 className="text-xl sm:text-2xl font-extrabold mb-5 pb-3 border-b border-line">
    Booking progress
  </h2>
  <ol className="flex flex-col gap-4">
          {b.statusHistory.map((h, i) => (
            <li key={i} className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 rounded-xl bg-gray-50 p-3 sm:p-4"><StatusBadge status={h.to} /><span className="text-sm text-ink-muted">{prettyDateTime(h.at)}</span></li>
          ))}
        </ol>
      </Card>

      {CANCELLABLE.includes(b.status) && (
    <Button
  className="w-full sm:w-auto min-h-[46px] justify-center rounded-xl"
  variant="secondary"
  onClick={() => { setCancelError(''); setOpen(true); }}
>Cancel booking</Button>
      )}

      <ConfirmDialog open={open} title="Cancel this booking?" confirmLabel="Yes, cancel booking" cancelLabel="Keep booking"
        onConfirm={doCancel} onCancel={() => setOpen(false)} busy={busy}>
        {policy && <p className="text-sm text-ink-muted mb-3">Free cancellation until {policy.freeHoursBefore} hours before your slot. After that a {policy.feePercent}% fee applies. The final fee is shown once you confirm.</p>}
        {cancelError && <div className="mb-3"><Alert>{cancelError}</Alert></div>}
        <label htmlFor="reason" className="block text-sm font-semibold text-ink-muted mb-1">Reason (optional)</label>
        <textarea id="reason" rows={3} maxLength={300} value={reason} onChange={(e) => setReason(e.target.value)}
          className="w-full min-h-[110px] px-3 py-3 rounded-xl border border-line bg-white text-sm sm:text-base focus:outline-none focus:ring-2 focus:ring-brand resize-y" />
      </ConfirmDialog>
    </div>
  );
}