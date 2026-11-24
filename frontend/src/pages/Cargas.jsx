import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import ArchivosVenta from '../components/ArchivosVenta';

const CADA_MS = 30000; // busca cargas nuevas cada 30 segundos

const iniciales = (nombre = '') => nombre.split(' ').filter(Boolean).slice(0, 2).map(n => n[0]).join('').toUpperCase();
const fmtDia = (d) => d ? new Date(`${d}T00:00:00`).toLocaleDateString('es-ES', { day: '2-digit', month: 'short', year: 'numeric' }) : '-';
const fmtHora = (f) => new Date(f).toLocaleString('es-ES', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });

export default function Cargas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [cargas, setCargas] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [msg, setMsg] = useState(null);
  const [seleccionada, setSeleccionada] = useState(null);
  const [cancelando, setCancelando] = useState(false);
  const [motivo, setMotivo] = useState('');
  const [procesando, setProcesando] = useState(false);

  const cargarCargas = () => {
    axios.get('http://localhost:3000/api/ventas/cargas', { headers })
      .then(res => setCargas(res.data))
      .catch(() => {})
      .finally(() => setCargando(false));
  };

  useEffect(() => {
    cargarCargas();
    const intervalo = setInterval(cargarCargas, CADA_MS);
    return () => clearInterval(intervalo);
  }, []);

  const avisar = (texto, ok = true) => {
    setMsg({ texto, ok });
    setTimeout(() => setMsg(null), 5000);
  };

  const abrir = (v) => {
    setSeleccionada(v);
    setCancelando(false);
    setMotivo('');
  };

  const cerrar = () => { setSeleccionada(null); setCancelando(false); setMotivo(''); };

  const revisar = async (accion) => {
    setProcesando(true);
    try {
      await axios.put(`http://localhost:3000/api/ventas/${seleccionada.venta_id}/revision`,
        { accion, motivo }, { headers });
      avisar(accion === 'CARGAR'
        ? `✅ VT-${seleccionada.venta_id} marcada como cargada`
        : `La carga VT-${seleccionada.venta_id} fue cancelada`);
      cerrar();
      cargarCargas();
    } catch (err) {
      avisar(err.response?.data?.mensaje || 'Error al guardar la revisión', false);
      cerrar();
      cargarCargas();
    } finally { setProcesando(false); }
  };

  const handleCargada = () => {
    if (!window.confirm('¿Confirmas que la información y los archivos están correctos? La venta pasará al historial.')) return;
    revisar('CARGAR');
  };

  return (
    <Layout>
      <div className="mb-5">
        <h2 className="text-xl font-bold text-gray-800">Cargas</h2>
        <p className="text-sm text-gray-500 mt-1">
          {cargas.length > 0
            ? `${cargas.length} ${cargas.length === 1 ? 'venta pendiente' : 'ventas pendientes'} de revisión. Ábrelas para ver la información y los archivos.`
            : 'Aquí llegan las ventas que envían los asesores para tu revisión.'}
        </p>
      </div>

      {msg && (
        <div className={`mb-4 px-4 py-3 rounded-lg text-sm ${msg.ok ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'}`}>
          {msg.texto}
        </div>
      )}

      {cargando ? (
        <p className="text-center text-gray-400 py-12 text-sm">Cargando...</p>
      ) : cargas.length === 0 ? (
        <div className="bg-white rounded-xl shadow py-16 text-center">
          <p className="text-3xl mb-2">📭</p>
          <p className="text-gray-500 text-sm">No hay cargas pendientes</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {cargas.map(v => (
            <button key={v.venta_id} onClick={() => abrir(v)}
              className="text-left bg-white rounded-xl shadow hover:shadow-md border border-transparent hover:border-green-300 transition p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-gray-400">VT-{v.venta_id}</span>
                <span className="text-xs font-medium bg-yellow-50 text-yellow-700 border border-yellow-200 rounded-full px-2 py-0.5">⏳ Por revisar</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600 shrink-0">
                  {iniciales(v.titular)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-800 text-sm truncate">{v.titular}</p>
                  <p className="text-xs text-gray-400 truncate">Enviada por {v.asesor}</p>
                </div>
              </div>
              <div className="flex items-center justify-between text-xs text-gray-500 border-t pt-3">
                <span>{fmtHora(v.venta_creado_en)}</span>
                <span>{v.total_archivos > 0 ? `📎 ${v.total_archivos} ${v.total_archivos === 1 ? 'archivo' : 'archivos'}` : 'Sin archivos'}</span>
              </div>
            </button>
          ))}
        </div>
      )}

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={cerrar} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl mx-4 z-10 overflow-hidden max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-5 border-b">
              <div>
                <h3 className="text-lg font-bold text-gray-800">Revisión de carga</h3>
                <p className="text-xs text-gray-400 mt-0.5">VT-{seleccionada.venta_id} · Enviada el {fmtHora(seleccionada.venta_creado_en)}</p>
              </div>
              <button onClick={cerrar} className="text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            </div>

            <div className="p-5 space-y-5">
              <div className="bg-gray-50 rounded-xl p-4">
                <p className="text-xs text-gray-400 uppercase tracking-wide mb-3">Información de la venta</p>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-sm font-bold text-gray-600">
                    {iniciales(seleccionada.titular)}
                  </div>
                  <p className="font-bold text-gray-800">{seleccionada.titular}</p>
                </div>
                {[
                  ['DNI', seleccionada.titular_dni],
                  ['Agente comercial', seleccionada.asesor],
                  ['Equipo', seleccionada.equipo || '-'],
                  ['Campaña', seleccionada.campana || '-'],
                  ['Tarifa', seleccionada.tarifa || '-'],
                  ['Fecha de venta', fmtDia(seleccionada.fecha_venta)],
                  ['Método de confirmación', seleccionada.venta_metodo_confirmacion || '-'],
                  ['Código SMS', seleccionada.venta_codigo_sms || '-'],
                  ['Estado inicial', seleccionada.venta_estado],
                ].map(([label, valor]) => (
                  <div key={label} className="flex justify-between border-b border-gray-200 py-1.5 text-sm last:border-0">
                    <span className="text-gray-500">{label}</span>
                    <span className="font-medium text-gray-800 text-right">{valor}</span>
                  </div>
                ))}
                <div className="mt-3">
                  <p className="text-xs text-gray-400 mb-1">Observación</p>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{seleccionada.venta_observacion || 'Sin observación'}</p>
                </div>
              </div>

              <ArchivosVenta ventaId={seleccionada.venta_id} />

              {cancelando && (
                <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                  <p className="text-sm font-semibold text-red-700 mb-1">¿Cancelar esta carga?</p>
                  <p className="text-xs text-red-600 mb-2">La venta no pasará al historial. Puedes dejar un motivo y el asesor lo verá en sus comentarios.</p>
                  <textarea className="w-full border border-red-200 rounded-lg px-3 py-2 text-sm resize-none bg-white"
                    rows={3} maxLength={900} placeholder="Motivo (opcional)"
                    value={motivo} onChange={(e) => setMotivo(e.target.value)} />
                </div>
              )}
            </div>

            <div className="flex gap-3 px-5 py-4 border-t bg-gray-50">
              {!cancelando ? (
                <>
                  <button onClick={() => setCancelando(true)} disabled={procesando}
                    className="flex-1 border border-red-300 text-red-600 hover:bg-red-50 py-2.5 rounded-lg text-sm font-medium transition">
                    ✕ Cancelar
                  </button>
                  <button onClick={handleCargada} disabled={procesando}
                    className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition">
                    {procesando ? 'Guardando...' : '✓ Venta Cargada'}
                  </button>
                </>
              ) : (
                <>
                  <button onClick={() => setCancelando(false)} disabled={procesando}
                    className="flex-1 border border-gray-300 text-gray-600 hover:bg-gray-100 py-2.5 rounded-lg text-sm font-medium transition">
                    Volver
                  </button>
                  <button onClick={() => revisar('CANCELAR')} disabled={procesando}
                    className="flex-1 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white py-2.5 rounded-lg text-sm font-medium transition">
                    {procesando ? 'Guardando...' : 'Confirmar cancelación'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
