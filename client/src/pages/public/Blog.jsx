import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

export default function Blog() {
  const { data, loading, error } = useFetch('/blogs');
  
  useSeo({
    title: 'Blog & Home Maintenance Tips | SmartServe',
    description: 'Read expert tips, guides, and articles on home maintenance, AC repair, plumbing, and more from SmartServe.',
    path: '/blog',
  });

  if (loading) return <div className="p-10"><Spinner /></div>;
  if (error) return <div className="p-10"><ErrorState message={error} /></div>;

  const blogs = data?.items || [];

  return (
    <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      <div className="text-center mb-10 sm:mb-14">
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-brand-dark tracking-tight">
          SmartServe Blog
        </h1>
        <p className="mt-4 text-base sm:text-lg text-ink-muted max-w-2xl mx-auto">
          Expert tips, guides, and news to help you take better care of your home.
        </p>
      </div>

      {blogs.length === 0 ? (
        <EmptyState title="No blog posts yet">
          Check back soon for new articles and tips.
        </EmptyState>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {blogs.map((post) => (
            <article key={post._id} className="bg-white rounded-2xl border border-line shadow-sm overflow-hidden flex flex-col transition-shadow hover:shadow-md">
              {post.coverImage && (
                <Link to={`/blog/${post.slug}`}>
                  <img 
                    src={post.coverImage} 
                    alt={post.title} 
                    className="w-full h-48 object-cover" 
                    loading="lazy"
                  />
                </Link>
              )}
              <div className="p-5 sm:p-6 flex flex-col flex-1">
                <p className="text-xs text-ink-muted mb-2">
                  {post.publishedAt ? prettyDate(post.publishedAt) : ''}
                </p>
                <h2 className="text-xl font-extrabold mb-3 leading-snug">
                  <Link to={`/blog/${post.slug}`} className="hover:text-brand transition-colors">
                    {post.title}
                  </Link>
                </h2>
                <p className="text-sm text-ink-muted mb-5 line-clamp-3 flex-1">
                  {post.excerpt}
                </p>
                <Link 
                  to={`/blog/${post.slug}`}
                  className="inline-flex items-center text-sm font-semibold text-brand hover:text-brand-dark"
                >
                  Read more <span className="ml-1" aria-hidden="true">→</span>
                </Link>
              </div>
            </article>
          ))}
        </div>
      )}
    </main>
  );
}