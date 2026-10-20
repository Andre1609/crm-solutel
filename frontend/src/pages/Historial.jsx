import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const estadoColores = {
  'ACTIVADO': 'bg-green-100 text-green-700',
  'PDT FIRMA': 'bg-yellow-100 text-yellow-700',
  'FIRMADO': 'bg-blue-100 text-blue-700',
  'CANCELADO': 'bg-red-100 text-red-700',
  'BAJA': 'bg-red-200 text-red-800',
  'BAJA RECUPERADA': 'bg-emerald-100 text-emerald-700',
  'BAJA NO RECUPERADA': 'bg-orange-100 text-orange-700',
  'VERI KO': 'bg-purple-100 text-purple-700',
  'VOLTEADA': 'bg-pink-100 text-pink-700',
};

const estadosVenta = ['PDT FIRMA','FIRMADO','CANCELADO','BAJA RECUPERADA','BAJA NO RECUPERADA','ACTIVADO','BAJA','VERI KO','VOLTEADA'];

export default function Historial() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [ventas, setVentas] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState('');
  const [campana, setCampana] = useState('');
  const [equipo, setEquipo] = useState('');
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [formEditar, setFormEditar] = useState({});

  const cargarVentas = () => {
    axios.get('http://localhost:3000/api/ventas', { headers }).then(res => {
      setVentas(res.data); setCargando(false);
    });
  };

  useEffect(() => {
    cargarVentas();
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
    axios.get('http://localhost:3000/api/catalogo/tarifas', { headers }).then(res => setTarifas(res.data));
    axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
  }, []);

  const filtradas = ventas.filter(v => {
    const coincideTexto = v.titular?.toLowerCase().includes(filtro.toLowerCase()) || v.titular_dni?.includes(filtro);
    const coincideEstado = estado ? v.venta_estado === estado : true;
    const coincideCampana = campana ? v.campana === campana : true;
    const coincideEquipo = equipo ? v.equipo === equipo : true;
    return coincideTexto && coincideEstado && coincideCampana && coincideEquipo;
  });

  const abrirModal = (v) => {
    setSeleccionada(v);
    setFormEditar({
      venta_estado: v.venta_estado,
      venta_campana_id: v.venta_campana_id,
      venta_tarifa_id: v.venta_tarifa_id,
      venta_observacion: v.venta_observacion || '',
      venta_fecha: v.venta_fecha ? v.venta_fecha.split('T')[0] : '',
    });
    setEditando(false);
    setConfirmEliminar(false);
  };

  const cerrarModal = () => { setSeleccionada(null); setEditando(false); setConfirmEliminar(false); };

  const handleEditar = async () => {
    try {
      await axios.put(`http://localhost:3000/api/ventas/${seleccionada.venta_id}`, formEditar, { headers });
      cargarVentas(); cerrarModal();
    } catch { alert('Error al editar'); }
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/ventas/${seleccionada.venta_id}`, { headers });
      cargarVentas(); cerrarModal();
    } catch { alert('Error al eliminar'); }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Historial de Ventas</h2>

      {/* Filtros */}
      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-56"
          placeholder="Buscar por nombre o DNI..."
          value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estadosVenta.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={campana} onChange={(e) => setCampana(e.target.value)}>
          <option value="">Todas las campañas</option>
          {campanas.map(c => <option key={c.campana_id}>{c.campana_nombre}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={equipo} onChange={(e) => setEquipo(e.target.value)}>
          <option value="">Todos los equipos</option>
          {equipos.map(e => <option key={e.equipo_id}>{e.equipo_nombre}</option>)}
        </select>
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtradas.length} resultado(s)</p>

      {/* Tabla */}
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titular</th>
              <th className="px-4 py-3 text-left">DNI</th>
              <th className="px-4 py-3 text-left">Campaña</th>
              <th className="px-4 py-3 text-left">Tarifa</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Asesor</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
            ) : filtradas.map((v) => (
              <tr key={v.venta_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => abrirModal(v)}>
                <td className="px-4 py-3 font-medium text-gray-800">{v.titular}</td>
                <td className="px-4 py-3 text-gray-500">{v.titular_dni}</td>
                <td className="px-4 py-3 text-gray-500">{v.campana || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{v.tarifa || '-'}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColores[v.venta_estado] || 'bg-gray-100 text-gray-600'}`}>
                    {v.venta_estado}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-500">{v.asesor}</td>
                <td className="px-4 py-3 text-gray-500">{v.equipo || '-'}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(v.venta_creado_en).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

            {!editando && !confirmEliminar && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle de Venta</h3>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Titular</span><span className="font-medium">{seleccionada.titular}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">DNI</span><span className="font-medium">{seleccionada.titular_dni}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Campaña</span><span className="font-medium">{seleccionada.campana || '-'}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Tarifa</span><span className="font-medium">{seleccionada.tarifa || '-'}</span></div>
                  <div className="flex justify-between border-b pb-2">
                    <span className="text-gray-500">Estado</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColores[seleccionada.venta_estado] || 'bg-gray-100'}`}>{seleccionada.venta_estado}</span>
                  </div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Asesor</span><span className="font-medium">{seleccionada.asesor}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Equipo</span><span className="font-medium">{seleccionada.equipo || '-'}</span></div>
                  <div className="flex justify-between border-b pb-2"><span className="text-gray-500">Fecha</span><span className="font-medium">{new Date(seleccionada.venta_creado_en).toLocaleDateString()}</span></div>
                  {seleccionada.venta_observacion && (
                    <div className="flex justify-between"><span className="text-gray-500">Observación</span><span className="font-medium text-right max-w-xs">{seleccionada.venta_observacion}</span></div>
                  )}
                </div>
                <div className="flex gap-3 mt-6">
                  <button onClick={() => setEditando(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Editar venta</button>
                  <button onClick={() => setConfirmEliminar(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Eliminar venta</button>
                </div>
              </>
            )}

            {editando && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Venta</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-xs text-gray-500">Estado</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.venta_estado} onChange={(e) => setFormEditar({ ...formEditar, venta_estado: e.target.value })}>
                      {estadosVenta.map(e => <option key={e}>{e}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Campaña</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.venta_campana_id} onChange={(e) => setFormEditar({ ...formEditar, venta_campana_id: e.target.value })}>
                      {campanas.map(c => <option key={c.campana_id} value={c.campana_id}>{c.campana_nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Tarifa</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.venta_tarifa_id} onChange={(e) => setFormEditar({ ...formEditar, venta_tarifa_id: e.target.value })}>
                      {tarifas.map(t => <option key={t.tarifa_id} value={t.tarifa_id}>{t.tarifa_nombre}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Fecha</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                      value={formEditar.venta_fecha} onChange={(e) => setFormEditar({ ...formEditar, venta_fecha: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-xs text-gray-500">Observación</label>
                    <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3}
                      value={formEditar.venta_observacion} onChange={(e) => setFormEditar({ ...formEditar, venta_observacion: e.target.value })} />
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
                  <h3 className="text-lg font-bold text-gray-800 mb-2">¿Seguro que deseas eliminar esta venta?</h3>
                  <p className="text-sm text-gray-500">{seleccionada.titular} — {seleccionada.campana} será eliminado permanentemente.</p>
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
