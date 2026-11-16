import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

const TOPICS = [
  { to: '/services', icon: '🛠️', title: 'Book a service', text: 'Choose a service, pick a slot and confirm.', tags: 'book booking order service slot' },
  { to: '/customer/bookings', icon: '📍', title: 'Track my booking', text: 'See the status, technician and start code.', tags: 'track status technician where' },
  { to: '/faq', icon: '❓', title: 'FAQ', text: 'Quick answers about booking and payments.', tags: 'questions faq answers' },
  { to: '/refund-policy', icon: '💸', title: 'Cancellation and refunds', text: 'When a fee applies and how refunds are paid.', tags: 'cancel refund fee money back' },
  { to: '/login-help', icon: '🔑', title: 'Login help', text: "Can't log in? Fix it here.", tags: 'login password forgot account blocked' },
  { to: '/forgot-password', icon: '🔒', title: 'Reset my password', text: 'Get a link to set a new password.', tags: 'password reset forgot' },
  { to: '/pricing', icon: '₹', title: 'Pricing', text: 'See what each service costs.', tags: 'price cost rate charges' },
  { to: '/ac-tonnage-calculator', icon: '❄️', title: 'AC size calculator', text: 'Find the right AC size for your room.', tags: 'ac tonnage calculator size room' },
  { to: '/become-a-technician', icon: '🧰', title: 'Become a technician', text: 'Apply to join our team.', tags: 'technician join job apply career work' },
  { to: '/privacy-policy', icon: '🛡️', title: 'Privacy Policy', text: 'How we handle your information.', tags: 'privacy data policy' },
  { to: '/terms', icon: '📄', title: 'Terms & Conditions', text: 'The terms of using our service.', tags: 'terms conditions legal' },
  { to: '/contact', icon: '💬', title: 'Contact us', text: 'Talk to our team.', tags: 'contact support help call email' },
];

export default function HelpCenter() {
  const [q, setQ] = useState('');
  useSeo({
    title: 'Help Center | SmartServe',
    description: 'Get help with bookings, payments, cancellations, your account and more.',
    path: '/help',
  });

  const list = useMemo(() => {
    const t = q.trim().toLowerCase();
    if (!t) return TOPICS;
    return TOPICS.filter((x) => `${x.title} ${x.text} ${x.tags}`.toLowerCase().includes(t));
  }, [q]);

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-dark text-white">
        <div className="mx-auto max-w-3xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">How can we help?</h1>
          <p className="mt-3 text-white/80">Search for a topic or pick one below.</p>
          <form role="search" onSubmit={(e) => e.preventDefault()} className="mx-auto mt-6 max-w-lg">
            <label htmlFor="help-q" className="sr-only">Search help topics</label>
            <input
              id="help-q"
              type="search"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="e.g. refund, password, AC size"
              className="min-h-[48px] w-full rounded-full px-5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-[#d97706]"
            />
          </form>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">
        {list.length === 0 ? (
          <div className="rounded-xl border border-line p-8 text-center">
            <p className="font-bold">No matching topics</p>
            <p className="mt-1 text-sm text-ink-muted">Try a different word, or contact us and we will help.</p>
            <Link to="/contact" className="mt-4 inline-block font-semibold text-brand underline underline-offset-4">Contact us</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {list.map((x) => (
              <Link
                key={x.to}
                to={x.to}
                className="group flex gap-4 rounded-xl border border-line p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xl" aria-hidden="true">
                  {x.icon}
                </span>
                <span className="min-w-0">
                  <span className="block font-bold group-hover:text-brand-dark">{x.title}</span>
                  <span className="mt-1 block text-sm text-ink-muted">{x.text}</span>
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}