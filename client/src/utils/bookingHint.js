const KEY = 'bookingHint';
const MAX_AGE = 6 * 60 * 60 * 1000; // forget it after 6 hours

export function saveHint(hint) {
  try {
    sessionStorage.setItem(KEY, JSON.stringify({ ...hint, at: Date.now() }));
  } catch {
    /* storage can be blocked, the booking still works without it */
  }
}

export function readHint(kind) {
  try {
    const h = JSON.parse(sessionStorage.getItem(KEY) || 'null');
    if (!h || Date.now() - h.at > MAX_AGE) return null;
    if (kind && h.kind !== kind) return null;
    return h;
  } catch {
    return null;
  }
}

export function clearHint() {
  try {
    sessionStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
}