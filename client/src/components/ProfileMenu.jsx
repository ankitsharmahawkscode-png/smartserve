import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';

export default function ProfileMenu({ user, logout, role }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!user) return null;

  // Fallback avatar using the user's name
  const avatarUrl = user.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=0B1F3A&color=fff&bold=true`;
  
  // Capitalize role (e.g., "admin" -> "Admin")
  const displayRole = role.charAt(0).toUpperCase() + role.slice(1);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-3 rounded-xl hover:bg-gray-50 p-1.5 pr-3 transition-colors focus:outline-none focus:ring-2 focus:ring-brand/20"
      >
        {/* Avatar */}
        <img
          src={avatarUrl}
          alt={user.name}
          className="w-9 h-9 rounded-full object-cover border border-gray-200 shadow-sm"
        />

        {/* Name and Role Stack */}
        <div className="hidden sm:flex flex-col items-start text-left leading-tight">
          <span className="text-sm font-bold text-gray-900 truncate max-w-[120px]">
            {user.name}
          </span>
          <span className="text-xs font-medium text-gray-500">
            {displayRole}
          </span>
        </div>

        {/* Chevron Icon in a Circle */}
        <div className={`ml-1 flex items-center justify-center w-6 h-6 rounded-full border border-gray-400 text-gray-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}>
          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="m6 9 6 6 6-6" />
          </svg>
        </div>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-100 py-1 z-50">
          
          {/* 👇 HIDE "My Profile" FOR ADMINS TO PREVENT 404 👇 */}
          {role !== 'admin' && (
            <Link
              to={`/${role}/profile`}
              onClick={() => setIsOpen(false)}
              className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 font-medium"
            >
              My Profile
            </Link>
          )}

          {role !== 'admin' && <div className="border-t border-gray-100 my-1"></div>}

          {/* Logout Button */}
          <button
            onClick={() => {
              setIsOpen(false);
              logout();
              navigate('/');
            }}
            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 font-bold"
          >
            Log out
          </button>
        </div>
      )}
    </div>
  );
}