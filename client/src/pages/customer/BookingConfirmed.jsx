import { Link, Navigate, useLocation } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import { inr, prettyDate, prettySlot } from '../../utils/format.js';

export default function BookingConfirmed() {
  const { state } = useLocation();
  useSeo({ title: 'Bookings received', noindex: true });

  const list = state?.bookings;
  if (!Array.isArray(list) || list.length === 0) return <Navigate to="/customer/bookings" replace />;

  const total = list.reduce((sum, b) => sum + (Number(b.price) || 0), 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6 sm:py-12">
      <div className="text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 text-3xl text-green-700" aria-hidden="true">✓</div>
        <h1 className="text-2xl font-extrabold sm:text-3xl">{list.length} services booked</h1>
        <p className="mx-auto mt-2 max-w-md text-ink-muted">
          We will confirm each booking shortly. You can follow them one by one.
        </p>
        {state?.date && (
          <p className="mt-3 inline-block rounded-full bg-gray-100 px-4 py-1.5 text-sm font-semibold">
            {prettyDate(state.date)}{state.slot ? `, ${prettySlot(state.slot)}` : ''}
          </p>
        )}
      </div>

      <ul className="mt-8 flex flex-col gap-3">
        {list.map((b) => (
          <li key={b._id} className="flex flex-col gap-3 rounded-xl border border-line p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ink-muted">{b.bookingNo}</p>
              <p className="font-bold">{b.name}</p>
              <p className="text-sm text-ink-muted">{inr(b.price)}</p>
            </div>
            <Link
              to={`/customer/bookings/${b._id}`}
              className="shrink-0 rounded-full border border-brand px-5 py-2 text-center text-sm font-bold text-brand hover:bg-brand-tint"
            >
              View booking
            </Link>
          </li>
        ))}
      </ul>

      <div className="mt-4 flex items-center justify-between rounded-xl bg-gray-50 p-4">
        <span className="font-bold">Total (before any discount)</span>
        <span className="text-xl font-extrabold text-brand-dark">{inr(total)}</span>
      </div>

      <p className="mt-4 text-sm leading-relaxed text-ink-muted">
        Each service is a separate booking with its own technician, status and payment. If you chose online payment,
        pay from each booking page.
      </p>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to="/customer/bookings" className="rounded-full bg-brand px-6 py-3 text-center text-sm font-bold text-white hover:bg-brand-dark">
          My bookings
        </Link>
        <Link to="/services" className="rounded-full border border-line-strong px-6 py-3 text-center text-sm font-bold hover:bg-gray-50">
          Book another service
        </Link>
      </div>
    </div>
  );
}