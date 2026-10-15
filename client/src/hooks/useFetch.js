import { useCallback, useEffect, useRef, useState } from 'react';
import api, { apiMessage } from '../api/client.js';

// GET helper. Pass url = null to skip. Ignores out-of-date responses.
export default function useFetch(url, params) {
  const [state, setState] = useState({ data: null, loading: Boolean(url), error: '' });
  const latest = useRef(0);
  const key = url ? url + JSON.stringify(params || {}) : '';

  const load = useCallback(() => {
    if (!url) { setState({ data: null, loading: false, error: '' }); return; }
    const id = ++latest.current;
    setState((s) => ({ ...s, loading: true, error: '' }));
    api.get(url, { params })
      .then((r) => id === latest.current && setState({ data: r.data.data, loading: false, error: '' }))
      .catch((e) => id === latest.current && setState({ data: null, loading: false, error: apiMessage(e) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { load(); }, [load]);
  return { ...state, reload: load };
}