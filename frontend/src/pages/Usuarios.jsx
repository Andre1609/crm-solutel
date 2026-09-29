import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Usuarios() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [personal, setPersonal] = useState([]);
  const [roles, setRoles] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [form, setForm] = useState({ personal_nombres: '', personal_apellidos: '', personal_email: '', password: '', personal_rol_id: '', personal_equipo_id: '' });
  const [msg, setMsg] = useState('');

  useEffect(() => {
    axios.get('http://localhost:3000/api/personal', { headers }).then(res => setPersonal(res.data));
    axios.get('http://localhost:3000/api/catalogo/roles', { headers }).then(res => setRoles(res.data));
    axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
  }, []);

  const handleCrear = async () => {
    try {
      await axios.post('http://localhost:3000/api/personal', form, { headers });
      setMsg('✅ Personal creado correctamente');
      const res = await axios.get('http://localhost:3000/api/personal', { headers });
      setPersonal(res.data);
      setForm({ personal_nombres: '', personal_apellidos: '', personal_email: '', password: '', personal_rol_id: '', personal_equipo_id: '' });
    } catch {
      setMsg('❌ Error al crear personal');
    }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Gestión de Personal</h2>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nuevo Personal</h3>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500">Nombres</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.personal_nombres} onChange={(e) => setForm({ ...form, personal_nombres: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Apellidos</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.personal_apellidos} onChange={(e) => setForm({ ...form, personal_apellidos: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Email</label><input type="text" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.personal_email} onChange={(e) => setForm({ ...form, personal_email: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Contraseña</label><input type="password" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          <div>
            <label className="text-xs text-gray-500">Rol</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.personal_rol_id} onChange={(e) => setForm({ ...form, personal_rol_id: e.target.value })}>
              <option value="">Seleccionar rol</option>
              {roles.map(r => <option key={r.rol_id} value={r.rol_id}>{r.rol_nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Equipo</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.personal_equipo_id} onChange={(e) => setForm({ ...form, personal_equipo_id: e.target.value })}>
              <option value="">Seleccionar equipo</option>
              {equipos.map(e => <option key={e.equipo_id} value={e.equipo_id}>{e.equipo_nombre}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleCrear} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm">Crear Personal</button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Email</th>
              <th className="px-4 py-3 text-left">Rol</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {personal.map((p) => (
              <tr key={p.personal_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{p.personal_nombres} {p.personal_apellidos}</td>
                <td className="px-4 py-3 text-gray-500">{p.personal_email}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    p.rol_nombre === 'Jefe de Plataforma' ? 'bg-red-100 text-red-700' :
                    p.rol_nombre === 'Supervisor' ? 'bg-purple-100 text-purple-700' :
                    p.rol_nombre === 'Back' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>{p.rol_nombre}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{p.equipo_nombre || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs ${p.personal_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                    {p.personal_activo ? 'Activo' : 'Inactivo'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
