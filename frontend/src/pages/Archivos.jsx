import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Archivos() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [documentos, setDocumentos] = useState([]);
  const [archivo, setArchivo] = useState(null);
  const [tipo, setTipo] = useState('OTRO');
  const [ventaId, setVentaId] = useState('');
  const [titularId, setTitularId] = useState('');
  const [dragging, setDragging] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [msg, setMsg] = useState('');

  const cargarDocumentos = () => {
    axios.get('http://localhost:3000/api/documentos', { headers }).then(res => setDocumentos(res.data));
  };

  useEffect(() => { cargarDocumentos(); }, []);

  const handleDrop = (e) => {
    e.preventDefault(); setDragging(false);
    const file = e.dataTransfer.files[0];
    if (file) setArchivo(file);
  };

  const handleSeleccionar = (e) => { if (e.target.files[0]) setArchivo(e.target.files[0]); };

  const handleSubir = async () => {
    if (!archivo) return setMsg('❌ Selecciona un archivo primero');
    setSubiendo(true); setMsg('');
    try {
      const formData = new FormData();
      formData.append('archivo', archivo);
      formData.append('documento_tipo', tipo);
      if (ventaId) formData.append('documento_venta_id', ventaId);
      if (titularId) formData.append('documento_titular_id', titularId);
      await axios.post('http://localhost:3000/api/documentos', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });
      setMsg('✅ Archivo subido correctamente');
      setArchivo(null); cargarDocumentos();
    } catch { setMsg('❌ Error al subir el archivo'); }
    finally { setSubiendo(false); }
  };

  const handleEliminar = async (id) => {
    if (!confirm('¿Seguro que quieres eliminar este documento?')) return;
    try {
      await axios.delete(`http://localhost:3000/api/documentos/${id}`, { headers });
      setMsg('✅ Documento eliminado');
      cargarDocumentos();
    } catch { setMsg('❌ Error al eliminar'); }
  };

  const handleAbrir = (ruta) => {
    const url = `http://localhost:3000/${ruta.replace(/\\/g, '/')}`;
    window.open(url, '_blank');
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Documentación Asociada</h2>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="grid grid-cols-3 gap-3 mb-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Tipo de documento</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={tipo} onChange={(e) => setTipo(e.target.value)}>
              {['GRABACION','DNI','CONTRATO','FACTURA','OTRO'].map(t => <option key={t}>{t}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ID Venta (opcional)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 1" value={ventaId} onChange={(e) => setVentaId(e.target.value)} />
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">ID Titular (opcional)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 1" value={titularId} onChange={(e) => setTitularId(e.target.value)} />
          </div>
        </div>

        <div onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition ${dragging ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          {archivo ? (
            <div>
              <p className="text-green-600 font-medium text-sm">{archivo.name}</p>
              <p className="text-gray-400 text-xs mt-1">{(archivo.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <p className="text-gray-400 text-sm">Arrastra un archivo aquí</p>
          )}
        </div>

        {msg && <p className="text-sm mt-3">{msg}</p>}

        <div className="flex gap-3 mt-4">
          <label className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-800">
            Seleccionar archivo
            <input type="file" className="hidden" onChange={handleSeleccionar} />
          </label>
          <button onClick={handleSubir} disabled={subiendo}
            className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">
            {subiendo ? 'Subiendo...' : 'Subir archivo'}
          </button>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Nombre</th>
              <th className="px-4 py-3 text-left">Tipo</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {documentos.map((d) => (
              <tr key={d.documento_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 text-gray-800">{d.documento_nombre}</td>
                <td className="px-4 py-3">
                  <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">{d.documento_tipo}</span>
                </td>
                <td className="px-4 py-3 text-gray-500">{new Date(d.documento_subido_en).toLocaleString()}</td>
                <td className="px-4 py-3 flex gap-2">
                  <button onClick={() => handleAbrir(d.documento_ruta)}
                    className="bg-blue-600 text-white px-3 py-1 rounded-lg text-xs hover:bg-blue-700">
                    Abrir
                  </button>
                  <button onClick={() => handleEliminar(d.documento_id)}
                    className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600">
                    Eliminar
                  </button>
                </td>
              </tr>
            ))}
            {documentos.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay documentos subidos</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
