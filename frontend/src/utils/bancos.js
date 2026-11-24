// Código de entidad (4 dígitos, posiciones 5-8 del IBAN español) -> nombre del banco.
// Fuente: lista oficial de entidades del Banco de España (BOE, resolución del 4 de agosto de 2025).
// Si el código no está en la lista, el banco se escribe a mano.
// Para agregar otro banco, añade una línea: 'CÓDIGO': 'Nombre',
const BANCOS_ES = {
  // Bancos y entidades de crédito
  '0003': 'Banco de Depósitos',
  '0019': 'Deutsche Bank',
  '0030': 'Banco Santander (antiguo Banesto)',
  '0049': 'Banco Santander',
  '0061': 'Banca March',
  '0073': 'Openbank',
  '0075': 'Banco Santander (antiguo Banco Popular)',
  '0078': 'Banca Pueyo',
  '0081': 'Banco Sabadell',
  '0083': 'Renta 4 Banco',
  '0086': 'Banco Santander (antiguo Banif)',
  '0128': 'Bankinter',
  '0133': 'Nuevo Micro Bank',
  '0136': 'Aresbank',
  '0182': 'BBVA',
  '0184': 'Banco Europeo de Finanzas',
  '0186': 'Banco Mediolanum',
  '0188': 'Banco Alcalá',
  '0198': 'Banco Cooperativo Español',
  '0200': 'Andbank España',
  '0211': 'EBN Banco de Negocios',
  '0224': 'Santander Consumer Finance',
  '0225': 'Banco Cetelem',
  '0229': 'WiZink Bank',
  '0232': 'Banco Inversis',
  '0233': 'Banco Santander (antiguo Popular Banca Privada)',
  '0234': 'CBNK Banco de Colectivos',
  '0235': 'Banco Pichincha España',
  '0237': 'Cajasur Banco',
  '0238': 'Banco Santander (antiguo Banco Pastor)',
  '0239': 'EVO Banco (Bankinter)',
  '0240': 'Banco de Crédito Social Cooperativo',
  '0241': 'A&G Banco',
  '0244': 'Miralta Finance Bank',
  '1465': 'ING',
  '1490': 'Singular Bank',
  '1491': 'Triodos Bank',
  '1544': 'MyInvestor',
  '1550': 'Fiare Banca Ética',
  '1563': 'N26',
  '1576': 'bunq',
  '1578': 'Solaris',
  '1583': 'Revolut',
  '1586': 'Trade Republic',
  '2038': 'CaixaBank (antiguo Bankia)',
  '2045': 'Caixa Ontinyent',
  '2056': 'Colonya Caixa Pollença',
  '2080': 'Abanca',
  '2085': 'Ibercaja',
  '2095': 'Kutxabank',
  '2100': 'CaixaBank',
  '2103': 'Unicaja Banco',
  '3025': "Caixa d'Enginyers",
  '3035': 'Laboral Kutxa',
  '3058': 'Cajamar',
  '3183': 'Arquia Bank',

  // Cajas rurales
  '3001': 'Caja Rural de Almendralejo',
  '3005': 'Caja Rural Central',
  '3007': 'Caja Rural de Gijón',
  '3008': 'Caja Rural de Navarra',
  '3009': 'Caja Rural de Extremadura',
  '3016': 'Caja Rural de Salamanca',
  '3017': 'Caja Rural de Soria',
  '3018': 'Caja Rural Regional San Agustín',
  '3020': 'Caja Rural de Utrera',
  '3023': 'Caja Rural de Granada',
  '3029': 'Caja de Crédito de Petrel',
  '3045': 'Caixa Rural Altea',
  '3059': 'Caja Rural de Asturias',
  '3060': 'Caja Rural de Burgos, Fuentepelayo, Segovia y Castelldans',
  '3067': 'Caja Rural de Jaén, Barcelona y Madrid',
  '3070': 'Caixa Rural Galega',
  '3076': 'Cajasiete',
  '3080': 'Caja Rural de Teruel',
  '3081': 'Eurocaja Rural',
  '3085': 'Caja Rural de Zamora',
  '3089': 'Caja Rural de Baena',
  '3095': 'Caja Rural San Roque de Almenara',
  '3096': "Caixa Rural de L'Alcúdia",
  '3098': 'Caja Rural de Nueva Carteya',
  '3102': 'Caixa Rural Sant Vicent Ferrer de la Vall d\'Uixó',
  '3104': 'Caja Rural de Cañete de las Torres',
  '3105': "Caja Rural de Callosa d'en Sarrià",
  '3110': 'Caja Rural Católico Agraria',
  '3111': 'Caixa Rural La Vall San Isidro',
  '3112': 'Caja Rural San José de Burriana',
  '3113': 'Caja Rural San José de Alcora',
  '3115': 'Caja Rural Nuestra Madre del Sol',
  '3117': "Caixa Rural d'Algemesí",
  '3118': 'Caixa Rural Torrent',
  '3119': 'Caja Rural San Jaime de Alquerías Niño Perdido',
  '3121': 'Caja Rural de Cheste',
  '3123': 'Caixa Rural de Turís',
  '3127': 'Caja Rural de Casas Ibáñez',
  '3130': 'Caja Rural San José de Almassora',
  '3134': 'Caja Rural Nuestra Señora de la Esperanza de Onda',
  '3135': 'Caja Rural San José de Nules',
  '3138': 'Ruralnostra',
  '3140': 'Caja Rural de Guissona',
  '3144': 'Caja Rural de Villamalea',
  '3150': 'Caja Rural de Albal',
  '3152': 'Caja Rural de Villar',
  '3157': 'Caja Rural La Junquera de Chilches',
  '3159': 'Caixa Popular-Caixa Rural',
  '3160': 'Caixa Rural Sant Josep de Vilavella',
  '3162': 'Caixa Rural Benicarló',
  '3165': 'Caja Rural San Isidro de Vilafamés',
  '3166': 'Caixa Rural Les Coves',
  '3174': 'Caixa Rural Vinaròs',
  '3179': 'Caja Rural de Alginet',
  '3187': 'Caja Rural del Sur',
  '3190': 'Caja Rural de Albacete, Ciudad Real y Cuenca',
  '3191': 'Caja Rural de Aragón',
};

const limpiar = (iban) => (iban || '').replace(/\s+/g, '').toUpperCase();

// Devuelve el nombre del banco según el IBAN, o '' si no se reconoce.
export function bancoDesdeIban(iban) {
  const i = limpiar(iban);
  if (!i.startsWith('ES') || i.length < 8) return '';
  return BANCOS_ES[i.slice(4, 8)] || '';
}

// Valida un IBAN español completo (24 caracteres) con el dígito de control.
// Devuelve null mientras el IBAN está incompleto o no es español.
export function ibanEspanolValido(iban) {
  const i = limpiar(iban);
  if (!i.startsWith('ES') || i.length !== 24) return null;
  if (!/^ES\d{22}$/.test(i)) return false;
  const reordenado = i.slice(4) + i.slice(0, 4);
  let resto = 0;
  for (const c of reordenado) {
    const valor = c >= 'A' && c <= 'Z' ? String(c.charCodeAt(0) - 55) : c;
    for (const d of valor) resto = (resto * 10 + Number(d)) % 97;
  }
  return resto === 1;
}
