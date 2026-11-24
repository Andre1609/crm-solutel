// Documentos de identidad: normalización y validación del dígito de control.
const LETRAS = 'TRWAGMYFPDXBNJZSQVHLCKE';

// Mayúsculas y sin espacios, guiones ni puntos
export const normalizarDocumento = (valor) =>
  (valor || '').toUpperCase().replace(/[\s.\-]/g, '');

const nifValido = (d) => /^\d{8}[A-Z]$/.test(d) && LETRAS[Number(d.slice(0, 8)) % 23] === d[8];

const nieValido = (d) => {
  if (!/^[XYZ]\d{7}[A-Z]$/.test(d)) return false;
  const numero = 'XYZ'.indexOf(d[0]) + d.slice(1, 8);
  return LETRAS[Number(numero) % 23] === d[8];
};

// Si el número está completo pero sin letra, le agrega la letra de control (NIF: 8 dígitos; NIE: X/Y/Z + 7 dígitos).
// El pasaporte no tiene dígito verificador, así que se devuelve igual.
export function completarLetraControl(tipo, valor) {
  const d = normalizarDocumento(valor);
  if (tipo === 'NIF' && /^\d{8}$/.test(d)) return d + LETRAS[Number(d) % 23];
  if (tipo === 'NIE' && /^[XYZ]\d{7}$/.test(d)) return d + LETRAS[Number('XYZ'.indexOf(d[0]) + d.slice(1)) % 23];
  return d;
}

// true / false cuando se puede validar; null si aún está incompleto o no aplica (pasaporte)
export function documentoValido(tipo, valor) {
  const d = normalizarDocumento(valor);
  if (tipo === 'NIF') return d.length < 9 ? null : nifValido(d);
  if (tipo === 'NIE') return d.length < 9 ? null : nieValido(d);
  return null;
}

export const TIPOS_DOCUMENTO = ['NIF', 'NIE', 'PASAPORTE'];
