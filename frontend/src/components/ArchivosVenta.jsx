import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

const TIPOS = ['GRABACION', 'DNI', 'CONTRATO', 'FACTURA', 'OTRO'];
const MAX_MB = 10;

// Archivos de una venta: lista, descarga y subida (solo la usa el Back)
export default function ArchivosVenta({ ventaId }) {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [archivos, setArchivos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [nuevos, setNuevos] = useState([]);
  const [subiendo, setSubiendo] = useState(false);
  const [descargando, setDescargando] = useState(null);
  const [msg, setMsg] = useState(null);

  const cargar = () => {
    axios.get(`http://localhost:3000/api/ventas/${ventaId}/documentos`, { headers })
      .then(res => setArchivos(res.data))
      .catch(() => setArchivos([]))
      .finally(() => setCargando(false));
  };

  useEffect(() => { setCargando(true); setNuevos([]); setMsg(null); cargar(); }, [ventaId]);

  const agregar = (lista) => {
    const aceptados = [];
    let rechazados = 0;
    Array.from(lista).forEach(f => {
      if (f.size > MAX_MB * 1024 * 1024) { rechazados++; return; }
      aceptados.push({ id: `${Date.now()}-${Math.random()}`, file: f, tipo: 'OTRO' });
    });
    if (aceptados.length) setNuevos(prev => [...prev, ...aceptados]);
    setMsg(rechazados ? { ok: false, texto: `${rechazados} archivo(s) superan los ${MAX_MB} MB y no se agregaron` } : null);
  };

  const subir = async () => {
    if (nuevos.length === 0) return;
    setSubiendo(true); setMsg(null);
    try {
      const formData = new FormData();
      nuevos.forEach(n => formData.append('archivos', n.file));
      formData.append('documento_tipos', JSON.stringify(nuevos.map(n => n.tipo)));
      await axios.post(`http://localhost:3000/api/ventas/${ventaId}/documentos`, formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setMsg({ ok: true, texto: `✅ ${nuevos.length} archivo(s) subido(s)` });
      setNuevos([]);
      cargar();
    } catch (err) {
      setMsg({ ok: false, texto: `❌ ${err.response?.data?.mensaje || 'No se pudieron subir los archivos'}` });
    } finally { setSubiendo(false); }
  };

  const descargar = async (a) => {
    setDescargando(a.documento_id);
    try {
      const res = await axios.get(
        `http://localhost:3000/api/ventas/${ventaId}/documentos/${a.documento_id}/descargar`,
        { headers, responseType: 'blob' });
      const url = URL.createObjectURL(res.data);
      const enlace = document.createElement('a');
      enlace.href = url;
      enlace.download = a.documento_nombre;
      document.body.appendChild(enlace);
      enlace.click();
      enlace.remove();
      URL.revokeObjectURL(url);
    } catch (err) {
      let texto = 'No se pudo descargar el archivo';
      try { texto = JSON.parse(await err.response.data.text()).mensaje || texto; } catch { /* sin detalle */ }
      setMsg({ ok: false, texto: `❌ ${texto}` });
    } finally { setDescargando(null); }
  };

  return (
    <div>
      <p className="text-sm font-semibold text-gray-700 mb-2">Archivos del cliente</p>

      {cargando ? (
        <p className="text-xs text-gray-400 text-center py-3">Cargando archivos...</p>
      ) : archivos.length === 0 ? (
        <p className="text-sm text-gray-400 text-center py-3 border border-dashed border-gray-300 rounded-lg">Aún no hay archivos</p>
      ) : (
        <div className="space-y-2">
          {archivos.map(a => (
            <div key={a.documento_id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
              <span className="text-xs font-medium bg-gray-100 text-gray-600 rounded-full px-2 py-0.5">{a.documento_tipo}</span>
              <p className="flex-1 min-w-0 text-sm text-gray-800 truncate">{a.documento_nombre}</p>
              <button onClick={() => descargar(a)} disabled={descargando === a.documento_id}
                className="border border-gray-300 text-gray-600 px-2.5 py-1 rounded-lg text-xs hover:bg-gray-50 disabled:opacity-50 whitespace-nowrap">
                {descargando === a.documento_id ? 'Descargando...' : '⬇ Descargar'}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="mt-3 bg-gray-50 rounded-lg p-3">
        <div className="flex items-center justify-between gap-2">
          <p className="text-xs text-gray-500">Subir archivos (máx. {MAX_MB} MB cada uno)</p>
          <label className="bg-gray-700 text-white px-3 py-1.5 rounded-lg text-xs cursor-pointer hover:bg-gray-800 whitespace-nowrap">
            Seleccionar archivos
            <input type="file" multiple className="hidden"
              onChange={(e) => { agregar(e.target.files); e.target.value = ''; }} />
          </label>
        </div>

        {nuevos.length > 0 && (
          <div className="mt-3 space-y-2">
            {nuevos.map(n => (
              <div key={n.id} className="flex items-center gap-2 bg-white border border-gray-200 rounded-lg px-3 py-2">
                <p className="flex-1 min-w-0 text-xs text-gray-800 truncate">{n.file.name}</p>
                <select className="border border-gray-300 rounded-lg px-2 py-1 text-xs" value={n.tipo}
                  onChange={(e) => setNuevos(prev => prev.map(x => x.id === n.id ? { ...x, tipo: e.target.value } : x))}>
                  {TIPOS.map(t => <option key={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => setNuevos(prev => prev.filter(x => x.id !== n.id))}
                  className="text-gray-400 hover:text-red-500 font-bold" title="Quitar">✕</button>
              </div>
            ))}
            <button onClick={subir} disabled={subiendo}
              className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg text-sm font-medium transition">
              {subiendo ? 'Subiendo...' : `Subir ${nuevos.length} archivo(s)`}
            </button>
          </div>
        )}

        {msg && <p className={`text-xs mt-2 ${msg.ok ? 'text-green-700' : 'text-red-600'}`}>{msg.texto}</p>}
      </div>
    </div>
  );
}
