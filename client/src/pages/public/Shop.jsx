import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useSeo from '../../hooks/useSeo.js';
import useFetch from '../../hooks/useFetch.js'; // 👈 Import your fetch hook
import { useAuth } from '../../context/AuthContext.jsx'; // 👈 Import auth to check if logged in
import { useState, useEffect } from 'react'; // 👈 Add useEffect
import api from '../../api/client.js'; // 👈 Import your axios client
import { 
  FaShoppingCart, 
  FaStar, 
  FaTools, 
  FaTruck, 
  FaShieldAlt, 
  FaFilter, 
  FaSearch 
} from 'react-icons/fa';

const CATEGORIES = ['All', 'Air Conditioners', 'Washing Machines', 'Refrigerators', 'Microwaves'];

export default function Shop() {
  const [activeCategory, setActiveCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const { user } = useAuth(); // Check if user is logged in

  // 👇 Fetch products from backend API 👇
const [products, setProducts] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState('');

useEffect(() => {
  const fetchProducts = async () => {
    try {
      setLoading(true);
      // Direct call to your Render backend
      const res = await api.get('/shop/products');
      // Set the data exactly as your API returns it
      setProducts(res.data.data || res.data || []); 
    } catch (err) {
      console.error("API Error:", err);
      setError(err.message || 'Failed to load products.');
    } finally {
      setLoading(false);
    }
  };
  fetchProducts();
}, []);


  useSeo({
    title: 'Buy Home Appliances Online | AC, Fridge, Washing Machine | SmartServe',
    description: 'Shop the best home appliances at SmartServe. Buy ACs, refrigerators, and washing machines with expert installation and extended warranty.',
    path: '/shop',
  });

  // Filter using backend data (note: using 'category' from DB)
  const filteredProducts = products.filter((p) => {
    const matchesCategory = activeCategory === 'All' || p.category === activeCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleBuyClick = (productId) => {
    if (!user) {
      // If not logged in, send to login page with a redirect back to shop
      navigate('/login?redirect=/shop');
      return;
    }
    // If logged in, navigate to a checkout page (You will need to build this page)
    // For now, let's just alert
    alert(`Proceeding to checkout for product: ${productId}`);
    // navigate(`/checkout/${productId}`);
  };

  return (
    <main className="bg-gray-50 min-h-screen pb-16">
      {/* Hero Section */}
      <section className="bg-white border-b border-line py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-4">
              Upgrade Your Home. <br />
              <span className="text-brand">Buy & Install with SmartServe.</span>
            </h1>
            <p className="text-ink-muted max-w-lg mx-auto md:mx-0">
              Shop top-brand appliances at the best prices. Free delivery, expert installation, and a 1-year extended warranty on all purchases.
            </p>
          </div>
          
          {/* Search Bar */}
          <div className="w-full md:w-auto flex-1 max-w-md">
            <div className="relative">
              <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search for ACs, Fridges, etc."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-gray-300 pl-11 pr-4 py-4 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand shadow-sm"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Trust Badges */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { icon: FaTruck, text: 'Free Delivery' },
            { icon: FaTools, text: 'Expert Installation' },
            { icon: FaShieldAlt, text: '1-Year Warranty' },
            { icon: FaStar, text: 'Genuine Products' },
          ].map((badge, i) => (
            <div key={i} className="flex items-center justify-center gap-2 bg-white rounded-lg p-3 border border-line text-sm font-semibold text-gray-700">
              <badge.icon className="text-brand" /> {badge.text}
            </div>
          ))}
        </div>
      </section>

      {/* Main Catalog */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-64 shrink-0">
            <div className="bg-white rounded-2xl border border-line p-5 sticky top-24">
              <div className="flex items-center gap-2 font-bold mb-4 text-gray-900">
                <FaFilter className="text-brand" /> Categories
              </div>
              <ul className="space-y-2">
                {CATEGORIES.map((cat) => (
                  <li key={cat}>
                    <button
                      onClick={() => setActiveCategory(cat)}
                      className={`w-full text-left px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                        activeCategory === cat
                          ? 'bg-brand-tint text-brand-dark'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      {cat}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          {/* Product Grid */}
          <div className="flex-1">
            <div className="mb-6 flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-900">
                {activeCategory === 'All' ? 'All Products' : activeCategory}
              </h2>
              <span className="text-sm text-ink-muted">{filteredProducts.length} results</span>
            </div>

            {/* 👇 Loading State 👇 */}
            {loading && (
              <div className="text-center py-20">
                <p className="text-lg font-semibold text-gray-600">Loading products...</p>
              </div>
            )}

            {/* 👇 Error State 👇 */}
            {error && (
              <div className="text-center py-20 bg-red-50 rounded-2xl border border-red-200">
                <p className="text-lg font-semibold text-red-700 mb-2">Failed to load products</p>
                <p className="text-red-500">{error}</p>
              </div>
            )}

            {/* 👇 Product Grid 👇 */}
            {!loading && !error && (
              filteredProducts.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-2xl border border-line">
                  <p className="text-lg font-semibold text-gray-900 mb-2">No products found</p>
                  <p className="text-ink-muted">Try adjusting your search or category filter.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
                  {filteredProducts.map((product, i) => (
                    <motion.div
                      key={product._id} // 👈 Use _id from MongoDB
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: i * 0.05 }}
                      className="bg-white rounded-2xl border border-line overflow-hidden hover:shadow-lg transition-shadow flex flex-col"
                    >
                      {/* Image */}
                      <div className="relative aspect-square bg-gray-50 p-4">
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-full h-full object-contain mix-blend-multiply"
                        />
                        <span className="absolute top-3 left-3 bg-red-100 text-red-700 text-xs font-bold px-2 py-1 rounded-md">
                          {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}% OFF
                        </span>
                      </div>

                      {/* Details */}
                      <div className="p-5 flex flex-col flex-1">
                        <p className="text-xs font-semibold text-brand mb-1">{product.category}</p>
                        <h3 className="font-bold text-gray-900 leading-snug mb-2 line-clamp-2">
                          {product.name}
                        </h3>
                        
                        <div className="flex items-center gap-1 mb-3">
                          <FaStar className="text-[#d97706] text-sm" />
                          <span className="text-sm font-bold">{product.rating}</span>
                          <span className="text-xs text-ink-muted">({product.numReviews || 0})</span>
                        </div>

                        <ul className="text-xs text-ink-muted space-y-1 mb-4 flex-1">
                          {product.features?.slice(0, 3).map((f, idx) => (
                            <li key={idx} className="flex items-center gap-1.5">
                              <span className="h-1 w-1 bg-gray-400 rounded-full"></span> {f}
                            </li>
                          ))}
                        </ul>

                        <div className="flex items-end justify-between mt-auto pt-4 border-t border-line">
                          <div>
                            <p className="text-lg font-extrabold text-gray-900">₹{product.price.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-ink-muted line-through">₹{product.originalPrice.toLocaleString('en-IN')}</p>
                          </div>
                          <button 
                            onClick={() => handleBuyClick(product._id)}
                            className="flex items-center gap-2 bg-brand-dark text-white rounded-xl px-4 py-2 text-sm font-bold hover:bg-black transition-colors"
                          >
                            <FaShoppingCart /> Buy
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
              )
            )}
          </div>
        </div>
      </section>
    </main>
  );
}