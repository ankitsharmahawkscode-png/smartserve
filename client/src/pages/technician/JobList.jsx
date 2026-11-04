import { useState } from 'react';
import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { Card, StatusBadge } from '../../components/ui.jsx';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate, prettySlot } from '../../utils/format.js';
import {
  PageCard, DataTable, TableFooter, serverPaging,
  EyeIcon, actionBtn, rowCls, td, tdLast,
} from '../../components/TableParts.jsx';

const mapUrl = (a = {}) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
    [a.line1, a.line2, a.city, a.pincode].filter(Boolean).join(', ')
  )}`;

const PinIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-4 w-4">
    <path d="M12 21s-7-6.2-7-11a7 7 0 0 1 14 0c0 4.8-7 11-7 11Z" />
    <circle cx="12" cy="10" r="2.5" />
  </svg>
);

const shortAddress = (a = {}) => [a.line1, a.city].filter(Boolean).join(', ') || '—';

export default function JobList({ history = false }) {
  const [page, setPage] = useState(1);
  const { data, loading, error, reload } = useFetch('/tech/jobs', {
    page,
    scope: history ? 'history' : undefined,
  });

  const items = data?.items || [];
  const { perPage, total, totalPages } = serverPaging(data, items.length);
  const startIdx = (page - 1) * perPage;

  return (
    <main className="min-h-screen bg-gray-50/70">
      <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8">
        <PageCard
          title={history ? 'Job History' : 'Assigned Jobs'}
          subtitle={
            history
              ? 'Review your completed and cancelled jobs.'
              : 'View job details and manage your current assignments.'
          }
        >
          {loading && <Spinner />}
          {error && <ErrorState message={error} onRetry={reload} />}

          {data && items.length === 0 && (
            <EmptyState title={history ? 'No finished jobs yet' : 'No jobs assigned'}>
              {history ? 'Completed and cancelled jobs appear here.' : 'New assignments will appear here.'}
            </EmptyState>
          )}

          {data && items.length > 0 && (
            <>
              {/* Phones: cards */}
              <ul className="flex flex-col gap-3 md:hidden">
                {items.map((j) => (
                  <li key={j._id}>
                    <Card className="p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="text-xs text-ink-muted">Booking {j.bookingNo}</p>
                          <h2 className="break-words text-lg font-extrabold">{j.service?.name}</h2>
                        </div>
                        <StatusBadge status={j.status} />
                      </div>
                      <p className="mt-3 text-sm text-ink-muted">📅 {prettyDate(j.date)}, {prettySlot(j.slot)}</p>
                      <p className="mt-1 text-sm text-ink-muted">👤 {j.customer?.name || '—'}</p>
                      <p className="mt-1 break-words text-sm text-ink-muted">📍 {shortAddress(j.address)}</p>
                      <div className="mt-4 flex gap-2 border-t border-line pt-3">
                        <Link
                          to={`/technician/jobs/${j._id}`}
                          className="flex-1 rounded-lg bg-brand py-2.5 text-center text-sm font-bold text-white hover:bg-brand-dark"
                        >
                          Open job →
                        </Link>
                        <a
                          href={mapUrl(j.address)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-lg border border-line-strong px-4 py-2.5 text-sm font-bold text-gray-700 hover:bg-gray-50"
                        >
                          Map
                        </a>
                      </div>
                    </Card>
                  </li>
                ))}
              </ul>

              {/* Tablet and desktop: table */}
              <div className="hidden md:block">
                <DataTable
                  minWidth={950}
                  columns={['S.No', 'Booking', 'Service', 'When', 'Customer', 'Address', 'Status', 'Action']}
                >
                  {items.map((j, i) => (
                    <tr key={j._id} className={rowCls}>
                      <td className={td}>{startIdx + i + 1}</td>
                      <td className={`${td} whitespace-nowrap font-semibold text-gray-800`}>{j.bookingNo}</td>
                      <td className={td}>{j.service?.name || '—'}</td>
                      <td className={`${td} whitespace-nowrap`}>
                        {prettyDate(j.date)}
                        <span className="block text-gray-500">{prettySlot(j.slot)}</span>
                      </td>
                      <td className={td}>{j.customer?.name || '—'}</td>
                      <td className={`${td} max-w-[240px]`}>{shortAddress(j.address)}</td>
                      <td className={td}><StatusBadge status={j.status} /></td>
                      <td className={tdLast}>
                        <div className="flex gap-1.5">
                          <Link
                            to={`/technician/jobs/${j._id}`}
                            title="Open job"
                            aria-label={`Open job ${j.bookingNo}`}
                            className={`${actionBtn} bg-[#5bc0a5]`}
                          >
                            <EyeIcon />
                          </Link>
                          <a
                            href={mapUrl(j.address)}
                            target="_blank"
                            rel="noopener noreferrer"
                            title="Open in maps"
                            aria-label="Open in maps"
                            className={`${actionBtn} bg-amber-400`}
                          >
                            <PinIcon />
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </DataTable>
              </div>

              <TableFooter
                page={page}
                onPage={setPage}
                total={total}
                perPage={perPage}
                totalPages={totalPages}
                shown={items.length}
              />
            </>
          )}
        </PageCard>
      </div>
    </main>
  );
}