import { Link } from 'react-router-dom';
import useFetch from '../../hooks/useFetch.js';
import { EmptyState, ErrorState, Spinner } from '../../components/States.jsx';
import { prettyDate } from '../../utils/format.js';
import useSeo from '../../hooks/useSeo.js';

export default function Blog() {
  const { data, loading, error } = useFetch('/blogs');
  
  useSeo({
    title: 'Home Services Blog, Tips & Guides | SmartServe',
    description: 'Read expert tips, guides, and articles on home maintenance, AC repair, plumbing, and more from SmartServe.',
    path: '/blog',
  });

  if (loading) return <div className="p-10"><Spinner /></div>;
  if (error) return <div className="p-10"><ErrorState message={error} /></div>;

  const blogs = data?.items || [];
  
  // Agar koi blog nahi hai
  if (blogs.length === 0) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-20">
        <EmptyState title="No blog posts yet">Check back soon for new articles and tips.</EmptyState>
      </div>
    );
  }

  // Data ko sections mein divide kiya
  const featuredPost = blogs[0];
  const latestPosts = blogs.slice(1, 5); // 4 grid items
  const topReads = blogs.slice(5, 8);   // 3 list items

  return (
    <main className="bg-white min-h-screen pb-20">
      
      {/* --- SECTION 1: HERO / FEATURED POST --- */}
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 pt-10 pb-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Big Featured Image */}
          <Link to={`/blog/${featuredPost.slug}`} className="group block overflow-hidden rounded-xl relative aspect-[4/3] lg:aspect-auto lg:h-[500px] bg-gray-100">
            {featuredPost.coverImage ? (
              <img 
                src={featuredPost.coverImage} 
                alt={featuredPost.title} 
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-gray-400">No Image</div>
            )}
            <span className="absolute top-4 right-4 bg-gray-400/90 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-sm">News</span>
          </Link>
          
          {/* Featured Text */}
          <div className="flex flex-col justify-center">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#1a1a1a] leading-[1.15] mb-4">
              <Link to={`/blog/${featuredPost.slug}`} className="hover:text-brand transition-colors">
                {featuredPost.title}
              </Link>
            </h1>
            <p className="text-gray-600 text-base sm:text-lg mb-6 line-clamp-3">
              {featuredPost.excerpt}
            </p>
            <div className="text-sm text-gray-500 font-medium">
              <span className="text-brand-dark font-bold">{featuredPost.author?.name || 'Admin'}</span> • {featuredPost.publishedAt ? prettyDate(featuredPost.publishedAt) : ''}
            </div>
          </div>
        </div>
      </section>

      {/* --- SECTION 2: LATEST NEWS GRID --- */}
      {latestPosts.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 border-t border-gray-200">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl sm:text-3xl font-extrabold uppercase tracking-tight text-[#1a1a1a]">Latest News</h2>
            {/* Decorative Arrows */}
            <div className="flex gap-2">
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"><span className="sr-only">Prev</span>←</button>
              <button className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-100"><span className="sr-only">Next</span>→</button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {latestPosts.map((post) => (
              <article key={post._id} className="group flex flex-col">
                <Link to={`/blog/${post.slug}`} className="block relative aspect-[4/3] overflow-hidden rounded-md bg-gray-100 mb-4">
                  {post.coverImage && (
                    <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                  )}
                  <span className="absolute top-2 right-2 bg-gray-400/90 text-white text-[10px] font-bold px-2 py-0.5 uppercase tracking-wider rounded-sm">Latest</span>
                </Link>
                <h3 className="font-bold text-base leading-snug mb-2 group-hover:text-brand transition-colors line-clamp-3">
                  <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                </h3>
                <div className="mt-auto text-xs text-gray-500">
                  {post.author?.name || 'Admin'} • {post.publishedAt ? prettyDate(post.publishedAt) : ''}
                </div>
              </article>
            ))}
          </div>
        </section>
      )}

      {/* --- SECTION 3: TOP READS (List Format) --- */}
      {topReads.length > 0 && (
        <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 border-t border-gray-200">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
            
            {/* Left side big image (using first top read) */}
            <div className="group relative rounded-xl overflow-hidden aspect-[4/3] lg:aspect-auto lg:h-[400px] bg-gray-100">
              {topReads[0]?.coverImage && (
                <img src={topReads[0].coverImage} alt="Top Read" className="w-full h-full object-cover" />
              )}
              <span className="absolute top-4 right-4 bg-gray-700 text-white text-xs font-bold px-3 py-1 uppercase tracking-wider rounded-sm">Latest</span>
            </div>

            {/* Right side list */}
            <div className="flex flex-col gap-6 justify-center">
              {topReads.slice(1).map((post, index) => (
                <article key={post._id} className="flex flex-col sm:flex-row gap-4 border-b border-gray-200 pb-6 last:border-0 last:pb-0">
                  <div className="text-2xl font-bold text-gray-300 w-8 shrink-0">0{index + 1}.</div>
                  <div className="w-full sm:w-32 aspect-[4/3] shrink-0 rounded-md overflow-hidden bg-gray-100">
                    {post.coverImage && <img src={post.coverImage} alt={post.title} className="w-full h-full object-cover" />}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-snug mb-2 hover:text-brand">
                      <Link to={`/blog/${post.slug}`}>{post.title}</Link>
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">{post.excerpt}</p>
                    <div className="text-xs text-gray-500">
                      {post.author?.name || 'Admin'} • {post.publishedAt ? prettyDate(post.publishedAt) : ''}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>
      )}

    </main>
  );
}