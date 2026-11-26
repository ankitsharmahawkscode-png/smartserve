import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSeo from '../../hooks/useSeo.js';
import { FaMapMarkerAlt, FaArrowRight } from 'react-icons/fa';

// In a real app, you might fetch this from your API: /api/locations
const CITIES = [
  { name: 'Bangalore', slug: 'bangalore', state: 'Karnataka', desc: 'AC repair, plumbing, and electrical services in Bangalore.' },
  { name: 'Mumbai', slug: 'mumbai', state: 'Maharashtra', desc: 'Trusted home services and appliance repair in Mumbai.' },
  { name: 'Delhi NCR', slug: 'delhi-ncr', state: 'Delhi', desc: 'Same-day plumbing, cleaning, and AC repair in Delhi.' },
  { name: 'Hyderabad', slug: 'hyderabad', state: 'Telangana', desc: 'Book verified technicians for home repairs in Hyderabad.' },
];

export default function Locations() {
  useSeo({
    title: 'Our Service Areas | Home Services Near You | SmartServe',
    description: 'Find SmartServe home services in your city. We offer AC repair, plumbing, electrical work, and cleaning in Bangalore, Mumbai, Delhi, and more.',
    path: '/locations',
  });

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      {/* Header */}
      <section className="bg-brand-dark text-white py-16 px-4 sm:px-6 lg:px-8 text-center">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
            Home Services Near You
          </h1>
          <p className="text-lg text-white/80">
            Book verified technicians for AC repair, plumbing, electrical work, and more in your city.
          </p>
        </div>
      </section>

      {/* Cities Grid */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {CITIES.map((city, i) => (
            <motion.div
              key={city.slug}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link
                to={`/locations/${city.slug}`}
                className="group block h-full bg-white rounded-2xl p-6 border border-line shadow-sm hover:shadow-md hover:border-brand transition-all"
              >
                <div className="flex items-center gap-3 mb-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-tint text-brand-dark">
                    <FaMapMarkerAlt />
                  </span>
                  <h2 className="text-xl font-bold group-hover:text-brand-dark">
                    {city.name}
                  </h2>
                </div>
                <p className="text-sm text-ink-muted mb-4">{city.desc}</p>
                <span className="inline-flex items-center gap-1 text-sm font-bold text-brand">
                  View services <FaArrowRight className="text-xs" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  );
}