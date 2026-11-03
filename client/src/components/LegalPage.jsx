import { Link } from 'react-router-dom';
import useSeo from '../hooks/useSeo.js';

// sections: [{ id, heading, body: [ 'paragraph' | { list: ['item', ...] } ] }]
export default function LegalPage({ title, description, path, updated, intro, sections }) {
  useSeo({ title: `${title} | SmartServe`, description, path });

  return (
    <main className="bg-white pb-20">
      <section className="bg-[#fffdf0] border-b border-gray-100">
        <div className="mx-auto max-w-[900px] px-4 py-10 sm:px-6">
          <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-700">Legal</p>
          <h1 className="mt-3 text-3xl font-extrabold text-[#111] sm:text-4xl">{title}</h1>
          <p className="mt-2 text-xs text-gray-500">Last updated: {updated}</p>
        </div>
      </section>

      <div className="mx-auto max-w-[900px] px-4 py-8 sm:px-6">
        {intro && <p className="mb-8 text-[15px] leading-relaxed text-gray-700">{intro}</p>}

        {/* Contents */}
        <nav aria-label="Contents" className="mb-10 rounded-lg border border-gray-200 bg-gray-50 p-4">
          <p className="mb-2 text-xs font-extrabold uppercase tracking-wide text-gray-500">Contents</p>
          <ol className="list-decimal space-y-1 pl-5 text-sm">
            {sections.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="text-brand-dark hover:underline">{s.heading}</a>
              </li>
            ))}
          </ol>
        </nav>

        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="mb-8 scroll-mt-24">
            <h2 className="mb-3 text-xl font-bold text-[#111]">
              {i + 1}. {s.heading}
            </h2>
            <div className="space-y-3 text-[15px] leading-relaxed text-gray-700">
              {s.body.map((b, j) =>
                typeof b === 'string' ? (
                  <p key={j}>{b}</p>
                ) : (
                  <ul key={j} className="list-disc space-y-1.5 pl-6">
                    {b.list.map((li, k) => <li key={k}>{li}</li>)}
                  </ul>
                )
              )}
            </div>
          </section>
        ))}

        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-2 border-t border-gray-200 pt-6 text-sm">
          <Link to="/privacy-policy" className="font-semibold text-brand hover:underline">Privacy Policy</Link>
          <Link to="/terms" className="font-semibold text-brand hover:underline">Terms &amp; Conditions</Link>
          <Link to="/refund-policy" className="font-semibold text-brand hover:underline">Refund &amp; Cancellation</Link>
          <Link to="/faq" className="font-semibold text-brand hover:underline">FAQ</Link>
          <Link to="/contact" className="font-semibold text-brand hover:underline">Contact us</Link>
        </div>
      </div>
    </main>
  );
}