import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
export default function Usuarios() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [usuarios, setUsuarios] = useState([]);
  const [form, setForm] = useState({ nombre: '', email: '', password: '', rol: 'vendedor' });
  const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('http://localhost:3000/api/usuarios', { headers }).then(res => setUsuarios(res.data)); }, []);
  const handleCrear = async () => {
    try { await axios.post('http://localhost:3000/api/usuarios', form, { headers }); setMsg('✅ Usuario creado'); const res = await axios.get('http://localhost:3000/api/usuarios', { headers }); setUsuarios(res.data); setForm({ nombre: '', email: '', password: '', rol: 'vendedor' }); }
    catch { setMsg('❌ Error al crear usuario'); }
  };
  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Usuarios</h2>
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nuevo Usuario</h3>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          {[['nombre','Nombre'],['email','Email'],['password','Contraseña']].map(([key, label]) => (<div key={key}><label className="text-xs text-gray-500">{label}</label><input type={key === 'password' ? 'password' : 'text'} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form[key]} onChange={(e) => setForm({ ...form, [key]: e.target.value })} /></div>))}
          <div><label className="text-xs text-gray-500">Rol</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.rol} onChange={(e) => setForm({ ...form, rol: e.target.value })}><option value="vendedor">Vendedor</option><option value="admin">Admin</option></select></div>
        </div>
        <button onClick={handleCrear} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm">Crear Usuario</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Email</th><th className="px-4 py-3 text-left">Rol</th><th className="px-4 py-3 text-left">Estado</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {usuarios.map((u) => (<tr key={u.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{u.nombre}</td><td className="px-4 py-3 text-gray-500">{u.email}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${u.rol === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>{u.rol}</span></td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs ${u.activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>{u.activo ? 'Activo' : 'Inactivo'}</span></td></tr>))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
