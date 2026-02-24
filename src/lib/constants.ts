// Peru departments
export const PERU_DEPARTMENTS = [
  'Amazonas',
  'Ancash',
  'Apurimac',
  'Arequipa',
  'Ayacucho',
  'Cajamarca',
  'Callao',
  'Cusco',
  'Huancavelica',
  'Huanuco',
  'Ica',
  'Junin',
  'La Libertad',
  'Lambayeque',
  'Lima',
  'Loreto',
  'Madre de Dios',
  'Moquegua',
  'Pasco',
  'Piura',
  'Puno',
  'San Martin',
  'Tacna',
  'Tumbes',
  'Ucayali',
]

// Provinces per department
export const PERU_PROVINCES: Record<string, string[]> = {
  'Amazonas':     ['Chachapoyas', 'Bagua', 'Bongará', 'Condorcanqui', 'Luya', 'Rodríguez de Mendoza', 'Utcubamba'],
  'Ancash':       ['Huaraz', 'Aija', 'Antonio Raimondi', 'Asunción', 'Bolognesi', 'Carhuaz', 'Carlos Fermín Fitzcarrald', 'Casma', 'Corongo', 'Huari', 'Huarmey', 'Huaylas', 'Mariscal Luzuriaga', 'Ocros', 'Pallasca', 'Pomabamba', 'Recuay', 'Santa', 'Sihuas', 'Yungay'],
  'Apurimac':     ['Abancay', 'Andahuaylas', 'Antabamba', 'Aymaraes', 'Cotabambas', 'Chincheros', 'Grau'],
  'Arequipa':     ['Arequipa', 'Camaná', 'Caravelí', 'Castilla', 'Caylloma', 'Condesuyos', 'Islay', 'La Unión'],
  'Ayacucho':     ['Huamanga', 'Cangallo', 'Huanca Sancos', 'Huanta', 'La Mar', 'Lucanas', 'Parinacochas', 'Páucar del Sara Sara', 'Sucre', 'Víctor Fajardo', 'Vilcas Huamán'],
  'Cajamarca':    ['Cajamarca', 'Cajabamba', 'Celendín', 'Chota', 'Contumazá', 'Cutervo', 'Hualgayoc', 'Jaén', 'San Ignacio', 'San Marcos', 'San Miguel', 'San Pablo', 'Santa Cruz'],
  'Callao':       ['Callao'],
  'Cusco':        ['Cusco', 'Acomayo', 'Anta', 'Calca', 'Canas', 'Canchis', 'Chumbivilcas', 'Espinar', 'La Convención', 'Paruro', 'Paucartambo', 'Quispicanchi', 'Urubamba'],
  'Huancavelica': ['Huancavelica', 'Acobamba', 'Angaraes', 'Castrovirreyna', 'Churcampa', 'Huaytará', 'Tayacaja'],
  'Huanuco':      ['Huánuco', 'Ambo', 'Dos de Mayo', 'Huacaybamba', 'Huamalíes', 'Leoncio Prado', 'Marañón', 'Pachitea', 'Puerto Inca', 'Lauricocha', 'Yarowilca'],
  'Ica':          ['Ica', 'Chincha', 'Nasca', 'Palpa', 'Pisco'],
  'Junin':        ['Huancayo', 'Chanchamayo', 'Chupaca', 'Concepción', 'Jauja', 'Junín', 'Satipo', 'Tarma', 'Yauli'],
  'La Libertad':  ['Trujillo', 'Ascope', 'Bolívar', 'Chepén', 'Julcán', 'Otuzco', 'Pacasmayo', 'Pataz', 'Sánchez Carrión', 'Santiago de Chuco', 'Gran Chimú', 'Virú'],
  'Lambayeque':   ['Chiclayo', 'Ferreñafe', 'Lambayeque'],
  'Lima':         ['Lima', 'Barranca', 'Cajatambo', 'Canta', 'Cañete', 'Huaral', 'Huarochirí', 'Huaura', 'Oyón', 'Yauyos'],
  'Loreto':       ['Maynas', 'Alto Amazonas', 'Loreto', 'Mariscal Ramón Castilla', 'Requena', 'Ucayali', 'Datem del Marañón', 'Putumayo'],
  'Madre de Dios':['Tambopata', 'Manu', 'Tahuamanu'],
  'Moquegua':     ['Mariscal Nieto', 'General Sánchez Cerro', 'Ilo'],
  'Pasco':        ['Pasco', 'Daniel Alcides Carrión', 'Oxapampa'],
  'Piura':        ['Piura', 'Ayabaca', 'Huancabamba', 'Morropón', 'Paita', 'Sechura', 'Sullana', 'Talara'],
  'Puno':         ['Puno', 'Azángaro', 'Carabaya', 'Chucuito', 'El Collao', 'Huancané', 'Lampa', 'Melgar', 'Moho', 'San Antonio de Putina', 'San Román', 'Sandia', 'Yunguyo'],
  'San Martin':   ['Moyobamba', 'Bellavista', 'El Dorado', 'Huallaga', 'Lamas', 'Mariscal Cáceres', 'Picota', 'Rioja', 'San Martín', 'Tocache'],
  'Tacna':        ['Tacna', 'Candarave', 'Jorge Basadre', 'Tarata'],
  'Tumbes':       ['Tumbes', 'Contralmirante Villar', 'Zarumilla'],
  'Ucayali':      ['Coronel Portillo', 'Atalaya', 'Padre Abad', 'Purús'],
}

// Common shipping agencies in Peru
export const SHIPPING_AGENCIES = [
  'Olva Courier',
  'Shalom',
  'Marvisur',
  'Cruz del Sur Cargo',
  'Tepsa',
  'Movil Tours',
  'Flores',
  'Civa',
  'Otro',
]

// Order status colors for badges
export const ORDER_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  STOCK_RESERVED: 'bg-blue-100 text-blue-800',
  PARTIAL_PAYMENT: 'bg-orange-100 text-orange-800',
  PAID: 'bg-green-100 text-green-800',
  SHIPPED: 'bg-purple-100 text-purple-800',
  DELIVERED: 'bg-emerald-100 text-emerald-800',
  CANCELLED: 'bg-red-100 text-red-800',
}

// Shipping type colors
export const SHIPPING_TYPE_COLORS: Record<string, string> = {
  PROVINCIA: 'bg-indigo-100 text-indigo-800',
  DELIVERY_LIMA: 'bg-cyan-100 text-cyan-800',
  RECOJO_TIENDA: 'bg-gray-100 text-gray-800',
}

// Upload limits
export const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
export const ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

// Pagination
export const DEFAULT_PAGE_SIZE = 10
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100]
