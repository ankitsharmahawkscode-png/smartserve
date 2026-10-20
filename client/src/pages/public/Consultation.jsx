import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

export default function Consultation() {
  useSeo({
    title: 'Free Home Service Consultation | SmartServe',
    description: 'Not sure what service you need? Get a free consultation from our home maintenance experts to diagnose the problem.',
    path: '/consultation',
  });

  return (
    <main className="w-full bg-white">
      <section className="bg-brand-tint py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight mb-4">
            Get Expert Consultation
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
            Not sure what service you need? Our experts are here to guide you.
          </p>
        </div>
      </section>

      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          <div>
            <h2 className="text-2xl font-extrabold mb-4 text-brand-dark">Why get a consultation?</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <span className="text-brand font-bold">✓</span>
                <p className="text-ink-muted text-sm leading-relaxed"><strong>Accurate Diagnosis:</strong> Sometimes the problem is not what it seems. We help you identify the real issue.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-brand font-bold">✓</span>
                <p className="text-ink-muted text-sm leading-relaxed"><strong>Cost Savings:</strong> Avoid spending money on the wrong service. We guide you to the most cost-effective solution.</p>
              </li>
              <li className="flex gap-3">
                <span className="text-brand font-bold">✓</span>
                <p className="text-ink-muted text-sm leading-relaxed"><strong>Honest Advice:</strong> If you don't need a service yet, we will tell you honestly.</p>
              </li>
            </ul>
          </div>
          <div className="bg-gray-50 p-6 rounded-2xl border border-line shadow-sm text-center">
            <h3 className="text-lg font-bold mb-2">Book a Call</h3>
            <p className="text-ink-muted text-sm mb-6">Fill out the contact form and our experts will call you back within 2 hours.</p>
            <Link to="/contact" className="inline-flex items-center justify-center w-full min-h-[48px] px-6 rounded-xl bg-brand text-white font-semibold hover:bg-brand-dark transition">
              Schedule Consultation
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}