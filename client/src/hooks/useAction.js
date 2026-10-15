import { useState } from 'react';
import { apiMessage } from '../api/client.js';

// run(async () => {...}) -> true on success, false on failure (message in `error`).
export default function useAction() {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const run = async (fn) => {
    setBusy(true);
    setError('');
    try { await fn(); return true; }
    catch (e) { setError(e.response?.data?.errors?.[0]?.message || apiMessage(e)); return false; }
    finally { setBusy(false); }
  };
  return { busy, error, setError, run };
}