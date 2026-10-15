import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Button } from '../../components/ui.jsx';
import { Alert } from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDateTime } from '../../utils/format.js';

const FILTERS = { '': {}, refundDue: { refundDue: 'true' }, razorpay: { provider: 'razorpay' }, cash: { provider: 'cash' }, refunded: { status: 'refunded' } };

export default function AdminPayments() {
  const [filter, setFilter] = useState('');
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/admin/payments', { page, ...FILTERS[filter] });
  const [target, setTarget] = useState(null);
  const [notice, setNotice] = useState('');
  const act = useAction();

  const refundAmount = (p) => Math.max(0, p.amount - (p.booking?.cancellation?.fee || 0));
  const due = (p) => p.status === 'paid' && p.provider === 'razorpay' && p.booking?.paymentStatus === 'refund_pending';
  const refund = async () => {
    if (await act.run(() => api.post(`/admin/payments/${target._id}/refund`))) { setTarget(null); setNotice('Refund processed'); reload(); }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Payments</h1>
      <div className="max-w-xs mb-6">
        <Select label="Show" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
          <option value="">All payments</option>
          <option value="refundDue">Refunds due</option>
          <option value="razorpay">Online payments</option>
          <option value="cash">Cash payments</option>
          <option value="refunded">Refunded</option>
        </Select>
      </div>
      {notice && <div role="status" className="mb-4 rounded-[10px] bg-brand-tint p-3 font-semibold text-brand-dark">{notice}</div>}
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <EmptyState title="No payments found">Payments appear here when customers pay or jobs are paid in cash.</EmptyState>}
      {data && data.items.length > 0 && (
        <div className="overflow-x-auto bg-white border border-line rounded-card">
          <table className="w-full min-w-[820px] text-left">
            <thead className="text-sm text-ink-muted"><tr>{['Date', 'Booking', 'Customer', 'Method', 'Amount', 'Status', 'Action'].map((h) => <th key={h} scope="col" className="p-3">{h}</th>)}</tr></thead>
            <tbody>
              {data.items.map((p) => (
                <tr key={p._id} className="border-t border-line align-top">
                  <td className="p-3">{prettyDateTime(p.createdAt)}</td>
                  <td className="p-3 font-semibold">{p.booking?.bookingNo}</td>
                  <td className="p-3">{p.customer?.name}</td>
                  <td className="p-3">{p.provider === 'cash' ? 'Cash' : 'Razorpay'}</td>
                  <td className="p-3">{inr(p.amount)}</td>
                  <td className="p-3">
                    {p.status === 'refunded' ? `Refunded ${inr(p.refundAmount)}` : due(p) ? <span className="font-semibold text-[#B45309]">Refund due</span> : p.status}
                  </td>
                  <td className="p-3">{due(p) && <Button onClick={() => { act.setError(''); setTarget(p); }}>Refund</Button>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <Pagination data={data} onPage={setPage} />

      <ConfirmDialog open={!!target} title={`Refund ${target?.booking?.bookingNo}?`} confirmLabel="Issue refund" cancelLabel="Not now" onConfirm={refund} onCancel={() => setTarget(null)} busy={act.busy}>
        {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
        {target && (
          <p className="text-ink-muted">
            Paid {inr(target.amount)}, cancellation fee {inr(target.booking?.cancellation?.fee || 0)}. You will refund <strong>{inr(refundAmount(target))}</strong> to the customer through Razorpay.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}