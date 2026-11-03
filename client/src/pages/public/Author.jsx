import { useParams, Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { ErrorState, Spinner } from '../../components/States.jsx';
import useSeo from '../../hooks/useSeo.js';
import { prettyPostDate } from '../../utils/format.js';

const SOCIALS = [
  { key: 'linkedin', label: 'LinkedIn' },
  { key: 'twitter', label: 'X / Twitter' },
  { key: 'facebook', label: 'Facebook' },
  { key: 'instagram', label: 'Instagram' },
  { key: 'website', label: 'Website' },
];

const initialsOf = (name) =>
  (name || 'A')
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || 'A';

export default function Author() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/authors/${slug}`);

  const author = data?.author;
  const posts = data?.posts || [];
  const total = data?.total ?? posts.length;

  const socials = author ? SOCIALS.filter((s) => author.social?.[s.key]) : [];

  useSeo({
    title: author ? `${author.name} – Author | SmartServe` : 'Author',
    description: author
      ? (author.about?.[0] || `Articles by ${author.name}`).slice(0, 160)
      : '',
    path: `/author/${slug}`,
    jsonLd: author
      ? {
          '@context': 'https://schema.org',
          '@type': 'Person',
          name: author.name,
          jobTitle: author.designation || undefined,
          url: window.location.href,
          sameAs: socials.map((s) => author.social[s.key]),
        }
      : undefined,
  });

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
  if (error || !author) {
    return (
      <div className="p-10">
        <ErrorState message={error || 'Author not found'} />
        <div className="mt-6 text-center">
          <Link to="/blog" className="text-brand font-semibold hover:underline">← Back to all articles</Link>
        </div>
      </div>
    );
  }

  const firstName = author.name.trim().split(/\s+/)[0];

  return (
    <main className="bg-white pb-20">
      {/* Header */}
      <section className="bg-[#fffdf0]">
        <div className="mx-auto flex max-w-[1000px] items-start justify-between gap-4 px-4 py-10 sm:px-6">
          <div className="min-w-0">
            <p className="text-[10px] font-extrabold uppercase tracking-[0.18em] text-gray-800">
              Author profile
            </p>
            <h1 className="mt-3 break-words text-3xl font-extrabold text-[#111] sm:text-4xl">
              {author.name}
            </h1>
            {author.designation && (
              <p className="mt-2 text-sm text-gray-800">{author.designation}</p>
            )}
            {(author.workplace || author.location) && (
              <p className="mt-1 text-xs text-gray-500">
                {[author.workplace, author.location].filter(Boolean).join(' · ')}
              </p>
            )}
          </div>

          <div className="relative h-24 w-24 shrink-0 overflow-hidden rounded-md bg-[#14142b] sm:h-28 sm:w-28">
            {author.avatar ? (
              <img src={author.avatar} alt={author.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center bg-[#0B1F3A] text-3xl font-bold text-white">
                {initialsOf(author.name)}
              </div>
            )}
            <div className="absolute inset-x-0 bottom-0 bg-[#14142b]/90 py-0.5 text-center text-[8px] font-bold text-amber-400">
              ✓ Verified Author
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <div className="border-y border-gray-100">
        <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
          <div className="inline-block px-6 py-4 text-center">
            <p className="text-2xl font-extrabold text-[#111]">{total}</p>
            <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-gray-500">
              Articles published
            </p>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto grid max-w-[1000px] gap-8 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_260px]">
        <div className="min-w-0">
          <h2 className="mb-3 flex items-center gap-2 text-base font-bold text-[#d97706]">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" /> About {firstName}
          </h2>
          {author.about.length ? (
            <div className="space-y-4 text-[15px] leading-relaxed text-gray-700">
              {author.about.map((p, i) => (
                <p key={i} className="break-words">{p}</p>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">No bio added yet.</p>
          )}

          <h2 className="mb-3 mt-10 flex items-center gap-2 text-base font-bold text-[#d97706]">
            <span className="h-2 w-2 rounded-full bg-[#d97706]" /> Articles by {firstName}
          </h2>
          {posts.length ? (
            <div className="flex flex-col gap-2">
              {posts.map((p) => (
                <Link
                  key={p._id}
                  to={`/blog/${p.slug}`}
                  className="flex items-center justify-between gap-3 rounded-md bg-[#f0ebe4] px-4 py-3 transition-colors hover:bg-[#e8e1d7]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold text-[#111]">{p.title}</p>
                    <p className="mt-1 text-xs text-gray-500">
                      {prettyPostDate(p.publishedAt || p.createdAt)} · {p.readMins} min read
                    </p>
                  </div>
                  <span className="text-blue-600">→</span>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm italic text-gray-500">No published articles yet.</p>
          )}
        </div>

        {/* Contact */}
        <aside className="h-fit overflow-hidden rounded-lg border border-gray-200">
          <div className="bg-[#f0ebe4] px-4 py-2.5 text-xs font-extrabold uppercase tracking-wide text-gray-600">
            Contact
          </div>
          <div className="px-4 py-3">
            {socials.length ? (
              <ul className="space-y-2">
                {socials.map((s) => (
                  <li key={s.key}>
                    <a
                      href={author.social[s.key]}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-semibold text-blue-700 hover:underline"
                    >
                      {s.label}
                    </a>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-xs italic text-gray-400">No social links added.</p>
            )}
          </div>
        </aside>
      </div>

      <div className="mx-auto max-w-[1000px] px-4 sm:px-6">
        <Link to="/blog" className="font-semibold text-brand hover:underline">← Back to all articles</Link>
      </div>
    </main>
  );
}