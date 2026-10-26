import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { useNavigate } from 'react-router-dom';

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

const estadoDot = {
  'ACTIVADO': 'bg-green-500', 'PDT FIRMA': 'bg-yellow-400', 'FIRMADO': 'bg-blue-500',
  'CANCELADO': 'bg-red-500', 'BAJA': 'bg-red-700', 'BAJA RECUPERADA': 'bg-emerald-500',
  'BAJA NO RECUPERADA': 'bg-orange-500', 'VERI KO': 'bg-purple-500', 'VOLTEADA': 'bg-pink-500',
};

const estadosVenta = ['PDT FIRMA','FIRMADO','CANCELADO','BAJA RECUPERADA','BAJA NO RECUPERADA','ACTIVADO','BAJA','VERI KO','VOLTEADA'];
const tabs = ['Todas', ...estadosVenta];
const POR_PAGINA = 13;

export default function Auditoria() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [ventas, setVentas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [tabActiva, setTabActiva] = useState('Todas');
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [seleccionada, setSeleccionada] = useState(null);
  const [comentarios, setComentarios] = useState([]);
  const [nuevoComentario, setNuevoComentario] = useState('');
  const [enviando, setEnviando] = useState(false);
  const [cargandoComentarios, setCargandoComentarios] = useState(false);
  const [nuevoEstado, setNuevoEstado] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [cargando, setCargando] = useState(true);

  const esJefe = usuario?.rol_id === 1;

  const cargarVentas = () => {
    axios.get('http://localhost:3000/api/ventas', { headers }).then(res => {
      setVentas(res.data); setCargando(false);
    });
  };

  useEffect(() => {
    cargarVentas();
    if (esJefe) {
      axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
    }
  }, []);

  const cargarComentarios = (ventaId) => {
    setCargandoComentarios(true);
    axios.get(`http://localhost:3000/api/ventas/${ventaId}/comentarios`, { headers })
      .then(res => setComentarios(res.data))
      .catch(() => setComentarios([]))
      .finally(() => setCargandoComentarios(false));
  };

  const abrirModal = (v) => {
    setSeleccionada(v);
    setNuevoEstado(v.venta_estado);
    setNuevoComentario('');
    setComentarios([]);
    cargarComentarios(v.venta_id);
  };

  const cerrarModal = () => setSeleccionada(null);

  const handleEnviarComentario = async () => {
    const texto = nuevoComentario.trim();
    if (!texto) return;
    setEnviando(true);
    try {
      await axios.post(`http://localhost:3000/api/ventas/${seleccionada.venta_id}/comentarios`,
        { comentario_texto: texto }, { headers });
      setNuevoComentario('');
      cargarComentarios(seleccionada.venta_id);
    } catch { alert('Error al guardar el comentario'); }
    finally { setEnviando(false); }
  };

  const handleGuardarEstado = async () => {
    setGuardando(true);
    try {
      await axios.put(`http://localhost:3000/api/ventas/${seleccionada.venta_id}`, {
        venta_estado: nuevoEstado,
        venta_campana_id: seleccionada.venta_campana_id,
        venta_tarifa_id: seleccionada.venta_tarifa_id,
        venta_observacion: seleccionada.venta_observacion,
        venta_fecha: seleccionada.venta_fecha ? seleccionada.venta_fecha.split('T')[0] : null,
      }, { headers });
      cargarVentas();
      setSeleccionada(null);
    } catch { alert('Error al guardar'); }
    finally { setGuardando(false); }
  };

  const filtradas = ventas.filter(v => {
    const coincideTexto = v.titular?.toLowerCase().includes(filtro.toLowerCase()) ||
      v.titular_dni?.includes(filtro) || v.asesor?.toLowerCase().includes(filtro.toLowerCase());
    const coincideTab = tabActiva === 'Todas' ? true : v.venta_estado === tabActiva;
    const coincideEquipo = filtroEquipo ? v.equipo === filtroEquipo : true;
    return coincideTexto && coincideTab && coincideEquipo;
  });

  useEffect(() => { setPagina(1); }, [filtro, tabActiva, filtroEquipo]);

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginadas = filtradas.slice(inicio, inicio + POR_PAGINA);
  const filasVacias = POR_PAGINA - paginadas.length;

  const contarPorEstado = (e) => ventas.filter(v => v.venta_estado === e).length;
  const iniciales = (nombre) => nombre?.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() || '?';

  const exportarInforme = () => {
    const total = ventas.length;
    const activadas = contarPorEstado('ACTIVADO');
    const pendientes = contarPorEstado('PDT FIRMA');
    const canceladas = contarPorEstado('CANCELADO') + contarPorEstado('VERI KO');
    const tasa = total > 0 ? Math.round((activadas / total) * 100) : 0;
    const fecha = new Date().toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' });
    const equipo = ventas.find(v => v.equipo)?.equipo || 'Todos los equipos';

    const barras = estadosVenta.map(e => {
      const count = contarPorEstado(e);
      const pct = total > 0 ? Math.round((count / total) * 100) : 0;
      return `<tr>
        <td style="padding:8px 12px;font-size:13px;color:#374151;">${e}</td>
        <td style="padding:8px 12px;text-align:center;font-weight:600;color:#111827;">${count}</td>
        <td style="padding:8px 12px;width:200px;">
          <div style="background:#f3f4f6;border-radius:9999px;height:8px;">
            <div style="background:#3b82f6;border-radius:9999px;height:8px;width:${pct}%;"></div>
          </div>
        </td>
        <td style="padding:8px 12px;text-align:right;font-size:12px;color:#6b7280;">${pct}%</td>
      </tr>`;
    }).join('');

    const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Informe de Auditoría</title>
      <style>body{font-family:Arial,sans-serif;margin:40px;color:#111827;}h1{font-size:24px;margin-bottom:4px;}.cards{display:flex;gap:20px;margin-bottom:30px;}.card{flex:1;padding:16px;border-radius:12px;}.card.yellow{background:#fef9c3;border:1px solid #fde68a;}.card.green{background:#dcfce7;border:1px solid #bbf7d0;}.card.red{background:#fee2e2;border:1px solid #fecaca;}.card-label{font-size:11px;color:#6b7280;text-transform:uppercase;margin-bottom:4px;}.card-value{font-size:32px;font-weight:bold;}.card-sub{font-size:11px;color:#9ca3af;}table{width:100%;border-collapse:collapse;}thead tr{background:#f9fafb;}thead th{padding:10px 12px;text-align:left;font-size:11px;color:#9ca3af;text-transform:uppercase;border-bottom:1px solid #e5e7eb;}tbody tr:nth-child(even){background:#f9fafb;}.footer{margin-top:40px;font-size:11px;color:#6b7280;border-top:1px solid #e5e7eb;padding-top:12px;}</style>
      </head><body>
      <p style="font-size:11px;color:#2563eb;font-weight:600;text-transform:uppercase;margin:0 0 4px;">Control de Calidad</p>
      <h1 style="margin:0 0 4px;">Informe de Auditoría</h1>
      <p style="color:#6b7280;font-size:14px;margin-bottom:24px;">Equipo: ${equipo} · Generado el ${fecha}</p>
      <div class="cards">
        <div class="card yellow"><div class="card-label">Pendientes</div><div class="card-value">${pendientes}</div><div class="card-sub">Requieren atención</div></div>
        <div class="card green"><div class="card-label">Activadas</div><div class="card-value">${activadas}</div><div class="card-sub">${tasa}% tasa de éxito</div></div>
        <div class="card red"><div class="card-label">Rechazadas</div><div class="card-value">${canceladas}</div><div class="card-sub">Requieren seguimiento</div></div>
      </div>
      <h2 style="font-size:16px;margin-bottom:12px;">Detalle por Estado</h2>
      <table><thead><tr><th>Estado</th><th style="text-align:center;">Total</th><th>Distribución</th><th style="text-align:right;">%</th></tr></thead>
      <tbody>${barras}</tbody></table>
      <div class="footer"><p>Total: <strong>${total}</strong> ventas · Tasa de éxito: <strong>${tasa}%</strong></p><p>Generado automáticamente por CRM Solutel el ${fecha}.</p></div>
      </body></html>`;

    const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Informe_Auditoria_${equipo.replace(/\s+/g, '_')}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const equipoDelBack = ventas.find(v => v.equipo)?.equipo || null;

  return (
    <Layout>
      <div className="flex items-start justify-between mb-5">
        <div>
          <p className="text-xs text-blue-600 font-semibold uppercase tracking-wide mb-1">Control de Calidad</p>
          <h2 className="text-2xl font-bold text-gray-900">Auditoría de ventas</h2>
          <p className="text-sm text-gray-500 mt-1">Revisa y valida las ventas registradas por el equipo comercial.</p>
        </div>
        <div className="flex flex-col items-end gap-2">
          <button onClick={exportarInforme}
            className="flex items-center gap-2 border border-gray-300 text-gray-700 px-4 py-2 rounded-lg text-sm hover:bg-gray-50">
            ⬇️ Exportar informe
          </button>
          {usuario?.rol_id === 3 && equipoDelBack && (
            <span className="bg-blue-50 border border-blue-200 text-blue-700 text-xs px-3 py-1 rounded-full font-medium">
              📋 {equipoDelBack}
            </span>
          )}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-5">
        {[
          { label: 'Pendientes de revisión', valor: contarPorEstado('PDT FIRMA'), sub: 'Requieren atención', icon: '🕐', bg: 'bg-yellow-50', border: 'border-yellow-200' },
          { label: 'Activadas', valor: contarPorEstado('ACTIVADO'), sub: `${ventas.length > 0 ? Math.round((contarPorEstado('ACTIVADO') / ventas.length) * 100) : 0}% del total`, icon: '✅', bg: 'bg-green-50', border: 'border-green-200' },
          { label: 'Rechazadas', valor: contarPorEstado('CANCELADO') + contarPorEstado('VERI KO'), sub: 'Requieren seguimiento', icon: '❌', bg: 'bg-red-50', border: 'border-red-200' },
        ].map(card => (
          <div key={card.label} className={`${card.bg} border ${card.border} rounded-xl p-4 flex items-center gap-4`}>
            <div className="text-3xl">{card.icon}</div>
            <div>
              <p className="text-xs text-gray-500">{card.label}</p>
              <p className="text-3xl font-bold text-gray-800">{card.valor}</p>
              <p className="text-xs text-gray-400">{card.sub}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <div className="flex gap-1 p-3 border-b bg-gray-50 overflow-x-auto">
          {tabs.map(tab => {
            const count = tab === 'Todas' ? ventas.length : contarPorEstado(tab);
            return (
              <button key={tab} onClick={() => setTabActiva(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition whitespace-nowrap ${tabActiva === tab ? 'bg-white shadow text-gray-800' : 'text-gray-500 hover:text-gray-700'}`}>
                {tab} <span className="ml-1 text-gray-400">{count}</span>
              </button>
            );
          })}
        </div>

        <div className="p-4 border-b space-y-3">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-gray-400 text-sm">🔍</span>
            <input className="w-full border border-gray-300 rounded-lg pl-8 pr-4 py-2 text-sm"
              placeholder="Buscar cliente, ID o agente..."
              value={filtro} onChange={(e) => setFiltro(e.target.value)} />
          </div>
          {esJefe && (
            <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full"
              value={filtroEquipo} onChange={(e) => setFiltroEquipo(e.target.value)}>
              <option value="">Todos los equipos</option>
              {equipos.map(e => <option key={e.equipo_id}>{e.equipo_nombre}</option>)}
            </select>
          )}
        </div>

        <table className="w-full text-sm table-fixed">
          <thead className="text-gray-400 text-xs uppercase bg-gray-50">
            <tr>
              <th className="px-5 py-3 text-left w-56">Venta / Cliente</th>
              <th className="px-4 py-3 text-left w-28">Campaña</th>
              <th className="px-4 py-3 text-left w-36">Tarifa</th>
              <th className="px-4 py-3 text-left w-32">Agente</th>
              <th className="px-4 py-3 text-left w-24">Fecha</th>
              <th className="px-4 py-3 text-left w-36">Estado</th>
              <th className="px-4 py-3 text-left w-24">Acción</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <>
                <tr><td colSpan={7} className="px-4 py-8 text-center text-gray-400">No hay ventas</td></tr>
                {Array.from({ length: POR_PAGINA - 1 }).map((_, i) => (
                  <tr key={`e-${i}`} className="border-t border-gray-50"><td colSpan={7} className="h-10" /></tr>
                ))}
              </>
            ) : (
              <>
                {paginadas.map(v => {
                  return (
                    <tr key={v.venta_id} className="border-t border-gray-100 hover:bg-gray-50 h-10">
                      <td className="px-5 py-2">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-gray-200 flex items-center justify-center text-xs font-bold text-gray-600 shrink-0">
                            {iniciales(v.titular)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-medium text-gray-800 truncate text-xs">{v.titular}</p>
                            <p className="text-xs text-gray-400">VT-{v.venta_id} · {v.titular_dni}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-2 text-gray-600 text-xs truncate">{v.campana || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs truncate">{v.tarifa || '-'}</td>
                      <td className="px-4 py-2 text-gray-600 text-xs truncate">{v.asesor}</td>
                      <td className="px-4 py-2 text-gray-500 text-xs">
                        {new Date(v.venta_creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-4 py-2">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border whitespace-nowrap ${estadoColores[v.venta_estado] || 'bg-gray-100 text-gray-600 border-gray-200'}`}>
                          <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${estadoDot[v.venta_estado] || 'bg-gray-400'}`} />
                          {v.venta_estado}
                        </span>
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => abrirModal(v)}
                          className="flex items-center gap-1 border border-gray-300 text-gray-600 px-2 py-1 rounded-lg text-xs hover:bg-gray-50 transition whitespace-nowrap">
                          Ver detalle ›
                        </button>
                      </td>
                    </tr>
                  );
                })}
                {Array.from({ length: filasVacias }).map((_, i) => (
                  <tr key={`pad-${i}`} className="border-t border-gray-50 h-10"><td colSpan={7} /></tr>
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
              <button onClick={() => setPagina(1)} disabled={pagina === 1} className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">«</button>
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">‹</button>
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
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas} className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">›</button>
              <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">»</button>
            </div>
          )}
        </div>
      </div>

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-3xl mx-4 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-bold text-gray-800">Verificación de venta</h3>
                  <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border ${estadoColores[seleccionada.venta_estado] || 'bg-gray-100'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${estadoDot[seleccionada.venta_estado] || 'bg-gray-400'}`} />
                    {seleccionada.venta_estado}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mt-0.5">VT-{seleccionada.venta_id} · Registrada el {new Date(seleccionada.venta_creado_en).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
              </div>
              <button onClick={cerrarModal} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="grid grid-cols-2 gap-5 p-5">
              <div>
                <div className="bg-gray-50 rounded-xl p-4 mb-4">
                  <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Cliente</p>
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                      {iniciales(seleccionada.titular)}
                    </div>
                    <p className="font-bold text-gray-800">{seleccionada.titular}</p>
                  </div>
                  {[['DNI', seleccionada.titular_dni],['Agente comercial', seleccionada.asesor],['Campaña', seleccionada.campana||'-'],['Tarifa', seleccionada.tarifa||'-'],['Equipo', seleccionada.equipo||'-']].map(([label, valor]) => (
                    <div key={label} className="flex justify-between text-sm py-1.5 border-b border-gray-100 last:border-0">
                      <span className="text-gray-400">{label}</span>
                      <span className="font-medium text-gray-700">{valor}</span>
                    </div>
                  ))}
                </div>
                <div className="bg-gray-100 rounded-xl p-4 text-center text-gray-400 text-sm">
                  🎙️ Sin grabación adjunta
                </div>
              </div>

              <div>
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-semibold text-gray-700 text-sm">Comentarios</p>
                    <span className="text-xs text-blue-600 font-medium">{comentarios.length}</span>
                  </div>
                  <p className="text-xs text-gray-400 mb-2">Deja observaciones sobre esta venta para el equipo.</p>
                  <textarea
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm resize-none"
                    rows={3} maxLength={1000}
                    placeholder="Escribe un comentario..."
                    value={nuevoComentario}
                    onChange={(e) => setNuevoComentario(e.target.value)} />
                  <button onClick={handleEnviarComentario} disabled={enviando || !nuevoComentario.trim()}
                    className="mt-2 w-full bg-gray-800 hover:bg-gray-900 disabled:opacity-40 text-white py-2 rounded-lg text-sm font-medium transition">
                    {enviando ? 'Enviando...' : '💬 Agregar comentario'}
                  </button>
                  <div className="space-y-2 mt-3 max-h-48 overflow-y-auto">
                    {cargandoComentarios ? (
                      <p className="text-xs text-gray-400 text-center py-2">Cargando comentarios...</p>
                    ) : comentarios.length === 0 ? (
                      <p className="text-xs text-gray-400 text-center py-2">Aún no hay comentarios.</p>
                    ) : comentarios.map(c => (
                      <div key={c.comentario_id} className="bg-white border border-gray-200 rounded-lg p-2.5">
                        <div className="flex justify-between items-center mb-1">
                          <span className="text-xs font-semibold text-gray-700">{c.autor}</span>
                          <span className="text-xs text-gray-400">
                            {new Date(c.comentario_creado_en).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p className="text-xs text-gray-600 whitespace-pre-wrap break-words">{c.comentario_texto}</p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">Cada comentario queda registrado con fecha, hora y autor.</p>
                </div>

                <div className="bg-gray-50 rounded-xl p-4">
                  <p className="text-sm font-semibold text-gray-700 mb-2">Cambiar estado de la venta</p>
                  <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm mb-3"
                    value={nuevoEstado} onChange={(e) => setNuevoEstado(e.target.value)}>
                    {estadosVenta.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                  <button onClick={handleGuardarEstado} disabled={guardando}
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg text-sm font-medium transition">
                    {guardando ? 'Guardando...' : '✓ Guardar estado'}
                  </button>
                </div>
              </div>
            </div>

            <div className="flex justify-between items-center px-5 py-3 border-t bg-gray-50">
              <button onClick={cerrarModal} className="text-sm text-gray-500 hover:text-gray-700">
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}