import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import api, { refreshSession, setAccessToken, setAuthFailureHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ Session check sirf ek baar ho, baar-baar na ho
  const hasChecked = useRef(false);

  useEffect(() => {
    if (hasChecked.current) return;
    hasChecked.current = true;

    let active = true;
    setAuthFailureHandler(() => {
        if (active) setUser(null);
    });

    refreshSession()
      .then((d) => {
        if (active) setUser(d.user);
      })
      .catch(() => {
        // Kuch nahi karna, user null rahega
      })
      .finally(() => {
        if (active) setLoading(false);
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
        try { await api.post('/auth/logout'); } catch {}
        setAccessToken(null);
        setUser(null);
        hasChecked.current = false; // Logout pe reset karo taaki next login pe check ho
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);