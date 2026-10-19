import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import api, { refreshSession, setAccessToken, setAuthFailureHandler } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // ✅ NEW: Track karo ki initial session check ho chuka hai ya nahi
  const [initialCheckDone, setInitialCheckDone] = useState(false);

  useEffect(() => {
    // Agar pehle se check ho chuka hai, toh dobara refresh mat karo
    if (initialCheckDone) return;

    let active = true;
    setAuthFailureHandler(() => setUser(null));
    
    refreshSession()
      .then((d) => active && setUser(d.user))
      .catch(() => {}) 
      .finally(() => {
        if (active) {
          setLoading(false);
          setInitialCheckDone(true); // ✅ Flag set karo
        }
      });
      
    return () => { active = false; };
  }, [initialCheckDone]);

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
        try { await api.post('/auth/logout'); } catch { /* cookie may already be gone */ }
        setAccessToken(null);
        setUser(null);
        setInitialCheckDone(false); // Logout pe reset karo
      },
    };
  }, [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);