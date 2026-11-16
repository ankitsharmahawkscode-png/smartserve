import { Link } from 'react-router-dom';
import { FaSnowflake, FaBolt, FaTint } from 'react-icons/fa';
import useSeo from '../hooks/useSeo.js';
import LinkButton from './LinkButton.jsx';

export const TOOLS = [
  { to: '/ac-tonnage-calculator', icon: FaSnowflake, title: 'AC tonnage calculator', text: 'Find the right AC size for your room.' },
  { to: '/ac-electricity-bill-calculator', icon: FaBolt, title: 'AC electricity bill calculator', text: 'Estimate what your AC costs to run each month.' },
  { to: '/water-tank-calculator', icon: FaTint, title: 'Water tank size calculator', text: 'Work out the tank size your home needs.' },
];

export default function ToolShell({ seo, eyebrow = 'Free tool', title, intro, faqs = [], cta, children }) {
  useSeo({
    ...seo,
    jsonLd: faqs.length
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((x) => ({
            '@type': 'Question',
            name: x.q,
            acceptedAnswer: { '@type': 'Answer', text: x.a },
          })),
        }
      : undefined,
  });

  const others = TOOLS.filter((t) => t.to !== seo.path);

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-5xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">{eyebrow}</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl">{title}</h1>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-ink-muted sm:text-lg">{intro}</p>
        </div>
      </section>

      <section className="mx-auto max-w-5xl px-4 py-10 sm:px-6">{children}</section>

      {faqs.length > 0 && (
        <section className="mx-auto max-w-3xl px-4 sm:px-6" aria-labelledby="tool-faq">
          <h2 id="tool-faq" className="mb-5 text-center text-2xl font-extrabold sm:text-3xl">Frequently asked questions</h2>
          <div className="divide-y divide-line rounded-2xl border border-line bg-white">
            {faqs.map((x) => (
              <details key={x.q} className="group px-5 py-4">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold [&::-webkit-details-marker]:hidden">
                  {x.q}
                  <span className="text-xl text-brand transition-transform group-open:rotate-45" aria-hidden="true">+</span>
                </summary>
                <p className="mt-3 pr-6 leading-relaxed text-ink-muted">{x.a}</p>
              </details>
            ))}
          </div>
        </section>
      )}

      <section className="mx-auto mt-14 max-w-5xl px-4 sm:px-6" aria-labelledby="more-tools">
        <h2 id="more-tools" className="mb-4 text-xl font-extrabold">More free tools</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {others.map((t) => {
            const Icon = t.icon;
            return (
              <Link
                key={t.to}
                to={t.to}
                className="group flex items-center gap-4 rounded-xl border border-line p-4 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-tint text-xl text-brand" aria-hidden="true">
                  <Icon />
                </span>
                <span>
                  <span className="block font-bold group-hover:text-brand-dark">{t.title}</span>
                  <span className="block text-sm text-ink-muted">{t.text}</span>
                </span>
              </Link>
            );
          })}
        </div>
      </section>

      {cta && (
        <section className="mx-auto mt-14 max-w-5xl px-4 sm:px-6">
          <div className="rounded-2xl bg-brand-dark px-6 py-10 text-center text-white sm:px-10">
            <h2 className="text-2xl font-extrabold sm:text-3xl">{cta.title}</h2>
            <p className="mx-auto mt-3 max-w-xl text-white/80">{cta.text}</p>
            <div className="mt-6 flex flex-col justify-center gap-3 sm:flex-row [&_a]:justify-center">
              <LinkButton to={cta.to}>{cta.label}</LinkButton>
              <LinkButton to="/contact" variant="secondary">Contact us</LinkButton>
            </div>
          </div>
        </section>
      )}
    </main>
  );
}