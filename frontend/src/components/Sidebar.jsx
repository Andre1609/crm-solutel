import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/ventas', label: 'Ventas' },
  { to: '/historial', label: 'Historial' },
  { to: '/agendados', label: 'Agendados' },
  { to: '/archivos', label: 'Archivos' },
];

const linksJefe = [
  { to: '/usuarios', label: 'Personal' },
];

export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };

  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700">
        <h1 className="text-xl font-bold text-green-400">CRM Solutel</h1>
        <p className="text-xs text-gray-400 mt-1">{usuario?.nombre}</p>
        {usuario?.rol_id && (
          <span className={`text-xs mt-1 inline-block px-2 py-0.5 rounded-full ${
            usuario.rol_id === 1 ? 'bg-red-900 text-red-300' :
            usuario.rol_id === 2 ? 'bg-purple-900 text-purple-300' :
            usuario.rol_id === 3 ? 'bg-blue-900 text-blue-300' :
            'bg-green-900 text-green-300'
          }`}>
            {usuario.rol_id === 1 ? 'Jefe de Plataforma' :
             usuario.rol_id === 2 ? 'Supervisor' :
             usuario.rol_id === 3 ? 'Back' : 'Asesor'}
          </span>
        )}
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {links.map((link) => (
          <NavLink key={link.to} to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
            }>
            {link.label}
          </NavLink>
        ))}
        {usuario?.rol_id === 1 && linksJefe.map((link) => (
          <NavLink key={link.to} to={link.to}
            className={({ isActive }) =>
              `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
            }>
            {link.label}
          </NavLink>
        ))}
      </nav>
      <div className="p-4 border-t border-gray-700">
        <button onClick={handleLogout} className="w-full text-sm text-gray-400 hover:text-white transition">
          Cerrar sesión
        </button>
      </div>
    </aside>
  );
}
