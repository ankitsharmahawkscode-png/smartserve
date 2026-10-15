import { Routes, Route } from 'react-router-dom';
import PublicLayout from './layouts/PublicLayout.jsx';
import DashboardLayout from './layouts/DashboardLayout.jsx';
import ProtectedRoute from './routes/ProtectedRoute.jsx';
import DashboardHome from './components/DashboardHome.jsx';
import Home from './pages/public/Home.jsx';
import About from './pages/public/About.jsx';
import Contact from './pages/public/Contact.jsx';
import NotFound from './pages/public/NotFound.jsx';
import Login from './pages/public/Login.jsx';
import Register from './pages/public/Register.jsx';
import ForgotPassword from './pages/public/ForgotPassword.jsx';
import ResetPassword from './pages/public/ResetPassword.jsx';
import Services from './pages/public/Services.jsx';
import ServiceDetail from './pages/public/ServiceDetail.jsx';
import Book from './pages/customer/Book.jsx';
import MyBookings from './pages/customer/MyBookings.jsx';
import BookingDetail from './pages/customer/BookingDetail.jsx';
import Profile from './pages/customer/Profile.jsx';
import Payments from './pages/customer/Payments.jsx';
import Reviews from './pages/customer/Reviews.jsx';
import AdminOverview from './pages/admin/AdminOverview.jsx';
import AdminBookings from './pages/admin/AdminBookings.jsx';
import AdminServices from './pages/admin/AdminServices.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminTechnicians from './pages/admin/AdminTechnicians.jsx';
import AdminCustomers from './pages/admin/AdminCustomers.jsx';
import AdminPayments from './pages/admin/AdminPayments.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminMessages from './pages/admin/AdminMessages.jsx';
import AdminAudit from './pages/admin/AdminAudit.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import TechOverview from './pages/technician/TechOverview.jsx';
import JobList from './pages/technician/JobList.jsx';
import JobDetail from './pages/technician/JobDetail.jsx';
import Earnings from './pages/technician/Earnings.jsx';
import TechProfile from './pages/technician/TechProfile.jsx';

const dash = (role, pages, home = <DashboardHome />) => (
  <Route element={<ProtectedRoute role={role} />}>
    <Route path={`/${role}`} element={<DashboardLayout role={role} />}>
      <Route index element={home} />
      {pages.map(([path, element]) => <Route key={path} path={path} element={element} />)}
    </Route>
  </Route>
);

export default function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/services" element={<Services />} />
        <Route path="/services/:id" element={<ServiceDetail />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
         <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="*" element={<NotFound />} />
      </Route>
      {dash('customer', [
        ['bookings', <MyBookings />],
        ['book/:serviceId', <Book />],
        ['bookings/:id', <BookingDetail />],
        ['payments', <Payments />],
        ['reviews', <Reviews />],
        ['profile', <Profile />],
      ])}
      {dash('technician', [
        ['jobs', <JobList />],
        ['jobs/:id', <JobDetail />],
        ['history', <JobList history />],
        ['earnings', <Earnings />],
        ['profile', <TechProfile />],
      ], <TechOverview />)}
      {dash('admin', [
        ['bookings', <AdminBookings />],
        ['services', <AdminServices />],
        ['categories', <AdminCategories />],
        ['technicians', <AdminTechnicians />],
        ['customers', <AdminCustomers />],
        ['payments', <AdminPayments />],
        ['reviews', <AdminReviews />],
        ['messages', <AdminMessages />],
        ['audit', <AdminAudit />],
        ['settings', <AdminSettings />],
      ], <AdminOverview />)}
    </Routes>
  );
}