import { createContext, useContext, useMemo, useState } from 'react';
import api, { setAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // { id, name, role }

  const value = useMemo(() => ({
    user,
    login: async (email, password) => {
      const { data } = await api.post('/auth/login', { email, password });
      setAccessToken(data.data.accessToken);
      setUser(data.data.user);
      return data.data.user;
    },
    logout: () => { setAccessToken(null); setUser(null); },
  }), [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
