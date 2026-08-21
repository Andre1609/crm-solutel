import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
export default function Agendados() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [agendados, setAgendados] = useState([]);
  const [form, setForm] = useState({ cliente_id: '', fecha_agendado: '', motivo: '', observaciones: '' });
  const [msg, setMsg] = useState('');
  useEffect(() => { axios.get('http://localhost:3000/api/agendados', { headers }).then(res => setAgendados(res.data)); }, []);
  const handleGuardar = async () => {
    try { await axios.post('http://localhost:3000/api/agendados', form, { headers }); setMsg('✅ Agendado correctamente'); const res = await axios.get('http://localhost:3000/api/agendados', { headers }); setAgendados(res.data); }
    catch { setMsg('❌ Error al agendar'); }
  };
  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Agendados</h2>
      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nuevo Agendado</h3>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500">ID Cliente</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.cliente_id} onChange={(e) => setForm({ ...form, cliente_id: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Fecha y hora</label><input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.fecha_agendado} onChange={(e) => setForm({ ...form, fecha_agendado: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Motivo</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.motivo} onChange={(e) => setForm({ ...form, motivo: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Observaciones</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.observaciones} onChange={(e) => setForm({ ...form, observaciones: e.target.value })} /></div>
        </div>
        <button onClick={handleGuardar} className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm">Agendar</button>
      </div>
      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase"><tr><th className="px-4 py-3 text-left">Cliente</th><th className="px-4 py-3 text-left">Fecha</th><th className="px-4 py-3 text-left">Motivo</th><th className="px-4 py-3 text-left">Estado</th></tr></thead>
          <tbody className="divide-y divide-gray-100">
            {agendados.map((a) => (<tr key={a.id} className="hover:bg-gray-50"><td className="px-4 py-3 font-medium text-gray-800">{a.cliente}</td><td className="px-4 py-3 text-gray-500">{new Date(a.fecha_agendado).toLocaleString()}</td><td className="px-4 py-3 text-gray-500">{a.motivo}</td><td className="px-4 py-3"><span className="bg-yellow-100 text-yellow-700 px-2 py-1 rounded-full text-xs">{a.estado}</span></td></tr>))}
            {agendados.length === 0 && (<tr><td colSpan={4} className="px-4 py-8 text-center text-gray-400">No hay agendados</td></tr>)}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
