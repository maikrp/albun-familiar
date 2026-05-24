export const familyMembers = [
  {
    id: 'carlos',
    name: 'Carlos Gonzalez',
    branch: 'Gonzalez',
    role: 'Abuelo fundador',
    years: '1940 - 2018',
    origin: 'Heredia',
    photo: 'https://i.pravatar.cc/300?img=12',
    story:
      'Trabajo la tierra, levanto un pequeno comercio familiar y dejo como herencia la costumbre de reunir a todos alrededor de una mesa grande.',
    parentId: null,
  },
  {
    id: 'elena',
    name: 'Elena Vargas',
    branch: 'Vargas',
    role: 'Abuela narradora',
    years: '1944 - 2021',
    origin: 'Cartago',
    photo: 'https://i.pravatar.cc/300?img=47',
    story:
      'Guardo cartas, recetas y fotografias durante decadas. Su memoria es el punto de partida del archivo familiar.',
    parentId: null,
  },
  {
    id: 'jose',
    name: 'Jose Gonzalez',
    branch: 'Gonzalez',
    role: 'Hijo mayor',
    years: '1965',
    origin: 'San Jose',
    photo: 'https://i.pravatar.cc/300?img=15',
    story:
      'Ingeniero civil. Fue quien empezo a escribir fechas al reverso de las fotos para que ninguna historia quedara suelta.',
    parentId: 'carlos',
  },
  {
    id: 'maria',
    name: 'Maria Gonzalez',
    branch: 'Gonzalez',
    role: 'Organizadora familiar',
    years: '1970',
    origin: 'Heredia',
    photo: 'https://i.pravatar.cc/300?img=45',
    story:
      'Profesora y anfitriona de reuniones. Sus cuadernos conservan recetas, dichos y listas de invitados de muchas celebraciones.',
    parentId: 'carlos',
  },
  {
    id: 'ana',
    name: 'Ana Gonzalez',
    branch: 'Mora',
    role: 'Fotografa familiar',
    years: '1995',
    origin: 'Alajuela',
    photo: 'https://i.pravatar.cc/300?img=20',
    story:
      'Disenadora grafica. Digitaliza retratos antiguos y prepara comparativas antes y despues para conservar los originales.',
    parentId: 'jose',
  },
  {
    id: 'luis',
    name: 'Luis Gonzalez',
    branch: 'Chaves',
    role: 'Archivo digital',
    years: '1998',
    origin: 'San Jose',
    photo: 'https://i.pravatar.cc/300?img=30',
    story:
      'Desarrollador web. Construye el sitio privado y organiza respaldos para que el album pueda crecer durante anos.',
    parentId: 'jose',
  },
];

export const branches = [
  {
    name: 'Rama Gonzalez',
    summary: 'Tronco principal, oficio agricultor, comercio y primeras reuniones documentadas.',
    cover: '/assets/hero-family-1911.jpg',
    count: 42,
  },
  {
    name: 'Rama Vargas',
    summary: 'Cartas antiguas, recetas familiares y fotografias conservadas por generaciones.',
    cover: '/assets/family-album-cover.jpg',
    count: 31,
  },
  {
    name: 'Rama Mora',
    summary: 'Graduaciones, matrimonios y migraciones recientes documentadas en video y audio.',
    cover: '/assets/four-generations.jpg',
    count: 26,
  },
  {
    name: 'Rama Chaves',
    summary: 'Album contemporaneo, entrevistas y testimonios de nuevas generaciones.',
    cover: '/assets/vintage-photographs.jpg',
    count: 18,
  },
];

export const timeline = [
  {
    year: '1920',
    title: 'Primer registro conocido',
    text: 'Aparecen los primeros nombres asociados al tronco familiar en documentos locales.',
  },
  {
    year: '1948',
    title: 'Mudanza a Heredia',
    text: 'La familia se traslada y empieza una nueva etapa de trabajo, estudio y comunidad.',
  },
  {
    year: '1965',
    title: 'Primer negocio familiar',
    text: 'Se abre un pequeno comercio que se convierte en punto de encuentro entre parientes.',
  },
  {
    year: '1982',
    title: 'Primera graduacion universitaria',
    text: 'Una generacion abre camino profesional y deja fotografias de celebracion.',
  },
  {
    year: '2001',
    title: 'Reunion familiar masiva',
    text: 'Se reune la familia extendida y se capturan retratos por ramas.',
  },
  {
    year: '2026',
    title: 'Archivo digital vivo',
    text: 'Nace Albun Familiar como sitio privado para preservar fotos, historias y documentos.',
  },
];

export const gallery = [
  {
    title: 'Boda familiar',
    year: '1954',
    branch: 'Gonzalez',
    image: '/assets/hero-family-1911.jpg',
  },
  {
    title: 'Retrato de generaciones',
    year: '1978',
    branch: 'Vargas',
    image: '/assets/four-generations.jpg',
  },
  {
    title: 'Reunion de primos',
    year: '2001',
    branch: 'Mora',
    image: '/assets/family-album-cover.jpg',
  },
  {
    title: 'Archivo restaurado',
    year: '2026',
    branch: 'Chaves',
    image: '/assets/vintage-photographs.jpg',
  },
];

export const archiveSteps = [
  'Recolectar nombres completos, apellidos y lugares de origen.',
  'Escanear fotografias en 600 DPI y separar originales de restauradas.',
  'Crear perfiles con fechas, relacion familiar, anecdotas y documentos.',
  'Organizar ramas familiares y validar datos con miembros mayores.',
  'Publicar album privado y mantener respaldos fisicos y digitales.',
];
