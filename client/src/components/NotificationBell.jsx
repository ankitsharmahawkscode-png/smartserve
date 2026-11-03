import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client.js';

const POLL_MS = 30000;

const timeAgo = (v) => {
  const s = Math.floor((Date.now() - new Date(v).getTime()) / 1000);
  if (!Number.isFinite(s) || s < 0) return '';
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60);
  if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h} hr ago`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(v).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
};

const Svg = ({ children, className = 'h-4 w-4' }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    {children}
  </svg>
);

const TYPES = {
  booking: {
    style: 'bg-cyan-100 text-cyan-700',
    icon: <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>,
  },
  application: {
    style: 'bg-emerald-100 text-emerald-700',
    icon: <Svg><circle cx="9" cy="8" r="4" /><path d="M2 21a7 7 0 0 1 14 0" /><path d="M19 8v6M16 11h6" /></Svg>,
  },
  refund: {
    style: 'bg-amber-100 text-amber-700',
    icon: <Svg><path d="M3 7v6h6" /><path d="M21 17a9 9 0 0 0-15-6.7L3 13" /></Svg>,
  },
  system: {
    style: 'bg-gray-100 text-gray-600',
    icon: <Svg><circle cx="12" cy="12" r="9" /><path d="M12 8v4M12 16h.01" /></Svg>,
  },
};

export default function NotificationBell() {
  const navigate = useNavigate();
  const box = useRef(null);
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState([]);
  const [unread, setUnread] = useState(0);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const res = await api.get('/admin/notifications', { params: { limit: 20 } });
      // works whether the API client unwraps the body or not
      const d = res?.data?.data ?? res?.data ?? {};
      setItems(Array.isArray(d.items) ? d.items : []);
      setUnread(Number(d.unread) || 0);
      setFailed(false);
    } catch {
      setFailed(true);
    }
  }, []);

  // Poll every 30s, but only while the tab is visible
  useEffect(() => {
    load();
    const timer = setInterval(() => { if (!document.hidden) load(); }, POLL_MS);
    const onVisible = () => { if (!document.hidden) load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  // Close on outside click or Escape
  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => { if (box.current && !box.current.contains(e.target)) setOpen(false); };
    const onKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const toggle = () => {
    setOpen((o) => !o);
    if (!open) load();
  };

  const openItem = (n) => {
    setOpen(false);
    if (!n.isRead) {
      setItems((list) => list.map((x) => (x._id === n._id ? { ...x, isRead: true } : x)));
      setUnread((u) => Math.max(0, u - 1));
      api.patch(`/admin/notifications/${n._id}/read`).catch(() => {});
    }
    if (n.link) navigate(n.link);
  };

  const readAll = async () => {
    setItems((list) => list.map((x) => ({ ...x, isRead: true })));
    setUnread(0);
    try {
      await api.patch('/admin/notifications/read-all');
    } catch {
      load();
    }
  };

  return (
    <div ref={box} className="relative">
      <button
        type="button"
        onClick={toggle}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
        className="relative flex h-10 w-10 items-center justify-center rounded-full text-gray-600 transition-colors hover:bg-gray-100"
      >
        <Svg className="h-5 w-5">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </Svg>
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="fixed inset-x-3 top-16 z-50 overflow-hidden rounded-lg border border-gray-200 bg-white shadow-xl sm:absolute sm:inset-x-auto sm:right-0 sm:top-full sm:mt-2 sm:w-[380px]">
          <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
            <h2 className="text-sm font-extrabold text-gray-800">
              Notifications {unread > 0 && <span className="font-semibold text-gray-400">({unread} new)</span>}
            </h2>
            <button
              type="button"
              onClick={readAll}
              disabled={unread === 0}
              className="text-xs font-bold text-[#d97706] hover:underline disabled:text-gray-300 disabled:no-underline"
            >
              Mark all as read
            </button>
          </div>

          <div className="max-h-[420px] overflow-y-auto">
            {failed && items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">Could not load notifications.</p>
            ) : items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-gray-500">You're all caught up.</p>
            ) : (
              <ul>
                {items.map((n) => {
                  const t = TYPES[n.type] || TYPES.system;
                  return (
                    <li key={n._id} className="border-b border-gray-100 last:border-b-0">
                      <button
                        type="button"
                        onClick={() => openItem(n)}
                        className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                          n.isRead ? '' : 'bg-[#fff8eb]'
                        }`}
                      >
                        <span className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${t.style}`}>
                          {t.icon}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className={`block text-[13px] text-gray-800 ${n.isRead ? 'font-semibold' : 'font-extrabold'}`}>
                            {n.title}
                          </span>
                          {n.message && (
                            <span className="mt-0.5 block truncate text-xs text-gray-500">{n.message}</span>
                          )}
                          <span className="mt-1 block text-[11px] text-gray-400">{timeAgo(n.createdAt)}</span>
                        </span>
                        {!n.isRead && <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-[#d97706]" />}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </div>
      )}
    </div>
  );
}