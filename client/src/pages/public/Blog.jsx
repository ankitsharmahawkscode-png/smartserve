import { Link, useSearchParams } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

export default function Blog() {
  const [searchParams] = useSearchParams();
  const tag = searchParams.get('tag');

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

  return (
    <main className="bg-white min-h-screen pb-20">
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#1a1a1a] mb-6">Blog</h1>

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
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map((post) => (
              <Link
                key={post._id}
                to={`/blog/${post.slug}`}
                className="group block rounded-lg border border-gray-200 overflow-hidden hover:shadow-md transition-shadow"
              >
                {post.coverImage && (
                  <div className="aspect-video bg-gray-100 overflow-hidden">
                    <img
                      src={post.coverImage}
                      alt={post.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    />
                  </div>
                )}
                <div className="p-4">
                  <h2 className="font-bold text-lg text-[#1a1a1a] group-hover:text-[#d97706] transition-colors">
                    {post.title}
                  </h2>
                  {post.excerpt && (
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">{post.excerpt}</p>
                  )}
                  <p className="text-xs text-gray-500 mt-3">
                    {post.author?.name || 'Admin'}
                    {post.publishedAt ? ` · ${prettyDate(post.publishedAt)}` : ''}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}