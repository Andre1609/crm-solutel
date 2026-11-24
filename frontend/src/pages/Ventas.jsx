import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { bancoDesdeIban, ibanEspanolValido } from '../utils/bancos';
import { normalizarDocumento, documentoValido, completarLetraControl, TIPOS_DOCUMENTO } from '../utils/documentos';

const tiposDocumento = ['GRABACION','DNI','CONTRATO','FACTURA','OTRO'];
const MAX_MB = 10;
const CAMPOS_TITULAR = [
  'titular_nombres', 'titular_apellidos', 'titular_nacionalidad', 'titular_fecha_nacimiento', 'titular_edad',
  'titular_telefono_fijo', 'titular_telefono_movil', 'titular_correo', 'titular_banco', 'titular_iban'
];
// Datos editables de un titular como texto (null -> '', fecha -> AAAA-MM-DD)
const camposDe = (t) => Object.fromEntries(CAMPOS_TITULAR.map(k =>
  [k, k === 'titular_fecha_nacimiento' ? String(t?.[k] ?? '').slice(0, 10) : String(t?.[k] ?? '')]));
const TITULAR_VACIO = {
  titular_tipo_documento: 'NIF', titular_dni: '', titular_nombres: '', titular_apellidos: '', titular_nacionalidad: '',
  titular_fecha_nacimiento: '', titular_edad: '', titular_telefono_fijo: '',
  titular_telefono_movil: '', titular_correo: '', titular_banco: '', titular_iban: ''
};
const estadosVenta = ['PDT FIRMA','FIRMADO','CANCELADO','BAJA RECUPERADA','BAJA NO RECUPERADA','ACTIVADO','BAJA','VERI KO','VOLTEADA'];

export default function Ventas() {
  const { token } = useAuth();
  const headers = { Authorization: `Bearer ${token}` };

  const [campanas, setCampanas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [titular, setTitular] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [msg, setMsg] = useState('');
  const [archivos, setArchivos] = useState([]);
  const [dragging, setDragging] = useState(false);
  const [bancoAuto, setBancoAuto] = useState(false);
  const [recienRegistrado, setRecienRegistrado] = useState(false);
  const [letraAuto, setLetraAuto] = useState(false);
  const [edicion, setEdicion] = useState(camposDe(null));

  const [nuevoTitular, setNuevoTitular] = useState(TITULAR_VACIO);

  const [form, setForm] = useState({
    venta_fecha: '', venta_campana_id: '', venta_tarifa_id: '',
    venta_metodo_confirmacion: 'LLAMADA', venta_codigo_sms: '',
    venta_estado: 'PDT FIRMA', venta_observacion: ''
  });

  useEffect(() => {
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
    axios.get('http://localhost:3000/api/catalogo/tarifas', { headers }).then(res => setTarifas(res.data));
  }, []);

  // Al escribir el número de identidad se busca solo; si ya existe, se cargan sus datos
  const documentoNormalizado = normalizarDocumento(nuevoTitular.titular_dni);

  useEffect(() => {
    setRecienRegistrado(false);
    if (documentoNormalizado.length < 5) { setTitular(null); setBuscando(false); return; }
    let cancelado = false;
    setBuscando(true);
    const espera = setTimeout(() => {
      axios.get(`http://localhost:3000/api/titulares/dni/${encodeURIComponent(documentoNormalizado)}`, { headers })
        .then(res => {
          if (cancelado) return;
          setTitular(res.data);
          setEdicion(camposDe(res.data));
          setBancoAuto(false);
          if (res.data.titular_tipo_documento) {
            setNuevoTitular(prev => ({ ...prev, titular_tipo_documento: res.data.titular_tipo_documento }));
          }
        })
        .catch(() => { if (!cancelado) setTitular(null); })
        .finally(() => { if (!cancelado) setBuscando(false); });
    }, 400);
    return () => { cancelado = true; clearTimeout(espera); };
  }, [documentoNormalizado]);

  // Al completar el número (8 dígitos del NIF o X/Y/Z + 7 del NIE) se agrega la letra de control.
  // Solo cuando se escribe hacia adelante: si el asesor borra, no se vuelve a agregar.
  const cambiarDocumento = (valor) => {
    const nuevo = normalizarDocumento(valor);
    const anterior = normalizarDocumento(nuevoTitular.titular_dni);
    const completado = nuevo.length > anterior.length
      ? completarLetraControl(nuevoTitular.titular_tipo_documento, nuevo)
      : nuevo;
    setLetraAuto(completado !== nuevo);
    setNuevoTitular({ ...nuevoTitular, titular_dni: completado });
  };

  // Los campos se editan sobre los datos del titular existente o sobre el formulario del nuevo
  const formActual = titular ? edicion : nuevoTitular;
  const setFormActual = titular ? setEdicion : setNuevoTitular;

  // Al escribir el IBAN se completa el banco; si el asesor edita el banco a mano, ya no se pisa
  const cambiarCampoTitular = (key, valor) => {
    if (key === 'titular_iban') {
      const detectado = bancoDesdeIban(valor);
      const sobrescribir = bancoAuto || !formActual.titular_banco;
      setFormActual({ ...formActual, titular_iban: valor, ...(sobrescribir ? { titular_banco: detectado } : {}) });
      if (sobrescribir) setBancoAuto(detectado !== '');
      return;
    }
    if (key === 'titular_banco') setBancoAuto(false);
    setFormActual({ ...formActual, [key]: valor });
  };

  // ¿El asesor modificó algo de un titular que ya existe?
  const base = camposDe(titular);
  const hayCambios = !!titular && (
    CAMPOS_TITULAR.some(k => edicion[k] !== base[k]) ||
    (!!titular.titular_tipo_documento && nuevoTitular.titular_tipo_documento !== titular.titular_tipo_documento)
  );

  const guardarCambiosTitular = async () => {
    const tipo = nuevoTitular.titular_tipo_documento;
    await axios.put(`http://localhost:3000/api/titulares/${titular.titular_id}`, { titular_tipo_documento: tipo, ...edicion }, { headers });
    setTitular({ ...titular, ...edicion, titular_tipo_documento: tipo });
  };

  const handleActualizarTitular = async () => {
    try { await guardarCambiosTitular(); setMsg('✅ Datos del titular actualizados'); }
    catch (err) { setMsg(`❌ ${err.response?.data?.mensaje || 'No se pudieron actualizar los datos del titular'}`); }
  };

  const registrarTitular = async () => {
    if (!documentoNormalizado) return setMsg('❌ Escribe el número de identidad del titular');
    try {
      const res = await axios.post('http://localhost:3000/api/titulares', { ...nuevoTitular, titular_dni: documentoNormalizado }, { headers });
      setTitular({ ...nuevoTitular, titular_dni: documentoNormalizado, titular_id: res.data.id });
      setRecienRegistrado(true);
      setEdicion(camposDe(nuevoTitular));
      setMsg('✅ Titular registrado correctamente');
    } catch (err) { setMsg(`❌ ${err.response?.data?.mensaje || 'Error al registrar titular'}`); }
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
    if (hayCambios) {
      try { await guardarCambiosTitular(); }
      catch (err) {
        setGuardando(false);
        return setMsg(`❌ No se pudieron guardar los cambios del titular: ${err.response?.data?.mensaje || 'sin conexión con el servidor'}`);
      }
    }
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

      setMsg('✅ Venta enviada. Quedó pendiente de revisión del Back' + (archivos.length > 0 ? ` con ${archivos.length} archivo(s)` : ''));
      setTitular(null); setNuevoTitular(TITULAR_VACIO); setBancoAuto(false); setArchivos([]);
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

        <div className="grid grid-cols-3 gap-3 mb-2">
          <div>
            <label className="text-xs text-gray-500">Tipo de documento</label>
            <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
              value={nuevoTitular.titular_tipo_documento}
              onChange={(e) => { setLetraAuto(false); setNuevoTitular({ ...nuevoTitular, titular_tipo_documento: e.target.value }); }}>
              {TIPOS_DOCUMENTO.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>
          <div className="col-span-2">
            <label className="text-xs text-gray-500">Número de identidad</label>
            <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" maxLength={20}
              placeholder={nuevoTitular.titular_tipo_documento === 'PASAPORTE' ? 'Número de pasaporte' : 'Ej: 12345678Z'}
              value={nuevoTitular.titular_dni}
              onChange={(e) => cambiarDocumento(e.target.value)} />
          </div>
        </div>

        <div className="mb-4 min-h-5 text-xs">
          {buscando ? (
            <p className="text-gray-400">Buscando titular...</p>
          ) : titular ? (
            <p className="text-green-700 bg-green-50 rounded-lg px-3 py-2">
              {recienRegistrado
                ? `✓ Titular registrado (ID ${titular.titular_id}).`
                : `✓ Titular existente (ID ${titular.titular_id}): se cargaron sus datos. Puedes editarlos.`}
            </p>
          ) : documentoNormalizado.length >= 5 ? (
            <p className="text-gray-500">Titular nuevo: completa los datos y regístralo.</p>
          ) : null}
          {letraAuto && (
            <p className="text-green-600 mt-1">Letra de control agregada automáticamente</p>
          )}
          {documentoValido(nuevoTitular.titular_tipo_documento, nuevoTitular.titular_dni) === false && (
            <p className="text-red-600 mt-1">⚠ {nuevoTitular.titular_tipo_documento} no válido, revísalo</p>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          {[
            ['titular_nombres','Nombres'],['titular_apellidos','Apellidos'],
            ['titular_nacionalidad','Nacionalidad'],['titular_telefono_fijo','Teléfono Fijo'],
            ['titular_telefono_movil','Teléfono Móvil'],
            ['titular_iban','IBAN'],['titular_banco','Banco'],
            ['titular_correo','Correo'],
            ['titular_fecha_nacimiento','Fecha Nacimiento'],['titular_edad','Edad']
          ].map(([key, label]) => {
            const valor = formActual[key] ?? '';
            return (
              <div key={key}>
                <label className="text-xs text-gray-500">{label}</label>
                <input className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                  type={key === 'titular_fecha_nacimiento' ? 'date' : 'text'}
                  value={key === 'titular_fecha_nacimiento' ? String(valor).slice(0, 10) : valor}
                  onChange={(e) => cambiarCampoTitular(key, e.target.value)} />
                {key === 'titular_banco' && bancoAuto && (
                  <p className="text-xs text-green-600 mt-1">Detectado por el IBAN</p>
                )}
                {key === 'titular_iban' && ibanEspanolValido(formActual.titular_iban) === true && (
                  <p className="text-xs text-green-600 mt-1">✓ IBAN válido</p>
                )}
                {key === 'titular_iban' && ibanEspanolValido(formActual.titular_iban) === false && (
                  <p className="text-xs text-red-600 mt-1">⚠ IBAN no válido, revísalo</p>
                )}
              </div>
            );
          })}
        </div>

        {hayCambios && (
          <div className="mt-4 flex items-center gap-3">
            <button onClick={handleActualizarTitular}
              className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
              Guardar cambios del titular
            </button>
            <p className="text-xs text-amber-600">Modificaste datos del titular. También se guardarán al enviar la venta.</p>
          </div>
        )}

        {!titular && (
          <button onClick={registrarTitular}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg text-sm font-medium transition">
            Registrar Titular
          </button>
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
