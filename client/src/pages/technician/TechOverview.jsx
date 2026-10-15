import useFetch from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, StatusBadge } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';

export default function TechOverview() {
  const { user } = useAuth();
  const jobs = useFetch('/tech/jobs', { limit: 50 });
  const earn = useFetch('/tech/earnings');

  if (jobs.loading || earn.loading) return <Spinner />;

  if (jobs.error || earn.error) {
    return (
      <main className="w-full max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ErrorState
          message={jobs.error || earn.error}
          onRetry={() => { jobs.reload(); earn.reload(); }}
        />
      </main>
    );
  }

  const items = jobs.data.items;
  const waiting = items.filter((j) => j.status === 'ASSIGNED').length;
  const active = items.filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length;

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="w-full max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Welcome header */}
        <section className="rounded-2xl bg-brand-dark text-white p-5 sm:p-7 lg:p-8 mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-white/70 mb-2">
            Technician dashboard
          </p>

          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight break-words">
            Welcome, {user.name}
          </h1>

          <p className="text-sm sm:text-base text-white/80 mt-3 max-w-2xl leading-relaxed">
            Review your assignments, manage active jobs, and keep track of your earnings.
          </p>

          <div className="mt-5 w-full sm:w-auto sm:inline-block [&_a]:w-full [&_a]:justify-center">
            <LinkButton to="/technician/jobs">
              View assigned jobs
            </LinkButton>
          </div>
        </section>

        {/* Summary cards */}
        <section aria-label="Job and earnings summary">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">

            <Card className="p-4 sm:p-5 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-muted leading-relaxed">
                    Waiting for your response
                  </p>
                  <p className={`text-3xl sm:text-4xl font-extrabold mt-3 ${waiting ? 'text-[#B45309]' : ''}`}>
                    {waiting}
                  </p>
                </div>

                <div className="shrink-0 w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
                    <circle cx="12" cy="12" r="9" />
                    <path strokeLinecap="round" d="M12 7v5l3 2" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-3">Jobs awaiting your decision</p>
            </Card>

            <Card className="p-4 sm:p-5 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-muted">
                    Active jobs
                  </p>
                  <p className="text-3xl sm:text-4xl font-extrabold mt-3">
                    {active}
                  </p>
                </div>

                <div className="shrink-0 w-10 h-10 rounded-xl bg-brand-tint text-brand-dark flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
                    <circle cx="12" cy="12" r="9" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-3">Accepted or in progress</p>
            </Card>

            <Card className="p-4 sm:p-5 min-w-0 sm:col-span-2 lg:col-span-1">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-ink-muted">
                    Earned this month
                  </p>
                  <p className="text-2xl sm:text-3xl font-extrabold mt-3 break-words">
                    {inr(earn.data.totals.thisMonth)}
                  </p>
                </div>

                <div className="shrink-0 w-10 h-10 rounded-xl bg-green-50 text-green-700 flex items-center justify-center" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="w-5 h-5">
                    <rect x="3" y="5" width="18" height="14" rx="2" />
                    <path strokeLinecap="round" d="M7 12h.01M17 12h.01M12 9v6" />
                  </svg>
                </div>
              </div>
              <p className="text-xs text-ink-muted mt-3">Your monthly earnings</p>
            </Card>

          </div>
        </section>

        {/* Upcoming jobs */}
        <section aria-labelledby="next-jobs-heading">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3 mb-5">
            <div>
              <h2 id="next-jobs-heading" className="text-xl sm:text-2xl font-extrabold">
                Next jobs
              </h2>
              <p className="text-sm text-ink-muted mt-1">
                A quick look at your latest assignments.
              </p>
            </div>

            {items.length > 0 && (
              <div className="w-full sm:w-auto [&_a]:w-full [&_a]:justify-center">
                <LinkButton to="/technician/jobs" variant="secondary">
                  View all jobs
                </LinkButton>
              </div>
            )}
          </div>

          {items.length === 0 ? (
            <EmptyState title="No jobs assigned">
              New assignments will appear here.
            </EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 sm:gap-4">
              {items.slice(0, 5).map((j) => (
                <li key={j._id} className="min-w-0">
                  <Card className="p-4 sm:p-5 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-semibold text-ink-muted mb-1">
                          Booking {j.bookingNo}
                        </p>

                        <h3 className="text-base sm:text-lg font-extrabold break-words">
                          {j.service?.name}
                        </h3>

                        <div className="flex flex-col gap-2 mt-3">
                          <p className="text-sm text-ink-muted break-words">
                            <span aria-hidden="true">📅 </span>
                            {prettyDate(j.date)}, {prettySlot(j.slot)}
                          </p>

                          <p className="text-sm text-ink-muted break-words">
                            <span aria-hidden="true">📍 </span>
                            {j.address.city}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col xs:flex-row sm:flex-col md:flex-row sm:items-start md:items-center gap-3 border-t border-line pt-3 sm:border-0 sm:pt-0">
                        <div className="self-start">
                          <StatusBadge status={j.status} />
                        </div>

                        <div className="w-full sm:w-auto sm:min-w-[110px] [&_a]:w-full [&_a]:justify-center">
                          <LinkButton
                            variant="secondary"
                            to={`/technician/jobs/${j._id}`}
                            aria-label={`Open job ${j.bookingNo}`}
                          >
                            Open job →
                          </LinkButton>
                        </div>
                      </div>

                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          )}
        </section>

      </div>
    </main>
  );
}