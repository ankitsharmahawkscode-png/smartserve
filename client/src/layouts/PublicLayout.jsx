import { Link, NavLink, Outlet } from 'react-router-dom';
export default function PublicLayout() {
  const link = 'font-semibold hover:text-brand';
  return (
    <>
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-6 min-h-16 flex items-center justify-between flex-wrap gap-4">
          <Link to="/" className="text-xl font-extrabold text-brand-dark">SmartServe</Link>
          <nav aria-label="Main" className="flex gap-6">
            <NavLink to="/services" className={link}>Services</NavLink>
            <NavLink to="/about" className={link}>About</NavLink>
            <NavLink to="/contact" className={link}>Contact</NavLink>
            <NavLink to="/login" className={`${link} text-brand-dark`}>Log in</NavLink>
          </nav>
        </div>
      </header>
      <Outlet />
    </>
  );
}
