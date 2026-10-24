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
  'ACTIVADO':'✅','PDT FIRMA':'⏳','FIRMADO':'📝','CANCELADO':'❌',
  'BAJA':'🔴','BAJA RECUPERADA':'🔄','BAJA NO RECUPERADA':'⚠️','VERI KO':'🚫','VOLTEADA':'🔀',
};

const estadoBarras = {
  'ACTIVADO':'bg-green-500','PDT FIRMA':'bg-yellow-400','FIRMADO':'bg-blue-400',
  'CANCELADO':'bg-red-400','BAJA':'bg-red-600','BAJA RECUPERADA':'bg-emerald-400',
  'BAJA NO RECUPERADA':'bg-orange-400','VERI KO':'bg-purple-400','VOLTEADA':'bg-pink-400',
};

export default function BackOffice() {
  const { token, usuario } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [stats, setStats] = useState(null);
  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    Promise.all([
      axios.get('http://localhost:3000/api/ventas/estadisticas', { headers }),
      axios.get('http://localhost:3000/api/ventas', { headers })
    ]).then(([resStats, resVentas]) => {
      setStats(resStats.data);
      setVentas(resVentas.data);
      setCargando(false);
    }).catch(() => {
      setCargando(false);
    });
  }, []);

  const totalVentas = stats?.estados?.reduce((acc, e) => acc + e.total, 0) || 0;
  const activadas = stats?.estados?.find(e => e.venta_estado === 'ACTIVADO')?.total || 0;
  const pendientes = stats?.estados?.find(e => e.venta_estado === 'PDT FIRMA')?.total || 0;
  const canceladas = stats?.estados?.find(e => e.venta_estado === 'CANCELADO')?.total || 0;
  const tasaExito = totalVentas > 0 ? Math.round((activadas / totalVentas) * 100) : 0;

  if (cargando) return <Layout><div className="flex items-center justify-center h-64 text-gray-400">Cargando Dashboard...</div></Layout>;

  return (
    <Layout>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-sm text-gray-500 mt-1">{usuario?.rol_id === 2 ? 'Vista de tu equipo' : 'Vista general de todos los equipos'}</p>
      </div>

      <div className="grid grid-cols-4 gap-4 mb-5">
        {[
          { label: 'Total Ventas', valor: totalVentas, color: 'bg-gray-800', texto: 'text-white', sub: 'registradas' },
          { label: 'Activadas', valor: activadas, color: 'bg-green-500', texto: 'text-white', sub: `${tasaExito}% éxito` },
          { label: 'PDT Firma', valor: pendientes, color: 'bg-yellow-400', texto: 'text-gray-800', sub: 'pendientes' },
          { label: 'Canceladas', valor: canceladas, color: 'bg-red-500', texto: 'text-white', sub: 'no concretadas' },
        ].map((card) => (
          <div key={card.label} className={`${card.color} rounded-xl p-4 shadow`}>
            <p className={`text-xs ${card.texto} opacity-70 uppercase tracking-wide`}>{card.label}</p>
            <p className={`text-3xl font-bold ${card.texto} my-1`}>{card.valor}</p>
            <p className={`text-xs ${card.texto} opacity-60`}>{card.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Distribución por Estado</h3>
          <div className="space-y-2">
            {stats?.estados?.sort((a, b) => b.total - a.total).map((e) => {
              const pct = Math.round((e.total / totalVentas) * 100);
              return (
                <div key={e.venta_estado}>
                  <div className="flex justify-between text-xs mb-1">
                    <div className="flex items-center gap-1">
                      <span>{estadoIconos[e.venta_estado] || '📌'}</span>
                      <span className="text-gray-600">{e.venta_estado}</span>
                    </div>
                    <div className="flex gap-2">
                      <span className="text-gray-400">{pct}%</span>
                      <span className="font-bold text-gray-800 w-5 text-right">{e.total}</span>
                    </div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2">
                    <div className={`${estadoBarras[e.venta_estado] || 'bg-gray-400'} h-2 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Ventas por Campaña</h3>
          <div className="space-y-3">
            {stats?.campanas?.sort((a, b) => b.total - a.total).map((c, i) => {
              const pct = Math.round((c.total / totalVentas) * 100);
              const colores = ['bg-blue-500','bg-green-500','bg-orange-400','bg-purple-400'];
              return (
                <div key={c.campana_nombre}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-gray-600 font-medium">{c.campana_nombre}</span>
                    <div className="flex gap-2"><span className="text-gray-400">{pct}%</span><span className="font-bold text-gray-800">{c.total}</span></div>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-2.5">
                    <div className={`${colores[i % colores.length]} h-2.5 rounded-full`} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          {stats?.equipos?.length > 0 && (
            <div className="mt-4 pt-3 border-t">
              <p className="text-xs text-gray-500 font-semibold mb-2 uppercase tracking-wide">Por Equipo</p>
              <div className="flex gap-3">
                {stats.equipos.map((eq) => (
                  <div key={eq.equipo_nombre} className="flex-1 bg-gray-50 rounded-lg p-2 text-center">
                    <p className="text-xs text-gray-500">{eq.equipo_nombre}</p>
                    <p className="text-lg font-bold text-gray-800 mt-0.5">{eq.total}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">Rendimiento de Asesores</h3>
          <table className="w-full text-xs">
            <thead className="bg-gray-50 text-gray-500 uppercase">
              <tr>
                <th className="px-2 py-2 text-left">#</th>
                <th className="px-2 py-2 text-left">Asesor</th>
                <th className="px-2 py-2 text-center">Total</th>
                <th className="px-2 py-2 text-center">✅</th>
                <th className="px-2 py-2 text-center">Éxito</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {stats?.asesores?.map((a, i) => {
                const tasa = a.total > 0 ? Math.round((a.activadas / a.total) * 100) : 0;
                return (
                  <tr key={a.asesor} className="hover:bg-gray-50">
                    <td className="px-2 py-2">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold
                        ${i===0?'bg-yellow-100 text-yellow-700':i===1?'bg-gray-100 text-gray-600':i===2?'bg-orange-100 text-orange-700':'bg-gray-50 text-gray-400'}`}>
                        {i+1}
                      </span>
                    </td>
                    <td className="px-2 py-2 font-medium text-gray-800">{a.asesor}</td>
                    <td className="px-2 py-2 text-center text-gray-600">{a.total}</td>
                    <td className="px-2 py-2 text-center text-green-600 font-medium">{a.activadas}</td>
                    <td className="px-2 py-2 text-center">
                      <span className={`px-1.5 py-0.5 rounded-full text-xs font-medium
                        ${tasa>=50?'bg-green-100 text-green-700':tasa>=25?'bg-yellow-100 text-yellow-700':'bg-red-100 text-red-600'}`}>
                        {tasa}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold text-gray-700 mb-3 text-sm">⚠️ Alertas — PDT Firma sin gestionar</h3>
          {stats?.asesores?.filter(a => {
            const ventasPendientes = ventas?.filter(v => v.venta_estado === 'PDT FIRMA' && v.asesor === a.asesor);
            return ventasPendientes?.length > 0;
          }).length === 0 ? (
            <div className="text-center text-gray-400 py-8 text-sm">✅ Sin alertas pendientes</div>
          ) : (
            <div className="space-y-2">
              {stats?.asesores?.map(a => {
                const pendientes = ventas?.filter(v => v.venta_estado === 'PDT FIRMA' && v.asesor === a.asesor).length || 0;
                if (pendientes === 0) return null;
                const urgente = pendientes >= 5;
                return (
                  <div key={a.asesor} className={`flex items-center justify-between p-2.5 rounded-lg border ${urgente ? 'bg-red-50 border-red-200' : 'bg-yellow-50 border-yellow-200'}`}>
                    <div className="flex items-center gap-2">
                      <span className="text-sm">{urgente ? '🔴' : '🟡'}</span>
                      <span className="text-xs font-medium text-gray-700">{a.asesor}</span>
                    </div>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${urgente ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'}`}>
                      {pendientes} PDT FIRMA
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}