import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useFetch from '../../hooks/useFetch.js';
import { Card, StatusBadge } from '../../components/ui.jsx';
import LinkButton from '../../components/LinkButton.jsx';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { inr } from '../../utils/format.js';

const Stat = ({ label, value, warn }) => (
  <Card><p className="text-sm text-ink-muted">{label}</p><p className={`text-3xl font-extrabold ${warn ? 'text-[#B45309]' : ''}`}>{value}</p></Card>
);

export default function AdminOverview() {
  const { data, loading, error, reload } = useFetch('/admin/stats');
  if (loading) return <Spinner />;
  if (error) return <div className="p-6"><ErrorState message={error} onRetry={reload} /></div>;
  const s = data.stats;
  const chart = s.last7.map((d) => ({ day: d.date.slice(5), Bookings: d.count }));
  const total = s.last7.reduce((a, d) => a + d.count, 0);

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-3xl font-extrabold">Overview</h1>
        <LinkButton to="/admin/bookings">Manage bookings</LinkButton>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-6">
        <Stat label="Bookings today" value={s.todayBookings} />
        <Stat label="Awaiting action" value={s.awaiting} warn={s.awaiting > 0} />
        <Stat label="Revenue this month" value={inr(s.revenueThisMonth)} />
        <Stat label="Active technicians" value={s.activeTechnicians} />
      </div>
      <div className="grid gap-4 lg:grid-cols-[2fr_1fr]">
        <Card>
          <h2 className="text-lg font-extrabold mb-4">New bookings, last 7 days</h2>
          <div role="img" aria-label={`${total} bookings created in the last 7 days`} className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="day" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="Bookings" fill="#0F766E" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
        <Card>
          <h2 className="text-lg font-extrabold mb-4">All bookings by status</h2>
          <ul className="flex flex-col gap-2">
            {['PENDING', 'CONFIRMED', 'ASSIGNED', 'ACCEPTED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'].map((st) => (
              <li key={st} className="flex items-center justify-between"><StatusBadge status={st} /><span className="font-semibold">{s.byStatus[st] || 0}</span></li>
            ))}
          </ul>
        </Card>
      </div>
    </div>
  );
}