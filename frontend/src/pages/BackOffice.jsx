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

const estadoIconos = {
  'ACTIVADO': '✅',
  'PDT FIRMA': '⏳',
  'FIRMADO': '📝',
  'CANCELADO': '❌',
  'BAJA': '🔴',
  'BAJA RECUPERADA': '🔄',
  'BAJA NO RECUPERADA': '⚠️',
  'VERI KO': '🚫',
  'VOLTEADA': '🔀',
};

export default function BackOffice() {
  const { token, usuario } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3000/api/ventas/estadisticas', { headers }),
      axios.get('http://localhost:3000/api/ventas', { headers }),
    ]).then(([statsRes, ventasRes]) => {
      setStats(statsRes.data);
      setVentas(ventasRes.data);
      setCargando(false);
    });
  }, []);

  const totalVentas = stats?.estados?.reduce((acc, e) => acc + e.total, 0) || 0;
  const activadas = stats?.estados?.find(e => e.venta_estado === 'ACTIVADO')?.total || 0;
  const pendientes = stats?.estados?.find(e => e.venta_estado === 'PDT FIRMA')?.total || 0;
  const canceladas = stats?.estados?.find(e => e.venta_estado === 'CANCELADO')?.total || 0;

  const ventasFiltradas = filtroEstado ? ventas.filter(v => v.venta_estado === filtroEstado) : ventas;

  if (cargando) return <Layout><div className="flex items-center justify-center h-64 text-gray-400">Cargando BackOffice...</div></Layout>;

  return (
    <Layout>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">BackOffice</h2>
        <p className="text-sm text-gray-500 mt-1">
          {usuario?.rol_nombre === 'Supervisor' ? `Equipo — vista de seguimiento` : 'Vista general de todos los equipos'}
        </p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Ventas', valor: totalVentas, color: 'bg-gray-800', texto: 'text-white' },
          { label: 'Activadas', valor: activadas, color: 'bg-green-500', texto: 'text-white' },
          { label: 'PDT Firma', valor: pendientes, color: 'bg-yellow-400', texto: 'text-gray-800' },
          { label: 'Canceladas', valor: canceladas, color: 'bg-red-500', texto: 'text-white' },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-5 shadow`}>
            <p className={`text-sm ${card.texto} opacity-80`}>{card.label}</p>
            <p className={`text-3xl font-bold ${card.texto} mt-1`}>{card.valor}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Ventas por Estado</h3>
          <div className="space-y-2">
            {stats?.estados?.map((e) => (
              <div key={e.venta_estado} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs">{estadoIconos[e.venta_estado] || '📌'}</span>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${estadoColores[e.venta_estado] || 'bg-gray-100 text-gray-600'}`}>{e.venta_estado}</span>
                </div>
                <span className="text-sm font-bold text-gray-800">{e.total}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Ventas por Campaña</h3>
          <div className="space-y-3">
            {stats?.campanas?.map((c) => {
              const pct = Math.round((c.total / totalVentas) * 100);
              return (
                <div key={c.campana_nombre}>
                  <div className="flex justify-between text-xs text-gray-600 mb-1">
                    <span>{c.campana_nombre}</span>
                    <span className="font-bold">{c.total}</span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className="bg-green-500 h-2 rounded-full" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-5">
          <h3 className="font-semibold text-gray-700 mb-4 text-sm">Top Asesores</h3>
          <div className="space-y-2">
            {stats?.asesores?.slice(0, 8).map((a, i) => (
              <div key={a.asesor} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <span className="w-5 h-5 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold text-xs">{i + 1}</span>
                  <span className="text-gray-700">{a.asesor}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-green-600 font-medium">{a.activadas} ✅</span>
                  <span className="text-gray-400">/ {a.total}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b flex items-center justify-between">
          <h3 className="font-semibold text-gray-700 text-sm">Seguimiento de Ventas</h3>
          <select className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm"
            value={filtroEstado} onChange={(e) => setFiltroEstado(e.target.value)}>
            <option value="">Todos los estados</option>
            {stats?.estados?.map(e => <option key={e.venta_estado} value={e.venta_estado}>{e.venta_estado} ({e.total})</option>)}
          </select>
        </div>
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titular</th>
              <th className="px-4 py-3 text-left">DNI</th>
              <th className="px-4 py-3 text-left">Campaña</th>
              <th className="px-4 py-3 text-left">Estado</th>
              <th className="px-4 py-3 text-left">Asesor</th>
              <th className="px-4 py-3 text-left">Equipo</th>
              <th className="px-4 py-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {ventasFiltradas.slice(0, 20).map((v) => (
              <tr key={v.venta_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{v.titular}</td>
                <td className="px-4 py-3 text-gray-500">{v.titular_dni}</td>
                <td className="px-4 py-3 text-gray-500">{v.campana || '-'}</td>
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
            {ventasFiltradas.length === 0 && (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay ventas</td></tr>
            )}
          </tbody>
        </table>
        {ventasFiltradas.length > 20 && (
          <div className="p-3 text-center text-xs text-gray-400 border-t">
            Mostrando 20 de {ventasFiltradas.length} ventas — usa los filtros para encontrar más
          </div>
        )}
      </div>
    </Layout>
  );
}