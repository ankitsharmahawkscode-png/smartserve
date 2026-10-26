import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { company } from '../content.js';
import useSeo from '../hooks/useSeo.js';
import ProfileMenu from '../components/ProfileMenu.jsx'; // 👈 Import the new component

const MENUS = {
  // ... (keep your MENUS object exactly as it is)
  customer: [['Overview', ''], ['My bookings', 'bookings'], ['Payments', 'payments'], ['Reviews', 'reviews'], ['Profile', 'profile']],
  technician: [['Overview', ''], ['Assigned jobs', 'jobs'], ['History', 'history'], ['Earnings', 'earnings'], ['Profile', 'profile']],
 admin: [
  ['Overview', ''], ['Bookings', 'bookings'], ['Services', 'services'], 
  ['Categories', 'categories'], ['Blog', 'blogs'], ['Technicians', 'technicians'], 
  ['Customers', 'customers'], ['Payments', 'payments'], ['Reviews', 'reviews'], 
  ['Messages', 'messages'], ['Activity log', 'audit'], ['Settings', 'settings'],
  ['Coupons', 'coupons'], ['Applications', 'applications'], 
],
};

export default function DashboardLayout({ role }) {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth(); // 👈 Get 'user' from AuthContext
  useSeo({ title: 'Dashboard', noindex: true });

  return (
    <div className="min-h-screen flex flex-col md:flex-row overflow-hidden">
      {/* ... (Keep your mobile top bar exactly as is) ... */}
      
      <nav id="dashboard-nav" aria-label={`${role} menu`} className="/* ... keep classes ... */">
        {/* ... (Keep your sidebar links exactly as is) ... */}
      </nav>

      <main className="flex-1 min-w-0 h-screen overflow-y-auto overflow-x-hidden bg-gray-50">
        {/* 👇 UPDATED HEADER 👇 */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b flex items-center justify-between px-6">
          <span className="font-semibold text-lg hidden sm:block">Technical Workers</span>
          
          {/* Profile Section on the right */}
          {user && (
            <ProfileMenu user={user} logout={logout} role={role} />
          )}
        </header>

        <Outlet />
      </main>
    </div>
  );
}