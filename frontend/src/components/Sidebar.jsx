import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const rolColores = {
  1: 'bg-red-900 text-red-300',
  2: 'bg-purple-900 text-purple-300',
  3: 'bg-blue-900 text-blue-300',
  4: 'bg-green-900 text-green-300',
};

const rolNombres = {
  1: 'Jefe de Plataforma',
  2: 'Supervisor',
  3: 'Back',
  4: 'Asesor',
};

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  const rol = usuario?.rol_id;

  const links = [
    { to: '/mis-ventas', label: 'Ventas', roles: [4] },
    { to: '/ventas', label: 'Cargar', roles: [4] },
    { to: '/historial', label: 'Historial', roles: [1, 2] },
    { to: '/agendados', label: 'Agendados', roles: [1, 4] },
    { to: '/archivos', label: 'Archivos', roles: [1] },
    { to: '/backoffice', label: 'Dashboard', roles: [1, 2] },
    { to: '/cargas', label: 'Cargas', roles: [3] },
    { to: '/auditoria', label: 'Auditoría', roles: [1, 3] },
    { to: '/administracion', label: 'Administración', roles: [1] },
    
  ].filter(l => l.roles.includes(rol));

  return (
    <aside className="w-56 h-full shrink-0 bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700 shrink-0">
        <h1 className="text-xl font-bold text-green-400">CRM Solutel</h1>
        <p className="text-xs text-gray-300 mt-1 font-medium">{usuario?.nombre}</p>
        {rol && (
          <div className="flex flex-wrap items-center gap-1 mt-1">
            <span className={`text-xs inline-block px-2 py-0.5 rounded-full ${rolColores[rol] || 'bg-gray-700 text-gray-300'}`}>
              {rolNombres[rol] || 'Usuario'}
            </span>
            {rol === 4 && usuario?.equipo_nombre && (
              <span className="text-xs inline-block px-2 py-0.5 rounded-full bg-gray-700 text-gray-200">
                {usuario.equipo_nombre}
              </span>
            )}
          </div>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
            }>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700 shrink-0">
        <button onClick={handleLogout} className="w-full text-sm text-gray-400 hover:text-white transition">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
