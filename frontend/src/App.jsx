import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Ventas from './pages/Ventas';
import Historial from './pages/Historial';
import Agendados from './pages/Agendados';
import Archivos from './pages/Archivos';
import Usuarios from './pages/Usuarios';
const PrivateRoute = ({ children }) => { const { token } = useAuth(); return token ? children : <Navigate to="/login" />; };
function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
      <Route path="/historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
      <Route path="/agendados" element={<PrivateRoute><Agendados /></PrivateRoute>} />
      <Route path="/archivos" element={<PrivateRoute><Archivos /></PrivateRoute>} />
      <Route path="/usuarios" element={<PrivateRoute><Usuarios /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
export default function App() {
  return (<AuthProvider><BrowserRouter><AppRoutes /></BrowserRouter></AuthProvider>);
}
