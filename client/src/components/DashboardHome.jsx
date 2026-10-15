import { Link } from 'react-router-dom';
import useFetch from '../hooks/useFetch.js';
import { useAuth } from '../context/AuthContext.jsx';
import { Card, StatusBadge } from './ui.jsx';
import LinkButton from './LinkButton.jsx';
import { ErrorState, Spinner } from './States.jsx';
import { inr, prettyDate, prettySlot } from '../utils/format.js';

// Customer overview: quick actions and the most recent bookings.
export default function DashboardHome() {
  const { user } = useAuth();
  const { data, loading, error, reload } = useFetch('/bookings', { limit: 5 });
  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-extrabold mb-6">Welcome, {user.name}</h1>
      <div className="grid gap-4 sm:grid-cols-2 mb-8">
        <Card><h2 className="text-xl font-extrabold mb-1">Need a technician?</h2><p className="text-ink-muted mb-4">Pick a service, a date and a time slot.</p><LinkButton to="/services">Book a service</LinkButton></Card>
        <Card><h2 className="text-xl font-extrabold mb-1">Your account</h2><p className="text-ink-muted mb-4">Update your details and saved addresses.</p><LinkButton to="/customer/profile" variant="secondary">Profile and addresses</LinkButton></Card>
      </div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-xl font-extrabold">Recent bookings</h2>
        <Link to="/customer/bookings" className="underline font-semibold text-brand">View all</Link>
      </div>
      {loading && <Spinner />}
      {error && <ErrorState message={error} onRetry={reload} />}
      {data && data.items.length === 0 && <Card className="text-center text-ink-muted">No bookings yet. Your first booking will show up here.</Card>}
      {data && data.items.length > 0 && (
        <ul className="flex flex-col gap-3">
          {data.items.map((b) => (
            <li key={b._id}><Card className="flex flex-wrap items-center justify-between gap-3">
              <div><p className="text-sm text-ink-muted">{b.bookingNo}</p><p className="font-extrabold">{b.service?.name}</p><p className="text-ink-muted">{prettyDate(b.date)}, {prettySlot(b.slot)}</p></div>
              <div className="flex items-center gap-3"><span className="font-semibold">{inr(b.finalPrice ?? b.estimatedPrice)}</span><StatusBadge status={b.status} /><LinkButton variant="secondary" to={`/customer/bookings/${b._id}`}>View</LinkButton></div>
            </Card></li>
          ))}
        </ul>
      )}
    </div>
  );
}