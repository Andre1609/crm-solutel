import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Ventas from './pages/Ventas';
import MisVentas from './pages/MisVentas';
import Cargas from './pages/Cargas';
import Historial from './pages/Historial';
import Agendados from './pages/Agendados';
import Archivos from './pages/Archivos';
import Administracion from './pages/Administracion';
import BackOffice from './pages/DashBoard';
import Auditoria from './pages/Auditoria';

// Página de inicio según el rol
const inicioPorRol = (rol) => {
  if (rol === 3) return '/auditoria';
  if (rol === 4) return '/ventas';
  return '/historial';
};

const PrivateRoute = ({ children, roles }) => {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario?.rol_id)) return <Navigate to={inicioPorRol(usuario?.rol_id)} />;
  return children;
};

const HomeRedirect = () => {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/login" />;
  return <Navigate to={inicioPorRol(usuario?.rol_id)} />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/ventas" element={<PrivateRoute roles={[4]}><Ventas /></PrivateRoute>} />
      <Route path="/mis-ventas" element={<PrivateRoute roles={[4]}><MisVentas /></PrivateRoute>} />
      <Route path="/cargas" element={<PrivateRoute roles={[3]}><Cargas /></PrivateRoute>} />
      <Route path="/historial" element={<PrivateRoute roles={[1, 2]}><Historial /></PrivateRoute>} />
      <Route path="/agendados" element={<PrivateRoute roles={[1, 4]}><Agendados /></PrivateRoute>} />
      <Route path="/archivos" element={<PrivateRoute roles={[1]}><Archivos /></PrivateRoute>} />
      <Route path="/backoffice" element={<PrivateRoute roles={[1, 2]}><BackOffice /></PrivateRoute>} />
      <Route path="/auditoria" element={<PrivateRoute roles={[1, 3]}><Auditoria /></PrivateRoute>} />
      <Route path="/administracion" element={<PrivateRoute roles={[1]}><Administracion /></PrivateRoute>} />
      <Route path="/personal" element={<Navigate to="/administracion" replace />} />
      <Route path="*" element={<HomeRedirect />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
