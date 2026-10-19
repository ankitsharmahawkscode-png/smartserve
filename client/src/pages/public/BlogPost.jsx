import { useParams, Link, Navigate } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';
import { company } from '../../content.js';

// Social Share Icons (SVG)
const SocialIcons = ({ title }) => {
  const url = typeof window !== 'undefined' ? window.location.href : '';
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  return (
    <div className="flex gap-2">
      <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand transition">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M18.77 7.46H14.5v-1.9c0-.9.6-1.1 1-1.1h3V.5h-4.33C10.24.5 9.5 3.44 9.5 5.32v2.15h-3v4h3v12h5v-12h3.85l.42-4z"/></svg>
      </a>
      <a href={`https://twitter.com/intent/tweet?text=${encodedTitle}&url=${encodedUrl}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand transition">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
      </a>
      <a href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand transition">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>
      </a>
      <a href={`https://api.whatsapp.com/send?text=${encodedTitle} ${encodedUrl}`} target="_blank" rel="noreferrer" className="w-8 h-8 rounded-full bg-brand-dark text-white flex items-center justify-center hover:bg-brand transition">
        <svg fill="currentColor" viewBox="0 0 24 24" className="w-4 h-4"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
      </a>
    </div>
  );
};

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

  if (loading) return <div className="p-10 flex justify-center"><Spinner /></div>;
  if (error) return <div className="p-10"><ErrorState message={error} /></div>;
  if (!blog) return <Navigate to="/blog" replace />;

  return (
    <main className="bg-white pb-20">
      <article className="max-w-[1000px] mx-auto px-4 sm:px-6 py-8 sm:py-12">
        
        {/* Header Section */}
        <header className="mb-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#1a1a1a] leading-[1.2] mb-4">
            {blog.title}
          </h1>
          
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gray-200 pb-4">
            <div className="text-sm">
              <span className="text-[#d97706] font-medium">{blog.author?.name || 'Ankit Sharma'}</span>
              <span className="text-gray-500 ml-2">- {blog.publishedAt ? prettyDate(blog.publishedAt) : 'Recent'} at 11:50 AM IST</span>
            </div>
            <SocialIcons title={blog.title} />
          </div>
        </header>

        {/* Content Section with Image Wrap */}
        <div className="text-[17px] text-[#333] leading-[1.8]">
          {blog.coverImage && (
            <figure className="sm:float-left sm:mr-6 mb-6 w-full sm:w-[45%]">
              <img 
                src={blog.coverImage} 
                alt={blog.title} 
                className="w-full h-auto object-cover rounded-sm"
              />
            </figure>
          )}
          
          {/* Render HTML content. Note: 'first-letter' styling requires the first element to be a <p> tag */}
          <div 
            className="prose prose-lg max-w-none prose-p:mb-5 prose-h2:text-[28px] prose-h2:font-bold prose-h2:mt-8 prose-h2:mb-4 prose-h3:text-xl prose-h3:font-bold prose-h3:mt-6 prose-h3:mb-3 prose-p:first-of-type:first-letter:text-5xl prose-p:first-of-type:first-letter:font-serif prose-p:first-of-type:first-letter:float-left prose-p:first-of-type:first-letter:mr-3 prose-p:first-of-type:first-letter:text-[#d97706] prose-p:first-of-type:first-letter:leading-[0.8] clearfix"
            dangerouslySetInnerHTML={{ __html: blog.content }} 
          />
        </div>

        {/* Tags Section (Static for now, you can make it dynamic later) */}
        <div className="mt-10 clear-both">
          <p className="font-bold text-gray-700 mb-3">Tags :</p>
          <div className="flex flex-wrap gap-2">
            {/* Example static tags */}
            <span className="bg-[#222] text-white text-xs font-semibold px-4 py-2 uppercase tracking-wide">Home Maintenance</span>
            <span className="bg-[#222] text-white text-xs font-semibold px-4 py-2 uppercase tracking-wide">AC Repair</span>
            <span className="bg-[#222] text-white text-xs font-semibold px-4 py-2 uppercase tracking-wide">Summer Tips</span>
            <span className="bg-[#222] text-white text-xs font-semibold px-4 py-2 uppercase tracking-wide">SmartServe</span>
          </div>
        </div>

        {/* Editor/Author Profile Section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-6">About The Editor</p>
          <div className="bg-white border-b-4 border-[#d97706] shadow-sm rounded-lg p-6 flex items-start gap-4">
            <div className="w-16 h-16 bg-[#0B1F3A] text-white rounded-full flex items-center justify-center shrink-0 text-xl font-bold">
              SS
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-gray-900">{blog.author?.name || 'SmartServe Team'}</h3>
                <span className="bg-[#fef3c7] text-[#d97706] text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>
                  Verified
                </span>
              </div>
              <p className="text-sm text-gray-500 mt-1">Content Creator & Home Expert</p>
            </div>
          </div>
        </div>

        <div className="mt-8">
           <Link to="/blog" className="text-brand font-semibold hover:underline">← Back to all articles</Link>
        </div>
      </article>
    </main>
  );
}