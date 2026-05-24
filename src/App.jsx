import React, { useEffect, useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MarkerType,
  MiniMap,
  Position,
  ReactFlow,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
  BookOpen,
  Camera,
  Clock3,
  Download,
  Eye,
  FolderArchive,
  GitBranch,
  Heart,
  Image,
  Lock,
  Plus,
  Save,
  Search,
  Shield,
  Sparkles,
  Trash2,
  TreePine,
  UserRound,
  X,
} from 'lucide-react';
import { archiveSteps, branches, familyMembers, gallery, timeline } from './data/familyData.js';
import {
  convertImageFileToWebp,
  sanitizeStorageSegment,
} from './lib/media.js';
import {
  familyMediaBucket,
  isSupabaseConfigured,
  supabase,
} from './lib/supabase.js';

const usersStorageKey = 'family-users';
const sessionStorageKey = 'family-session';
const customMembersStorageKey = 'family-custom-members-v2';
const customGalleryStorageKey = 'family-custom-gallery-v2';

const emptyMemberForm = {
  name: '',
  branch: '',
  role: '',
  nationalId: '',
  birthYear: '',
  deathYear: '',
  origin: '',
  parentId: '',
  relationship: '',
  photo: '',
  story: '',
};

const emptyPhotoForm = {
  title: '',
  year: '',
  branch: '',
  image: '',
};

const branchStyles = {
  Gonzalez: { color: '#315d8c', label: 'Rama paterna' },
  Vargas: { color: '#4e7c55', label: 'Rama materna' },
  Mora: { color: '#b9822f', label: 'Descendencia' },
  Chaves: { color: '#7d4f8f', label: 'Familia politica' },
  General: { color: '#7f6a54', label: 'General' },
};

function getBranchStyle(branch) {
  return branchStyles[branch] || branchStyles.General;
}

function getMemberGeneration(member, members, cache = new Map()) {
  if (cache.has(member.id)) {
    return cache.get(member.id);
  }

  if (!member.parentId) {
    cache.set(member.id, 0);
    return 0;
  }

  const parent = members.find((candidate) => candidate.id === member.parentId);
  const generation = parent ? getMemberGeneration(parent, members, cache) + 1 : 0;
  cache.set(member.id, generation);
  return generation;
}

function createFlowElements(members, filters, selectedMemberId) {
  const generationCache = new Map();
  const visibleMembers = members.filter((member) => {
    const generation = getMemberGeneration(member, members, generationCache);
    const haystack = `${member.name} ${member.nationalId || ''} ${member.branch} ${member.origin} ${member.role} ${member.relationship || ''}`.toLowerCase();
    const matchesSearch = haystack.includes(filters.query.toLowerCase());
    const matchesBranch = filters.branch === 'all' || member.branch === filters.branch;
    const matchesGeneration = filters.generation === 'all' || String(generation) === filters.generation;
    return matchesSearch && matchesBranch && matchesGeneration;
  });
  const visibleIds = new Set(visibleMembers.map((member) => member.id));
  const childrenByParent = visibleMembers.reduce((accumulator, member) => {
    if (!member.parentId || !visibleIds.has(member.parentId)) {
      return accumulator;
    }

    return {
      ...accumulator,
      [member.parentId]: [...(accumulator[member.parentId] || []), member],
    };
  }, {});
  const roots = visibleMembers.filter((member) => !member.parentId || !visibleIds.has(member.parentId));
  const positions = new Map();
  let nextLeaf = 0;

  function layoutMember(member, depth) {
    const children = childrenByParent[member.id] || [];
    const childXs = children.map((child) => layoutMember(child, depth + 1));
    const x = childXs.length > 0
      ? childXs.reduce((total, value) => total + value, 0) / childXs.length
      : nextLeaf++ * 250;
    positions.set(member.id, { x, y: depth * 310 });
    return x;
  }

  roots.forEach((root) => layoutMember(root, 0));
  const minX = Math.min(...Array.from(positions.values()).map((position) => position.x), 0);

  const nodes = visibleMembers.map((member) => {
    const branchStyle = getBranchStyle(member.branch);
    const position = positions.get(member.id) || { x: 0, y: 0 };
    return {
      id: member.id,
      sourcePosition: Position.Bottom,
      targetPosition: Position.Top,
      position: { x: position.x - minX, y: position.y },
      data: {
        label: (
          <div className="flow-member">
            <img src={member.photo} alt="" />
            <strong>{member.name}</strong>
            <span className="flow-role">{member.role}</span>
            <small>{member.years}</small>
          </div>
        ),
      },
      style: {
        borderColor: branchStyle.color,
        boxShadow: selectedMemberId === member.id
          ? `0 0 0 3px ${branchStyle.color}44, 0 14px 30px rgba(35, 32, 28, 0.16)`
          : '0 10px 24px rgba(35, 32, 28, 0.1)',
      },
    };
  });

  const edges = visibleMembers
    .filter((member) => member.parentId && visibleIds.has(member.parentId))
    .map((member) => ({
      id: `${member.parentId}-${member.id}`,
      source: member.parentId,
      target: member.id,
      type: 'smoothstep',
      animated: selectedMemberId === member.id,
      label: `↓ ${member.relationship || 'Descendiente'}`,
      labelBgPadding: [8, 4],
      labelBgBorderRadius: 6,
      labelBgStyle: { fill: '#fffaf2', fillOpacity: 0.92 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: getBranchStyle(member.branch).color,
      },
      style: { stroke: getBranchStyle(member.branch).color, strokeWidth: 5 },
    }));

  return { nodes, edges };
}

function Stat({ icon: Icon, label, value }) {
  return (
    <div className="stat">
      <Icon size={18} />
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function readStorageList(key) {
  const savedValue = localStorage.getItem(key);
  return savedValue ? JSON.parse(savedValue) : [];
}

function toProperName(value) {
  const lowerParticles = new Set(['de', 'del', 'la', 'las', 'los', 'y', 'e']);
  return value
    .trim()
    .toLocaleLowerCase('es')
    .replace(/\s+/g, ' ')
    .split(' ')
    .map((word, index) => {
      if (index > 0 && lowerParticles.has(word)) {
        return word;
      }

      return word
        .split('-')
        .map((part) => part.charAt(0).toLocaleUpperCase('es') + part.slice(1))
        .join('-');
    })
    .join(' ');
}

function normalizeMember(member) {
  return {
    ...member,
    name: toProperName(member.name || ''),
    branch: toProperName(member.branch || ''),
    role: toProperName(member.role || ''),
    nationalId: member.nationalId || '',
    relationship: toProperName(member.relationship || ''),
    origin: toProperName(member.origin || ''),
  };
}

function normalizePhoto(photo) {
  return {
    ...photo,
    title: toProperName(photo.title || ''),
    branch: toProperName(photo.branch || ''),
  };
}

function readNormalizedStorageList(key, normalizer) {
  const items = readStorageList(key);
  const normalizedItems = items.map(normalizer);
  if (JSON.stringify(items) !== JSON.stringify(normalizedItems)) {
    localStorage.setItem(key, JSON.stringify(normalizedItems));
  }
  return normalizedItems;
}

function publicStorageUrl(path) {
  if (!supabase) {
    return null;
  }

  const { data } = supabase.storage.from(familyMediaBucket).getPublicUrl(path);
  return data.publicUrl;
}

function parseCivilRegistryText(text) {
  if (!text) return null;
  
  const rawLines = text.split(/[\r\n]+/);
  const lines = [];
  rawLines.forEach((line) => {
    const segments = line.split(/\t|\s{3,}/).map((s) => s.trim()).filter(Boolean);
    lines.push(...segments);
  });

  const data = {
    cedula: '',
    nombre: '',
    padre: '',
    madre: '',
    fechaNacimiento: '',
    nacionalidad: '',
    edad: '',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    const extractValue = (currentLine, index) => {
      const match = currentLine.match(/[:]/);
      if (match) {
        const val = currentLine.slice(match.index + match[0].length).trim();
        if (val) return val;
      }
      if (index + 1 < lines.length) {
        const nextLine = lines[index + 1];
        const isKey = /c[eé]dula|nombre|hijo|nacionalidad|edad|marginal|conocido/i.test(nextLine);
        if (!isKey) {
          return nextLine;
        }
      }
      return '';
    };

    if (/c[eé]dula/i.test(line)) {
      data.cedula = extractValue(line, i);
    } else if (/nombre\s+completo/i.test(line)) {
      data.nombre = extractValue(line, i);
    } else if (/hijo\/a\s+de/i.test(line)) {
      data.padre = extractValue(line, i);
    } else if (/^y\s*:/i.test(line) || /^y\s+/i.test(line) || line.trim().toLowerCase() === 'y') {
      if (data.padre) {
        data.madre = extractValue(line, i);
      }
    } else if (/fecha\s+nacimiento/i.test(line)) {
      data.fechaNacimiento = extractValue(line, i);
    } else if (/nacionalidad/i.test(line)) {
      data.nacionalidad = extractValue(line, i);
    } else if (/edad/i.test(line)) {
      data.edad = extractValue(line, i);
    }
  }

  const cleanField = (val) => {
    if (!val) return '';
    const clipMatch = val.match(/\s*(c[eé]dula|nombre|hijo|nacionalidad|edad|marginal|conocido|fecha)/i);
    if (clipMatch) {
      return val.slice(0, clipMatch.index).trim();
    }
    return val.trim();
  };

  data.nombre = cleanField(data.nombre);
  data.cedula = cleanField(data.cedula);
  data.padre = cleanField(data.padre);
  data.madre = cleanField(data.madre);
  data.fechaNacimiento = cleanField(data.fechaNacimiento);
  data.nacionalidad = cleanField(data.nacionalidad);
  data.edad = cleanField(data.edad);

  if (!data.nombre) {
    const nameMatch = text.match(/Nombre\s+Completo\s*[:\t]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ \t]+)/i);
    if (nameMatch) data.nombre = nameMatch[1].trim();
  }
  if (!data.cedula) {
    const idMatch = text.match(/C[eé]dula\s*[:\t]?\s*([0-9\-]+)/i);
    if (idMatch) data.cedula = idMatch[1].trim();
  }
  if (!data.padre) {
    const fatherMatch = text.match(/Hijo\/a\s+de\s*[:\t]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ \t]+)/i);
    if (fatherMatch) data.padre = fatherMatch[1].trim();
  }
  if (!data.madre && data.padre) {
    const motherMatch = text.match(/Y\s*[:\t]?\s*([A-ZÁÉÍÓÚÑa-záéíóúñ \t]+)/i);
    if (motherMatch) data.madre = motherMatch[1].trim();
  }

  const sanitizeName = (name) => {
    if (!name) return '';
    return name.replace(/[0-9:]/g, '').replace(/\s+/g, ' ').trim();
  };

  data.nombre = sanitizeName(data.nombre);
  data.padre = sanitizeName(data.padre);
  data.madre = sanitizeName(data.madre);

  if (!data.nombre && !data.cedula) {
    return null;
  }

  return data;
}

export default function App() {
  const [query, setQuery] = useState('');
  const [customMembers, setCustomMembers] = useState([]);
  const [customGallery, setCustomGallery] = useState([]);
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm);
  const [fastPasteText, setFastPasteText] = useState('');
  const [parsedParents, setParsedParents] = useState({ father: '', mother: '' });
  const [adminMessage, setAdminMessage] = useState('');
  const [uploadStatus, setUploadStatus] = useState('');
  const [editingMemberId, setEditingMemberId] = useState(null);
  const [branchFilter, setBranchFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [session, setSession] = useState(null);
  const [authMode, setAuthMode] = useState('register');
  const [authMessage, setAuthMessage] = useState('');
  const [authForm, setAuthForm] = useState({
    name: '',
    email: '',
    password: '',
  });
  const allMembers = useMemo(() => [...familyMembers, ...customMembers], [customMembers]);
  const allGallery = useMemo(() => [...gallery, ...customGallery], [customGallery]);
  const [selectedMember, setSelectedMember] = useState(null);
  const generations = useMemo(() => {
    const cache = new Map();
    return [...new Set(allMembers.map((member) => getMemberGeneration(member, allMembers, cache)))]
      .sort((first, second) => first - second);
  }, [allMembers]);
  const branchOptions = useMemo(
    () => [...new Set(allMembers.map((member) => member.branch).filter(Boolean))].sort(),
    [allMembers],
  );
  const dynamicBranches = useMemo(() => {
    const seededBranches = branches;
    const seededNames = new Set(seededBranches.map((branch) => branch.name.replace('Rama ', '')));
    const createdBranches = branchOptions
      .filter((branch) => !seededNames.has(branch))
      .map((branch) => ({
        name: `Rama ${branch}`,
        summary: 'Rama creada desde el modulo administrativo. Agrega historias, fotos y contexto para documentarla.',
        cover: allGallery.find((item) => item.branch === branch)?.image || '/assets/family-album-cover.jpg',
        count: allGallery.filter((item) => item.branch === branch).length,
      }));
    return [...seededBranches, ...createdBranches];
  }, [allGallery, branchOptions]);
  const flowElements = useMemo(
    () => createFlowElements(
      allMembers,
      { branch: branchFilter, generation: generationFilter, query },
      selectedMember?.id,
    ),
    [allMembers, branchFilter, generationFilter, query, selectedMember?.id],
  );

  const filteredMembers = allMembers.filter((member) => {
    const text = `${member.name} ${member.nationalId || ''} ${member.branch} ${member.origin} ${member.role}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });
  const selectedChildren = selectedMember
    ? allMembers.filter((member) => member.parentId === selectedMember.id)
    : [];
  const selectedGeneration = selectedMember ? getMemberGeneration(selectedMember, allMembers) : 0;
  const relatedPhotos = selectedMember
    ? allGallery.filter((item) => item.branch === selectedMember.branch)
    : [];

  const isUnlocked = Boolean(session);
  const isAdmin = session?.isAdmin;

  const mapSupabaseUser = (user) => {
    if (!user) return null;
    return {
      id: user.id,
      name: user.user_metadata?.name || user.email.split('@')[0],
      email: user.email,
      isAdmin: user.user_metadata?.is_admin === true || user.user_metadata?.role === 'admin' || user.email === 'maikrp@gmail.com',
    };
  };

  // Recover active session on mount and set up listener
  useEffect(() => {
    if (!supabase) return;

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(mapSupabaseUser(session?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(mapSupabaseUser(session?.user));
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch family data from Supabase
  useEffect(() => {
    if (!session || !supabase) {
      setCustomMembers([]);
      setCustomGallery([]);
      return;
    }

    async function loadData() {
      try {
        // --- AUTO-MIGRATION LAYER FROM LOCALSTORAGE TO SUPABASE ---
        const localMembersRaw = localStorage.getItem('family-custom-members-v2');
        const localPhotosRaw = localStorage.getItem('family-custom-gallery-v2');

        const localMembers = localMembersRaw ? JSON.parse(localMembersRaw) : [];
        const localPhotos = localPhotosRaw ? JSON.parse(localPhotosRaw) : [];

        if (localMembers.length > 0 || localPhotos.length > 0) {
          console.log('Detectados datos locales. Iniciando migración a Supabase...');

          // Map local IDs to brand new UUIDs
          const idMap = {};
          localMembers.forEach((member) => {
            idMap[member.id] = crypto.randomUUID();
          });

          // Map and insert members
          const membersToInsert = localMembers.map((member) => ({
            id: idMap[member.id],
            nombre: member.name,
            rama_familiar: member.branch,
            rol: member.role || 'Miembro Familiar',
            cedula: member.nationalId || '',
            vinculo: member.relationship || '',
            periodo: member.years || '',
            fecha_nacimiento: member.birthYear || '',
            fecha_fallecimiento: member.deathYear || '',
            lugar_origen: member.origin || '',
            foto_principal: member.photo || '/assets/family-album-cover.jpg',
            biografia: member.story || 'Historia pendiente de documentar.',
            parent_id: member.parentId ? (idMap[member.parentId] || null) : null,
          }));

          if (membersToInsert.length > 0) {
            const { error: insertMembersError } = await supabase
              .from('familiares')
              .insert(membersToInsert);
            if (insertMembersError) throw insertMembersError;
          }

          // Map and insert photos
          const photosToInsert = localPhotos.map((photo) => ({
            titulo: photo.title,
            fecha_aproximada: photo.year || 'Sin fecha',
            rama_familiar: photo.branch || 'General',
            url: photo.image,
            mime_type: 'image/webp',
          }));

          if (photosToInsert.length > 0) {
            const { error: insertPhotosError } = await supabase
              .from('fotos')
              .insert(photosToInsert);
            if (insertPhotosError) throw insertPhotosError;
          }

          // Clear localStorage so we don't migrate multiple times
          localStorage.removeItem('family-custom-members-v2');
          localStorage.removeItem('family-custom-gallery-v2');
          console.log('Migración de datos locales a Supabase completada con éxito.');
        }
        // --- END MIGRATION ---

        const { data: dbFamiliares, error: familiaresError } = await supabase
          .from('familiares')
          .select('*');

        if (familiaresError) throw familiaresError;

        const mappedMembers = (dbFamiliares || []).map((dbMember) => ({
          id: dbMember.id,
          name: dbMember.nombre,
          branch: dbMember.rama_familiar,
          role: dbMember.rol || 'Miembro Familiar',
          nationalId: dbMember.cedula || '',
          relationship: dbMember.vinculo || '',
          years: dbMember.periodo || '',
          birthYear: dbMember.fecha_nacimiento || '',
          deathYear: dbMember.fecha_fallecimiento || '',
          origin: dbMember.lugar_origen || '',
          photo: dbMember.foto_principal || '/assets/family-album-cover.jpg',
          story: dbMember.biografia || 'Historia pendiente de documentar.',
          parentId: dbMember.parent_id || null,
          custom: true,
        }));

        setCustomMembers(mappedMembers);

        const { data: dbFotos, error: fotosError } = await supabase
          .from('fotos')
          .select('*');

        if (fotosError) throw fotosError;

        const mappedPhotos = (dbFotos || []).map((dbPhoto) => ({
          id: dbPhoto.id,
          title: dbPhoto.titulo,
          year: dbPhoto.fecha_aproximada || 'Sin fecha',
          branch: dbPhoto.rama_familiar || 'General',
          image: dbPhoto.url,
          custom: true,
        }));

        setCustomGallery(mappedPhotos);
      } catch (error) {
        console.error('Error cargando datos de Supabase:', error);
      }
    }

    loadData();
  }, [session]);

  async function handleAuth(event) {
    event.preventDefault();
    setAuthMessage('');

    const name = authForm.name.trim();
    const email = authForm.email.trim().toLowerCase();
    const formPassword = authForm.password.trim();

    if (!email || !formPassword || (authMode === 'register' && !name)) {
      setAuthMessage('Completa los campos para continuar.');
      return;
    }

    if (!supabase) {
      setAuthMessage('Supabase no esta configurado.');
      return;
    }

    setAuthMessage(authMode === 'register' ? 'Registrando...' : 'Iniciando sesion...');

    try {
      if (authMode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email,
          password: formPassword,
          options: {
            data: { name },
          },
        });

        if (error) {
          setAuthMessage(`Error al registrarse: ${error.message}`);
          return;
        }

        if (data.session) {
          setSession(mapSupabaseUser(data.user));
          setAuthMessage('');
        } else {
          setAuthMessage('Registro exitoso. Si tienes activada la confirmación por email en Supabase, debes verificar tu bandeja antes de iniciar sesión.');
          setAuthMode('login');
        }
        return;
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password: formPassword,
      });

      if (error) {
        if (error.message.toLowerCase().includes('confirm') || error.message.toLowerCase().includes('verified')) {
          setAuthMessage('Error: Correo electrónico no confirmado. Revisa tu bandeja de entrada o desactiva "Confirm Email" en el panel de Supabase Auth.');
        } else if (error.message.toLowerCase().includes('invalid')) {
          setAuthMessage('Error: Credenciales incorrectas. Verifica tu correo y contraseña.');
        } else {
          setAuthMessage(`Error: ${error.message}`);
        }
        return;
      }

      if (data.user) {
        setSession(mapSupabaseUser(data.user));
        setAuthMessage('');
      }
    } catch (err) {
      setAuthMessage(`Error inesperado: ${err.message}`);
    }
  }

  async function handleLogout() {
    if (supabase) {
      await supabase.auth.signOut();
    }
    setSession(null);
  }

  function updateAuthForm(field, value) {
    setAuthForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updateMemberForm(field, value) {
    setMemberForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function updatePhotoForm(field, value) {
    setPhotoForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFastPaste(text) {
    setFastPasteText(text);
    if (!text.trim()) {
      setParsedParents({ father: '', mother: '' });
      return;
    }

    const parsed = parseCivilRegistryText(text);
    if (!parsed) {
      return;
    }

    const birthYearExtracted = parsed.fechaNacimiento?.includes('/')
      ? parsed.fechaNacimiento.split('/').pop().trim()
      : '';

    setMemberForm((current) => ({
      ...current,
      name: toProperName(parsed.nombre),
      nationalId: parsed.cedula.trim(),
      birthYear: birthYearExtracted,
      origin: parsed.nacionalidad.toLowerCase().includes('costarricense') ? 'Costa Rica' : toProperName(parsed.nacionalidad),
      story: `Ficha registrada desde el Registro Civil. Edad: ${toProperName(parsed.edad)}.`,
    }));

    setParsedParents({
      father: toProperName(parsed.padre),
      mother: toProperName(parsed.madre),
    });

    setAdminMessage(`✓ Ficha parseada: ${toProperName(parsed.nombre)} (Cédula: ${parsed.cedula}). Padres detectados: ${toProperName(parsed.padre)} y ${toProperName(parsed.madre)}.`);
  }

  async function uploadWebpToSupabase(file, folder) {
    if (!supabase) {
      throw new Error('Supabase no esta configurado en variables de entorno.');
    }

    const converted = await convertImageFileToWebp(file);
    const timestamp = Date.now();
    const path = `${sanitizeStorageSegment(folder)}/${timestamp}-${converted.file.name}`;
    const { error } = await supabase.storage
      .from(familyMediaBucket)
      .upload(path, converted.file, {
        cacheControl: '31536000',
        contentType: 'image/webp',
        upsert: false,
      });

    if (error) {
      throw error;
    }

    return {
      url: publicStorageUrl(path),
      path,
      ...converted,
    };
  }

  async function handleImageFile(file, callback, folder) {
    if (!file) {
      return;
    }

    if (!supabase) {
      setUploadStatus('Error: Supabase no está configurado. Carga en la nube requerida.');
      return;
    }

    setUploadStatus('Convirtiendo imagen a WebP y subiendo a Supabase Storage...');
    try {
      const uploaded = await uploadWebpToSupabase(file, folder);
      callback(uploaded.url);
      setUploadStatus(`Imagen WebP subida exitosamente a Supabase Storage (${Math.round(uploaded.webpBytes / 1024)} KB).`);
    } catch (error) {
      setUploadStatus(`Error al subir a Supabase: ${error.message || 'No se pudo procesar la imagen.'}`);
    }
  }

  async function submitMember(event) {
    event.preventDefault();
    setAdminMessage('');

    const normalizedName = toProperName(memberForm.name);
    const normalizedBranch = toProperName(memberForm.branch);
    const normalizedRole = toProperName(memberForm.role);
    const normalizedOrigin = toProperName(memberForm.origin);
    const normalizedRelationship = toProperName(memberForm.relationship);

    if (!normalizedName || !normalizedBranch) {
      setAdminMessage('Agrega al menos nombre y rama familiar.');
      return;
    }

    const years = memberForm.deathYear.trim()
      ? `${memberForm.birthYear.trim() || 'Sin fecha'} - ${memberForm.deathYear.trim()}`
      : memberForm.birthYear.trim() || 'Sin fecha';

    if (!supabase) {
      setAdminMessage('Supabase no esta configurado.');
      return;
    }

    setAdminMessage('Guardando...');

    try {
      let fatherId = null;
      let motherId = null;
      const newParentsToAppend = [];

      // 1. Father resolution
      if (parsedParents.father) {
        const existingFather = allMembers.find(
          (m) => m.name.toLowerCase() === parsedParents.father.toLowerCase()
        );
        if (existingFather) {
          fatherId = existingFather.id;
        } else {
          setAdminMessage(`Creando registro para el padre: ${parsedParents.father}...`);
          const { data: fData, error: fErr } = await supabase
            .from('familiares')
            .insert({
              nombre: parsedParents.father,
              rama_familiar: normalizedBranch,
              rol: 'Padre',
              vinculo: 'Padre',
              foto_principal: '/assets/family-album-cover.jpg',
              biografia: `Padre de ${normalizedName}.`,
            })
            .select()
            .single();

          if (fErr) throw fErr;
          fatherId = fData.id;

          const newFatherMember = {
            id: fData.id,
            name: fData.nombre,
            branch: fData.rama_familiar,
            role: fData.rol,
            nationalId: fData.cedula || '',
            relationship: fData.vinculo || '',
            years: fData.periodo || '',
            birthYear: fData.fecha_nacimiento || '',
            deathYear: fData.fecha_fallecimiento || '',
            origin: fData.lugar_origen || '',
            photo: fData.foto_principal,
            story: fData.biografia,
            parentId: fData.parent_id,
            custom: true,
          };
          newParentsToAppend.push(newFatherMember);
        }
      }

      // 2. Mother resolution
      if (parsedParents.mother) {
        const existingMother = allMembers.find(
          (m) => m.name.toLowerCase() === parsedParents.mother.toLowerCase()
        );
        if (existingMother) {
          motherId = existingMother.id;
        } else {
          setAdminMessage(`Creando registro para la madre: ${parsedParents.mother}...`);
          const { data: mData, error: mErr } = await supabase
            .from('familiares')
            .insert({
              nombre: parsedParents.mother,
              rama_familiar: normalizedBranch,
              rol: 'Madre',
              vinculo: 'Madre',
              foto_principal: '/assets/family-album-cover.jpg',
              biografia: `Madre de ${normalizedName}.`,
            })
            .select()
            .single();

          if (mErr) throw mErr;
          motherId = mData.id;

          const newMotherMember = {
            id: mData.id,
            name: mData.nombre,
            branch: mData.rama_familiar,
            role: mData.rol,
            nationalId: mData.cedula || '',
            relationship: mData.vinculo || '',
            years: mData.periodo || '',
            birthYear: mData.fecha_nacimiento || '',
            deathYear: mData.fecha_fallecimiento || '',
            origin: mData.lugar_origen || '',
            photo: mData.foto_principal,
            story: mData.biografia,
            parentId: mData.parent_id,
            custom: true,
          };
          newParentsToAppend.push(newMotherMember);
        }
      }

      const dbPayload = {
        nombre: normalizedName,
        rama_familiar: normalizedBranch,
        rol: normalizedRole || 'Miembro Familiar',
        cedula: memberForm.nationalId.trim(),
        vinculo: memberForm.parentId ? normalizedRelationship || 'Descendiente' : 'Persona Inicial',
        periodo: years,
        fecha_nacimiento: memberForm.birthYear.trim(),
        fecha_fallecimiento: memberForm.deathYear.trim(),
        lugar_origen: normalizedOrigin || 'Por Documentar',
        foto_principal: memberForm.photo.trim() || '/assets/family-album-cover.jpg',
        biografia: memberForm.story.trim() || 'Historia pendiente de documentar.',
        parent_id: memberForm.parentId || fatherId || motherId || null,
        padre_id: fatherId || null,
        madre_id: motherId || null,
      };

      if (editingMemberId) {
        const { data, error } = await supabase
          .from('familiares')
          .update(dbPayload)
          .eq('id', editingMemberId)
          .select()
          .single();

        if (error) throw error;

        const updatedMember = {
          id: data.id,
          name: data.nombre,
          branch: data.rama_familiar,
          role: data.rol,
          nationalId: data.cedula,
          relationship: data.vinculo,
          years: data.periodo,
          birthYear: data.fecha_nacimiento,
          deathYear: data.fecha_fallecimiento,
          origin: data.lugar_origen,
          photo: data.foto_principal,
          story: data.biografia,
          parentId: data.parent_id,
          custom: true,
        };

        const nextMembers = customMembers.map((m) => (m.id === editingMemberId ? updatedMember : m));
        setCustomMembers([...nextMembers, ...newParentsToAppend]);
        setSelectedMember(updatedMember);
        setAdminMessage(newParentsToAppend.length > 0 
          ? `Persona actualizada. Se agregaron y vincularon ${newParentsToAppend.length} padres.`
          : 'Persona actualizada correctamente.'
        );
      } else {
        const { data, error } = await supabase
          .from('familiares')
          .insert(dbPayload)
          .select()
          .single();

        if (error) throw error;

        const newMember = {
          id: data.id,
          name: data.nombre,
          branch: data.rama_familiar,
          role: data.rol,
          nationalId: data.cedula,
          relationship: data.vinculo,
          years: data.periodo,
          birthYear: data.fecha_nacimiento,
          deathYear: data.fecha_fallecimiento,
          origin: data.lugar_origen,
          photo: data.foto_principal,
          story: data.biografia,
          parentId: data.parent_id,
          custom: true,
        };

        setCustomMembers([...customMembers, ...newParentsToAppend, newMember]);
        setSelectedMember(newMember);
        setAdminMessage(newParentsToAppend.length > 0
          ? `✓ Persona agregada exitosamente y vinculada con sus ${newParentsToAppend.length} padres en Supabase.`
          : 'Persona agregada al arbol familiar.'
        );
      }

      setMemberForm(emptyMemberForm);
      setFastPasteText('');
      setParsedParents({ father: '', mother: '' });
      setEditingMemberId(null);
    } catch (error) {
      console.error(error);
      setAdminMessage(`Error al guardar: ${error.message}`);
    }
  }

  function editCustomMember(member) {
    setEditingMemberId(member.id);
    setMemberForm({
      name: member.name || '',
      branch: member.branch || '',
      role: member.role || '',
      nationalId: member.nationalId || '',
      birthYear: member.birthYear || '',
      deathYear: member.deathYear || '',
      origin: member.origin || '',
      parentId: member.parentId || '',
      relationship: member.relationship || '',
      photo: member.photo || '',
      story: member.story || '',
    });
    setAdminMessage(`Editando a ${member.name}.`);
  }

  function cancelMemberEdit() {
    setEditingMemberId(null);
    setMemberForm(emptyMemberForm);
    setAdminMessage('');
  }

  async function addPhoto(event) {
    event.preventDefault();
    setAdminMessage('');

    const normalizedTitle = toProperName(photoForm.title);
    const normalizedBranch = toProperName(photoForm.branch);

    if (!normalizedTitle || !photoForm.image.trim()) {
      setAdminMessage('Agrega titulo y una imagen para guardar la foto.');
      return;
    }

    if (!supabase) {
      setAdminMessage('Supabase no esta configurado.');
      return;
    }

    const dbPayload = {
      titulo: normalizedTitle,
      fecha_aproximada: photoForm.year.trim() || 'Sin fecha',
      rama_familiar: normalizedBranch || 'General',
      url: photoForm.image.trim(),
      mime_type: 'image/webp',
    };

    setAdminMessage('Guardando imagen...');
    try {
      const { data, error } = await supabase
        .from('fotos')
        .insert(dbPayload)
        .select()
        .single();

      if (error) throw error;

      const newPhoto = {
        id: data.id,
        title: data.titulo,
        year: data.fecha_aproximada || 'Sin fecha',
        branch: data.rama_familiar || 'General',
        image: data.url,
        custom: true,
      };

      setCustomGallery([...customGallery, newPhoto]);
      setPhotoForm(emptyPhotoForm);
      setAdminMessage('Imagen agregada a la galeria familiar.');
    } catch (error) {
      console.error(error);
      setAdminMessage(`Error al guardar imagen: ${error.message}`);
    }
  }

  async function deleteCustomMember(memberId) {
    if (!supabase) return;

    setAdminMessage('Eliminando...');
    try {
      const { error } = await supabase
        .from('familiares')
        .delete()
        .eq('id', memberId);

      if (error) throw error;

      const nextMembers = customMembers.filter((member) => member.id !== memberId);
      setCustomMembers(nextMembers);
      if (selectedMember?.id === memberId) {
        setSelectedMember(nextMembers[0] || null);
      }
      setAdminMessage('Persona eliminada correctamente.');
    } catch (error) {
      console.error(error);
      setAdminMessage(`Error al eliminar: ${error.message}`);
    }
  }

  async function deleteCustomPhoto(photoId) {
    if (!supabase) return;

    setAdminMessage('Eliminando imagen...');
    try {
      const { error } = await supabase
        .from('fotos')
        .delete()
        .eq('id', photoId);

      if (error) throw error;

      const nextGallery = customGallery.filter((item) => item.id !== photoId);
      setCustomGallery(nextGallery);
      setAdminMessage('Imagen eliminada correctamente.');
    } catch (error) {
      console.error(error);
      setAdminMessage(`Error al eliminar imagen: ${error.message}`);
    }
  }

  if (!isUnlocked) {
    return (
      <main className="lock-screen">
        <section className="lock-panel">
          <div className="brand-mark">
            <TreePine />
          </div>
          <p>Archivo privado familiar</p>
          <h1>Albun Familiar</h1>
          <div className="auth-tabs" role="tablist" aria-label="Acceso familiar">
            <button
              className={authMode === 'register' ? 'active' : ''}
              onClick={() => {
                setAuthMode('register');
                setAuthMessage('');
              }}
              type="button"
            >
              Crear cuenta
            </button>
            <button
              className={authMode === 'login' ? 'active' : ''}
              onClick={() => {
                setAuthMode('login');
                setAuthMessage('');
              }}
              type="button"
            >
              Iniciar sesion
            </button>
          </div>
          <form onSubmit={handleAuth}>
            {authMode === 'register' && (
              <>
                <label htmlFor="family-name">Nombre familiar</label>
                <div className="password-row">
                  <UserRound size={18} />
                  <input
                    id="family-name"
                    type="text"
                    value={authForm.name}
                    onChange={(event) => updateAuthForm('name', event.target.value)}
                    placeholder="Ej. Maria Gonzalez"
                  />
                </div>
              </>
            )}
            <label htmlFor="family-email">Correo</label>
            <div className="password-row">
              <UserRound size={18} />
              <input
                id="family-email"
                type="email"
                value={authForm.email}
                onChange={(event) => updateAuthForm('email', event.target.value)}
                placeholder="familia@ejemplo.com"
              />
            </div>
            <label htmlFor="family-password">Clave</label>
            <div className="password-row">
              <Lock size={18} />
              <input
                id="family-password"
                type="password"
                value={authForm.password}
                onChange={(event) => updateAuthForm('password', event.target.value)}
                placeholder="Crea una clave privada"
              />
            </div>
            {authMessage && <strong className="auth-message">{authMessage}</strong>}
            <button type="submit">
              <Shield size={18} />
              {authMode === 'register' ? 'Crear y entrar' : 'Entrar al album'}
            </button>
          </form>
        </section>
      </main>
    );
  }

  if (window.location.pathname === '/admin') {
    if (!isAdmin) {
      return (
        <main className="lock-screen access-denied">
          <section className="lock-panel" style={{ maxWidth: '420px', textAlign: 'center' }}>
            <div className="brand-mark alert-mark" style={{ borderColor: '#ea580c', color: '#ea580c', margin: '0 auto 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '64px', height: '64px', borderRadius: '50%', border: '2px solid' }}>
              <Shield size={32} />
            </div>
            <p style={{ color: '#ea580c', fontWeight: 'bold', textTransform: 'uppercase', tracking: '0.05em', fontSize: '0.85rem' }}>Acceso Restringido</p>
            <h1 style={{ fontSize: '1.8rem', margin: '0.5rem 0 1rem', fontFamily: 'Inter, sans-serif' }}>Solo Administradores</h1>
            <p style={{ opacity: 0.8, fontSize: '0.9rem', marginBottom: '2rem', lineHeight: '1.5' }}>
              Tu cuenta ({session?.email}) no cuenta con privilegios de administrador para gestionar este archivo familiar.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', width: '100%' }}>
              <a className="primary-link" href="/" style={{ justifyContent: 'center', width: '100%', textAlign: 'center', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <BookOpen size={18} />
                Regresar al Álbum
              </a>
              <button 
                onClick={handleLogout} 
                style={{ 
                  backgroundColor: 'rgba(234, 88, 12, 0.1)', 
                  color: '#ea580c', 
                  border: '1px solid rgba(234, 88, 12, 0.2)',
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </section>
        </main>
      );
    }

    return (
      <main className="admin-page">
        <header className="admin-header">
          <div>
            <p className="eyebrow">Panel privado</p>
            <h1>Administracion familiar</h1>
            <p>Gestiona personas, fotografias y datos base sin mezclar formularios dentro del album.</p>
          </div>
          <a className="secondary-link" href="/">
            <BookOpen size={18} />
            Ver album
          </a>
        </header>

        <section className="dashboard-band">
          <div className="dashboard">
            <Stat icon={UserRound} label="Personas" value={allMembers.length} />
            <Stat icon={GitBranch} label="Ramas" value={dynamicBranches.length} />
            <Stat icon={Camera} label="Fotos" value={allGallery.length} />
            <Stat icon={Shield} label="Supabase" value={isSupabaseConfigured ? 'Listo' : 'Pendiente'} />
          </div>
        </section>

        <section className="admin-section">
          <div className="section-heading">
            <p className="eyebrow">Carga de archivo</p>
            <h2>Personas e imagenes</h2>
          </div>
          <div className="admin-grid">
            <form className="admin-panel" onSubmit={submitMember}>
              <div className="panel-title">
                <UserRound size={20} />
                <h3>{editingMemberId ? 'Editar persona' : 'Nueva persona'}</h3>
              </div>

              <div className="fast-paste-container" style={{ marginBottom: '1.5rem', padding: '1rem', backgroundColor: 'rgba(234, 88, 12, 0.05)', borderRadius: '8px', border: '1px dashed rgba(234, 88, 12, 0.25)', width: '100%', boxSizing: 'border-box' }}>
                <label htmlFor="fast-paste" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 'bold', color: '#ea580c', marginBottom: '0.5rem', fontSize: '0.9rem' }}>
                  <Sparkles size={16} />
                  Pegado Rápido (Ficha Registro Civil)
                </label>
                <textarea
                  id="fast-paste"
                  value={fastPasteText}
                  onChange={(event) => handleFastPaste(event.target.value)}
                  placeholder="Copia la ficha completa de la consulta TSE y pégala aquí. El sistema auto-rellenará los campos y creará al padre y madre al guardar..."
                  style={{ width: '100%', height: '80px', fontSize: '0.85rem', padding: '0.5rem', borderRadius: '6px', border: '1px solid rgba(234, 88, 12, 0.2)', backgroundColor: '#fffaf2', resize: 'vertical', boxSizing: 'border-box', fontFamily: 'inherit' }}
                />
                {parsedParents.father && (
                  <div style={{ marginTop: '0.6rem', fontSize: '0.8rem', fontWeight: '500', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    <span style={{ backgroundColor: 'rgba(49, 93, 140, 0.08)', color: '#315d8c', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(49, 93, 140, 0.15)' }}>👨‍👦 Padre: {parsedParents.father}</span>
                    <span style={{ backgroundColor: 'rgba(78, 124, 85, 0.08)', color: '#4e7c55', padding: '0.2rem 0.6rem', borderRadius: '4px', border: '1px solid rgba(78, 124, 85, 0.15)' }}>👩‍👦 Madre: {parsedParents.mother}</span>
                  </div>
                )}
              </div>
              <label htmlFor="member-name">Nombre completo</label>
              <input
                id="member-name"
                value={memberForm.name}
                onChange={(event) => updateMemberForm('name', event.target.value)}
                onBlur={(event) => updateMemberForm('name', toProperName(event.target.value))}
                placeholder="Ej. Jose Gonzalez Vargas"
              />
              <div className="form-row">
                <div>
                  <label htmlFor="member-branch">Rama</label>
                  <input
                    id="member-branch"
                    value={memberForm.branch}
                    onChange={(event) => updateMemberForm('branch', event.target.value)}
                    onBlur={(event) => updateMemberForm('branch', toProperName(event.target.value))}
                    placeholder="Gonzalez"
                  />
                </div>
                <div>
                  <label htmlFor="member-role">Relacion o rol</label>
                  <input
                    id="member-role"
                    value={memberForm.role}
                    onChange={(event) => updateMemberForm('role', event.target.value)}
                    onBlur={(event) => updateMemberForm('role', toProperName(event.target.value))}
                    placeholder="Abuela, hijo, nieta"
                  />
                </div>
              </div>
              <label htmlFor="member-national-id">Numero de cedula</label>
              <input
                id="member-national-id"
                value={memberForm.nationalId}
                onChange={(event) => updateMemberForm('nationalId', event.target.value)}
                placeholder="Ej. 1-0234-0567"
              />
              <div className="form-row">
                <div>
                  <label htmlFor="member-birth">Nacimiento</label>
                  <input
                    id="member-birth"
                    value={memberForm.birthYear}
                    onChange={(event) => updateMemberForm('birthYear', event.target.value)}
                    placeholder="1940"
                  />
                </div>
                <div>
                  <label htmlFor="member-death">Fallecimiento</label>
                  <input
                    id="member-death"
                    value={memberForm.deathYear}
                    onChange={(event) => updateMemberForm('deathYear', event.target.value)}
                    placeholder="Opcional"
                  />
                </div>
              </div>
              <label htmlFor="member-origin">Lugar de origen</label>
              <input
                id="member-origin"
                value={memberForm.origin}
                onChange={(event) => updateMemberForm('origin', event.target.value)}
                onBlur={(event) => updateMemberForm('origin', toProperName(event.target.value))}
                placeholder="Ciudad, departamento o pais"
              />
              <label htmlFor="member-parent">Conectar debajo de</label>
              <select
                id="member-parent"
                value={memberForm.parentId}
                onChange={(event) => updateMemberForm('parentId', event.target.value)}
              >
                <option value="">Persona inicial del arbol</option>
                {allMembers.map((member) => (
                  <option key={member.id} value={member.id}>
                    {member.name}
                  </option>
                ))}
              </select>
              <label htmlFor="member-relationship">Vinculo con la persona seleccionada</label>
              <select
                id="member-relationship"
                value={memberForm.relationship}
                onChange={(event) => updateMemberForm('relationship', event.target.value)}
              >
                <option value="">Seleccionar vinculo</option>
                <option value="Hija">Hija</option>
                <option value="Hijo">Hijo</option>
                <option value="Madre">Madre</option>
                <option value="Padre">Padre</option>
                <option value="Pareja">Pareja</option>
                <option value="Hermana">Hermana</option>
                <option value="Hermano">Hermano</option>
                <option value="Nieta">Nieta</option>
                <option value="Nieto">Nieto</option>
                <option value="Sobrina">Sobrina</option>
                <option value="Sobrino">Sobrino</option>
                <option value="Tia">Tia</option>
                <option value="Tio">Tio</option>
                <option value="Prima">Prima</option>
                <option value="Primo">Primo</option>
                <option value="Otro">Otro</option>
              </select>
              <p className="field-help">
                Para que el arbol dibuje bien las lineas, conecta hijos con su padre o madre directo. Usa nieta,
                sobrina o prima como descripcion cuando aun no tengas cargada la generacion intermedia.
              </p>
              <label htmlFor="member-photo-url">URL de fotografia</label>
              <input
                id="member-photo-url"
                value={memberForm.photo}
                onChange={(event) => updateMemberForm('photo', event.target.value)}
                placeholder="https://..."
              />
              <label htmlFor="member-photo-file">O cargar fotografia</label>
              <input
                id="member-photo-file"
                accept="image/*"
                type="file"
                onChange={(event) => handleImageFile(
                  event.target.files?.[0],
                  (value) => updateMemberForm('photo', value),
                  `personas/${memberForm.branch || 'general'}`,
                )}
              />
              <label htmlFor="member-story">Historia o anecdota</label>
              <textarea
                id="member-story"
                value={memberForm.story}
                onChange={(event) => updateMemberForm('story', event.target.value)}
                placeholder="Escribe una historia corta, oficio, recuerdo o contexto familiar."
              />
              <button type="submit">
                {editingMemberId ? <Save size={18} /> : <Plus size={18} />}
                {editingMemberId ? 'Guardar cambios' : 'Agregar persona'}
              </button>
              {editingMemberId && (
                <button className="secondary-admin-action" onClick={cancelMemberEdit} type="button">
                  <X size={18} />
                  Cancelar edicion
                </button>
              )}
            </form>

            <form className="admin-panel" onSubmit={addPhoto}>
              <div className="panel-title">
                <Image size={20} />
                <h3>Nueva imagen</h3>
              </div>
              <label htmlFor="photo-title">Titulo</label>
              <input
                id="photo-title"
                value={photoForm.title}
                onChange={(event) => updatePhotoForm('title', event.target.value)}
                onBlur={(event) => updatePhotoForm('title', toProperName(event.target.value))}
                placeholder="Boda familiar, graduacion, reunion"
              />
              <div className="form-row">
                <div>
                  <label htmlFor="photo-year">Ano</label>
                  <input
                    id="photo-year"
                    value={photoForm.year}
                    onChange={(event) => updatePhotoForm('year', event.target.value)}
                    placeholder="1954"
                  />
                </div>
                <div>
                  <label htmlFor="photo-branch">Rama</label>
                  <input
                    id="photo-branch"
                    value={photoForm.branch}
                    onChange={(event) => updatePhotoForm('branch', event.target.value)}
                    onBlur={(event) => updatePhotoForm('branch', toProperName(event.target.value))}
                    placeholder="Gonzalez"
                  />
                </div>
              </div>
              <label htmlFor="photo-url">URL de imagen</label>
              <input
                id="photo-url"
                value={photoForm.image}
                onChange={(event) => updatePhotoForm('image', event.target.value)}
                placeholder="https://..."
              />
              <label htmlFor="photo-file">O cargar imagen</label>
              <input
                id="photo-file"
                accept="image/*"
                type="file"
                onChange={(event) => handleImageFile(
                  event.target.files?.[0],
                  (value) => updatePhotoForm('image', value),
                  `galeria/${photoForm.branch || 'general'}`,
                )}
              />
              {photoForm.image && (
                <img className="admin-preview" src={photoForm.image} alt="Vista previa" />
              )}
              <button type="submit">
                <Save size={18} />
                Guardar imagen
              </button>
            </form>
          </div>

          {adminMessage && <strong className="admin-message">{adminMessage}</strong>}
          {uploadStatus && <strong className="admin-message">{uploadStatus}</strong>}

          <div className="admin-lists">
            <article>
              <h3>Personas cargadas</h3>
              {customMembers.length === 0 ? (
                <p>Aun no hay personas agregadas desde el modulo administrativo.</p>
              ) : (
                customMembers.map((member) => (
                  <div className="admin-list-item" key={member.id}>
                    <img src={member.photo} alt="" />
                    <span>{member.name}</span>
                    <button onClick={() => editCustomMember(member)} title="Editar persona" type="button">
                      <Save size={16} />
                    </button>
                    <button onClick={() => deleteCustomMember(member.id)} title="Eliminar persona" type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </article>
            <article>
              <h3>Imagenes cargadas</h3>
              {customGallery.length === 0 ? (
                <p>Aun no hay imagenes agregadas desde el modulo administrativo.</p>
              ) : (
                customGallery.map((item) => (
                  <div className="admin-list-item" key={item.id}>
                    <img src={item.image} alt="" />
                    <span>{item.title}</span>
                    <button onClick={() => deleteCustomPhoto(item.id)} title="Eliminar imagen" type="button">
                      <Trash2 size={16} />
                    </button>
                  </div>
                ))
              )}
            </article>
          </div>
        </section>

        <button className="floating-close" onClick={handleLogout} title="Cerrar sesion" type="button">
          <X size={18} />
        </button>
      </main>
    );
  }

  return (
    <main>
      <header className="hero">
        <nav>
          <a href="#arbol">Arbol</a>
          <a href="#ramas">Ramas</a>
          <a href="#galeria">Galeria</a>
          <a href="#historias">Historias</a>
        </nav>
        <div className="hero-content">
          <p className="eyebrow">Proyecto legado familiar</p>
          <h1>Albun Familiar</h1>
          <p>
            Un sitio privado para preservar el arbol genealogico, fotografias restauradas,
            historias humanas, documentos y una linea de tiempo que pueda crecer generacion tras
            generacion.
          </p>
          <div className="hero-actions">
            <a className="primary-link" href="#arbol">
              <GitBranch size={18} />
              Ver arbol
            </a>
            <a className="secondary-link" href="#galeria">
              <Camera size={18} />
              Abrir album
            </a>
            {isAdmin && (
              <a className="secondary-link" href="/admin">
                <Shield size={18} />
                Gestionar
              </a>
            )}
          </div>
        </div>
      </header>

      <section className="dashboard-band">
        <div className="dashboard">
          <Stat icon={UserRound} label="Personas" value={allMembers.length} />
          <Stat icon={GitBranch} label="Ramas" value={dynamicBranches.length} />
          <Stat icon={Camera} label="Fotos" value={allGallery.length} />
          <Stat icon={Shield} label="Supabase" value={isSupabaseConfigured ? 'Listo' : 'Pendiente'} />
        </div>
      </section>

      <section className="section-grid" id="arbol">
        <div className="section-copy">
          <p className="eyebrow">Tronco principal</p>
          <h2>Arbol genealogico maestro</h2>
          <p>
            Vista interactiva con zoom, arrastre, busqueda y filtros por rama o generacion. Cada
            tarjeta abre el perfil documental de la persona.
          </p>
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, rama u origen"
            />
          </div>
          <div className="tree-filters">
            <label htmlFor="branch-filter">Rama</label>
            <select
              id="branch-filter"
              value={branchFilter}
              onChange={(event) => setBranchFilter(event.target.value)}
            >
              <option value="all">Todas las ramas</option>
              {branchOptions.map((branch) => (
                <option key={branch} value={branch}>
                  {branch}
                </option>
              ))}
            </select>
            <label htmlFor="generation-filter">Generacion</label>
            <select
              id="generation-filter"
              value={generationFilter}
              onChange={(event) => setGenerationFilter(event.target.value)}
            >
              <option value="all">Todas las generaciones</option>
              {generations.map((generation) => (
                <option key={generation} value={String(generation)}>
                  Generacion {generation + 1}
                </option>
              ))}
            </select>
          </div>
          <div className="branch-legend">
            {branchOptions.map((branch) => (
              <span key={branch} style={{ '--branch-color': getBranchStyle(branch).color }}>
                {getBranchStyle(branch).label}: {branch}
              </span>
            ))}
          </div>
          <div className="mini-results">
            {filteredMembers.map((member) => (
              <button key={member.id} onClick={() => setSelectedMember(member)} type="button">
                <img src={member.photo} alt="" />
                <span>{member.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="tree-shell flow-shell">
          {flowElements.nodes.length > 0 ? (
            <ReactFlow
              nodes={flowElements.nodes}
              edges={flowElements.edges}
              onNodeClick={(_, node) => {
                const member = allMembers.find((candidate) => candidate.id === node.id);
                if (member) {
                  setSelectedMember(member);
                }
              }}
              fitView
              minZoom={0.35}
              maxZoom={1.7}
            >
              <Background color="#c2b7a8" gap={24} />
              <MiniMap pannable zoomable nodeStrokeWidth={3} />
              <Controls showInteractive={false} />
            </ReactFlow>
          ) : (
            <div className="empty-flow">
              Todavia no hay personas en el arbol. Crea la primera desde el panel de gestion.
            </div>
          )}
        </div>
      </section>

      <section className="profile-band" id="historias">
        {selectedMember ? (
          <>
            <div className="profile">
              <img src={selectedMember.photo} alt={selectedMember.name} />
              <div className="profile-copy">
                <p className="eyebrow">{selectedMember.branch}</p>
                <h2>{selectedMember.name}</h2>
                <p className="profile-role">{selectedMember.role}</p>
                <p>{selectedMember.story}</p>
                <dl>
                  <div>
                    <dt>Periodo</dt>
                    <dd>{selectedMember.years}</dd>
                  </div>
                  <div>
                    <dt>Origen</dt>
                    <dd>{selectedMember.origin}</dd>
                  </div>
                  <div>
                    <dt>Cedula</dt>
                    <dd>{selectedMember.nationalId || 'No registrada'}</dd>
                  </div>
                  <div>
                    <dt>Generacion</dt>
                    <dd>{selectedGeneration + 1}</dd>
                  </div>
                  <div>
                <dt>Vinculo</dt>
                <dd>{selectedMember.relationship || selectedMember.role}</dd>
              </div>
              <div>
                <dt>Descendientes directos</dt>
                <dd>{selectedChildren.length}</dd>
              </div>
                </dl>
              </div>
            </div>
            <div className="profile-dossier">
              <article>
                <h3>Hijos y descendencia</h3>
                {selectedChildren.length === 0 ? (
                  <p>Sin descendientes directos registrados todavia.</p>
                ) : (
                  selectedChildren.map((child) => (
                    <button key={child.id} onClick={() => setSelectedMember(child)} type="button">
                      <img src={child.photo} alt="" />
                      <span>{child.name}</span>
                    </button>
                  ))
                )}
              </article>
              <article>
                <h3>Material asociado</h3>
                <div className="dossier-tags">
                  <span><Camera size={15} /> {relatedPhotos.length} fotos</span>
                  <span><BookOpen size={15} /> Biografia</span>
                  <span><FolderArchive size={15} /> Documentos pendiente</span>
                  <span><Clock3 size={15} /> Audio pendiente</span>
                </div>
              </article>
              <article>
                <h3>Ubicacion historica</h3>
                <p>{selectedMember.origin}. El modulo de mapa queda preparado para conectar Leaflet o Mapbox.</p>
              </article>
            </div>
          </>
        ) : (
          <div className="empty-profile">
            <p className="eyebrow">Historias familiares</p>
            <h2>Selecciona o crea una persona</h2>
            <p>Cuando agregues tu primer familiar, aqui aparecera su biografia, descendencia, fotos y contexto historico.</p>
          </div>
        )}
      </section>

      <section className="content-section" id="ramas">
        <div className="section-heading">
          <p className="eyebrow">Album por ramas</p>
          <h2>Organizacion familiar clara</h2>
        </div>
        <div className="branch-grid">
          {dynamicBranches.length === 0 ? (
            <article className="empty-card">
              <h3>Sin ramas creadas</h3>
              <p>Agrega una persona desde el panel de gestion y escribe su rama familiar para empezar.</p>
            </article>
          ) : dynamicBranches.map((branch) => (
            <article
              className="branch-card"
              key={branch.name}
              style={{ '--branch-color': getBranchStyle(branch.name.replace('Rama ', '')).color }}
            >
              <img src={branch.cover} alt={branch.name} />
              <div>
                <h3>{branch.name}</h3>
                <p>{branch.summary}</p>
                <span>{branch.count} archivos catalogados</span>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="content-section" id="galeria">
        <div className="section-heading">
          <p className="eyebrow">Fotografias</p>
          <h2>Galeria restaurada y documentada</h2>
        </div>
        <div className="gallery-grid">
          {allGallery.length === 0 ? (
            <article className="empty-card">
              <h3>Sin imagenes cargadas</h3>
              <p>Sube la primera fotografia familiar desde el panel de gestion.</p>
            </article>
          ) : allGallery.map((item) => (
            <article className="photo-card" key={item.id || item.title}>
              <img src={item.image} alt={item.title} />
              <div>
                <span>{item.year} - Rama {item.branch}</span>
                <h3>{item.title}</h3>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section-grid timeline-section">
        <div className="section-copy">
          <p className="eyebrow">Contexto historico</p>
          <h2>Linea de tiempo documental</h2>
          <p>
            Las fechas familiares ganan fuerza cuando se conectan con mudanzas, oficios, estudios,
            celebraciones, migraciones y cambios de epoca.
          </p>
        </div>
        <div className="timeline">
          {timeline.length === 0 ? (
            <article>
              <time>Inicio</time>
              <div>
                <h3>Linea de tiempo vacia</h3>
                <p>Cuando registres eventos familiares, aqui se convertiran en una cronologia documental.</p>
              </div>
            </article>
          ) : timeline.map((event) => (
            <article key={event.year}>
              <time>{event.year}</time>
              <div>
                <h3>{event.title}</h3>
                <p>{event.text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="archive-band">
        <div className="archive-panel">
          <div>
            <p className="eyebrow">Metodo de archivo</p>
            <h2>Flujo recomendado para preservar el legado</h2>
          </div>
          <ol>
            {archiveSteps.map((step) => (
              <li key={step}>{step}</li>
            ))}
          </ol>
          <div className="tool-row">
            <button type="button" title="Exportar album">
              <Download size={18} />
            </button>
            <button type="button" title="Revisar documentos">
              <FolderArchive size={18} />
            </button>
            <button type="button" title="Vista de lectura">
              <BookOpen size={18} />
            </button>
            <button type="button" title="Comparar restauraciones">
              <Eye size={18} />
            </button>
            <button type="button" title="Linea de tiempo">
              <Clock3 size={18} />
            </button>
          </div>
        </div>
      </section>

      <footer>
        <span>
          <Heart size={16} />
          Albun Familiar
        </span>
        <span>
          <Sparkles size={16} />
          {session?.name || 'Archivo privado en crecimiento'}
        </span>
      </footer>

      <button className="floating-close" onClick={handleLogout} title="Cerrar sesion" type="button">
        <X size={18} />
      </button>
    </main>
  );
}
