import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { company } from '../content.js';
import useSeo from '../hooks/useSeo.js';
import ProfileMenu from '../components/ProfileMenu.jsx';

// Admin ke menus ab object format mein hain taaki permission mapping aasan ho
const ADMIN_MENUS = [
  { label: 'Overview', path: '', permission: 'all' },
  { label: 'Bookings', path: 'bookings', permission: 'bookings' },
  { label: 'Services', path: 'services', permission: 'services' },
  { label: 'Categories', path: 'categories', permission: 'categories' },
  { label: 'Blog', path: 'blogs', permission: 'blogs' },
  { label: 'Technicians', path: 'technicians', permission: 'technicians' },
  { label: 'Customers', path: 'customers', permission: 'customers' },
  { label: 'Payments', path: 'payments', permission: 'payments' },
  { label: 'Reviews', path: 'reviews', permission: 'reviews' },
  { label: 'Messages', path: 'messages', permission: 'messages' },
  { label: 'Activity log', path: 'audit', permission: 'audit' },
  { label: 'Settings', path: 'settings', permission: 'settings' },
  { label: 'Coupons', path: 'coupons', permission: 'coupons' },
  { label: 'Applications', path: 'applications', permission: 'applications' },
];

const CUSTOMER_MENUS = [['Overview', ''], ['My bookings', 'bookings'], ['Payments', 'payments'], ['Reviews', 'reviews'], ['Profile', 'profile']];
const TECH_MENUS = [['Overview', ''], ['Assigned jobs', 'jobs'], ['History', 'history'], ['Earnings', 'earnings'], ['Profile', 'profile']];

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();
  useSeo({ title: 'Dashboard', noindex: true });

  // 👇 Menu Filter Logic 👇
  const getMenuItems = () => {
    if (role === 'customer') return CUSTOMER_MENUS;
    if (role === 'technician') return TECH_MENUS;
    
    // Admin logic
    if (role === 'admin') {
      if (user?.isSuperAdmin) {
        return ADMIN_MENUS.map(m => [m.label, m.path]); // Super admin gets all
      }
      
      // Sub Admin gets only allowed permissions
      return ADMIN_MENUS
        .filter(m => m.permission === 'all' || (user?.permissions || []).includes(m.permission))
        .map(m => [m.label, m.path]);
    }
    return [];
  };

  const activeMenus = getMenuItems();

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      
      {/* Phones: Top bar with logo and Menu button */}
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

      {/* Sidebar Navigation */}
      <nav 
        id="dashboard-nav"
        aria-label={`${role} menu`}
        className={`
          ${open ? 'flex' : 'hidden'}
          md:flex flex-col gap-1
          w-full md:w-60 md:shrink-0
          h-auto md:h-screen
          overflow-y-auto
          bg-brand-dark text-white p-4
          z-40
        `}
      >
        <a href="/" className="hidden md:block bg-white rounded-[10px] p-2 mb-6" aria-label={`${company.name} website`}>
          <img src="/logo.png" alt={company.name} className="h-10 w-auto mx-auto" />
        </a>
        
        {/* Dynamically mapped menus based on permissions */}
        {activeMenus.map(([label, path]) => (
          <NavLink 
            key={label} 
            end={path === ''} 
            to={`/${role}/${path}`} 
            onClick={() => setOpen(false)}
            className={({ isActive }) => `px-3 py-3 rounded-[10px] font-semibold transition-colors ${isActive ? 'bg-white text-brand-dark' : 'hover:bg-white/10'}`}
          >
            {label}
          </NavLink>
        ))}
        
        <button onClick={logout} className="md:mt-auto text-left px-3 py-3 font-semibold hover:bg-white/10 rounded-[10px] transition-colors mt-4">
          Log out
        </button>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-gray-50 flex flex-col">
        
        {/* Top Header with Profile Menu */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-6 shrink-0">
          <span className="font-semibold text-lg hidden sm:block">Technical Workers</span>
          {user && (
            <ProfileMenu user={user} logout={logout} role={role} />
          )}
        </header>

        {/* Page Content */}
        <div className="flex-1">
          <Outlet />
        </div>
      </main>

    </div>
  );
}