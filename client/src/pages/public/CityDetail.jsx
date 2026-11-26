import { useParams, Link, Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSeo from '../../hooks/useSeo.js';
import { FaCheckCircle, FaMapMarkerAlt, FaPhoneAlt, FaCalendarCheck } from 'react-icons/fa';

// Expanded data for the specific city pages
const CITY_DATA = {
  'bangalore': {
    name: 'Bangalore',
    state: 'Karnataka',
    headline: 'Home Services in Bangalore',
    desc: 'Need an AC repair or plumber in Bangalore? SmartServe connects you with top-rated local technicians for fast, reliable home services.',
    popularServices: ['AC Repair in Bangalore', 'Plumbing Services', 'Electrical Work', 'Deep Home Cleaning'],
  },
  'mumbai': {
    name: 'Mumbai',
    state: 'Maharashtra',
    headline: 'Home Services in Mumbai',
    desc: 'Book verified technicians in Mumbai for AC repair, appliance fixing, and plumbing. Same-day service available across the city.',
    popularServices: ['AC Repair in Mumbai', 'Plumbing Services', 'Appliance Repair', 'Pest Control'],
  },
  'delhi-ncr': {
    name: 'Delhi NCR',
    state: 'Delhi',
    headline: 'Home Services in Delhi NCR',
    desc: 'From electrical repairs to home cleaning, find trusted professionals in Delhi NCR on SmartServe.',
    popularServices: ['AC Repair in Delhi', 'Electrician Services', 'Home Cleaning', 'Carpentry'],
  },
  'hyderabad': {
    name: 'Hyderabad',
    state: 'Telangana',
    headline: 'Home Services in Hyderabad',
    desc: 'Get your home fixed in Hyderabad. Book expert AC repair, plumbing, and cleaning services online.',
    popularServices: ['AC Repair in Hyderabad', 'Plumbing Services', 'Home Cleaning', 'Painting'],
  }
};

export default function CityDetail() {
  const { city } = useParams();
  const data = CITY_DATA[city?.toLowerCase()];

  // If the city isn't in our list, redirect to the main locations page
  if (!data) {
    return <Navigate to="/locations" replace />;
  }

  useSeo({
    title: `Home Services in ${data.name} | AC, Plumbing, Electrical | SmartServe`,
    description: `Need a plumber or AC repair in ${data.name}? Book verified local technicians online with SmartServe. Fast, reliable, and affordable in ${data.state}.`,
    path: `/locations/${city}`,
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'LocalBusiness',
      name: `SmartServe ${data.name}`,
      description: data.desc,
      areaServed: {
        '@type': 'City',
        name: data.name,
      },
      url: `https://smartserve-wine.vercel.app/locations/${city}`,
    },
  });

  return (
    <main className="bg-white pb-16">
      {/* Hero Section */}
      <section className="bg-brand-dark text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none" />
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
            <FaMapMarkerAlt /> Serving {data.name}, {data.state}
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6">
            {data.headline}
          </h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto mb-8">
            {data.desc}
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/services" className="rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
              Browse Services
            </Link>
            <a href="tel:+910000000000" className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/10 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/20 transition-colors">
              <FaPhoneAlt /> Call Support
            </a>
          </div>
        </div>
      </section>

      {/* Popular Services in this City */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold mb-4">Popular Services in {data.name}</h2>
          <p className="text-ink-muted">Pick a service and book a verified technician near you.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {data.popularServices.map((service, i) => (
            <motion.div
              key={service}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.3, delay: i * 0.1 }}
              className="rounded-xl border border-line p-5 bg-gray-50 hover:bg-white hover:shadow-sm transition-all flex items-start gap-3"
            >
              <FaCheckCircle className="text-brand mt-1 shrink-0" />
              <span className="font-bold text-sm">{service}</span>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Trust & Local SEO Text */}
      <section className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center">
        <h2 className="text-xl font-bold mb-4">Why choose SmartServe in {data.name}?</h2>
        <p className="text-ink-muted leading-relaxed mb-6">
          Finding a reliable technician in {data.name} can be stressful. SmartServe makes it easy. 
          We pre-screen all our professionals so you don't have to worry about safety or quality. 
          Whether it's an emergency AC repair during the summer or a routine plumbing fix, 
          our local {data.name} technicians are ready to help. Enjoy transparent pricing, 
          easy online booking, and secure payments.
        </p>
        <Link
          to="/become-a-technician"
          className="inline-flex items-center gap-2 text-sm font-bold text-brand underline underline-offset-4 hover:text-brand-dark"
        >
          Are you a technician in {data.name}? Join our network <FaCalendarCheck />
        </Link>
      </section>
    </main>
  );
}