import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { refreshSession, setAccessToken, setAuthFailureHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // true until the first session check finishes

  useEffect(() => {
    let active = true;
    setAuthFailureHandler(() => setUser(null));
    refreshSession()
      .then((d) => active && setUser(d.user))
      .catch(() => {}) // no valid session: stay logged out
      .finally(() => active && setLoading(false));
    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const start = (data) => { setAccessToken(data.accessToken); setUser(data.user); return data.user; };
    return {
      user,
      setUser,
      loading,
      login: async (email, password) => start((await api.post('/auth/login', { email, password })).data.data),
      register: async (payload) => start((await api.post('/auth/register', payload)).data.data),
      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* cookie may already be gone */ }
        setAccessToken(null);
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);