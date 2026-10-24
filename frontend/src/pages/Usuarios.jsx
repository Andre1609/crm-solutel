import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const rolColores = {
  'Jefe de Plataforma': 'bg-red-100 text-red-700',
  'Supervisor': 'bg-purple-100 text-purple-700',
  'Back': 'bg-blue-100 text-blue-700',
  'Asesor': 'bg-green-100 text-green-700',
};

const POR_PAGINA = 10;

export default function Usuarios() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [personal, setPersonal] = useState([]);
  const [roles, setRoles] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [equipoFiltro, setEquipoFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [form, setForm] = useState({ personal_nombres: '', personal_apellidos: '', personal_email: '', password: '', personal_rol_id: '', personal_equipo_id: '' });
  const [msg, setMsg] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [editando, setEditando] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [formEditar, setFormEditar] = useState({});

  const cargarPersonal = () => {
    axios.get('http://localhost:3000/api/personal', { headers }).then(res => setPersonal(res.data));
  };

  useEffect(() => {
    cargarPersonal();
    axios.get('http://localhost:3000/api/catalogo/roles', { headers }).then(res => setRoles(res.data));
    axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
  }, []);

  const filtradas = personal.filter(p => {
    const nombreCompleto = `${p.personal_nombres} ${p.personal_apellidos}`.toLowerCase();
    const coincideTexto = nombreCompleto.includes(filtro.toLowerCase()) || p.personal_email?.toLowerCase().includes(filtro.toLowerCase());
    
    let coincideEquipo = true;
    if (equipoFiltro === 'sin_equipo') {
      coincideEquipo = !p.personal_equipo_id;
    } else if (equipoFiltro) {
      coincideEquipo = String(p.personal_equipo_id) === String(equipoFiltro);
    }
    
    return coincideTexto && coincideEquipo;
  });

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA) || 1;
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginadas = filtradas.slice(inicio, inicio + POR_PAGINA);
  const filasVacias = POR_PAGINA - paginadas.length;

  useEffect(() => { setPagina(1); }, [filtro, equipoFiltro]);

  const handleCrear = async () => {
    try {
      await axios.post('http://localhost:3000/api/personal', form, { headers });
      setMsg('✅ Personal creado correctamente');
      cargarPersonal();
      setForm({ personal_nombres: '', personal_apellidos: '', personal_email: '', password: '', personal_rol_id: '', personal_equipo_id: '' });
    } catch { setMsg('❌ Error al crear personal'); }
  };

  const abrirModal = (p) => {
    setSeleccionado(p);
    setFormEditar({
      personal_nombres: p.personal_nombres,
      personal_apellidos: p.personal_apellidos,
      personal_email: p.personal_email,
      personal_rol_id: p.personal_rol_id,
      personal_equipo_id: p.personal_equipo_id || '',
    });
    setEditando(false);
    setConfirmEliminar(false);
  };

  const cerrarModal = () => {
    setSeleccionado(null);
    setEditando(false);
    setConfirmEliminar(false);
  };

  const handleEditar = async () => {
    try {
      await axios.put(`http://localhost:3000/api/personal/${seleccionado.personal_id}`, formEditar, { headers });
      setMsg('✅ Datos actualizados');
      cargarPersonal();
      cerrarModal();
    } catch { setMsg('❌ Error al actualizar'); }
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/personal/${seleccionado.personal_id}`, { headers });
      setMsg('✅ Personal eliminado');
      cargarPersonal();
      cerrarModal();
    } catch { setMsg('❌ Error al eliminar'); }
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

      <div className="flex gap-2 mb-4 flex-wrap">
        <input 
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52"
          placeholder="Buscar por nombre o email..."
          value={filtro} 
          onChange={(e) => setFiltro(e.target.value)} 
        />
        <select 
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={equipoFiltro} 
          onChange={(e) => setEquipoFiltro(e.target.value)}
        >
          <option value="">Todos los equipos</option>
          <option value="sin_equipo">Sin equipo</option>
          {equipos.map(e => (
            <option key={e.equipo_id} value={e.equipo_id}>{e.equipo_nombre}</option>
          ))}
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtradas.length} resultado(s)</p>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left w-52">Nombre</th>
              <th className="px-4 py-3 text-left w-56">Email</th>
              <th className="px-4 py-3 text-left w-36">Rol</th>
              <th className="px-4 py-3 text-left w-36">Equipo</th>
              <th className="px-4 py-3 text-left w-28">Estado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <>
                <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay personal registrado</td></tr>
                {Array.from({ length: POR_PAGINA - 1 }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-t border-gray-50"><td colSpan={5} className="h-10" /></tr>
                ))}
              </>
            ) : (
              <>
                {paginadas.map((p) => (
                  <tr key={p.personal_id}
                    className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer h-10"
                    onClick={() => abrirModal(p)}>
                    <td className="px-4 py-2 font-medium text-gray-800 truncate">{p.personal_nombres} {p.personal_apellidos}</td>
                    <td className="px-4 py-2 text-gray-500 truncate">{p.personal_email}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${rolColores[p.rol_nombre] || 'bg-gray-100 text-gray-600'}`}>{p.rol_nombre}</span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 truncate">{p.equipo_nombre || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${p.personal_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                        {p.personal_activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                  </tr>
                ))}
                {Array.from({ length: filasVacias }).map((_, i) => (
                  <tr key={`pad-${i}`} className="border-t border-gray-50 h-10"><td colSpan={5} /></tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filtradas.length > 0 ? `Página ${pagina} de ${totalPaginas} — mostrando ${inicio + 1} a ${Math.min(inicio + POR_PAGINA, filtradas.length)} de ${filtradas.length}` : '0 resultados'}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPagina(1)} disabled={pagina === 1}
                className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">«</button>
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}
                className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">‹</button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let p;
                if (totalPaginas <= 5) p = i + 1;
                else if (pagina <= 3) p = i + 1;
                else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
                else p = pagina - 2 + i;
                return (
                  <button key={p} onClick={() => setPagina(p)}
                    className={`px-3 py-1 rounded text-xs border ${pagina === p ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">›</button>
              <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas}
                className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">»</button>
            </div>
          )}
        </div>
      </div>

      {seleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

            {!editando && !confirmEliminar && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Datos del Personal</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Nombre</span>
                    <span className="font-medium">{seleccionado.personal_nombres} {seleccionado.personal_apellidos}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Email</span>
                    <span className="font-medium">{seleccionado.personal_email}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Rol</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${rolColores[seleccionado.rol_nombre] || 'bg-gray-100'}`}>{seleccionado.rol_nombre}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Equipo</span>
                    <span className="font-medium">{seleccionado.equipo_nombre || '-'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Estado</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${seleccionado.personal_activo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-600'}`}>
                      {seleccionado.personal_activo ? 'Activo' : 'Inactivo'}
                    </span>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditando(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Editar datos</button>
                  <button onClick={() => setConfirmEliminar(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Eliminar personal</button>
                </div>
              </>
            )}

            {editando && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Personal</h3>
                <div className="space-y-3">
                  {[['personal_nombres','Nombres'],['personal_apellidos','Apellidos'],['personal_email','Email']].map(([key, label]) => (
                    <div key={key}>
                      <label className="text-xs text-gray-500">{label}</label>
                      <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={formEditar[key] || ''}
                        onChange={(e) => setFormEditar({ ...formEditar, [key]: e.target.value })} />
                    </div>
                  ))}
                  <div>
                    <label className="text-xs text-gray-500">Rol</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.personal_rol_id || ''}
                      onChange={(e) => setFormEditar({ ...formEditar, personal_rol_id: e.target.value })}>
                      {roles.map(r => <option key={r.rol_id} value={r.rol_id}>{r.rol_nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Equipo</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.personal_equipo_id || ''}
                      onChange={(e) => setFormEditar({ ...formEditar, personal_equipo_id: e.target.value })}>
                      <option value="">Sin equipo</option>
                      {equipos.map(e => <option key={e.equipo_id} value={e.equipo_id}>{e.equipo_nombre}</option>)}
                    </select>
                  </div>
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditando(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                  <button onClick={handleEditar} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Guardar cambios</button>
                </div>
              </>
            )}

            {confirmEliminar && (
              <>
                <div className="text-center py-4">
                  <div className="text-5xl mb-4">⚠️</div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">¿Seguro que deseas eliminar este usuario?</h3>
                  <p className="text-sm text-gray-500">{seleccionado.personal_nombres} {seleccionado.personal_apellidos} será eliminado permanentemente.</p>
                </div>
                <div className="flex gap-3 mt-4">
                  <button onClick={() => setConfirmEliminar(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                  <button onClick={handleEliminar} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Sí, eliminar</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}
