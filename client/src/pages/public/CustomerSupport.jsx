import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

export default function CustomerSupport() {
  useSeo({
    title: 'Customer Support | SmartServe',
    description: 'Need help with a booking or have a question? Our customer support team is available 7 days a week to assist you.',
    path: '/customer-support',
  });

  return (
    <main className="w-full bg-white">
      <section className="bg-brand-tint py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight mb-4">
            Customer Support
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
            We are here to help. Whether it's a question about your booking or an issue with a service, our team is ready.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="bg-white p-6 sm:p-10 rounded-2xl border border-line shadow-sm">
          <h2 className="text-2xl font-extrabold mb-6 text-center text-brand-dark">How can we assist you today?</h2>
          
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-tint rounded-full flex items-center justify-center shrink-0 text-brand-dark font-bold">1</div>
              <div>
                <h3 className="font-bold text-lg">Booking Issues</h3>
                <p className="text-ink-muted text-sm mt-1">Need to reschedule or cancel a booking? You can do it directly from your dashboard under "My Bookings".</p>
                <Link to="/customer/bookings" className="text-brand text-sm font-semibold hover:underline mt-1 inline-block">Go to My Bookings →</Link>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-tint rounded-full flex items-center justify-center shrink-0 text-brand-dark font-bold">2</div>
              <div>
                <h3 className="font-bold text-lg">Payment & Refunds</h3>
                <p className="text-ink-muted text-sm mt-1">If you have a question about a recent payment or are waiting for a refund, please contact us with your booking ID.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-brand-tint rounded-full flex items-center justify-center shrink-0 text-brand-dark font-bold">3</div>
              <div>
                <h3 className="font-bold text-lg">Service Quality</h3>
                <p className="text-ink-muted text-sm mt-1">Your satisfaction is our priority. If a service did not meet your expectations, let us know immediately so we can make it right.</p>
              </div>
            </div>
          </div>

          <div className="mt-10 pt-8 border-t border-line text-center">
            <h3 className="text-lg font-bold mb-2">Still need help?</h3>
            <p className="text-ink-muted text-sm mb-4">Our support team is available from 9 AM to 9 PM, 7 days a week.</p>
            <Link to="/contact" className="inline-flex items-center justify-center min-h-[48px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition">
              Contact Support
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}