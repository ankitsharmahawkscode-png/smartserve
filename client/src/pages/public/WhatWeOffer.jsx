import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

export default function WhatWeOffer() {
  useSeo({
    title: 'What We Offer | SmartServe',
    description: 'Discover our professional services, customized solutions, customer support, and consultation for all your home maintenance needs.',
    path: '/what-we-offer',
  });

  return (
    <main className="w-full bg-white">
      {/* Hero Section */}
      <section className="bg-brand-tint py-16 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight mb-4">
            What We Offer
          </h1>
          <p className="text-base sm:text-lg text-ink-muted leading-relaxed max-w-2xl mx-auto">
            At {company.name}, we go beyond just fixing things. We provide a comprehensive suite of home services designed to make your life easier, safer, and more comfortable.
          </p>
        </div>
      </section>

      {/* Content Section */}
      <section className="py-12 sm:py-16 px-4 sm:px-6 lg:px-8 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
          
          {/* 1. Professional Services */}
          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <div className="w-12 h-12 bg-brand-tint text-brand-dark rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold mb-2">Professional Services</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Our team consists of verified, background-checked, and highly trained professionals. From AC repair to plumbing and carpentry, every job is done with precision and care.
            </p>
            <Link to="/services" className="inline-block mt-4 text-brand font-semibold hover:underline">
              Explore Services →
            </Link>
          </div>

          {/* 2. Customized Solutions */}
          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <div className="w-12 h-12 bg-brand-tint text-brand-dark rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold mb-2">Customized Solutions</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Every home is different, and so are its needs. We offer flexible scheduling, customized maintenance packages, and tailored solutions to fit your specific requirements and budget.
            </p>
          </div>

          {/* 3. Customer Support */}
          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <div className="w-12 h-12 bg-brand-tint text-brand-dark rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636l-3.536 3.536m0 5.656l3.536 3.536M9.172 9.172L5.636 5.636m3.536 9.192l-3.536 3.536M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-5 0a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold mb-2">Customer Support</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              We are here for you 7 days a week. Whether you need to reschedule a booking or have a question about your service, our support team is just a call or message away.
            </p>
            <Link to="/contact" className="inline-block mt-4 text-brand font-semibold hover:underline">
              Contact Support →
            </Link>
          </div>

          {/* 4. Consultation */}
          <div className="bg-white p-6 rounded-2xl border border-line shadow-sm">
            <div className="w-12 h-12 bg-brand-tint text-brand-dark rounded-xl flex items-center justify-center mb-4">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <h2 className="text-xl font-extrabold mb-2">Consultation</h2>
            <p className="text-ink-muted text-sm sm:text-base leading-relaxed">
              Not sure what service you need? Our experts provide free consultations over the phone or in person to help you understand the problem and choose the right solution.
            </p>
            <Link to="/contact" className="inline-block mt-4 text-brand font-semibold hover:underline">
              Get Consultation →
            </Link>
          </div>

        </div>
      </section>
    </main>
  );
}