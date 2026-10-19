import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { refreshSession, setAccessToken, setAuthFailureHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    setAuthFailureHandler(() => {
      if (active) setUser(null);
    });

    // Page load hote hi refresh session check karo
    refreshSession()
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch(() => {
        if (active) setUser(null); // Token nahi mila toh user null
      })
      .finally(() => {
        if (active) setLoading(false); // Check poora hone ke baad loading false
      });

    return () => { active = false; };
  }, []);

  const value = useMemo(() => {
    const start = (data) => { 
      setAccessToken(data.accessToken); 
      setUser(data.user); 
      return data.user; 
    };
    
    return {
      user,
      setUser,
      loading,
      login: async (email, password) => start((await api.post('/auth/login', { email, password })).data.data),
      register: async (payload) => start((await api.post('/auth/register', payload)).data.data),
      logout: async () => {
        try { await api.post('/auth/logout'); } catch { /* cookie gone */ }
        setAccessToken(null);
        setUser(null);
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);