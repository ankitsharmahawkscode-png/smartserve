import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function LoginPopup() {
  const { user, loading } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Agar user logged in hai ya loading hai, toh popup mat dikhao
    if (loading || user) return;

    // Check karo ki user ne pehle popup close kiya tha ya nahi (localStorage)
    const hasSeenPopup = localStorage.getItem('smartserve_popup_seen');

    if (!hasSeenPopup) {
      // 5 second baad popup dikhao
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 5000);

      return () => clearTimeout(timer);
    }
  }, [user, loading]);

  const handleClose = () => {
    setIsOpen(false);
    // LocalStorage me save karo ki user ne popup dekh liya hai
    localStorage.setItem('smartserve_popup_seen', 'true');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 sm:p-8 relative animate-fade-in-up">
        
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-800 transition"
          aria-label="Close popup"
        >
          ✕
        </button>

        <div className="text-center">
          <div className="mx-auto mb-4 w-14 h-14 rounded-2xl bg-brand-tint text-brand-dark flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <rect x="4" y="10" width="16" height="11" rx="2" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 10V7a4 4 0 0 1 8 0v3" />
              <path strokeLinecap="round" d="M12 14v3" />
            </svg>
          </div>

          <h2 className="text-2xl font-extrabold text-brand-dark mb-2">Welcome to SmartServe!</h2>
          <p className="text-ink-muted text-sm mb-6">
            Log in or create an account to book services, track your technician live, and get exclusive discounts.
          </p>

          <div className="flex flex-col gap-3">
            <Link
              to="/register"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center min-h-[48px] rounded-xl bg-brand text-white font-bold text-base hover:bg-brand-dark transition"
            >
              Create Free Account
            </Link>
            <Link
              to="/login"
              onClick={handleClose}
              className="w-full inline-flex items-center justify-center min-h-[48px] rounded-xl border border-line-strong bg-white text-ink font-bold text-base hover:bg-gray-50 transition"
            >
              Log In
            </Link>
          </div>

          <p className="mt-4 text-xs text-ink-muted">
            By continuing, you agree to our Terms & Privacy Policy.
          </p>
        </div>
      </div>
    </div>
  );
}