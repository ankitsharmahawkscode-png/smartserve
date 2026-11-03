import { useState } from 'react';
import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

const FAQS = [
  { group: 'Booking', items: [
    { q: 'How do I book a service?', a: 'Choose a service, pick a date and time slot, enter your address and confirm. You will get an email once we approve the booking.' },
    { q: 'Can I choose my time slot?', a: 'Yes. Pick any slot that is shown as available for your date. If a slot fills up, we will offer you another one.' },
    { q: 'How do I know a technician is on the way?', a: 'Your booking page shows the status (Confirmed, Assigned, Accepted, In progress), and we email you at each step with your technician\'s name.' },
    { q: 'Do I need an account to book?', a: 'Yes, an account lets you track bookings, pay online and leave reviews. Registration takes under a minute.' },
  ] },
  { group: 'Pricing and payment', items: [
    { q: 'How is the price decided?', a: 'Some services have a fixed price. For others you see an estimate first, and the final amount is set after the technician inspects the job.' },
    { q: 'Will I be charged for parts or extra work?', a: 'Only after the technician explains it to you. Nothing extra is added without your knowledge.' },
    { q: 'What payment methods are accepted?', a: 'You can pay online (cards, UPI and net banking through Razorpay) or pay cash after the job where cash is offered.' },
    { q: 'Is online payment safe?', a: 'Payments are processed by Razorpay. We never see or store your card or UPI details.' },
  ] },
  { group: 'Cancellation and refunds', items: [
    { q: 'Can I cancel a booking?', a: 'Yes, from My bookings in your dashboard, until work has started. See our Refund & Cancellation Policy for the details.' },
    { q: 'Is there a cancellation fee?', a: 'Cancelling well before your slot is free. A small fee applies for late cancellations, because the technician has already set aside the time.' },
    { q: 'How long does a refund take?', a: 'After we issue it, an online refund reaches your account in 5 to 7 working days, depending on your bank.' },
  ] },
  { group: 'Technicians and quality', items: [
    { q: 'Are the technicians verified?', a: 'Technicians apply to us and are approved by our team before they can take jobs.' },
    { q: 'What if I am not happy with the work?', a: 'Contact us within 48 hours with your booking number. We will review it and arrange a fix or a refund where appropriate.' },
    { q: 'Can I leave a review?', a: 'Yes. After a job is completed, open the Reviews page in your dashboard and rate your technician.' },
  ] },
  { group: 'Account', items: [
    { q: 'I forgot my password. What do I do?', a: 'Use the Forgot password link on the login page, and we will email you a reset link.' },
    { q: 'How do I become a technician?', a: 'Fill in the Become a Technician form. Our team reviews every application and contacts approved applicants.' },
  ] },
];

function Item({ q, a, open, onToggle, id }) {
  return (
    <div className="border-b border-gray-200">
      <h3>
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={open}
          aria-controls={id}
          className="flex w-full items-center justify-between gap-4 py-4 text-left"
        >
          <span className="text-[15px] font-bold text-[#111]">{q}</span>
          <span className={`text-xl text-[#d97706] transition-transform ${open ? 'rotate-45' : ''}`} aria-hidden="true">+</span>
        </button>
      </h3>
      {open && (
        <div id={id} className="pb-4 pr-8 text-[15px] leading-relaxed text-gray-700">{a}</div>
      )}
    </div>
  );
}

export default function Faq() {
  const [openKey, setOpenKey] = useState('0-0');

  useSeo({
    title: 'FAQ | SmartServe',
    description: 'Answers about booking, pricing, payments, cancellations and refunds for home services.',
    path: '/faq',
    jsonLd: {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: FAQS.flatMap((g) => g.items).map((x) => ({
        '@type': 'Question',
        name: x.q,
        acceptedAnswer: { '@type': 'Answer', text: x.a },
      })),
    },
  });

  return (
    <main className="bg-white pb-20">
      <section className="bg-[#fffdf0] border-b border-gray-100">
        <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-700">Help</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#111] sm:text-4xl">Frequently asked questions</h1>
          <p className="mt-2 text-sm text-gray-600">Quick answers about booking, payments and refunds.</p>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        {FAQS.map((g, gi) => (
          <section key={g.group} className="mb-8">
            <h2 className="mb-1 flex items-center gap-2 text-base font-bold text-[#d97706]">
              <span className="h-2 w-2 rounded-full bg-[#d97706]" /> {g.group}
            </h2>
            {g.items.map((x, ii) => {
              const key = `${gi}-${ii}`;
              return (
                <Item
                  key={key}
                  id={`faq-${key}`}
                  q={x.q}
                  a={x.a}
                  open={openKey === key}
                  onToggle={() => setOpenKey(openKey === key ? null : key)}
                />
              );
            })}
          </section>
        ))}

        <div className="mt-10 rounded-lg bg-[#f0ebe4] p-6 text-center">
          <p className="font-bold text-[#111]">Still have a question?</p>
          <p className="mt-1 text-sm text-gray-600">Our team is happy to help.</p>
          <Link to="/contact" className="mt-4 inline-block rounded bg-[#d97706] px-5 py-2 text-sm font-bold text-white hover:bg-[#b45309]">
            Contact us
          </Link>
        </div>
      </div>
    </main>
  );
}