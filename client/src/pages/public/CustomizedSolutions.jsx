import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

export default function CustomizedSolutions() {
  useSeo({
    title: 'Customized Home Service Solutions | SmartServe',
    description: 'Get tailored home maintenance packages, flexible scheduling, and custom solutions to fit your specific requirements and budget.',
    path: '/customized-solutions',
  });

  return (
    <main className="w-full bg-white">
      <section className="bg-brand-tint py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight mb-4">
            Customized Solutions
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
            Every home is different, and so are its needs. We don't believe in a one-size-fits-all approach.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          
          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-2 text-brand-dark">Tailored Maintenance Packages</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Whether you need monthly AC servicing, quarterly deep cleaning, or annual pest control, we can create a maintenance package that fits your schedule and budget.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-2 text-brand-dark">Flexible Scheduling</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Life is busy. That's why we offer flexible time slots, including evenings and weekends, to ensure our services fit into your routine, not the other way around.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-2 text-brand-dark">Bundle & Save</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Combine multiple services into a single booking and save money. Get your AC serviced and your house deep-cleaned on the same day at a discounted rate.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <h2 className="text-xl font-extrabold mb-2 text-brand-dark">Corporate & Bulk Bookings</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              We also cater to offices, housing societies, and commercial spaces. Contact us for bulk bookings and get special corporate pricing.
            </p>
          </div>
        </div>

        <div className="mt-12 text-center">
          <Link to="/contact" className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition">
            Discuss Your Requirements
          </Link>
        </div>
      </section>
    </main>
  );
}