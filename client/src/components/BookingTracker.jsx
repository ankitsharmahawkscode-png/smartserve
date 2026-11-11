import { useCallback, useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import api from '../api/client.js';

const POLL_MS = 6000;
const MAX_FAILS = 3; // stop retrying after this many failures in a row
const STEPS = ['Booked', 'Assigned', 'On the way', 'Arrived', 'In progress', 'Completed'];
const DONE = ['COMPLETED', 'CANCELLED'];

const unwrap = (res) => res?.data?.data ?? res?.data ?? {};
const addrText = (a = {}) => [a.line1, a.line2, a.city, a.state, a.pincode].filter(Boolean).join(', ');

// Finds the address on the map once, then remembers it in the browser.
// Stops after the first answer so it never floods the free OpenStreetMap lookup.
async function geocode(a) {
  const tries = [addrText(a), [a?.city, a?.pincode].filter(Boolean).join(', ')].filter(Boolean);
  for (const q of tries) {
    const key = `geo:${q}`;
    try {
      const cached = localStorage.getItem(key);
      if (cached) return JSON.parse(cached);
    } catch { /* ignore */ }
    try {
      const r = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=in&q=${encodeURIComponent(q)}`
      );
      if (!r.ok) continue;
      const j = await r.json();
      if (j?.[0]) {
        const p = { lat: Number(j[0].lat), lng: Number(j[0].lon) };
        if (Number.isFinite(p.lat) && Number.isFinite(p.lng)) {
          try { localStorage.setItem(key, JSON.stringify(p)); } catch { /* ignore */ }
          return p;
        }
      }
    } catch { /* ignore */ }
  }
  return null;
}

const km = (a, b) => {
  const r = (x) => (x * Math.PI) / 180;
  const h =
    Math.sin(r(b.lat - a.lat) / 2) ** 2 +
    Math.cos(r(a.lat)) * Math.cos(r(b.lat)) * Math.sin(r(b.lng - a.lng) / 2) ** 2;
  return 12742 * Math.asin(Math.sqrt(h));
};

const pin = (emoji, bg) =>
  L.divIcon({
    className: '',
    html: `<div style="width:38px;height:38px;border-radius:50%;background:${bg};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 2px 8px rgba(0,0,0,.35);border:2px solid #fff">${emoji}</div>`,
    iconSize: [38, 38],
    iconAnchor: [19, 19],
  });

const stageOf = (t) => {
  switch (t.status) {
    case 'COMPLETED': return 5;
    case 'IN_PROGRESS': return 4;
    case 'ACCEPTED': return t.arrivedAt ? 3 : t.onTheWayAt ? 2 : 1;
    case 'ASSIGNED': return 1;
    default: return 0;
  }
};

const headline = (t, eta) => {
  const n = t.technician?.name?.split(' ')[0] || 'Your technician';
  switch (t.status) {
    case 'PENDING': return 'Waiting for confirmation';
    case 'CONFIRMED': return 'Finding a technician for you';
    case 'ASSIGNED': return 'Technician assigned. Waiting for them to accept';
    case 'ACCEPTED':
      if (t.arrivedAt) return `${n} has arrived`;
      if (t.onTheWayAt) return eta ? `${n} is on the way. Arriving in about ${eta} min` : `${n} is on the way`;
      return `${n} accepted your booking`;
    case 'IN_PROGRESS': return 'Work is in progress';
    case 'COMPLETED': return 'Job completed';
    case 'CANCELLED': return 'This booking was cancelled';
    default: return 'Booking update';
  }
};

export default function BookingTracker({ booking, onStatusChange }) {
  const [t, setT] = useState(null);
  const [home, setHome] = useState(null);
  const [err, setErr] = useState('');
  const [gaveUp, setGaveUp] = useState(false);

  const mapEl = useRef(null);
  const map = useRef(null);
  const techM = useRef(null);
  const homeM = useRef(null);
  const line = useRef(null);
  const fitted = useRef(0);
  const fails = useRef(0);
  const statusRef = useRef(booking.status);
  const prevStatus = useRef(booking.status);
  const onChange = useRef(onStatusChange);
  onChange.current = onStatusChange; // always call the latest callback without restarting effects

  const load = useCallback(async () => {
    try {
      const d = unwrap(await api.get(`/bookings/${booking._id}/tracking`));
      setT(d.tracking || null);
      setErr('');
      setGaveUp(false);
      fails.current = 0;
    } catch (e) {
      fails.current += 1;
      setErr(e.response?.data?.message || 'Could not refresh the status');
      if (fails.current >= MAX_FAILS) setGaveUp(true);
    }
  }, [booking._id]);

  // Refresh every few seconds while the tab is visible, the job is not finished,
  // and the server has not failed several times in a row
  useEffect(() => {
    load();
    const timer = setInterval(() => {
      if (!document.hidden && !DONE.includes(statusRef.current) && fails.current < MAX_FAILS) load();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden && fails.current < MAX_FAILS) load();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [load]);

  // Tell the parent page when the status changes, so it can reload its own data
  useEffect(() => {
    if (!t) return;
    statusRef.current = t.status;
    if (t.status !== prevStatus.current) {
      prevStatus.current = t.status;
      onChange.current?.(t.status);
    }
  }, [t]);

  // Place the customer's address on the map
  useEffect(() => {
    let on = true;
    geocode(booking.address).then((p) => { if (on) setHome(p); });
    return () => { on = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [booking._id]);

  const showMap = !!t && ['ACCEPTED', 'IN_PROGRESS'].includes(t.status);
  const loc = t?.location;
  const locLat = loc?.lat;
  const locLng = loc?.lng;

  // Create the map
  useEffect(() => {
    if (!showMap || !mapEl.current) return undefined;
    const m = L.map(mapEl.current).setView([20.59, 78.96], 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '© OpenStreetMap contributors',
    }).addTo(m);
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
      techM.current = null;
      homeM.current = null;
      line.current = null;
      fitted.current = 0;
    };
  }, [showMap]);

  const recenter = useCallback(() => {
    const m = map.current;
    if (!m) return;
    const pts = [];
    if (home) pts.push([home.lat, home.lng]);
    if (locLat != null && locLng != null) pts.push([locLat, locLng]);
    if (pts.length === 1) m.setView(pts[0], 15);
    else if (pts.length > 1) m.fitBounds(pts, { padding: [50, 50], maxZoom: 16 });
  }, [home, locLat, locLng]);

  // Move the markers
  useEffect(() => {
    const m = map.current;
    if (!m) return;

    if (home && !homeM.current) {
      homeM.current = L.marker([home.lat, home.lng], { icon: pin('🏠', '#0B1F3A') }).addTo(m);
    }

    const hasLoc = locLat != null && locLng != null;
    if (hasLoc) {
      const ll = [locLat, locLng];
      if (!techM.current) techM.current = L.marker(ll, { icon: pin('🔧', '#d97706') }).addTo(m);
      else techM.current.setLatLng(ll);
    } else if (techM.current) {
      techM.current.remove();
      techM.current = null;
    }

    if (line.current) { line.current.remove(); line.current = null; }
    if (home && hasLoc) {
      line.current = L.polyline([[home.lat, home.lng], [locLat, locLng]], {
        color: '#d97706', weight: 3, dashArray: '6 8',
      }).addTo(m);
    }

    // Fit the view the first time, then leave it alone so the customer can zoom
    const count = (home ? 1 : 0) + (hasLoc ? 1 : 0);
    if (count > fitted.current) {
      fitted.current = count;
      recenter();
    }
  }, [home, locLat, locLng, showMap, recenter]);

  // ---- loading and error states ----
  if (!t) {
    if (err) {
      return (
        <div role="alert" className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
          <p className="font-semibold">{err}</p>
          {gaveUp && (
            <button
              type="button"
              onClick={() => { fails.current = 0; setGaveUp(false); load(); }}
              className="mt-2 font-bold underline underline-offset-4"
            >
              Try again
            </button>
          )}
        </div>
      );
    }
    return <p className="p-4 text-sm text-ink-muted">Loading your booking status…</p>;
  }

  if (t.status === 'CANCELLED') return null;

  const distance = home && locLat != null && locLng != null ? km(home, { lat: locLat, lng: locLng }) : null;
  const eta = distance != null && !t.arrivedAt ? Math.max(1, Math.round(((distance * 1.3) / 22) * 60)) : null;
  const stage = stageOf(t);
  const tech = t.technician;
  const initials = (tech?.name || 'T').split(/\s+/).map((w) => w[0]).slice(0, 2).join('').toUpperCase();
  const shareText = `${tech?.name || 'My technician'} is ${t.arrivedAt ? 'here' : 'on the way'} for my home service.`;

  return (
    <section className="overflow-hidden rounded-2xl border border-line bg-white shadow-sm" aria-live="polite">
      {/* Headline */}
      <div className="bg-brand-dark px-5 py-4 text-white">
        <p className="text-[11px] font-bold uppercase tracking-widest text-white/60">Live status</p>
        <h2 className="mt-1 text-lg font-extrabold sm:text-xl">{headline(t, eta)}</h2>
        {distance != null && !t.arrivedAt && (
          <p className="mt-1 text-sm text-white/80">About {distance.toFixed(1)} km away</p>
        )}
        {loc?.stale && <p className="mt-1 text-xs text-amber-200">Location not updating. They may have poor network.</p>}
        {err && (
          <p className="mt-1 text-xs text-amber-200">
            {gaveUp ? 'Updates paused. ' : 'Connection problem. '}
            {gaveUp && (
              <button
                type="button"
                onClick={() => { fails.current = 0; setGaveUp(false); load(); }}
                className="font-bold underline underline-offset-2"
              >
                Refresh
              </button>
            )}
          </p>
        )}
      </div>

      {/* Steps */}
      <ol className="flex items-start px-3 pb-2 pt-5 sm:px-5" aria-label="Booking progress">
        {STEPS.map((label, i) => {
          const on = i <= stage;
          return (
            <li key={label} className="relative flex flex-1 flex-col items-center text-center">
              {i > 0 && (
                <span className={`absolute right-1/2 top-3.5 h-0.5 w-full ${i <= stage ? 'bg-brand' : 'bg-gray-200'}`} aria-hidden="true" />
              )}
              <span
                className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold ${
                  on ? 'bg-brand text-white' : 'bg-gray-200 text-gray-500'
                }`}
              >
                {i < stage ? '✓' : i + 1}
              </span>
              <span className={`mt-1.5 text-[10px] font-semibold leading-tight sm:text-xs ${on ? 'text-brand-dark' : 'text-gray-400'}`}>
                {label}
              </span>
            </li>
          );
        })}
      </ol>

      {/* Map */}
      {showMap && (
        <div className="relative mt-3">
          <div ref={mapEl} className="z-0 h-64 w-full bg-gray-100 sm:h-80" role="img" aria-label="Map showing your technician" />
          {!loc && (
            <div className="pointer-events-none absolute inset-x-3 top-3 z-[500] rounded-lg bg-white/95 p-3 text-center text-xs font-semibold text-gray-700 shadow">
              The map shows your technician once they set off.
            </div>
          )}
          {(home || loc) && (
            <button
              type="button"
              onClick={recenter}
              className="absolute bottom-3 right-3 z-[500] rounded-full bg-white px-3 py-1.5 text-xs font-bold shadow hover:bg-gray-50"
            >
              Recenter
            </button>
          )}
        </div>
      )}

      {(tech || t.startCode) && (
        <div className="grid gap-4 p-5 sm:grid-cols-2">
          {/* Technician */}
          {tech && (
            <div className="flex items-center gap-3 rounded-xl border border-line p-4">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#0B1F3A] font-bold text-white">
                {initials}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-extrabold">{tech.name}</p>
                <p className="text-xs text-ink-muted">Your technician</p>
              </div>
              <div className="flex shrink-0 gap-2">
                {tech.phone && (
                  <a
                    href={`tel:${tech.phone}`}
                    className="flex h-10 w-10 items-center justify-center rounded-full bg-green-600 text-lg text-white hover:bg-green-700"
                    aria-label={`Call ${tech.name}`}
                  >
                    📞
                  </a>
                )}
                <a
                  href={`https://wa.me/?text=${encodeURIComponent(shareText)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-line-strong text-lg hover:bg-gray-50"
                  aria-label="Share status on WhatsApp"
                >
                  ↗
                </a>
              </div>
            </div>
          )}

          {/* Start code */}
          {t.startCode && (
            <div className="rounded-xl border-2 border-dashed border-[#d97706] bg-[#fff8eb] p-4 text-center">
              <p className="text-xs font-bold uppercase tracking-wide text-[#b45309]">Start code</p>
              <p
                className="mt-1 font-mono text-4xl font-extrabold tracking-[0.35em] text-[#111]"
                aria-label={`Start code ${t.startCode.split('').join(' ')}`}
              >
                {t.startCode}
              </p>
              <p className="mt-2 text-xs leading-relaxed text-gray-600">
                Tell this code to the technician when they reach you so they can start the job. Do not share it before.
              </p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}