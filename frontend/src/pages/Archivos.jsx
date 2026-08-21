import { useState } from 'react';
import Layout from '../components/Layout';
export default function Archivos() {
  const [archivos, setArchivos] = useState([]);
  const [tipo, setTipo] = useState('OTRO');
  const [dragging, setDragging] = useState(false);
  const [subidos, setSubidos] = useState([]);
  const handleDrop = (e) => { e.preventDefault(); setDragging(false); setArchivos(Array.from(e.dataTransfer.files)); };
  const handleSeleccionar = (e) => { setArchivos(Array.from(e.target.files)); };
  const handleSubir = () => { if (archivos.length === 0) return; setSubidos([...subidos, ...archivos.map(f => ({ nombre: f.name, tipo, fecha: new Date().toLocaleString() }))]); setArchivos([]); };
  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Documentación Asociada</h2>
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <div className="mb-4"><label className="text-xs text-gray-500 block mb-1">Tipo de documento</label><select className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-64" value={tipo} onChange={(e) => setTipo(e.target.value)}>{['AUDIO TEXTO LEGAL','DNI','CONTRATO','OTRO'].map(t => <option key={t}>{t}</option>)}</select></div>
        <div onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} className={`border-2 border-dashed rounded-xl p-12 text-center transition ${dragging ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <p className="text-gray-400 text-sm">Arrastrar archivos aquí</p>
          {archivos.length > 0 && <p className="text-green-600 text-sm mt-2">{archivos.length} archivo(s) seleccionado(s)</p>}
        </div>
        <div className="flex gap-3 mt-4">
          <label className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-800">Seleccionar archivos<input type="file" multiple className="hidden" onChange={handleSeleccionar} /></label>
          <button onClick={handleSubir} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700">Subir archivos</button>
        </div>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Nombre</th><th className="px-4 py-3 text-left">Tipo</th><th className="px-4 py-3 text-left">Fecha</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {subidos.map((a, i) => (<tr key={i} className="hover:bg-gray-50"><td className="px-4 py-3 text-gray-800">{a.nombre}</td><td className="px-4 py-3 text-gray-500">{a.tipo}</td><td className="px-4 py-3 text-gray-500">{a.fecha}</td></tr>))}
            {subidos.length === 0 && (<tr><td colSpan={3} className="px-4 py-8 text-center text-gray-400">No hay archivos subidos</td></tr>)}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
