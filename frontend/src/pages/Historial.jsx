import { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import * as XLSX from 'xlsx';

const estadoColores = {
  'ACTIVADO': 'bg-green-100 text-green-700',
  'PDT FIRMA': 'bg-yellow-100 text-yellow-700',
  'FIRMADO': 'bg-blue-100 text-blue-700',
  'CANCELADO': 'bg-red-100 text-red-700',
  'BAJA': 'bg-red-200 text-red-800',
  'BAJA RECUPERADA': 'bg-emerald-100 text-emerald-700',
  'BAJA NO RECUPERADA': 'bg-orange-100 text-orange-700',
  'VERI KO': 'bg-purple-100 text-purple-700',
  'VOLTEADA': 'bg-pink-100 text-pink-700',
};

const estadosVenta = ['PDT FIRMA','FIRMADO','CANCELADO','BAJA RECUPERADA','BAJA NO RECUPERADA','ACTIVADO','BAJA','VERI KO','VOLTEADA'];
const POR_PAGINA = 13;

export default function Historial() {
  const { token, usuario } = useAuth();
  const navigate = useNavigate();
  const headers = { Authorization: `Bearer ${token}` };
  const [ventas, setVentas] = useState([]);
  const [campanas, setCampanas] = useState([]);
  const [tarifas, setTarifas] = useState([]);
  const [equipos, setEquipos] = useState([]);
  const [filtro, setFiltro] = useState('');
  const [estado, setEstado] = useState('');
  const [campana, setCampana] = useState('');
  const [equipo, setEquipo] = useState('');
  const [pagina, setPagina] = useState(1);
  const [cargando, setCargando] = useState(true);
  const [seleccionada, setSeleccionada] = useState(null);
  const [editando, setEditando] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(false);
  const [formEditar, setFormEditar] = useState({});

  const cargarVentas = () => {
    axios.get('http://localhost:3000/api/ventas', { headers }).then(res => {
      setVentas(res.data); setCargando(false);
    });
  };

  useEffect(() => {
    cargarVentas();
    axios.get('http://localhost:3000/api/catalogo/campanas', { headers }).then(res => setCampanas(res.data));
    axios.get('http://localhost:3000/api/catalogo/tarifas', { headers }).then(res => setTarifas(res.data));
    axios.get('http://localhost:3000/api/catalogo/equipos', { headers }).then(res => setEquipos(res.data));
  }, []);

  const filtradas = ventas.filter(v => {
    const coincideTexto = v.titular?.toLowerCase().includes(filtro.toLowerCase()) || v.titular_dni?.includes(filtro);
    const coincideEstado = estado ? v.venta_estado === estado : true;
    const coincideCampana = campana ? v.campana === campana : true;
    const coincideEquipo = equipo ? v.equipo === equipo : true;
    return coincideTexto && coincideEstado && coincideCampana && coincideEquipo;
  });

  const totalPaginas = Math.ceil(filtradas.length / POR_PAGINA);
  const inicio = (pagina - 1) * POR_PAGINA;
  const paginadas = filtradas.slice(inicio, inicio + POR_PAGINA);
  const filasVacias = POR_PAGINA - paginadas.length;

  useEffect(() => { setPagina(1); }, [filtro, estado, campana, equipo]);

  const exportarExcel = () => {
    const datos = filtradas.map(v => ({
      'Titular': v.titular,
      'DNI': v.titular_dni,
      'Campaña': v.campana || '-',
      'Tarifa': v.tarifa || '-',
      'Estado': v.venta_estado,
      'Asesor': v.asesor,
      'Equipo': v.equipo || '-',
      'Fecha': new Date(v.venta_creado_en).toLocaleDateString(),
      'Observación': v.venta_observacion || '-',
    }));
    const ws = XLSX.utils.json_to_sheet(datos);
    ws['!cols'] = [
      { wch: 35 }, 
      { wch: 15 }, 
      { wch: 20 }, 
      { wch: 30 }, 
      { wch: 25 }, 
      { wch: 20 }, 
      { wch: 15 }, 
      { wch: 12 }, 
      { wch: 210 }, 

    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Ventas');
    XLSX.writeFile(wb, `historial_ventas_${new Date().toLocaleDateString().replace(/\//g, '-')}.xlsx`);
  };

  const abrirModal = (v) => {
    setSeleccionada(v);
    setFormEditar({
      venta_estado: v.venta_estado,
      venta_campana_id: v.venta_campana_id,
      venta_tarifa_id: v.venta_tarifa_id,
      venta_observacion: v.venta_observacion || '',
      venta_fecha: v.venta_fecha ? v.venta_fecha.split('T')[0] : '',
    });
    setEditando(false); setConfirmEliminar(false);
  };

  const cerrarModal = () => { setSeleccionada(null); setEditando(false); setConfirmEliminar(false); };

  const handleEditar = async () => {
    try {
      await axios.put(`http://localhost:3000/api/ventas/${seleccionada.venta_id}`, formEditar, { headers });
      cargarVentas(); cerrarModal();
    } catch { alert('Error al editar'); }
  };

  const handleEliminar = async () => {
    try {
      await axios.delete(`http://localhost:3000/api/ventas/${seleccionada.venta_id}`, { headers });
      cargarVentas(); cerrarModal();
    } catch { alert('Error al eliminar'); }
  };

  return (
    <Layout>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">Historial de Ventas</h2>
        <div className="flex gap-2">
          <button
            onClick={() => navigate('/backoffice')}
            className="px-4 py-2 rounded-lg text-sm font-medium border border-blue-600 text-blue-600 hover:bg-blue-50 transition">
            📊 Ver Dashboard
          </button>
          <button
            onClick={exportarExcel}
            className="px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition">
            📥 Exportar Excel
          </button>
        </div>
      </div>

      <div className="flex gap-2 mb-4 flex-wrap">
        <input className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-52"
          placeholder="Buscar por nombre o DNI..."
          value={filtro} onChange={(e) => setFiltro(e.target.value)} />
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={estado} onChange={(e) => setEstado(e.target.value)}>
          <option value="">Todos los estados</option>
          {estadosVenta.map(e => <option key={e}>{e}</option>)}
        </select>
        <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
          value={campana} onChange={(e) => setCampana(e.target.value)}>
          <option value="">Todas las campañas</option>
          {campanas.map(c => <option key={c.campana_id}>{c.campana_nombre}</option>)}
        </select>
        {usuario?.rol_id === 1 ? (
          <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm"
            value={equipo} onChange={(e) => setEquipo(e.target.value)}>
            <option value="">Todos los equipos</option>
            {equipos.map(e => <option key={e.equipo_id}>{e.equipo_nombre}</option>)}
          </select>
        ) : usuario?.rol_id === 2 && (
          <div className="border border-purple-300 bg-purple-50 text-purple-700 rounded-lg px-3 py-2 text-sm font-medium">
            📋 {ventas.find(v => v.equipo)?.equipo || 'Mi equipo'}
          </div>
        )}
      </div>

      <p className="text-xs text-gray-500 mb-3">{filtradas.length} resultado(s)</p>

      <div className="bg-white rounded-xl shadow overflow-hidden">
        <table className="w-full text-sm table-fixed">
          <thead className="bg-gray-50 text-gray-500 text-xs uppercase">
            <tr>
              <th className="px-4 py-3 text-left w-40">Titular</th>
              <th className="px-4 py-3 text-left w-28">DNI</th>
              <th className="px-4 py-3 text-left w-24">Campaña</th>
              <th className="px-4 py-3 text-left w-40">Tarifa</th>
              <th className="px-4 py-3 text-left w-36">Estado</th>
              <th className="px-4 py-3 text-left w-32">Asesor</th>
              <th className="px-4 py-3 text-left w-28">Equipo</th>
              <th className="px-4 py-3 text-left w-24">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <>
                <tr><td colSpan={8} className="px-4 py-8 text-center text-gray-400">No hay ventas registradas</td></tr>
                {Array.from({ length: POR_PAGINA - 1 }).map((_, i) => (
                  <tr key={`empty-${i}`} className="border-t border-gray-50"><td colSpan={8} className="h-10" /></tr>
                ))}
              </>
            ) : (
              <>
                {paginadas.map((v) => (
                  <tr key={v.venta_id} className="border-t border-gray-100 hover:bg-gray-50 cursor-pointer h-10" onClick={() => abrirModal(v)}>
                    <td className="px-4 py-2 font-medium text-gray-800 truncate">{v.titular}</td>
                    <td className="px-4 py-2 text-gray-500">{v.titular_dni}</td>
                    <td className="px-4 py-2 text-gray-500 truncate">{v.campana || '-'}</td>
                    <td className="px-4 py-2 text-gray-500 truncate">{v.tarifa || '-'}</td>
                    <td className="px-4 py-2">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${estadoColores[v.venta_estado] || 'bg-gray-100 text-gray-600'}`}>
                        {v.venta_estado}
                      </span>
                    </td>
                    <td className="px-4 py-2 text-gray-500 truncate">{v.asesor}</td>
                    <td className="px-4 py-2 text-gray-500 truncate">{v.equipo || '-'}</td>
                    <td className="px-4 py-2 text-gray-500">{new Date(v.venta_creado_en).toLocaleDateString()}</td>
                  </tr>
                ))}
                {Array.from({ length: filasVacias }).map((_, i) => (
                  <tr key={`pad-${i}`} className="border-t border-gray-50 h-10"><td colSpan={8} /></tr>
                ))}
              </>
            )}
          </tbody>
        </table>

        <div className="px-4 py-3 border-t flex items-center justify-between">
          <p className="text-xs text-gray-500">
            {filtradas.length > 0 ? `Página ${pagina} de ${totalPaginas} — mostrando ${inicio + 1} a ${Math.min(inicio + POR_PAGINA, filtradas.length)} de ${filtradas.length}` : '0 resultados'}
          </p>
          {totalPaginas > 1 && (
            <div className="flex items-center gap-1">
              <button onClick={() => setPagina(1)} disabled={pagina === 1} className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">«</button>
              <button onClick={() => setPagina(p => p - 1)} disabled={pagina === 1} className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">‹</button>
              {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                let p;
                if (totalPaginas <= 5) p = i + 1;
                else if (pagina <= 3) p = i + 1;
                else if (pagina >= totalPaginas - 2) p = totalPaginas - 4 + i;
                else p = pagina - 2 + i;
                return (
                  <button key={p} onClick={() => setPagina(p)}
                    className={`px-3 py-1 rounded text-xs border ${pagina === p ? 'bg-green-600 text-white border-green-600' : 'border-gray-300 hover:bg-gray-50'}`}>
                    {p}
                  </button>
                );
              })}
              <button onClick={() => setPagina(p => p + 1)} disabled={pagina === totalPaginas} className="px-3 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">›</button>
              <button onClick={() => setPagina(totalPaginas)} disabled={pagina === totalPaginas} className="px-2 py-1 rounded text-xs border border-gray-300 disabled:opacity-40 hover:bg-gray-50">»</button>
            </div>
          )}
        </div>
      </div>

      {seleccionada && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={cerrarModal} />
          <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-lg mx-4 p-6 z-10">
            <button onClick={cerrarModal} className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-xl font-bold">✕</button>
            {!editando && !confirmEliminar && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Detalle de Venta</h3>
                <div className="space-y-2 text-sm">
                  {[['Titular', seleccionada.titular],['DNI', seleccionada.titular_dni],['Campaña', seleccionada.campana||'-'],
                    ['Tarifa', seleccionada.tarifa||'-'],['Asesor', seleccionada.asesor],['Equipo', seleccionada.equipo||'-'],
                    ['Fecha', new Date(seleccionada.venta_creado_en).toLocaleDateString()]
                  ].map(([label, valor]) => (
                    <div key={label} className="flex justify-between border-b pb-1.5">
                      <span className="text-gray-500">{label}</span>
                      <span className="font-medium">{valor}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-b pb-1.5">
                    <span className="text-gray-500">Estado</span>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${estadoColores[seleccionada.venta_estado]||'bg-gray-100'}`}>{seleccionada.venta_estado}</span>
                  </div>
                  {seleccionada.venta_observacion && (
                    <div className="flex justify-between">
                      <span className="text-gray-500">Obs.</span>
                      <span className="font-medium text-right max-w-xs text-xs">{seleccionada.venta_observacion}</span>
                    </div>
                  )}
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setEditando(true)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Editar venta</button>
                  <button onClick={() => setConfirmEliminar(true)} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Eliminar venta</button>
                </div>
              </>
            )}
            {editando && (
              <>
                <h3 className="text-lg font-bold text-gray-800 mb-4">Editar Venta</h3>
                <div className="space-y-3">
                  <div><label className="text-xs text-gray-500">Estado</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formEditar.venta_estado} onChange={(e) => setFormEditar({...formEditar, venta_estado: e.target.value})}>
                      {estadosVenta.map(e => <option key={e}>{e}</option>)}
                    </select></div>
                  <div><label className="text-xs text-gray-500">Campaña</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formEditar.venta_campana_id} onChange={(e) => setFormEditar({...formEditar, venta_campana_id: e.target.value})}>
                      {campanas.map(c => <option key={c.campana_id} value={c.campana_id}>{c.campana_nombre}</option>)}
                    </select></div>
                  <div><label className="text-xs text-gray-500">Tarifa</label>
                    <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formEditar.venta_tarifa_id} onChange={(e) => setFormEditar({...formEditar, venta_tarifa_id: e.target.value})}>
                      {tarifas.map(t => <option key={t.tarifa_id} value={t.tarifa_id}>{t.tarifa_nombre}</option>)}
                    </select></div>
                  <div><label className="text-xs text-gray-500">Fecha</label>
                    <input type="date" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" value={formEditar.venta_fecha} onChange={(e) => setFormEditar({...formEditar, venta_fecha: e.target.value})} /></div>
                  <div><label className="text-xs text-gray-500">Observación</label>
                    <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={2} value={formEditar.venta_observacion} onChange={(e) => setFormEditar({...formEditar, venta_observacion: e.target.value})} /></div>
                </div>
                <div className="flex gap-3 mt-5">
                  <button onClick={() => setEditando(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                  <button onClick={handleEditar} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg text-sm font-medium">Guardar cambios</button>
                </div>
              </>
            )}
            {confirmEliminar && (
              <div className="text-center py-4">
                <div className="text-5xl mb-3">⚠️</div>
                <h3 className="text-lg font-bold text-gray-800 mb-2">¿Eliminar esta venta?</h3>
                <p className="text-sm text-gray-500 mb-5">{seleccionada.titular} será eliminado permanentemente.</p>
                <div className="flex gap-3">
                  <button onClick={() => setConfirmEliminar(false)} className="flex-1 border border-gray-300 text-gray-600 py-2 rounded-lg text-sm">Cancelar</button>
                  <button onClick={handleEliminar} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2 rounded-lg text-sm font-medium">Sí, eliminar</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </Layout>
  );
}