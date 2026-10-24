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
  const { token, usuario } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [agenda, setAgenda] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [titular, setTitular] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [filtroEquipo, setFiltroEquipo] = useState('');
  const [seleccionado, setSeleccionado] = useState(null);
  const [form, setForm] = useState({
    agenda_venta_id: '',
    agenda_fecha: '',
    agenda_motivo: '',
    agenda_tarifa_id: '',
    agenda_campana_id: '',
  });
  const [msg, setMsg] = useState('');
  const [cargando, setCargando] = useState(true);

  const esJefeOBack = usuario?.rol_id === 1 || usuario?.rol_id === 3;
  const esSupervisor = usuario?.rol_id === 2;

  const cargarAgenda = () => {
    axios.get('http://localhost:3000/api/agenda', { headers }).then(res => {
      setAgenda(res.data); setCargando(false);
    });
  };

  useEffect(() => {
    cargarAgenda();
    axios.get('http://localhost:3000/api/catalogo/tarifas', { headers }).then(res => setTarifas(res.data));
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
    if (esJefeOBack) {
      axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
    }
  }, []);

  const buscarTitular = async () => {
    if (!busqueda) return;
    setBuscando(true);
    try {
      const esId = /^\d+$/.test(busqueda) && busqueda.length <= 5;
      const url = esId
        ? `http://localhost:3000/api/titulares/id/${busqueda}`
        : `http://localhost:3000/api/titulares/dni/${busqueda}`;
      const res = await axios.get(url, { headers });
      setTitular(res.data); setMsg('');
    } catch {
      setTitular(null); setMsg('❌ Titular no encontrado');
    } finally { setBuscando(false); }
  };

  const handleGuardar = async () => {
    if (!titular) return setMsg('❌ Primero busca un titular');
    if (!form.agenda_fecha) return setMsg('❌ Selecciona una fecha');
    try {
      const tarifaNombre = tarifas.find(t => t.tarifa_id == form.agenda_tarifa_id)?.tarifa_nombre || '';
      const campanaNombre = campanas.find(c => c.campana_id == form.agenda_campana_id)?.campana_nombre || '';
      const obs = [tarifaNombre && `Tarifa: ${tarifaNombre}`, campanaNombre && `Campaña: ${campanaNombre}`].filter(Boolean).join(' | ');

      await axios.post('http://localhost:3000/api/agenda', {
        agenda_titular_id: titular.titular_id,
        agenda_venta_id: form.agenda_venta_id || null,
        agenda_fecha: form.agenda_fecha,
        agenda_motivo: form.agenda_motivo,
        agenda_observacion: obs,
      }, { headers });
      setMsg('✅ Agendado correctamente');
      cargarAgenda();
      setTitular(null); setBusqueda('');
      setForm({ agenda_venta_id: '', agenda_fecha: '', agenda_motivo: '', agenda_tarifa_id: '', agenda_campana_id: '' });
    } catch { setMsg('❌ Error al agendar'); }
  };

  const agendaFiltrada = agenda.filter(a => {
    if (filtroEquipo) return a.equipo === filtroEquipo;
    return true;
  });

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Agendados</h2>

      <div className="bg-white rounded-xl shadow p-5 mb-6">
        <h3 className="font-semibold text-gray-700 mb-3">Nuevo Agendado</h3>
        {msg && <p className="text-sm mb-3">{msg}</p>}

        <div className="flex gap-3 mb-4">
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="Buscar titular por DNI o ID..."
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && buscarTitular()} />
          <button onClick={buscarTitular}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {titular && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4 flex justify-between items-center">
            <div>
              <p className="text-sm font-medium text-green-800">{titular.titular_nombres} {titular.titular_apellidos}</p>
              <p className="text-xs text-green-600">DNI: {titular.titular_dni} — Móvil: {titular.titular_telefono_movil || '-'}</p>
            </div>
            <button onClick={() => { setTitular(null); setBusqueda(''); }}
              className="text-green-600 hover:text-green-800 text-lg font-bold">✕</button>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
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
          <div>
            <label className="text-xs text-gray-500">Tarifa</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.agenda_tarifa_id} onChange={(e) => setForm({ ...form, agenda_tarifa_id: e.target.value })}>
              <option value="">Sin tarifa</option>
              {tarifas.map(t => <option key={t.tarifa_id} value={t.tarifa_id}>{t.tarifa_nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Campaña</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.agenda_campana_id} onChange={(e) => setForm({ ...form, agenda_campana_id: e.target.value })}>
              <option value="">Sin campaña</option>
              {campanas.map(c => <option key={c.campana_id} value={c.campana_id}>{c.campana_nombre}</option>)}
            </select>
          </div>
        </div>
        <button onClick={handleGuardar}
          className="mt-4 bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm">
          Agendar
        </button>
      </div>

      <div className="flex items-center gap-3 mb-4">
        {esJefeOBack && (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={filtroEquipo} onChange={(e) => setFiltroEquipo(e.target.value)}>
            <option value="">Todos los equipos</option>
            {equipos.map(e => <option key={e.equipo_id}>{e.equipo_nombre}</option>)}
          </select>
        )}
        <p className="text-xs text-gray-500">{agendaFiltrada.length} resultado(s)</p>
      </div>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left">Titular</th>
              <th className="px-4 py-3 text-left">Fecha</th>
              <th className="px-4 py-3 text-left">Motivo</th>
              <th className="px-4 py-3 text-left">Responsable</th>
              {esJefeOBack && <th className="px-4 py-3 text-left">Equipo</th>}
              <th className="px-4 py-3 text-left">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {cargando ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : agendaFiltrada.length === 0 ? (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-gray-400">No hay agendados</td></tr>
            ) : agendaFiltrada.map((a) => (
              <tr key={a.agenda_id} className="hover:bg-gray-50 cursor-pointer" onClick={() => setSeleccionado(a)}>
                <td className="px-4 py-3 font-medium text-gray-800">{a.titular}</td>
                <td className="px-4 py-3 text-gray-500">{new Date(a.agenda_fecha).toLocaleString()}</td>
                <td className="px-4 py-3 text-gray-500">{a.agenda_motivo}</td>
                <td className="px-4 py-3 text-gray-500">{a.responsable}</td>
                {esJefeOBack && <td className="px-4 py-3 text-gray-500">{a.equipo || '-'}</td>}
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

      {seleccionado && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSeleccionado(null)} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-4 p-6 z-10">
            <button onClick={() => setSeleccionado(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>

            <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle del Agendado</h3>

            <div className="space-y-2 text-sm mb-5">
              {[
                ['Titular', seleccionado.titular],
                ['Fecha', new Date(seleccionado.agenda_fecha).toLocaleString()],
                ['Motivo', seleccionado.agenda_motivo || '-'],
                ['Responsable', seleccionado.responsable],
                ['Equipo', seleccionado.equipo || '-'],
                ['Observación', seleccionado.agenda_observacion || '-'],
              ].map(([label, valor]) => (
                <div key={label} className="flex justify-between border-b pb-1.5">
                  <span className="text-gray-500">{label}</span>
                  <span className="font-medium text-right max-w-xs">{valor}</span>
                </div>
              ))}
              <div className="flex justify-between pb-1.5">
                <span className="text-gray-500">Estado</span>
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${estadoColores[seleccionado.agenda_estado] || 'bg-gray-100'}`}>
                  {seleccionado.agenda_estado}
                </span>
              </div>
            </div>

          <button
            onClick={() => alert('📞 Función de llamada próximamente disponible')}
            className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white py-3 rounded-xl text-sm font-medium transition mb-4">
            <span className="text-lg">📞</span>
            Iniciar llamada
          </button>

          <button
            onClick={async () => {
              try {
                await axios.delete(`http://localhost:3000/api/agenda/${seleccionado.agenda_id}`, { headers });
                setSeleccionado(null);
                cargarAgenda();
              } catch { alert('Error al eliminar'); }
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white py-3 rounded-xl text-sm font-medium transition">
            🗑️ Eliminar agendado
          </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
