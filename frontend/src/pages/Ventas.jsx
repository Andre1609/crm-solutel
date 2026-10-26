import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';

const tiposDocumento = ['GRABACION','DNI','CONTRATO','FACTURA','OTRO'];
const MAX_MB = 10;
const estadosVenta = ['PDT FIRMA','FIRMADO','CANCELADO','BAJA RECUPERADA','BAJA NO RECUPERADA','ACTIVADO','BAJA','VERI KO','VOLTEADA'];

export default function Ventas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [campanas, setCampanas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [busqueda, setBusqueda] = useState('');
  const [titular, setTitular] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [dragging, setDragging] = useState(false);

  const [nuevoTitular, setNuevoTitular] = useState({
    titular_dni: '', titular_nombres: '', titular_apellidos: '', titular_nacionalidad: '',
    titular_fecha_nacimiento: '', titular_edad: '', titular_telefono_fijo: '',
    titular_telefono_movil: '', titular_correo: '', titular_banco: '', titular_iban: ''
  });

  const [form, setForm] = useState({
    venta_fecha: '', venta_campana_id: '', venta_tarifa_id: '',
    venta_metodo_confirmacion: 'LLAMADA', venta_codigo_sms: '',
    venta_estado: 'PDT FIRMA', venta_observacion: ''
  });

  useEffect(() => {
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
    axios.get('http://localhost:3000/api/catalogo/tarifas', { headers }).then(res => setTarifas(res.data));
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
      setTitular(res.data);
      setMsg('');
    } catch {
      setTitular(null);
      setMsg('Titular no encontrado. Complete los datos para registrarlo.');
    } finally { setBuscando(false); }
  };

  const registrarTitular = async () => {
    try {
      const res = await axios.post('http://localhost:3000/api/titulares', nuevoTitular, { headers });
      setTitular({ ...nuevoTitular, titular_id: res.data.id });
      setMsg('✅ Titular registrado correctamente');
    } catch { setMsg('❌ Error al registrar titular'); }
  };

  const agregarArchivos = (lista) => {
    const nuevos = [];
    let rechazados = 0;
    Array.from(lista).forEach(f => {
      if (f.size > MAX_MB * 1024 * 1024) { rechazados++; return; }
      nuevos.push({ id: `${Date.now()}-${Math.random()}`, file: f, tipo: 'OTRO' });
    });
    if (nuevos.length) setArchivos(prev => [...prev, ...nuevos]);
    if (rechazados) setMsg(`❌ ${rechazados} archivo(s) superan los ${MAX_MB} MB y no se agregaron`);
  };

  const handleDrop = (e) => { e.preventDefault(); setDragging(false); agregarArchivos(e.dataTransfer.files); };
  const cambiarTipo = (id, tipo) => setArchivos(prev => prev.map(a => a.id === id ? { ...a, tipo } : a));
  const quitarArchivo = (id) => setArchivos(prev => prev.filter(a => a.id !== id));

  const handleGuardar = async () => {
    if (!titular) return setMsg('❌ Primero busca o registra un titular');
    setGuardando(true); setMsg('');
    try {
      // Venta y archivos viajan en una sola petición: si algo falla, no se guarda nada
      const formData = new FormData();
      Object.entries({ ...form, venta_titular_id: titular.titular_id })
        .forEach(([k, v]) => formData.append(k, v ?? ''));
      archivos.forEach(a => formData.append('archivos', a.file));
      formData.append('documento_tipos', JSON.stringify(archivos.map(a => a.tipo)));

      await axios.post('http://localhost:3000/api/ventas', formData, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' }
      });

      setMsg(archivos.length > 0
        ? `✅ Venta guardada correctamente con ${archivos.length} archivo(s)`
        : '✅ Venta guardada correctamente');
      setTitular(null); setBusqueda(''); setArchivos([]);
      setForm({ venta_fecha: '', venta_campana_id: '', venta_tarifa_id: '', venta_metodo_confirmacion: 'LLAMADA', venta_codigo_sms: '', venta_estado: 'PDT FIRMA', venta_observacion: '' });
    } catch (err) {
      setMsg(`❌ No se guardó la venta: ${err.response?.data?.mensaje || 'no hay conexión con el servidor'}. Revisa los datos y vuelve a intentarlo.`);
    }
    finally { setGuardando(false); }
  };

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-6">Nueva Venta</h2>
      {msg && <div className="mb-4 text-sm p-3 rounded-lg bg-gray-50 text-gray-700">{msg}</div>}

      {/* Datos del Titular */}
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-3">Datos del Titular</h3>
        <div className="flex gap-3 mb-4">
          <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm flex-1"
            placeholder="DNI o ID del titular"
            value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
          <button onClick={buscarTitular} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700">
            {buscando ? 'Buscando...' : 'Buscar'}
          </button>
        </div>

        {titular ? (
          <div className="grid grid-cols-2 gap-3 text-sm text-gray-600 bg-green-50 p-4 rounded-lg">
            <p><span className="font-medium">ID:</span> {titular.titular_id}</p>
            <p><span className="font-medium">DNI:</span> {titular.titular_dni}</p>
            <p><span className="font-medium">Nombre:</span> {titular.titular_nombres} {titular.titular_apellidos}</p>
            <p><span className="font-medium">Móvil:</span> {titular.titular_telefono_movil}</p>
            <p><span className="font-medium">Email:</span> {titular.titular_correo}</p>
            <p><span className="font-medium">Banco:</span> {titular.titular_banco}</p>
            <p><span className="font-medium">IBAN:</span> {titular.titular_iban}</p>
            <p><span className="font-medium">Nacionalidad:</span> {titular.titular_nacionalidad}</p>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              {[
                ['titular_dni','DNI/NIE'],['titular_nombres','Nombres'],['titular_apellidos','Apellidos'],
                ['titular_nacionalidad','Nacionalidad'],['titular_telefono_fijo','Teléfono Fijo'],
                ['titular_telefono_movil','Teléfono Móvil'],['titular_correo','Correo'],
                ['titular_banco','Banco'],['titular_iban','IBAN'],
                ['titular_fecha_nacimiento','Fecha Nacimiento'],['titular_edad','Edad']
              ].map(([key, label]) => (
                <div key={key}>
                  <label className="text-xs text-gray-500">{label}</label>
                  <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                    type={key === 'titular_fecha_nacimiento' ? 'date' : 'text'}
                    value={nuevoTitular[key]}
                    onChange={(e) => setNuevoTitular({ ...nuevoTitular, [key]: e.target.value })} />
                </div>
              ))}
            </div>
            <button onClick={registrarTitular}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              Registrar Titular
            </button>
          </>
        )}
      </div>

      {/* Datos de Venta */}
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-3">Datos de Venta</h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500">Fecha de venta</label>
            <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.venta_fecha} onChange={(e) => setForm({ ...form, venta_fecha: e.target.value })} />
          </div>
          <div>
            <label className="text-xs text-gray-500">Campaña</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.venta_campana_id} onChange={(e) => setForm({ ...form, venta_campana_id: e.target.value })}>
              <option value="">Seleccionar campaña</option>
              {campanas.map(c => <option key={c.campana_id} value={c.campana_id}>{c.campana_nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Tarifa</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.venta_tarifa_id} onChange={(e) => setForm({ ...form, venta_tarifa_id: e.target.value })}>
              <option value="">Seleccionar tarifa</option>
              {tarifas.map(t => <option key={t.tarifa_id} value={t.tarifa_id}>{t.tarifa_nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500">Método de confirmación</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.venta_metodo_confirmacion} onChange={(e) => setForm({ ...form, venta_metodo_confirmacion: e.target.value })}>
              {['SMS','EMAIL','LLAMADA','PRESENCIAL'].map(m => <option key={m}>{m}</option>)}
            </select>
          </div>
          {form.venta_metodo_confirmacion === 'SMS' && (
            <div>
              <label className="text-xs text-gray-500">Código SMS</label>
              <div className="flex gap-2">
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm bg-gray-50"
                  value={form.venta_codigo_sms} readOnly />
                <button type="button"
                  onClick={() => setForm({ ...form, venta_codigo_sms: 'SMS-' + Math.floor(1000 + Math.random() * 9000) })}
                  className="bg-blue-600 text-white px-3 py-2 rounded-lg text-sm hover:bg-blue-700 whitespace-nowrap">
                  Generar
                </button>
              </div>
            </div>
          )}
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Estado</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={form.venta_estado} onChange={(e) => setForm({ ...form, venta_estado: e.target.value })}>
              {estadosVenta.map(e => <option key={e}>{e}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Observación</label>
            <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3}
              value={form.venta_observacion} onChange={(e) => setForm({ ...form, venta_observacion: e.target.value })} />
          </div>
        </div>
      </div>

      {/* Documentación */}
      <div className="bg-white rounded-xl shadow p-5 mb-5">
        <h3 className="font-semibold text-gray-700 mb-1">Documentación (opcional)</h3>
        <p className="text-xs text-gray-400 mb-3">Los archivos se envían junto con la venta (máx. {MAX_MB} MB cada uno).</p>
        <div onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition ${dragging ? 'border-green-400 bg-green-50' : 'border-gray-300 bg-gray-50'}`}>
          <p className="text-gray-400 text-sm mb-3">Arrastra archivos aquí o</p>
          <label className="bg-gray-700 text-white px-4 py-2 rounded-lg text-sm cursor-pointer hover:bg-gray-800 inline-block">
            Seleccionar archivos
            <input type="file" multiple className="hidden"
              onChange={(e) => { agregarArchivos(e.target.files); e.target.value = ''; }} />
          </label>
        </div>

        {archivos.length > 0 && (
          <div className="mt-4 space-y-2">
            {archivos.map(a => (
              <div key={a.id} className="flex items-center gap-3 border border-gray-200 rounded-lg px-3 py-2">
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 truncate">{a.file.name}</p>
                  <p className="text-xs text-gray-400">{(a.file.size / 1024).toFixed(1)} KB</p>
                </div>
                <select className="border border-gray-300 rounded-lg px-2 py-1 text-xs"
                  value={a.tipo} onChange={(e) => cambiarTipo(a.id, e.target.value)}>
                  {tiposDocumento.map(t => <option key={t}>{t}</option>)}
                </select>
                <button type="button" onClick={() => quitarArchivo(a.id)}
                  className="text-gray-400 hover:text-red-500 text-lg font-bold" title="Quitar">✕</button>
              </div>
            ))}
          </div>
        )}
      </div>

      <button onClick={handleGuardar} disabled={guardando}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg text-sm font-medium transition">
        {guardando ? 'Guardando...' : 'Guardar Venta'}
      </button>
    </Layout>
  );
}
