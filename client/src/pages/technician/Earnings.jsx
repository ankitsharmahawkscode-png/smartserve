import useFetch from '../../hooks/useFetch.js';
import { Card } from '../../components/ui.jsx';
import {
  EmptyState,
  ErrorState,
  Spinner,
} from '../../components/States.jsx';
import {
  inr,
  prettyDate,
  prettySlot,
} from '../../utils/format.js';

export default function Earnings() {
  const {
    data,
    loading,
    error,
    reload,
  } = useFetch('/tech/earnings');

  if (loading) return <Spinner />;

  if (error) {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        <ErrorState message={error} onRetry={reload} />
      </div>
    );
  }

  const { totals, items, commissionPct } = data;

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">

        {/* Page Header */}
        <header className="mb-6">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-wider text-brand mb-2">
            Technician dashboard
          </p>

          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Earnings
          </h1>

          <p className="text-sm sm:text-base text-ink-muted mt-2">
            Track your completed jobs and earnings in one place.
          </p>

          <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-brand-tint px-3 py-2">
            <span className="text-sm text-brand-dark">
              Your commission rate
            </span>
            <span className="text-sm font-extrabold text-brand-dark">
              {commissionPct}%
            </span>
          </div>
        </header>

        {/* Earnings Summary */}
        <section
          aria-label="Earnings summary"
          className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-7"
        >
          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-muted">
                  Earnings this month
                </p>

                <p className="text-2xl sm:text-3xl font-extrabold mt-2 break-words">
                  {inr(totals.thisMonth)}
                </p>

                <p className="text-sm text-ink-muted mt-2">
                  {totals.thisMonthJobs}{' '}
                  {totals.thisMonthJobs === 1 ? 'completed job' : 'completed jobs'}
                </p>
              </div>

              <div
                className="shrink-0 w-11 h-11 rounded-xl bg-brand-tint
                  text-brand-dark flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-6 h-6"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 3v18h18M7 14l4-4 4 3 5-7"
                  />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-5 sm:p-6">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm text-ink-muted">
                  Total earnings
                </p>

                <p className="text-2xl sm:text-3xl font-extrabold mt-2 break-words">
                  {inr(totals.earned)}
                </p>

                <p className="text-sm text-ink-muted mt-2">
                  {totals.jobs}{' '}
                  {totals.jobs === 1 ? 'completed job' : 'completed jobs'} all time
                </p>
              </div>

              <div
                className="shrink-0 w-11 h-11 rounded-xl bg-brand-tint
                  text-brand-dark flex items-center justify-center"
                aria-hidden="true"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.8"
                  className="w-6 h-6"
                >
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M3 10h18M12 14h.01"
                  />
                </svg>
              </div>
            </div>
          </Card>
        </section>

        {/* Earnings History */}
        <section aria-labelledby="earnings-history">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-4">
            <div>
              <h2
                id="earnings-history"
                className="text-xl sm:text-2xl font-extrabold"
              >
                Earnings history
              </h2>

              <p className="text-sm text-ink-muted mt-1">
                Your earnings from completed jobs.
              </p>
            </div>

            <span className="text-sm text-ink-muted">
              {items.length} {items.length === 1 ? 'record' : 'records'}
            </span>
          </div>

          {items.length === 0 ? (
            <Card className="p-5 sm:p-8">
              <EmptyState title="No completed jobs yet">
                Your earnings history will appear here after you complete a job.
              </EmptyState>
            </Card>
          ) : (
            <>
              {/* Mobile Layout */}
              <div className="grid grid-cols-1 gap-3 md:hidden">
                {items.map((item) => (
                  <Card key={item._id} className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-xs text-ink-muted">
                          Booking
                        </p>

                        <p className="font-bold break-words">
                          {item.bookingNo}
                        </p>
                      </div>

                      <div className="text-right shrink-0">
                        <p className="text-xs text-ink-muted">
                          Your earning
                        </p>

                        <p className="text-lg font-extrabold text-brand-dark">
                          {inr(item.earning)}
                        </p>
                      </div>
                    </div>

                    <div className="border-t border-line my-3" />

                    <p className="font-semibold break-words">
                      {item.service}
                    </p>

                    <p className="text-sm text-ink-muted mt-1">
                      {prettyDate(item.date)} · {prettySlot(item.slot)}
                    </p>

                    <div className="mt-3 flex items-center justify-between gap-3">
                      <span className="text-sm text-ink-muted">
                        Job amount
                      </span>

                      <span className="text-sm font-semibold">
                        {inr(item.gross)}
                      </span>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Tablet and Desktop Table */}
              <div className="hidden md:block overflow-x-auto bg-white border border-line rounded-xl">
                <table className="w-full text-left">
                  <thead className="bg-gray-50 text-xs uppercase tracking-wide text-ink-muted">
                    <tr>
                      <th scope="col" className="px-4 py-4 font-bold">
                        Booking
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        Service
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        Date and time
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        Job amount
                      </th>
                      <th scope="col" className="px-4 py-4 font-bold">
                        Your earning
                      </th>
                    </tr>
                  </thead>

                  <tbody>
                    {items.map((item) => (
                      <tr
                        key={item._id}
                        className="border-t border-line hover:bg-gray-50/70 transition-colors"
                      >
                        <td className="px-4 py-4 text-sm font-semibold">
                          {item.bookingNo}
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {item.service}
                        </td>

                        <td className="px-4 py-4">
                          <p className="text-sm">
                            {prettyDate(item.date)}
                          </p>
                          <p className="text-xs text-ink-muted mt-1">
                            {prettySlot(item.slot)}
                          </p>
                        </td>

                        <td className="px-4 py-4 text-sm">
                          {inr(item.gross)}
                        </td>

                        <td className="px-4 py-4 text-sm font-bold text-brand-dark">
                          {inr(item.earning)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </section>
      </div>
    </main>
  );
}