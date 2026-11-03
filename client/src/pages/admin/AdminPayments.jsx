import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import useAction from '../../hooks/useAction.js';
import { Alert } from '../../components/Input.jsx';
import { Select } from '../../components/Fields.jsx';
import ConfirmDialog from '../../components/ConfirmDialog.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';
import {
  PageCard, DataTable, TableFooter, serverPaging, fmtDateTime,
  UndoIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const FILTERS = {
  '': {},
  refundDue: { refundDue: 'true' },
  razorpay: { provider: 'razorpay' },
  cash: { provider: 'cash' },
  refunded: { status: 'refunded' },
};

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
    if (await act.run(() => api.post(`/admin/payments/${target._id}/refund`))) {
      setTarget(null);
      setNotice('Refund processed');
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

      <PageCard title="Payments">
        <div className="mb-5 max-w-xs">
          <Select label="Show" value={filter} onChange={(e) => { setFilter(e.target.value); setPage(1); }}>
            <option value="">All payments</option>
            <option value="refundDue">Refunds due</option>
            <option value="razorpay">Online payments</option>
            <option value="cash">Cash payments</option>
            <option value="refunded">Refunded</option>
          </Select>
        </div>

        {loading && <Spinner />}
        {error && <ErrorState message={error} onRetry={reload} />}
        {data && items.length === 0 && (
          <EmptyState title="No payments found">
            Payments appear here when customers pay or jobs are paid in cash.
          </EmptyState>
        )}

        {data && items.length > 0 && (
          <>
            <DataTable
              minWidth={900}
              columns={['S.No', 'Date', 'Booking', 'Customer', 'Method', 'Amount', 'Status', 'Action']}
            >
              {items.map((p, i) => (
                <tr key={p._id} className={rowCls}>
                  <td className={td}>{startIdx + i + 1}</td>
                  <td className={`${td} whitespace-nowrap`}>{fmtDateTime(p.createdAt)}</td>
                  <td className={`${td} font-semibold text-gray-800`}>{p.booking?.bookingNo || '—'}</td>
                  <td className={td}>{p.customer?.name || '—'}</td>
                  <td className={td}>{p.provider === 'cash' ? 'Cash' : 'Razorpay'}</td>
                  <td className={`${td} whitespace-nowrap`}>{inr(p.amount)}</td>
                  <td className={td}>
                    {p.status === 'refunded' ? (
                      <span className="text-gray-700">Refunded {inr(p.refundAmount)}</span>
                    ) : due(p) ? (
                      <span className="font-semibold text-[#B45309]">Refund due</span>
                    ) : (
                      <span className="capitalize">{p.status}</span>
                    )}
                  </td>
                  <td className={tdLast}>
                    {due(p) ? (
                      <button
                        type="button"
                        onClick={() => { act.setError(''); setTarget(p); }}
                        title="Issue refund"
                        aria-label="Issue refund"
                        className={`${actionBtn} bg-amber-500`}
                      >
                        <UndoIcon />
                      </button>
                    ) : (
                      <span className="text-gray-400">—</span>
                    )}
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

      <ConfirmDialog
        open={!!target}
        title={`Refund ${target?.booking?.bookingNo}?`}
        confirmLabel="Issue refund"
        cancelLabel="Not now"
        onConfirm={refund}
        onCancel={() => setTarget(null)}
        busy={act.busy}
      >
        {act.error && <div className="mb-3"><Alert>{act.error}</Alert></div>}
        {target && (
          <p className="text-ink-muted">
            Paid {inr(target.amount)}, cancellation fee {inr(target.booking?.cancellation?.fee || 0)}. You will refund{' '}
            <strong>{inr(refundAmount(target))}</strong> to the customer through Razorpay.
          </p>
        )}
      </ConfirmDialog>
    </div>
  );
}