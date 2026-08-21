import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
<<<<<<< HEAD
const links = [
  { to: '/ventas', label: 'Ventas' },
  { to: '/historial', label: 'Historial' },
  { to: '/agendados', label: 'Agendados' },
  { to: '/archivos', label: 'Archivos' },
];

const linksAdmin = [
  { to: '/usuarios', label: 'Usuarios' },
];
=======
const links = [{ to: '/ventas', label: 'Ventas' },{ to: '/historial', label: 'Historial' },{ to: '/agendados', label: 'Agendados' },{ to: '/archivos', label: 'Archivos' },{ to: '/usuarios', label: 'Usuarios' }];
>>>>>>> ccc836f4984e8d0d1feea1f90e713fa4d43b9b4e
export default function Sidebar() {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate('/login'); };
  return (
    <aside className="w-56 min-h-screen bg-gray-900 text-white flex flex-col">
      <div className="p-5 border-b border-gray-700"><h1 className="text-xl font-bold text-green-400">CRM Solutel</h1><p className="text-xs text-gray-400 mt-1">{usuario?.nombre}</p></div>
      <nav className="flex-1 p-4 space-y-1">
<<<<<<< HEAD
      {links.map((link) => (
        <NavLink key={link.to} to={link.to}
          className={({ isActive }) =>
            `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
          }>
          {link.label}
        </NavLink>
      ))}
      {usuario?.rol === 'admin' && linksAdmin.map((link) => (
        <NavLink key={link.to} to={link.to}
          className={({ isActive }) =>
            `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`
          }>
          {link.label}
        </NavLink>
      ))}
    </nav>
=======
        {links.map((link) => (<NavLink key={link.to} to={link.to} className={({ isActive }) => `block px-4 py-2 rounded-lg text-sm transition ${isActive ? 'bg-green-600 text-white' : 'text-gray-300 hover:bg-gray-700'}`}>{link.label}</NavLink>))}
      </nav>
>>>>>>> ccc836f4984e8d0d1feea1f90e713fa4d43b9b4e
      <div className="p-4 border-t border-gray-700"><button onClick={handleLogout} className="w-full text-sm text-gray-400 hover:text-white transition">Cerrar sesión</button></div>
    </aside>
  );
}
