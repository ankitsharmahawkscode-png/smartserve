import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSeo from '../../hooks/useSeo.js';
import { FaBuilding, FaCheckCircle, FaArrowRight, FaFileContract, FaHandshake, FaClock } from 'react-icons/fa';

const BENEFITS = [
  {
    icon: FaFileContract,
    title: 'Annual Maintenance Contracts (AMC)',
    desc: 'Predictable monthly costs for all your office or apartment maintenance needs. No surprise bills.',
  },
  {
    icon: FaClock,
    title: 'Priority Response',
    desc: 'Dedicated account managers and priority technician dispatch for corporate clients.',
  },
  {
    icon: FaHandshake,
    title: 'Dedicated Support',
    desc: 'A single point of contact for all your HVAC, electrical, and plumbing issues across multiple locations.',
  },
];

const SERVICES = [
  'Office AC Servicing & Repair',
  'Corporate Electrical Maintenance',
  'Commercial Plumbing',
  'Apartment Complex Common Area Maintenance',
  'Co-working Space Deep Cleaning',
  'Appliance Repair (Water Coolers, Microwaves, etc.)',
];

export default function Corporate() {
  useSeo({
    title: 'Corporate & B2B Maintenance Services | SmartServe',
    description: 'SmartServe offers reliable Annual Maintenance Contracts (AMC), office AC repair, and electrical maintenance for businesses and apartment complexes.',
    path: '/corporate',
  });

  return (
    <main className="bg-white pb-16">
      {/* Hero Section */}
      <section className="bg-[#0B1F3A] text-white py-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col lg:flex-row items-center gap-12 relative z-10">
          <div className="flex-1 text-center lg:text-left">
            <span className="inline-flex items-center gap-2 bg-white/10 rounded-full px-4 py-1.5 text-sm font-semibold mb-6">
              <FaBuilding /> SmartServe for Business
            </span>
            <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight mb-6 leading-tight">
              Reliable Maintenance for Your <span className="text-brand">Office & Properties</span>
            </h1>
            <p className="text-lg text-white/80 max-w-xl mx-auto lg:mx-0 mb-8">
              Stop juggling multiple contractors. Get a dedicated Annual Maintenance Contract (AMC) for your office, co-working space, or apartment complex.
            </p>
            <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
              <Link to="/contact" className="rounded-xl bg-brand px-8 py-3.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
                Get a B2B Quote
              </Link>
              <a href="#services" className="rounded-xl border border-white/30 px-8 py-3.5 text-sm font-bold text-white hover:bg-white/10 transition-colors">
                View Services
              </a>
            </div>
          </div>
          
          {/* Decorative Image Placeholder */}
          <div className="flex-1 hidden lg:block">
             <div className="w-full h-80 bg-white/5 border border-white/10 rounded-2xl backdrop-blur-sm p-6 flex flex-col justify-center shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                   <div className="h-10 w-10 bg-brand rounded-full flex items-center justify-center"><FaCheckCircle /></div>
                   <div className="h-4 w-32 bg-white/20 rounded"></div>
                </div>
                <div className="h-3 w-full bg-white/10 rounded mb-2"></div>
                <div className="h-3 w-5/6 bg-white/10 rounded mb-6"></div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                   <div className="h-20 bg-white/5 rounded-xl border border-white/10"></div>
                </div>
             </div>
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-extrabold mb-4">Why Choose SmartServe for Your Business?</h2>
          <p className="text-ink-muted max-w-2xl mx-auto">We handle the headaches of property maintenance so you can focus on running your business.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BENEFITS.map((b, i) => (
            <motion.div
              key={b.title}
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="bg-gray-50 rounded-2xl p-8 border border-line text-center"
            >
              <div className="w-14 h-14 mx-auto bg-white text-brand rounded-2xl flex items-center justify-center text-2xl shadow-sm mb-6">
                <b.icon />
              </div>
              <h3 className="text-lg font-bold mb-3">{b.title}</h3>
              <p className="text-sm text-ink-muted leading-relaxed">{b.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Services List */}
      <section id="services" className="bg-gray-50 py-16 border-y border-line">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-3xl font-extrabold mb-6">Corporate Services We Offer</h2>
              <p className="text-ink-muted mb-8 leading-relaxed">
                Whether you manage a 100-seat office or a 50-unit apartment complex, our vetted technicians are equipped to handle your specific maintenance requirements.
              </p>
              <ul className="space-y-4">
                {SERVICES.map((s, i) => (
                  <li key={i} className="flex items-center gap-3 font-semibold text-gray-800">
                    <FaCheckCircle className="text-brand shrink-0" /> {s}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-white p-8 rounded-2xl border border-line shadow-sm text-center">
              <h3 className="text-xl font-bold mb-2">Ready to simplify maintenance?</h3>
              <p className="text-sm text-ink-muted mb-6">Fill out a quick form and our B2B team will call you within 24 hours.</p>
              <Link to="/contact" className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-6 py-3.5 text-sm font-bold text-white hover:bg-brand-dark transition-colors">
                Request a Callback <FaArrowRight />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}