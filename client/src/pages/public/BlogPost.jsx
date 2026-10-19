import { useParams, Link, Navigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

export default function BlogPost() {
  const { slug } = useParams();
  const { data, loading, error } = useFetch(`/blogs/${slug}`);

  const blog = data?.blog;

  useSeo({
    title: blog?.seo?.title || (blog ? `${blog.title} | SmartServe` : 'Blog'),
    description: blog?.seo?.description || blog?.excerpt || '',
    path: `/blog/${slug}`,
    jsonLd: blog ? {
      '@context': 'https://schema.org',
      '@type': 'Article',
      headline: blog.title,
      image: blog.coverImage ? [blog.coverImage] : undefined,
      datePublished: blog.publishedAt,
      dateModified: blog.updatedAt,
      author: [{
        '@type': 'Organization',
        name: company.name,
        url: window.location.origin
      }]
    } : undefined
  });

  if (loading) return <div className="p-10"><Spinner /></div>;
  if (error) return <div className="p-10"><ErrorState message={error} /></div>;
  if (!blog) return <Navigate to="/blog" replace />;

  return (
    <main className="bg-white">
      {blog.coverImage && (
        <div className="w-full h-[30vh] sm:h-[45vh] md:h-[60vh] max-h-[600px] overflow-hidden bg-gray-100">
          <img src={blog.coverImage} alt={blog.title} className="w-full h-full object-cover" />
        </div>
      )}
      
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <p className="mb-4 text-sm">
          <Link to="/blog" className="text-brand hover:underline underline-offset-2">← Back to all articles</Link>
        </p>
        
        <header className="mb-8 sm:mb-10 text-center">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-tight text-brand-dark tracking-tight mb-4">
            {blog.title}
          </h1>
          <div className="flex items-center justify-center gap-3 text-sm text-ink-muted">
            <span>{blog.author?.name || 'SmartServe Team'}</span>
            <span>•</span>
            <span>{blog.publishedAt ? prettyDate(blog.publishedAt) : 'Draft'}</span>
          </div>
        </header>

        {/* Content Renders as HTML */}
        <div 
          className="prose prose-sm sm:prose-base lg:prose-lg mx-auto prose-headings:text-brand-dark prose-a:text-brand hover:prose-a:text-brand-dark"
          dangerouslySetInnerHTML={{ __html: blog.content }} 
        />
      </article>
    </main>
  );
}