import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const estadoColores = {
  'PENDIENTE': 'bg-yellow-100 text-yellow-700',
  'REALIZADO': 'bg-green-100 text-green-700',
  'CANCELADO': 'bg-red-100 text-red-700',
};

export default function Agendados() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [agenda, setAgenda] = useState([]);
  const [form, setForm] = useState({ agenda_titular_id: '', agenda_venta_id: '', agenda_fecha: '', agenda_motivo: '', agenda_observacion: '' });
  const [msg, setMsg] = useState('');
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    axios.get('http://localhost:3000/api/agenda', { headers }).then(res => {
      setAgenda(res.data);
      setCargando(false);
    });
  }, []);

  const handleGuardar = async () => {
    try {
      await axios.post('http://localhost:3000/api/agenda', form, { headers });
      setMsg('✅ Agendado correctamente');
      const res = await axios.get('http://localhost:3000/api/agenda', { headers });
      setAgenda(res.data);
      setForm({ agenda_titular_id: '', agenda_venta_id: '', agenda_fecha: '', agenda_motivo: '', agenda_observacion: '' });
    } catch { setMsg('❌ Error al agendar'); }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Agendados</h2>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nuevo Agendado</h3>
        {msg && <p className="text-sm mb-3">{msg}</p>}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">ID Titular</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 1"
              value={form.agenda_titular_id} onChange={(e) => setForm({ ...form, agenda_titular_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">ID Venta (opcional)</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: 1"
              value={form.agenda_venta_id} onChange={(e) => setForm({ ...form, agenda_venta_id: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Fecha y hora</label>
            <input type="datetime-local" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.agenda_fecha} onChange={(e) => setForm({ ...form, agenda_fecha: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Motivo</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              placeholder="Ej: Llamada de seguimiento"
              value={form.agenda_motivo} onChange={(e) => setForm({ ...form, agenda_motivo: e.target.value })} />
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Observación</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2}
              value={form.agenda_observacion} onChange={(e) => setForm({ ...form, agenda_observacion: e.target.value })} />
          </div>
        </div>
        <button onClick={handleGuardar}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm">
          Agendar
        </button>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titular</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Responsable</th>
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : agenda.length === 0 ? (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-gray-400">No hay agendados</td></tr>
            ) : agenda.map((a) => (
              <tr key={a.agenda_id} className="hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-800">{a.titular}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.agenda_fecha).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{a.agenda_motivo}</td>
                <td className="px-4 py-3 text-gray-500">{a.responsable}</td>
                <td className="px-4 py-3">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoColores[a.agenda_estado] || 'bg-gray-100 text-gray-600'}`}>
                    {a.agenda_estado}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
