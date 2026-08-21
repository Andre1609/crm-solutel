import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
const estadoColores = { 'ACTIVADO': 'bg-green-100 text-green-700', 'PENDIENTE DE VERIFICACION': 'bg-yellow-100 text-yellow-700', 'BAJA': 'bg-red-100 text-red-700', 'KO': 'bg-red-200 text-red-800', 'SCORING': 'bg-purple-100 text-purple-700' };
export default function Historial() {
  const { token } = useAuth();
  const [ventas, setVentas] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState('');
  useEffect(() => { axios.get('http://localhost:3000/api/ventas', { headers: { Authorization: `Bearer ${token}` } }).then(res => setVentas(res.data)); }, []);
  const filtradas = ventas.filter(v => { const coincideTexto = v.cliente?.toLowerCase().includes(filtro.toLowerCase()) || v.dni?.includes(filtro); const coincideEstado = estado ? v.estado_venta === estado : true; return coincideTexto && coincideEstado; });
  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Historial de Ventas</h2>
      <div className="flex gap-3 mb-4">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" placeholder="Buscar por nombre o DNI..." value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm" value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {['ACTIVADO','PENDIENTE DE VERIFICACION','BAJA','BAJA ANTICIPADA','INCIDENCIA ADMINISTRATIVA','KO','PAGADO COMERCIAL','RECUPERADO','REPOSICION','SCORING'].map(e => <option key={e}>{e}</option>)}
        </select>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">DNI</th><th className="px-4 py-3 text-left">Estado</th><th className="px-4 py-3 text-left">Vendedor</th><th className="px-4 py-3 text-left">Fecha</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {filtradas.map((v) => (<tr key={v.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{v.cliente}</td><td className="px-4 py-3 text-gray-500">{v.dni}</td><td className="px-4 py-3"><span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColores[v.estado_venta] || 'bg-gray-100 text-gray-600'}`}>{v.estado_venta}</span></td><td className="px-4 py-3 text-gray-500">{v.usuario}</td><td className="px-4 py-3 text-gray-500">{new Date(v.created_at).toLocaleDateString()}</td></tr>))}
            {filtradas.length === 0 && (<tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay ventas</td></tr>)}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
