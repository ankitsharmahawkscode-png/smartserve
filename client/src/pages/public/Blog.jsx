import { useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

// ---------- small building blocks ----------
const Badge = ({ children }) => (
  <span className="absolute top-2 right-2 rounded bg-black/60 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-white">
    {children}
  </span>
);

const Cover = ({ post, badge, className = '' }) => (
  <div className={`relative overflow-hidden rounded-lg bg-gray-200 ${className}`}>
    {post.coverImage && (
      <img
        src={post.coverImage}
        alt={post.title}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
      />
    )}
    {badge && <Badge>{badge}</Badge>}
  </div>
);

const Meta = ({ post, light }) => (
  <p className={`mt-2 text-xs ${light ? 'text-gray-500' : 'text-gray-700'}`}>
    <span>{post.author?.name || 'Admin'}</span>
    <span className="mx-1.5">•</span>
    <span>{post.publishedAt ? prettyDate(post.publishedAt) : ''}</span>
  </p>
);

const Divider = () => <hr className="my-10 border-gray-300" />;

export default function Blog() {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');
  const scroller = useRef(null);

  const { data, loading, error, reload } = useFetch(
    tag ? `/blogs?tag=${encodeURIComponent(tag)}` : '/blogs'
  );

  useSeo({
    title: tag ? `${tag} – Blog | SmartServe` : 'Blog | SmartServe',
    description: 'Read expert tips and guides from SmartServe.',
    path: '/blog',
  });

  // Safe array extraction
  let raw = data;
  if (raw && !Array.isArray(raw) && raw.data) raw = raw.data;
  const posts = Array.isArray(raw?.items)
    ? raw.items
    : Array.isArray(raw?.blogs)
      ? raw.blogs
      : Array.isArray(raw)
        ? raw
        : [];

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
  if (error) return <div className="p-10"><ErrorState message={error} onRetry={reload} /></div>;

  const scrollBy = (dir) => {
    const el = scroller.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth, behavior: 'smooth' });
  };

  const [p0, p1, p2, p3] = posts;
  const listPosts = posts.slice(0, 6);
  const [big, ...rest] = listPosts;

  return (
    <main className="bg-white min-h-screen pb-20">
      <section className="mx-auto max-w-[1200px] px-4 sm:px-6 py-8 sm:py-10">
        {tag && (
          <div className="mb-6 flex flex-wrap items-center gap-3">
            <span className="text-sm text-gray-600">
              Showing posts tagged: <strong>{tag}</strong>
            </span>
            <Link to="/blog" className="text-brand font-semibold text-sm hover:underline">
              Clear filter ✕
            </Link>
          </div>
        )}

        {posts.length === 0 ? (
          <EmptyState title="No posts found">
            {tag ? 'No articles use this tag yet.' : 'Check back soon for new articles.'}
          </EmptyState>
        ) : (
          <>
            {/* ---------- 1. FEATURED GRID ---------- */}
            <div className="grid gap-6 lg:grid-cols-2">
              {p0 && (
                <Link to={`/blog/${p0.slug}`} className="group block">
                  <Cover post={p0} badge="News" className="aspect-[1/0.93]" />
                  <h2 className="mt-4 text-2xl sm:text-[28px] font-bold leading-tight text-[#111] group-hover:text-[#d97706] transition-colors">
                    {p0.title}
                  </h2>
                  <Meta post={p0} />
                </Link>
              )}

              <div className="flex flex-col gap-6">
                {p1 && (
                  <Link to={`/blog/${p1.slug}`} className="group block">
                    <Cover post={p1} badge="News" className="aspect-[16/9]" />
                    <h2 className="mt-3 text-lg sm:text-xl font-bold leading-snug text-[#111] group-hover:text-[#d97706] transition-colors">
                      {p1.title}
                    </h2>
                    <Meta post={p1} />
                  </Link>
                )}

                {(p2 || p3) && (
                  <div className="grid grid-cols-2 gap-4">
                    {[p2, p3].filter(Boolean).map((p) => (
                      <Link key={p._id} to={`/blog/${p.slug}`} className="group block">
                        <Cover post={p} badge="News" className="aspect-[16/10]" />
                        <h3 className="mt-2 text-sm sm:text-base font-bold leading-snug text-[#111] line-clamp-3 group-hover:text-[#d97706] transition-colors">
                          {p.title}
                        </h3>
                        <Meta post={p} />
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <Divider />

            {/* ---------- 2. LATEST NEWS CAROUSEL ---------- */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-2xl font-extrabold uppercase text-[#111]">Latest News</h2>
              <div className="flex gap-2">
                {[
                  { dir: -1, label: 'Previous', icon: '←' },
                  { dir: 1, label: 'Next', icon: '→' },
                ].map((b) => (
                  <button
                    key={b.dir}
                    type="button"
                    onClick={() => scrollBy(b.dir)}
                    aria-label={b.label}
                    className="flex h-9 w-9 items-center justify-center rounded-full border-2 border-[#d97706] text-[#111] hover:bg-[#d97706] hover:text-white transition-colors"
                  >
                    {b.icon}
                  </button>
                ))}
              </div>
            </div>

            <div
              ref={scroller}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {posts.map((p) => (
                <Link
                  key={p._id}
                  to={`/blog/${p.slug}`}
                  className="group block shrink-0 snap-start basis-[85%] sm:basis-[calc(50%-12px)] lg:basis-[calc(25%-18px)]"
                >
                  <Cover post={p} badge="Latest" className="aspect-[16/9]" />
                  <h3 className="mt-3 text-sm font-bold leading-snug text-[#111] line-clamp-2 group-hover:text-[#d97706] transition-colors">
                    {p.title}
                  </h3>
                  <Meta post={p} light />
                </Link>
              ))}
            </div>

            <Divider />

            {/* ---------- 3. NUMBERED LIST ---------- */}
            <div className="grid gap-8 lg:grid-cols-2">
              {big && (
                <Link to={`/blog/${big.slug}`} className="group block">
                  <Cover post={big} badge="Latest" className="aspect-[1/0.95]" />
                  <h2 className="mt-4 text-2xl font-bold leading-tight text-[#111] group-hover:text-[#d97706] transition-colors">
                    {big.title}
                  </h2>
                  {big.excerpt && (
                    <p className="mt-2 text-gray-600 line-clamp-3">{big.excerpt}</p>
                  )}
                  <Meta post={big} light />
                </Link>
              )}

              <div className="flex flex-col gap-6">
                {rest.map((p, i) => (
                  <Link key={p._id} to={`/blog/${p.slug}`} className="group block">
                    <div className="mb-2 border-b border-gray-300 pb-1">
                      <span className="text-3xl font-light text-gray-400">
                        {String(i + 2).padStart(2, '0')}.
                      </span>
                    </div>
                    <div className="flex gap-4">
                      <Cover
                        post={p}
                        badge="Latest"
                        className="aspect-[4/3] w-[38%] shrink-0"
                      />
                      <div className="min-w-0">
                        <h3 className="text-base font-bold leading-snug text-[#111] line-clamp-2 group-hover:text-[#d97706] transition-colors">
                          {p.title}
                        </h3>
                        {p.excerpt && (
                          <p className="mt-1 text-sm text-gray-600 line-clamp-2">{p.excerpt}</p>
                        )}
                        <Meta post={p} light />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </section>
    </main>
  );
}