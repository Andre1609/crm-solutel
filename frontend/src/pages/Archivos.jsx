import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

export default function Archivos() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [documentos, setDocumentos] = useState([]);
  const [msg, setMsg] = useState('');
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const cargarDocumentos = () => {
    axios.get('http://localhost:3000/api/documentos', { headers }).then(res => setDocumentos(res.data));
  };

  useEffect(() => { cargarDocumentos(); }, []);

  const handleEliminar = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/documentos/${confirmEliminar}`, { headers });
      setMsg('✅ Documento eliminado');
      setConfirmEliminar(null);
      cargarDocumentos();
    } catch { setMsg('❌ Error al eliminar'); }
  };

  const handleAbrir = (ruta) => {
    const url = `http://localhost:3000/${ruta.replace(/\\/g, '/').split('/').map(encodeURIComponent).join('/')}`;
    window.open(url, '_blank');
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-2">Documentación Asociada</h2>

      <p className="text-sm text-gray-500 mb-4">Los archivos de los clientes los sube el Back desde Auditoría o Cargas.</p>

      {msg && <p className="text-sm mb-3">{msg}</p>}

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
                  <button onClick={() => setConfirmEliminar(d.documento_id)}
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

      {confirmEliminar && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setConfirmEliminar(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm mx-4 p-6 z-10 text-center">
            <div className="text-5xl mb-3">🗑️</div>
            <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar documento?</h3>
            <p className="text-sm text-gray-500 mb-6">Esta acción no se puede deshacer.</p>
            <div className="flex gap-3">
              <button onClick={() => setConfirmEliminar(null)}
                className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">
                Cancelar
              </button>
              <button onClick={handleEliminar}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">
                Sí, eliminar
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}