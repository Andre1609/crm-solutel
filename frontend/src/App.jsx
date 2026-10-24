import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Ventas from './pages/Ventas';
import Historial from './pages/Historial';
import Agendados from './pages/Agendados';
import Archivos from './pages/Archivos';
import Usuarios from './pages/Usuarios';
import BackOffice from './pages/DashBoard';
import Auditoria from './pages/Auditoria';

const PrivateRoute = ({ children, roles }) => {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario?.rol_id)) {
    if (usuario?.rol_id === 3) return <Navigate to="/auditoria" />;
    return <Navigate to="/ventas" />;
  }
  return children;
};

const HomeRedirect = () => {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (usuario?.rol_id === 3) return <Navigate to="/auditoria" />;
  return <Navigate to="/ventas" />;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/ventas" element={<PrivateRoute roles={[1, 2, 4]}><Ventas /></PrivateRoute>} />
      <Route path="/historial" element={<PrivateRoute roles={[1, 2]}><Historial /></PrivateRoute>} />
      <Route path="/agendados" element={<PrivateRoute roles={[1, 2, 4]}><Agendados /></PrivateRoute>} />
      <Route path="/archivos" element={<PrivateRoute roles={[1, 2, 4]}><Archivos /></PrivateRoute>} />
      <Route path="/backoffice" element={<PrivateRoute roles={[1, 2]}><BackOffice /></PrivateRoute>} />
      <Route path="/auditoria" element={<PrivateRoute roles={[1, 3]}><Auditoria /></PrivateRoute>} />
      <Route path="/personal" element={<PrivateRoute roles={[1]}><Usuarios /></PrivateRoute>} />
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
