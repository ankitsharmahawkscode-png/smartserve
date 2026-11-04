import { useState } from 'react';
import api from '../../api/client.js';
import useFetch from '../../hooks/useFetch.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { Card, StatusBadge } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { inr, prettyDate, prettySlot, todayYMD } from '../../utils/format.js';

const OPEN = ['ASSIGNED', 'ACCEPTED', 'IN_PROGRESS'];

const Stat = ({ label, value, sub, tone = 'bg-brand-tint text-brand-dark', valueCls = '', children }) => (
  <Card className="min-w-0 p-4 sm:p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink-muted">{label}</p>
        <p className={`mt-3 break-words text-3xl font-extrabold sm:text-4xl ${valueCls}`}>{value}</p>
      </div>
      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${tone}`} aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" className="h-5 w-5">{children}</svg>
      </div>
    </div>
    <p className="mt-3 text-xs text-ink-muted">{sub}</p>
  </Card>
);

export default function TechOverview() {
  const { user, setUser } = useAuth();
  const jobs = useFetch('/tech/jobs', { limit: 50 });
  const earn = useFetch('/tech/earnings');
  const [available, setAvailable] = useState(!!user?.technician?.isAvailable);
  const [toggling, setToggling] = useState(false);
  const [toggleErr, setToggleErr] = useState('');

  if (jobs.loading || earn.loading) return <div className="flex justify-center p-10"><Spinner /></div>;

  if (jobs.error || earn.error || !jobs.data || !earn.data) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-6 sm:px-6 sm:py-8">
        <ErrorState
          message={jobs.error || earn.error || 'Could not load your dashboard'}
          onRetry={() => { jobs.reload(); earn.reload(); }}
        />
      </main>
    );
  }

  const items = jobs.data.items || [];
  const totals = earn.data.totals || {};
  const waiting = items.filter((j) => j.status === 'ASSIGNED').length;
  const active = items.filter((j) => ['ACCEPTED', 'IN_PROGRESS'].includes(j.status)).length;
  const today = todayYMD();
  const todayCount = items.filter((j) => j.date === today && OPEN.includes(j.status)).length;

  // Soonest first
  const next = items
    .filter((j) => OPEN.includes(j.status))
    .sort((a, b) => `${a.date}${a.slot}`.localeCompare(`${b.date}${b.slot}`))
    .slice(0, 5);

  const toggleAvailability = async () => {
    const value = !available;
    setAvailable(value);
    setToggling(true);
    setToggleErr('');
    try {
      await api.put('/tech/availability', { isAvailable: value });
      if (typeof setUser === 'function') {
        setUser((u) => ({ ...u, technician: { ...u.technician, isAvailable: value } }));
      }
    } catch (err) {
      setAvailable(!value);
      setToggleErr(err.response?.data?.message || 'Could not update availability');
    } finally {
      setToggling(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10">
        {/* Welcome */}
        <section className="mb-6 rounded-2xl bg-brand-dark p-5 text-white sm:mb-8 sm:p-7 lg:p-8">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="mb-2 text-xs font-bold uppercase tracking-widest text-white/70 sm:text-sm">Technician dashboard</p>
              <h1 className="break-words text-2xl font-extrabold tracking-tight sm:text-3xl lg:text-4xl">
                Welcome, {user?.name}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-white/80 sm:text-base">
                Review your assignments, manage active jobs, and keep track of your earnings.
              </p>
              <div className="mt-5 w-full sm:inline-block sm:w-auto [&_a]:w-full [&_a]:justify-center">
                <LinkButton to="/technician/jobs">View assigned jobs</LinkButton>
              </div>
            </div>

            <div className="shrink-0 rounded-xl bg-white/10 p-4 sm:min-w-[210px]">
              <p className="text-xs font-bold uppercase tracking-wide text-white/70">Your status</p>
              <div className="mt-2 flex items-center justify-between gap-4">
                <span className="text-sm font-bold">{available ? 'Available' : 'Unavailable'}</span>
                <button
                  type="button"
                  role="switch"
                  aria-checked={available}
                  aria-label="Available for jobs"
                  disabled={toggling}
                  onClick={toggleAvailability}
                  className={`relative h-7 w-14 rounded-full transition-colors disabled:opacity-60 ${available ? 'bg-green-500' : 'bg-white/30'}`}
                >
                  <span className={`absolute left-1 top-1 h-5 w-5 rounded-full bg-white shadow transition-transform ${available ? 'translate-x-7' : ''}`} />
                </button>
              </div>
              <p className="mt-2 text-[11px] leading-snug text-white/60">New jobs are only assigned while you are available.</p>
              {toggleErr && <p className="mt-2 text-[11px] font-semibold text-red-200">{toggleErr}</p>}
            </div>
          </div>
        </section>

        {/* Jobs waiting banner */}
        {waiting > 0 && (
          <div className="mb-6 flex flex-col gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-semibold text-amber-900">
              You have {waiting} {waiting === 1 ? 'job' : 'jobs'} waiting for your response.
            </p>
            <div className="[&_a]:w-full [&_a]:justify-center sm:w-auto">
              <LinkButton to="/technician/jobs">Respond now</LinkButton>
            </div>
          </div>
        )}

        {/* Summary */}
        <section aria-label="Job and earnings summary" className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Stat
            label="Waiting for response"
            value={waiting}
            valueCls={waiting ? 'text-[#B45309]' : ''}
            tone="bg-amber-50 text-amber-700"
            sub="Jobs awaiting your decision"
          >
            <circle cx="12" cy="12" r="9" />
            <path strokeLinecap="round" d="M12 7v5l3 2" />
          </Stat>
          <Stat label="Active jobs" value={active} sub="Accepted or in progress">
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4" />
            <circle cx="12" cy="12" r="9" />
          </Stat>
          <Stat label="Jobs today" value={todayCount} tone="bg-sky-50 text-sky-700" sub="Scheduled for today">
            <rect x="3" y="4" width="18" height="18" rx="2" />
            <path strokeLinecap="round" d="M16 2v4M8 2v4M3 10h18" />
          </Stat>
          <Stat
            label="Earned this month"
            value={inr(totals.thisMonth || 0)}
            tone="bg-green-50 text-green-700"
            sub={`${totals.thisMonthJobs || 0} completed this month`}
          >
            <rect x="3" y="5" width="18" height="14" rx="2" />
            <path strokeLinecap="round" d="M7 12h.01M17 12h.01M12 9v6" />
          </Stat>
        </section>

        {/* Next jobs */}
        <section aria-labelledby="next-jobs-heading">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h2 id="next-jobs-heading" className="text-xl font-extrabold sm:text-2xl">Next jobs</h2>
              <p className="mt-1 text-sm text-ink-muted">Your upcoming jobs, soonest first.</p>
            </div>
            {next.length > 0 && (
              <div className="w-full sm:w-auto [&_a]:w-full [&_a]:justify-center">
                <LinkButton to="/technician/jobs" variant="secondary">View all jobs</LinkButton>
              </div>
            )}
          </div>

          {next.length === 0 ? (
            <EmptyState title="No upcoming jobs">New assignments will appear here.</EmptyState>
          ) : (
            <ul className="flex flex-col gap-3 sm:gap-4">
              {next.map((j) => (
                <li key={j._id} className="min-w-0">
                  <Card className="min-w-0 p-4 sm:p-5">
                    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                      <div className="min-w-0 flex-1">
                        <p className="mb-1 flex flex-wrap items-center gap-2 text-xs font-semibold text-ink-muted">
                          Booking {j.bookingNo}
                          {j.date === today && (
                            <span className="rounded-full bg-sky-100 px-2 py-0.5 text-[10px] font-bold text-sky-800">TODAY</span>
                          )}
                        </p>
                        <h3 className="break-words text-base font-extrabold sm:text-lg">{j.service?.name}</h3>
                        <div className="mt-3 flex flex-col gap-2">
                          <p className="break-words text-sm text-ink-muted">📅 {prettyDate(j.date)}, {prettySlot(j.slot)}</p>
                          <p className="break-words text-sm text-ink-muted">📍 {j.address?.city || '—'}</p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3 border-t border-line pt-3 sm:border-0 sm:pt-0 md:flex-row md:items-center">
                        <div className="self-start"><StatusBadge status={j.status} /></div>
                        <div className="w-full sm:w-auto sm:min-w-[110px] [&_a]:w-full [&_a]:justify-center">
                          <LinkButton variant="secondary" to={`/technician/jobs/${j._id}`} aria-label={`Open job ${j.bookingNo}`}>
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