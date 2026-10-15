import { useState } from 'react';
import useFetch from '../../hooks/useFetch.js';
import { Card, StatusBadge } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import Pagination from '../../components/Pagination.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate, prettySlot } from '../../utils/format.js';

export default function JobList({ history = false }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/tech/jobs', { page, scope: history ? 'history' : undefined });

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-10">

        {/* Page heading */}
        <div className="mb-6 sm:mb-8">
          <p className="text-xs sm:text-sm font-bold uppercase tracking-widest text-ink-muted mb-2">
            Technician workspace
          </p>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight">
            {history ? 'Job history' : 'Assigned jobs'}
          </h1>
          <p className="text-sm sm:text-base text-ink-muted mt-2">
            {history
              ? 'Review your completed and cancelled jobs.'
              : 'View job details and manage your current assignments.'}
          </p>
        </div>

        {loading && <Spinner />}

        {error && <ErrorState message={error} onRetry={reload} />}

        {data && data.items.length === 0 && (
          <EmptyState title={history ? 'No finished jobs yet' : 'No jobs assigned'}>
            {history
              ? 'Completed and cancelled jobs appear here.'
              : 'New assignments will appear here.'}
          </EmptyState>
        )}

        {data && data.items.length > 0 && (
          <ul className="flex flex-col gap-4">
            {data.items.map((j) => (
              <li key={j._id} className="min-w-0">
                <Card className="p-4 sm:p-5 lg:p-6">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">

                    {/* Job information */}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <span className="text-xs sm:text-sm font-semibold text-ink-muted">
                          Booking ID
                        </span>
                        <span className="text-xs sm:text-sm font-bold break-all">
                          {j.bookingNo}
                        </span>
                      </div>

                      <h2 className="text-lg sm:text-xl font-extrabold break-words">
                        {j.service?.name}
                      </h2>

                      <div className="flex flex-col gap-2 mt-3">
                        <p className="flex flex-wrap items-center gap-2 text-sm text-ink-muted">
                          <span aria-hidden="true">📅</span>
                          <span>{prettyDate(j.date)}, {prettySlot(j.slot)}</span>
                        </p>

                        <p className="flex items-start gap-2 text-sm text-ink-muted break-words">
                          <span aria-hidden="true">👤</span>
                          <span className="min-w-0">
                            {j.customer?.name}
                          </span>
                        </p>

                        <p className="flex items-start gap-2 text-sm text-ink-muted break-words">
                          <span aria-hidden="true">📍</span>
                          <span className="min-w-0">
                            {[j.address.line1, j.address.city].filter(Boolean).join(', ')}
                          </span>
                        </p>
                      </div>
                    </div>

                    {/* Status and action */}
                    <div className="flex flex-col xs:flex-row sm:flex-col lg:flex-row sm:items-stretch lg:items-center gap-3 pt-3 sm:pt-0 border-t border-line sm:border-0">
                      <div className="flex items-center">
                        <StatusBadge status={j.status} />
                      </div>

                      <div className="[&_a]:w-full [&_a]:justify-center sm:min-w-[120px]">
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

        {/* Pagination */}
        {data && data.items.length > 0 && (
          <div className="mt-6 sm:mt-8 overflow-x-auto">
            <Pagination data={data} onPage={setPage} />
          </div>
        )}
      </div>
    </main>
  );
}