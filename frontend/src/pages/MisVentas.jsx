import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const estadoColores = {
  'ACTIVADO': 'bg-green-100 text-green-700 border-green-200',
  'PDT FIRMA': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'FIRMADO': 'bg-blue-100 text-blue-700 border-blue-200',
  'CANCELADO': 'bg-red-100 text-red-700 border-red-200',
  'BAJA': 'bg-red-200 text-red-800 border-red-300',
  'BAJA RECUPERADA': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'BAJA NO RECUPERADA': 'bg-orange-100 text-orange-700 border-orange-200',
  'VERI KO': 'bg-purple-100 text-purple-700 border-purple-200',
  'VOLTEADA': 'bg-pink-100 text-pink-700 border-pink-200',
};

const POR_PAGINA = 10;
const CADA_MS = 30000; // revisa comentarios nuevos cada 30 segundos

export default function MisVentas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [ventas, setVentas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtro, setFiltro] = useState('');
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);

  const cargarVentas = () => {
    axios.get('http://localhost:3000/api/ventas', { headers })
      .then(res => setVentas(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarVentas();
    const intervalo = setInterval(cargarVentas, CADA_MS);
    return () => clearInterval(intervalo);
  }, []);

  useEffect(() => { setPagina(1); }, [filtro]);

  const abrirComentarios = (v) => {
    setSeleccionada(v);
    setComentarios([]);
    setCargandoComentarios(true);

    // El puntito rojo desaparece apenas se abre
    setVentas(prev => prev.map(x => x.venta_id === v.venta_id ? { ...x, comentarios_no_leidos: 0 } : x));

    axios.get(`http://localhost:3000/api/ventas/${v.venta_id}/comentarios`, { headers })
      .then(res => setComentarios(res.data))
      .catch(() => setComentarios([]))
      .finally(() => setCargandoComentarios(false));

    if (v.comentarios_no_leidos > 0) {
      axios.put(`http://localhost:3000/api/ventas/${v.venta_id}/comentarios/leido`, {}, { headers })
        .then(cargarVentas)
        .catch(() => {});
    }
  };

  const filtradas = ventas.filter(v => {
    const t = filtro.toLowerCase();
    return !t || v.titular?.toLowerCase().includes(t) || v.titular_dni?.includes(filtro);
  });
  const totalPaginas = Math.max(1, Math.ceil(filtradas.length / POR_PAGINA));
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginadas = filtradas.slice(inicio, inicio + POR_PAGINA);
  const sinLeer = ventas.reduce((acc, v) => acc + (v.comentarios_no_leidos > 0 ? 1 : 0), 0);

  const fmtFecha = (f) => new Date(f).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' });

  return (
    <Layout>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">Mis ventas</h2>
        <p className="text-sm text-gray-500 mt-1">
          {sinLeer > 0
            ? `Tienes comentarios nuevos en ${sinLeer} ${sinLeer === 1 ? 'venta' : 'ventas'}.`
            : 'Revisa el estado de tus ventas y los comentarios del equipo de Back.'}
        </p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="p-4 border-b">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 text-sm"
              placeholder="Buscar por nombre o DNI..."
              value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="text-gray-400 text-xs uppercase bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">Nombre</th>
                <th className="px-4 py-3 text-left">DNI</th>
                <th className="px-4 py-3 text-left">Campaña</th>
                <th className="px-4 py-3 text-left">Tarifa</th>
                <th className="px-4 py-3 text-left">Fecha</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Acción</th>
              </tr>
            </thead>
            <tbody>
              {cargando ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
              ) : paginadas.length === 0 ? (
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay ventas para mostrar</td></tr>
              ) : paginadas.map(v => (
                <tr key={v.venta_id} className="border-t border-gray-100 hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-800 text-xs">{v.titular}</p>
                    <p className="text-xs text-gray-400">VT-{v.venta_id}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{v.titular_dni}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{v.campana || '-'}</td>
                  <td className="px-4 py-3 text-gray-600 text-xs">{v.tarifa || '-'}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">{fmtFecha(v.venta_creado_en)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${estadoColores[v.venta_estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                      {v.venta_estado}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button onClick={() => abrirComentarios(v)}
                      className="relative flex items-center gap-1 border border-gray-300 text-gray-600 px-2.5 py-1 rounded-lg text-xs hover:bg-gray-50 transition whitespace-nowrap">
                      💬 Comentarios ›
                      {v.comentarios_no_leidos > 0 && (
                        <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full ring-2 ring-white" title="Comentarios nuevos" />
                      )}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filtradas.length > 0 ? `Mostrando ${inicio + 1} a ${Math.min(inicio + POR_PAGINA, filtradas.length)} de ${filtradas.length}` : '0 resultados'}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-2">
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1}
                className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">‹ Anterior</button>
              <span className="text-xs text-gray-500">Página {pagina} de {totalPaginas}</span>
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas}
                className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">Siguiente ›</button>
            </div>
          )}
        </div>
      </div>

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setSeleccionada(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Comentarios</h3>
                <p className="text-xs text-gray-400 mt-0.5">VT-{seleccionada.venta_id} · {seleccionada.titular}</p>
              </div>
              <button onClick={() => setSeleccionada(null)} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>
            <div className="p-5 space-y-2">
              {cargandoComentarios ? (
                <p className="text-sm text-gray-400 text-center py-4">Cargando comentarios...</p>
              ) : comentarios.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Esta venta aún no tiene comentarios.</p>
              ) : comentarios.map(c => (
                <div key={c.comentario_id} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs font-semibold text-gray-700">{c.autor}</span>
                    <span className="text-xs text-gray-400">
                      {new Date(c.comentario_creado_en).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 whitespace-pre-wrap break-words">{c.comentario_texto}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
