import { useParams, Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

export default function BlogPost() {
  const { slug } = useParams();
  const { data: post, loading, error } = useFetch(`/blogs/${slug}`);

  // Setup SEO for the specific blog post
  useSeo({
    title: post ? `${post.title} | SmartServe` : 'Loading...',
    description: post?.excerpt || 'Read expert tips and guides from SmartServe.',
    path: `/blog/${slug}`,
    image: post?.coverImage
  });

  if (loading) return <div className="p-10 min-h-screen flex justify-center"><Spinner /></div>;
  if (error || !post) return <div className="p-10"><ErrorState message={error || "Post not found"} /></div>;

  // ✅ THE FIX: Split the comma-separated string from the database into an array
  const tagList = post.seo?.keywords 
    ? post.seo.keywords.split(',').map(k => k.trim()).filter(Boolean) 
    : [];

  return (
    <main className="bg-white min-h-screen pb-20">
      
      {/* --- COVER IMAGE & HEADER --- */}
      <section className="max-w-[900px] mx-auto px-4 sm:px-6 pt-10 pb-8">
        <Link to="/blog" className="text-brand-dark font-semibold text-sm hover:underline mb-6 inline-block">
          ← Back to Blog
        </Link>
        
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a1a] leading-[1.15] mb-6">
          {post.title}
        </h1>
        
        <div className="flex items-center gap-4 text-sm text-gray-500 font-medium mb-8">
          <span className="text-brand-dark font-bold">{post.author?.name || 'Admin'}</span>
          <span>•</span>
          <span>{post.publishedAt ? prettyDate(post.publishedAt) : 'Draft'}</span>
        </div>

        {post.coverImage && (
          <div className="w-full aspect-video rounded-xl overflow-hidden mb-10 bg-gray-100">
            <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />
          </div>
        )}

        {/* --- BLOG CONTENT --- */}
        <div className="prose prose-lg max-w-none text-gray-700">
          {/* 
            NOTE: If you are using a library like react-markdown to render HTML/Text, 
            replace this with your renderer. Otherwise, dangerouslySetInnerHTML is standard for CMS content.
          */}
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>

        {/* --- ✅ DYNAMIC TAGS SECTION (The Fix) --- */}
        {tagList.length > 0 && (
          <div className="flex flex-wrap items-center gap-2 mt-12 pt-8 border-t border-gray-200">
            <span className="font-bold text-[#1a1a1a] text-sm mr-2">Tags :</span>
            
            {tagList.map((keyword, index) => (
              <span 
                key={index} 
                className="bg-[#1a1a1a] text-white text-xs font-bold px-3 py-1.5 uppercase tracking-wider"
              >
                {keyword}
              </span>
            ))}
          </div>
        )}

      </section>
    </main>
  );
}