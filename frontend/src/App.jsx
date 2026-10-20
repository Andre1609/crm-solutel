import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Login from './pages/Login';
import Ventas from './pages/Ventas';
import Historial from './pages/Historial';
import Agendados from './pages/Agendados';
import Archivos from './pages/Archivos';
import Usuarios from './pages/Usuarios';
import BackOffice from './pages/BackOffice';

const PrivateRoute = ({ children, roles }) => {
  const { token, usuario } = useAuth();
  if (!token) return <Navigate to="/login" />;
  if (roles && !roles.includes(usuario?.rol_id)) return <Navigate to="/ventas" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/ventas" element={<PrivateRoute><Ventas /></PrivateRoute>} />
      <Route path="/historial" element={<PrivateRoute><Historial /></PrivateRoute>} />
      <Route path="/agendados" element={<PrivateRoute><Agendados /></PrivateRoute>} />
      <Route path="/archivos" element={<PrivateRoute><Archivos /></PrivateRoute>} />
      <Route path="/backoffice" element={<PrivateRoute roles={[1, 2, 3]}><BackOffice /></PrivateRoute>} />
      <Route path="/personal" element={<PrivateRoute roles={[1]}><Usuarios /></PrivateRoute>} />
      <Route path="*" element={<Navigate to="/login" />} />
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
