import { createContext, useState, useContext } from 'react';
const AuthContext = createContext();
export const AuthProvider = ({ children }) => {
  const [usuario, setUsuario] = useState(() => { const u = localStorage.getItem('usuario'); return u ? JSON.parse(u) : null; });
  const [token, setToken] = useState(() => localStorage.getItem('token') || null);
  const login = (data) => { setUsuario(data.usuario); setToken(data.token); localStorage.setItem('usuario', JSON.stringify(data.usuario)); localStorage.setItem('token', data.token); };
  const logout = () => { setUsuario(null); setToken(null); localStorage.removeItem('usuario'); localStorage.removeItem('token'); };
  return <AuthContext.Provider value={{ usuario, token, login, logout }}>{children}</AuthContext.Provider>;
};
export const useAuth = () => useContext(AuthContext);
