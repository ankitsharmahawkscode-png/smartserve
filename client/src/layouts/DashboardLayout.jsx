import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

const MENUS = {
  customer: [['Overview', ''], ['My bookings', 'bookings'], ['Payments', 'payments'], ['Reviews', 'reviews'], ['Profile', 'profile']],
  technician: [['Overview', ''], ['Assigned jobs', 'jobs'], ['History', 'history'], ['Earnings', 'earnings'], ['Profile', 'profile']],
  admin: [['Overview', ''], ['Bookings', 'bookings'], ['Services', 'services'], ['Categories', 'categories'], ['Technicians', 'technicians'], ['Customers', 'customers'], ['Payments', 'payments'], ['Reviews', 'reviews'], ['Settings', 'settings']],
};

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  return (
    <div className="min-h-screen md:flex">
      <button className="md:hidden m-3 min-h-[44px] px-4 rounded-[10px] border border-line bg-white font-semibold" onClick={() => setOpen(!open)} aria-expanded={open}>Menu</button>
      <nav aria-label={`${role} menu`} className={`${open ? 'flex' : 'hidden'} md:flex flex-col gap-1 w-full md:w-60 bg-brand-dark text-white p-4`}>
        <strong className="text-xl mb-6 px-2">SmartServe</strong>
        {MENUS[role].map(([label, path]) => (
          <NavLink key={label} end={path === ''} to={`/${role}/${path}`} className={({ isActive }) => `px-3 py-3 rounded-[10px] font-semibold ${isActive ? 'bg-white text-brand-dark' : 'hover:bg-white/10'}`}>{label}</NavLink>
        ))}
        <button onClick={logout} className="mt-auto text-left px-3 py-3 font-semibold hover:bg-white/10 rounded-[10px]">Log out</button>
      </nav>
      <main className="flex-1 min-w-0"><Outlet /></main>
    </div>
  );
}
