import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
const estadosVenta = ['PENDIENTE DE VERIFICACION','ACTIVADO','BAJA','BAJA ANTICIPADA','INCIDENCIA ADMINISTRATIVA','KO','PAGADO COMERCIAL','RECUPERADO','REPOSICION','SCORING'];
export default function Ventas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };
  const [dni, setDni] = useState('');
  const [cliente, setCliente] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [form, setForm] = useState({ fecha_venta: '', metodo_confirmacion: 'SMS', grabacion: 'Agendado', codigo_seguridad: '', estado_venta: 'PENDIENTE DE VERIFICACION', observacion_backoffice: '', plan_id: '' });
  const [nuevoCliente, setNuevoCliente] = useState({ nombres: '', apellidos: '', nacionalidad: '', fecha_nacimiento: '', edad: '', telefono_fijo: '', telefono_movil: '', correo_electronico: '', entidad_bancaria: '', numero_cuenta: '' });
  const buscarCliente = async () => {
    if (!dni) return; setBuscando(true);
    try { const res = await axios.get(`http://localhost:3000/api/clientes/dni/${dni}`, { headers }); setCliente(res.data); }
    catch { setCliente(null); setMsg('Cliente no encontrado. Complete los datos para registrarlo.'); }
    finally { setBuscando(false); }
  };
  const handleGuardar = async () => {
    setGuardando(true); setMsg('');
    try {
      let cliente_id = cliente?.id;
      if (!cliente_id) { const res = await axios.post('http://localhost:3000/api/clientes', { ...nuevoCliente, dni }, { headers }); cliente_id = res.data.id; }
      await axios.post('http://localhost:3000/api/ventas', { ...form, cliente_id }, { headers });
      setMsg('✅ Venta guardada correctamente'); setCliente(null); setDni('');
    } catch { setMsg('❌ Error al guardar la venta'); }
    finally { setGuardando(false); }
  };
  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Nueva Venta</h2>
      {msg && <div className="mb-4 text-sm p-3 rounded-lg bg-gray-50 text-gray-700">{msg}</div>}
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-3">Datos del Titular</h3>
        <div className="flex gap-3 mb-4">
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1" placeholder="DNI" value={dni} onChange={(e) => setDni(e.target.value)} />
          <button onClick={buscarCliente} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">{buscando ? 'Buscando...' : 'Buscar'}</button>
        </div>
        {cliente ? (
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 bg-green-50 p-3 rounded-lg">
            <p><span className="font-medium">Nombre:</span> {cliente.nombres} {cliente.apellidos}</p>
            <p><span className="font-medium">Móvil:</span> {cliente.telefono_movil}</p>
            <p><span className="font-medium">Email:</span> {cliente.correo_electronico}</p>
            <p><span className="font-medium">Banco:</span> {cliente.entidad_bancaria}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {[['nombres','Nombres'],['apellidos','Apellidos'],['nacionalidad','Nacionalidad'],['telefono_fijo','Teléfono Fijo'],['telefono_movil','Teléfono Móvil'],['correo_electronico','Correo'],['entidad_bancaria','Banco'],['numero_cuenta','Cuenta IBAN'],['fecha_nacimiento','Fecha Nacimiento'],['edad','Edad']].map(([key, label]) => (
              <div key={key}><label className="text-xs text-gray-500">{label}</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={nuevoCliente[key]} onChange={(e) => setNuevoCliente({ ...nuevoCliente, [key]: e.target.value })} /></div>
            ))}
          </div>
        )}
      </div>
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-3">Datos de Venta</h3>
        <div className="grid grid-cols-2 gap-3">
          <div><label className="text-xs text-gray-500">Fecha de venta</label><input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.fecha_venta} onChange={(e) => setForm({ ...form, fecha_venta: e.target.value })} /></div>
          <div><label className="text-xs text-gray-500">Método de confirmación</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.metodo_confirmacion} onChange={(e) => setForm({ ...form, metodo_confirmacion: e.target.value })}>{['SMS','EMAIL','LLAMADA','PRESENCIAL'].map(m => <option key={m}>{m}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">Grabación</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.grabacion} onChange={(e) => setForm({ ...form, grabacion: e.target.value })}>{['Agendado','Realizado','Pendiente'].map(g => <option key={g}>{g}</option>)}</select></div>
          <div><label className="text-xs text-gray-500">Código de seguridad</label><input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.codigo_seguridad} onChange={(e) => setForm({ ...form, codigo_seguridad: e.target.value })} /></div>
          <div className="col-span-2"><label className="text-xs text-gray-500">Estado BackOffice</label><select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={form.estado_venta} onChange={(e) => setForm({ ...form, estado_venta: e.target.value })}>{estadosVenta.map(e => <option key={e}>{e}</option>)}</select></div>
          <div className="col-span-2"><label className="text-xs text-gray-500">Observación BackOffice</label><textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} value={form.observacion_backoffice} onChange={(e) => setForm({ ...form, observacion_backoffice: e.target.value })} /></div>
        </div>
      </div>
      <button onClick={handleGuardar} disabled={guardando} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">{guardando ? 'Guardando...' : 'Guardar Venta'}</button>
    </Layout>
  );
}
