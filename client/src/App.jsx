import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import Placeholder from './components/Placeholder.jsx';

const P = (t) => <Placeholder title={t} />;
const dash = (role, pages) => (
  <Route element={<ProtectedRoute role={role} />}>
    <Route path={`/${role}`} element={<DashboardLayout role={role} />}>
      <Route index element={P('Overview')} />
      {pages.map(([path, title]) => <Route key={path} path={path} element={P(title)} />)}
    </Route>
  </Route>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={P('Home')} />
        <Route path="/services" element={P('Services')} />
        <Route path="/services/:id" element={P('Service details')} />
        <Route path="/about" element={P('About us')} />
        <Route path="/contact" element={P('Contact us')} />
        <Route path="/login" element={P('Login')} />
        <Route path="/register" element={P('Register')} />
        <Route path="*" element={P('Page not found')} />
      </Route>
      {dash('customer', [['bookings', 'My bookings'], ['book/:serviceId', 'Book a service'], ['bookings/:id', 'Booking details'], ['payments', 'Payments'], ['reviews', 'Reviews'], ['profile', 'Profile and addresses']])}
      {dash('technician', [['jobs', 'Assigned jobs'], ['jobs/:id', 'Job details'], ['history', 'Job history'], ['earnings', 'Earnings'], ['profile', 'Profile']])}
      {dash('admin', [['bookings', 'Bookings'], ['services', 'Services'], ['categories', 'Categories'], ['technicians', 'Technicians'], ['customers', 'Customers'], ['payments', 'Payments'], ['reviews', 'Reviews'], ['settings', 'Reports and settings']])}
    </Routes>
  );
}
