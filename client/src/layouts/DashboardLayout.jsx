import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { company } from '../content.js';
import useSeo from '../hooks/useSeo.js';

const MENUS = {
  customer: [['Overview', ''], ['My bookings', 'bookings'], ['Payments', 'payments'], ['Reviews', 'reviews'], ['Profile', 'profile']],
  technician: [['Overview', ''], ['Assigned jobs', 'jobs'], ['History', 'history'], ['Earnings', 'earnings'], ['Profile', 'profile']],
   admin: [
    ['Overview', ''], 
    ['Bookings', 'bookings'], 
    ['Services', 'services'], 
    ['Categories', 'categories'], 
    ['Blog', 'blogs'],       // 👈 NEW
    ['Technicians', 'technicians'], 
    ['Customers', 'customers'], 
    ['Payments', 'payments'], 
    ['Reviews', 'reviews'], 
    ['Messages', 'messages'], 
    ['Activity log', 'audit'], 
    ['Settings', 'settings'],
    ['Coupons', 'coupons'],  
    ['Applications', 'applications'], // 👈 Add this
  ],
};

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { logout } = useAuth();
  useSeo({ title: 'Dashboard', noindex: true });
  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* Phones: a top bar with the logo and a Menu button. Larger screens use the sidebar below. */}
      <div className="md:hidden sticky top-0 z-40 flex items-center justify-between gap-3 bg-white border-b border-line px-4 py-2">
        <a href="/" aria-label={`${company.name} website`}><img src="/logo.png" alt={company.name} className="h-9 w-auto" /></a>
        <button type="button" aria-expanded={open} aria-controls="dashboard-nav" onClick={() => setOpen((o) => !o)}
          className="inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[10px] border border-line-strong bg-white font-semibold">
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
          </svg>
          {open ? 'Close' : 'Menu'}
        </button>
      </div>
      <nav   id="dashboard-nav"
  aria-label={`${role} menu`}
  className={`
    ${open ? 'flex' : 'hidden'}
    md:flex flex-col gap-1
    w-full md:w-60 md:shrink-0
    h-auto md:h-screen
    overflow-y-auto
    bg-brand-dark text-white p-4`}>
        <a href="/" className="hidden md:block bg-white rounded-[10px] p-2 mb-6" aria-label={`${company.name} website`}>
          <img src="/logo.png" alt={company.name} className="h-10 w-auto mx-auto" />
        </a>
        {MENUS[role].map(([label, path]) => (
          <NavLink key={label} end={path === ''} to={`/${role}/${path}`} onClick={() => setOpen(false)}
            className={({ isActive }) => `px-3 py-3 rounded-[10px] font-semibold ${isActive ? 'bg-white text-brand-dark' : 'hover:bg-white/10'}`}>{label}</NavLink>
        ))}
        <button onClick={logout} className="md:mt-auto text-left px-3 py-3 font-semibold hover:bg-white/10 rounded-[10px]">Log out</button>
      </nav>
<main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-gray-50">
  <header className="sticky top-0 z-30 h-14 bg-white border-b flex items-center justify-between px-6">
    <span className="font-semibold">Technical Workers</span>
  </header>

  <Outlet />
</main>
    </div>
  );
}