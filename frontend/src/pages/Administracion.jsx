import { useState } from 'react';
import Layout from '../components/Layout';
import Usuarios from './Usuarios';
import Campanas from './Campanas';
import Tarifas from './Tarifas';

const secciones = [
  { id: 'personal', label: 'Personal' },
  { id: 'campanas', label: 'Campañas' },
  { id: 'tarifas', label: 'Tarifas' },
];

export default function Administracion() {
  const [seccion, setSeccion] = useState('personal');

  return (
    <Layout>
      <h2 className="text-xl font-bold text-gray-800 mb-4">Administración</h2>

      <div className="flex gap-1 border-b border-gray-300 mb-6">
        {secciones.map(s => (
          <button key={s.id} onClick={() => setSeccion(s.id)}
            className={`px-5 py-2 text-sm font-medium -mb-px border-b-2 transition ${
              seccion === s.id
                ? 'border-green-600 text-green-700'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}>
            {s.label}
          </button>
        ))}
      </div>

      {seccion === 'personal' && <Usuarios />}
      {seccion === 'campanas' && <Campanas />}
      {seccion === 'tarifas' && <Tarifas />}
    </Layout>
  );
}
