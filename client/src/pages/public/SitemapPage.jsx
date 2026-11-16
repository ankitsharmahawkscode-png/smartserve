import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';

const GROUPS = [
  { title: 'Services', links: [['Our services', '/services'], ['Pricing', '/pricing'], ['AC tonnage calculator', '/ac-tonnage-calculator'], ['What we offer', '/what-we-offer'], ['Customized solutions', '/customized-solutions'], ['Consultation', '/consultation']] },
  { title: 'Company', links: [['Home', '/'], ['About us', '/about'], ['Blog', '/blog'], ['Careers', '/careers'], ['Become a technician', '/become-a-technician'], ['Contact', '/contact']] },
  { title: 'Help', links: [['Help center', '/help'], ['FAQ', '/faq'], ['Customer support', '/customer-support'], ['Login help', '/login-help']] },
  { title: 'Account', links: [['Log in', '/login'], ['Create an account', '/register'], ['Forgot password', '/forgot-password']] },
  { title: 'Legal', links: [['Privacy policy', '/privacy-policy'], ['Terms & conditions', '/terms'], ['Refund & cancellation', '/refund-policy'], ['Cookie policy', '/cookie-policy']] },
];

export default function SitemapPage() {
  useSeo({ title: 'Sitemap | SmartServe', description: 'A list of all the pages on our website.', path: '/sitemap' });

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6">
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">Sitemap</h1>
          <p className="mt-2 text-ink-muted">Every page on the site, in one place.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-5xl gap-8 px-4 py-10 sm:grid-cols-2 sm:px-6 lg:grid-cols-3">
        {GROUPS.map((g) => (
          <nav key={g.title} aria-label={g.title}>
            <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#d97706]">
              <span className="h-2 w-2 rounded-full bg-[#d97706]" /> {g.title}
            </h2>
            <ul className="space-y-2 text-sm">
              {g.links.map(([label, to]) => (
                <li key={to}>
                  <Link to={to} className="text-gray-700 underline-offset-4 hover:text-brand-dark hover:underline">{label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        ))}
      </section>
    </main>
  );
}