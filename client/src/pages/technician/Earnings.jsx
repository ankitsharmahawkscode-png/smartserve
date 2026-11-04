import { useMemo, useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Card } from '../../components/ui.jsx';
import { Select } from '../../components/Fields.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';
import {
  PageCard, DataTable, TableFooter, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const PAGE_SIZE = 10;

const monthLabel = (m) =>
  new Date(`${m}-01T00:00:00`).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });

const csvCell = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;

const StatCard = ({ label, value, sub, children }) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm text-ink-muted">{label}</p>
        <p className="mt-2 break-words text-2xl font-extrabold sm:text-3xl">{value}</p>
        {sub && <p className="mt-2 text-sm text-ink-muted">{sub}</p>}
      </div>
      <div
        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand-tint text-brand-dark"
        aria-hidden="true"
      >
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-6 w-6">
          {children}
        </svg>
      </div>
    </div>
  </Card>
);

export default function Earnings() {
  const { data, loading, error, reload } = useFetch('/tech/earnings');
  const [month, setMonth] = useState('');
  const [page, setPage] = useState(1);

  const totals = data?.totals || {};
  const commissionPct = data?.commissionPct ?? 0;

  // Newest first
  const all = useMemo(
    () => [...(data?.items || [])].sort((a, b) => `${b.date}${b.slot}`.localeCompare(`${a.date}${a.slot}`)),
    [data]
  );

  const months = useMemo(
    () => [...new Set(all.map((i) => String(i.date || '').slice(0, 7)).filter(Boolean))],
    [all]
  );

  const items = month ? all.filter((i) => String(i.date).startsWith(month)) : all;
  const filteredEarned = items.reduce((sum, i) => sum + (Number(i.earning) || 0), 0);

  const avg = totals.jobs ? (totals.earned || 0) / totals.jobs : 0;

  // Pagination (client side)
  const total = items.length;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const current = Math.min(page, totalPages);
  const startIdx = (current - 1) * PAGE_SIZE;
  const pageItems = items.slice(startIdx, startIdx + PAGE_SIZE);

  const downloadCsv = () => {
    const head = ['Booking', 'Service', 'Date', 'Slot', 'Job amount', 'Your earning'];
    const rows = items.map((i) => [i.bookingNo, i.service, i.date, i.slot, i.gross, i.earning]);
    const csv = [head, ...rows].map((r) => r.map(csvCell).join(',')).join('\n');
    const url = URL.createObjectURL(new Blob([`\ufeff${csv}`], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url;
    a.download = `earnings${month ? `-${month}` : ''}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;

  if (error || !data) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6">
        <ErrorState message={error || 'Could not load earnings'} onRetry={reload} />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        {/* Summary */}
        <section aria-label="Earnings summary" className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Earnings this month"
            value={inr(totals.thisMonth || 0)}
            sub={`${totals.thisMonthJobs || 0} ${totals.thisMonthJobs === 1 ? 'completed job' : 'completed jobs'}`}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 3v18h18M7 14l4-4 4 3 5-7" />
          </StatCard>

          <StatCard
            label="Total earnings"
            value={inr(totals.earned || 0)}
            sub={`${totals.jobs || 0} ${totals.jobs === 1 ? 'completed job' : 'completed jobs'} all time`}
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M12 14h.01" />
          </StatCard>

          <StatCard label="Average per job" value={inr(Math.round(avg))} sub="Based on all completed jobs">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </StatCard>

          <StatCard label="Your commission" value={`${commissionPct}%`} sub="Of each job amount">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 5 5 19M7 7h.01M17 17h.01" />
          </StatCard>
        </section>

        <PageCard
          title="Earnings History"
          subtitle="Your earnings from completed jobs."
          action={
            <button
              type="button"
              onClick={downloadCsv}
              disabled={items.length === 0}
              className="inline-flex items-center justify-center gap-2 rounded bg-cyan-400 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-cyan-500 disabled:opacity-50"
            >
              ↓ Download CSV
            </button>
          }
        >
          {all.length === 0 ? (
            <EmptyState title="No completed jobs yet">
              Your earnings history will appear here after you complete a job.
            </EmptyState>
          ) : (
            <>
              {/* Filter + period total */}
              <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div className="w-full sm:max-w-xs">
                  <Select label="Month" value={month} onChange={(e) => { setMonth(e.target.value); setPage(1); }}>
                    <option value="">All months</option>
                    {months.map((m) => <option key={m} value={m}>{monthLabel(m)}</option>)}
                  </Select>
                </div>
                <p className="text-sm text-gray-600">
                  {total} {total === 1 ? 'job' : 'jobs'} ·{' '}
                  <span className="font-bold text-brand-dark">{inr(filteredEarned)}</span> earned
                  {month ? ` in ${monthLabel(month)}` : ''}
                </p>
              </div>

              {items.length === 0 ? (
                <EmptyState title="No jobs in this month">Pick another month to see your jobs.</EmptyState>
              ) : (
                <>
                  {/* Mobile: cards */}
                  <div className="grid grid-cols-1 gap-3 md:hidden">
                    {pageItems.map((item, i) => (
                      <Card key={item._id} className="p-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <p className="text-xs text-ink-muted">#{startIdx + i + 1} · Booking</p>
                            <p className="break-words font-bold">{item.bookingNo}</p>
                          </div>
                          <div className="shrink-0 text-right">
                            <p className="text-xs text-ink-muted">Your earning</p>
                            <p className="text-lg font-extrabold text-brand-dark">{inr(item.earning)}</p>
                          </div>
                        </div>
                        <div className="my-3 border-t border-line" />
                        <p className="break-words font-semibold">{item.service}</p>
                        <p className="mt-1 text-sm text-ink-muted">
                          {prettyDate(item.date)} · {prettySlot(item.slot)}
                        </p>
                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="text-sm text-ink-muted">Job amount</span>
                          <span className="text-sm font-semibold">{inr(item.gross)}</span>
                        </div>
                      </Card>
                    ))}
                  </div>

                  {/* Tablet and desktop: table */}
                  <div className="hidden md:block">
                    <DataTable
                      minWidth={760}
                      columns={['S.No', 'Booking', 'Service', 'Date', 'Time slot', 'Job amount', 'Your earning']}
                    >
                      {pageItems.map((item, i) => (
                        <tr key={item._id} className={rowCls}>
                          <td className={td}>{startIdx + i + 1}</td>
                          <td className={`${td} whitespace-nowrap font-semibold text-gray-800`}>{item.bookingNo}</td>
                          <td className={td}>{item.service}</td>
                          <td className={`${td} whitespace-nowrap`}>{prettyDate(item.date)}</td>
                          <td className={`${td} whitespace-nowrap`}>{prettySlot(item.slot)}</td>
                          <td className={`${td} whitespace-nowrap`}>{inr(item.gross)}</td>
                          <td className={`${tdLast} whitespace-nowrap font-bold text-brand-dark`}>{inr(item.earning)}</td>
                        </tr>
                      ))}
                    </DataTable>
                  </div>

                  <TableFooter
                    page={current}
                    onPage={setPage}
                    total={total}
                    perPage={PAGE_SIZE}
                    totalPages={totalPages}
                    shown={pageItems.length}
                  />
                </>
              )}
            </>
          )}
        </PageCard>
      </div>
    </main>
  );
}