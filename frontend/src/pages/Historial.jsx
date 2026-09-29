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
  const [ventas, setVentas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState('');
  const [campana, setCampana] = useState('');
  const [campanas, setCampanas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    axios.get('http://localhost:3000/api/ventas', { headers }).then(res => {
      setVentas(res.data);
      setCargando(false);
    });
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
  }, []);

  const filtradas = ventas.filter(v => {
    const coincideTexto = v.titular?.toLowerCase().includes(filtro.toLowerCase()) || v.titular_dni?.includes(filtro);
    const coincideEstado = estado ? v.venta_estado === estado : true;
    const coincideCampana = campana ? v.campana === campana : true;
    return coincideTexto && coincideEstado && coincideCampana;
  });

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Historial de Ventas</h2>

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1 min-w-48"
          placeholder="Buscar por nombre o DNI..."
          value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estadosVenta.map(e => <option key={e}>{e}</option>)}
        </select>
        <select
          className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={campana} onChange={(e) => setCampana(e.target.value)}>
          <option value="">Todas las campañas</option>
          {campanas.map(c => <option key={c.campana_id}>{c.campana_nombre}</option>)}
        </select>
      </div>

      {/* Contador */}
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
              <th className="px-4 py-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
            ) : filtradas.map((v) => (
              <tr key={v.venta_id} className="hover:bg-gray-50">
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
                <td className="px-4 py-3 text-gray-500">{new Date(v.venta_creado_en).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
