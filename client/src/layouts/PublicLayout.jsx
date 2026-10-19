import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import Footer from '../components/Footer.jsx';
import { company } from '../content.js';
import InstallPWA from '../components/InstallPWA.jsx';


const NAV = [['/services', 'Services'], ['/blog', 'Blog'], ['/about', 'About'], ['/contact', 'Contact']];

export default function PublicLayout() {
  const { user, loading } = useAuth();
  const [open, setOpen] = useState(false);
  const { pathname } = useLocation();

  useEffect(() => { setOpen(false); }, [pathname]); // close the phone menu after choosing a page
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const link = ({ isActive }) => `font-semibold ${isActive ? 'text-brand' : 'text-ink hover:text-brand'}`;
  const rows = ({ isActive }) => `block py-3 border-b border-line font-semibold ${isActive ? 'text-brand' : 'text-ink'}`;
  const register = 'inline-flex items-center justify-center min-h-[44px] px-4 rounded-[10px] bg-brand text-white font-semibold';

  const items = (mobile) => (
    <>
      {NAV.map(([to, label]) => <NavLink key={to} to={to} className={mobile ? rows : link}>{label}</NavLink>)}
      {!loading && (user
        ? <NavLink to={`/${user.role}`} className={mobile ? rows : link}>My dashboard</NavLink>
        : (
          <>
            <NavLink to="/login" className={mobile ? rows : link}>Log in</NavLink>
            <NavLink to="/register" className={mobile ? `${register} w-full mt-4` : register}>Register</NavLink>
          </>
        ))}
    </>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:z-50 focus:m-2 focus:px-4 focus:py-2 focus:rounded-[10px] focus:bg-brand focus:text-white focus:font-semibold">Skip to content</a>
      <header className="bg-white border-b border-line sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 min-h-16 py-2 flex items-center justify-between gap-4">
          <Link to="/" aria-label={`${company.name} home`}><img src="/logo.png" alt={company.name} width="282" height="100" className="h-10 sm:h-11 w-auto" /></Link>
          <nav aria-label="Main" className="hidden md:flex gap-6 items-center">{items(false)}</nav>
          <button type="button" aria-expanded={open} aria-controls="mobile-nav" onClick={() => setOpen((o) => !o)}
            className="md:hidden inline-flex items-center gap-2 min-h-[44px] px-4 rounded-[10px] border border-line-strong bg-white font-semibold">
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              {open ? <path d="M4 4l12 12M16 4L4 16" /> : <path d="M3 6h14M3 10h14M3 14h14" />}
            </svg>
            {open ? 'Close' : 'Menu'}
          </button>
        </div>
        {open && <nav id="mobile-nav" aria-label="Mobile" className="md:hidden border-t border-line bg-white px-6 pb-4 flex flex-col">{items(true)}</nav>}
      </header>
      <div id="content" tabIndex={-1} className="flex-1 outline-none"><Outlet /></div>
      <Footer />
      <InstallPWA />
    </div>
  );
}