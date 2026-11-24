import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function Tarifas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [tarifas, setTarifas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState({ tarifa_nombre: '', tarifa_descripcion: '' });
  const [msg, setMsg] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [seleccionada, setSeleccionada] = useState(null);
  const [formEditar, setFormEditar] = useState({ tarifa_nombre: '', tarifa_descripcion: '' });

  const cargar = () => {
    axios.get('http://localhost:3000/api/catalogo/tarifas/admin', { headers })
      .then(res => setTarifas(res.data))
      .catch(() => setTarifas([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const avisar = (texto, ok = true) => setMsg({ texto, ok });
  const errorDe = (err, defecto) => err.response?.data?.mensaje || defecto;

  const handleCrear = async () => {
    if (!form.tarifa_nombre.trim()) return avisar('❌ Escribe el nombre de la tarifa', false);
    setGuardando(true);
    try {
      await axios.post('http://localhost:3000/api/catalogo/tarifas', form, { headers });
      avisar('✅ Tarifa creada correctamente');
      setForm({ tarifa_nombre: '', tarifa_descripcion: '' });
      cargar();
    } catch (err) { avisar(`❌ ${errorDe(err, 'Error al crear la tarifa')}`, false); }
    finally { setGuardando(false); }
  };

  const abrir = (c) => {
    setSeleccionada(c);
    setFormEditar({ tarifa_nombre: c.tarifa_nombre, tarifa_descripcion: c.tarifa_descripcion || '' });
  };

  const guardarCambios = async (c, cambios, textoOk) => {
    try {
      await axios.put(`http://localhost:3000/api/catalogo/tarifas/${c.tarifa_id}`, {
        tarifa_nombre: c.tarifa_nombre,
        tarifa_descripcion: c.tarifa_descripcion,
        tarifa_activa: c.tarifa_activa,
        ...cambios,
      }, { headers });
      avisar(textoOk);
      setSeleccionada(null);
      cargar();
    } catch (err) { avisar(`❌ ${errorDe(err, 'Error al guardar los cambios')}`, false); }
  };

  const handleEditar = () => guardarCambios(seleccionada, formEditar, '✅ Tarifa actualizada');

  const handleActivar = (c) => {
    const activar = !c.tarifa_activa;
    if (!activar && !window.confirm(`¿Desactivar "${c.tarifa_nombre}"? Ya no aparecerá para cargar nuevas ventas. Las ventas existentes no se modifican.`)) return;
    guardarCambios(c, { tarifa_activa: activar ? 1 : 0 }, activar ? '✅ Tarifa activada' : '✅ Tarifa desactivada');
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nueva Tarifa</h3>
        {msg && <p className={`text-sm mb-3 ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.texto}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Nombre</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" maxLength={100}
              placeholder="Ej: Tarifa Solar + Bateria Virtual + SVA"
              value={form.tarifa_nombre} onChange={(e) => setForm({ ...form, tarifa_nombre: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Descripción (opcional)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.tarifa_descripcion} onChange={(e) => setForm({ ...form, tarifa_descripcion: e.target.value })} />
          </div>
        </div>
        <button onClick={handleCrear} disabled={guardando}
          className="mt-4 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-5 py-2 rounded-lg text-sm">
          {guardando ? 'Creando...' : 'Crear Tarifa'}
        </button>
      </div>

      <p className="text-xs text-gray-500 mb-3">{tarifas.length} tarifa(s)</p>

      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Tarifa</th>
              <th className="px-4 py-3 text-left">Descripción</th>
              <th className="px-4 py-3 text-left">Ventas</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : tarifas.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay tarifas registradas</td></tr>
            ) : tarifas.map(c => (
              <tr key={c.tarifa_id} className="border-t border-gray-100 hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{c.tarifa_nombre}</td>
                <td className="px-4 py-3 text-gray-500">{c.tarifa_descripcion || '-'}</td>
                <td className="px-4 py-3 text-gray-600">{c.total_ventas}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-0.5 rounded-full text-xs whitespace-nowrap ${c.tarifa_activa ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                    {c.tarifa_activa ? 'Activa' : 'Inactiva'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <button onClick={() => abrir(c)}
                      className="border border-gray-300 text-gray-600 px-3 py-1 rounded-lg text-xs hover:bg-gray-50">Editar</button>
                    <button onClick={() => handleActivar(c)}
                      className={`px-3 py-1 rounded-lg text-xs border ${c.tarifa_activa ? 'border-red-300 text-red-600 hover:bg-red-50' : 'border-green-300 text-green-700 hover:bg-green-50'}`}>
                      {c.tarifa_activa ? 'Desactivar' : 'Activar'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSeleccionada(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
            <button onClick={() => setSeleccionada(null)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Tarifa</h3>
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500">Nombre</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" maxLength={100}
                  value={formEditar.tarifa_nombre}
                  onChange={(e) => setFormEditar({ ...formEditar, tarifa_nombre: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-gray-500">Descripción</label>
                <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none" rows={3}
                  value={formEditar.tarifa_descripcion}
                  onChange={(e) => setFormEditar({ ...formEditar, tarifa_descripcion: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setSeleccionada(null)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
              <button onClick={handleEditar} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Guardar cambios</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
