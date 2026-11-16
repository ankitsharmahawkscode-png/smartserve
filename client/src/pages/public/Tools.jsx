import { Link } from 'react-router-dom';
import useSeo from '../../hooks/useSeo.js';
import { TOOLS } from '../../components/ToolShell.jsx';

export default function Tools() {
  useSeo({
    title: 'Free Home Tools | SmartServe',
    description: 'Free calculators for your home: AC size, AC electricity bill and water tank size.',
    path: '/tools',
  });

  return (
    <main className="bg-white pb-20">
      <section className="bg-brand-tint">
        <div className="mx-auto max-w-3xl px-4 py-10 text-center sm:px-6 sm:py-14">
          <p className="text-sm font-extrabold uppercase tracking-widest text-accent-text">Free tools</p>
          <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">Helpful tools for your home</h1>
          <p className="mt-3 text-ink-muted">Quick calculators to help you decide before you book.</p>
        </div>
      </section>
      <section className="mx-auto grid max-w-4xl gap-4 px-4 py-10 sm:grid-cols-2 sm:px-6">
        {TOOLS.map((t) => (
          <Link
            key={t.to}
            to={t.to}
            className="group flex gap-4 rounded-xl border border-line p-5 transition-all hover:-translate-y-0.5 hover:border-brand hover:shadow-md"
          >
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-brand-tint text-2xl" aria-hidden="true">{t.icon}</span>
            <span>
              <span className="block text-lg font-bold group-hover:text-brand-dark">{t.title}</span>
              <span className="mt-1 block text-sm text-ink-muted">{t.text}</span>
              <span className="mt-3 inline-block text-sm font-semibold text-brand">Open the tool →</span>
            </span>
          </Link>
        ))}
      </section>
    </main>
  );
}