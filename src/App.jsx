import React, { useMemo, useState } from 'react';
import {
  Background,
  Controls,
  MiniMap,
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
import { isSupabaseConfigured } from './lib/supabase.js';

const usersStorageKey = 'family-users';
const sessionStorageKey = 'family-session';
const customMembersStorageKey = 'family-custom-members-v2';
const customGalleryStorageKey = 'family-custom-gallery-v2';

const emptyMemberForm = {
  name: '',
  branch: '',
  role: '',
  birthYear: '',
  deathYear: '',
  origin: '',
  parentId: '',
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
    const haystack = `${member.name} ${member.branch} ${member.origin} ${member.role}`.toLowerCase();
    const matchesSearch = haystack.includes(filters.query.toLowerCase());
    const matchesBranch = filters.branch === 'all' || member.branch === filters.branch;
    const matchesGeneration = filters.generation === 'all' || String(generation) === filters.generation;
    return matchesSearch && matchesBranch && matchesGeneration;
  });
  const visibleIds = new Set(visibleMembers.map((member) => member.id));
  const grouped = visibleMembers.reduce((accumulator, member) => {
    const generation = getMemberGeneration(member, members, generationCache);
    return {
      ...accumulator,
      [generation]: [...(accumulator[generation] || []), member],
    };
  }, {});

  const nodes = Object.entries(grouped).flatMap(([generation, generationMembers]) => {
    const y = Number(generation) * 210;
    const totalWidth = (generationMembers.length - 1) * 210;
    return generationMembers.map((member, index) => {
      const branchStyle = getBranchStyle(member.branch);
      return {
        id: member.id,
        position: { x: index * 210 - totalWidth / 2, y },
        data: {
          label: (
            <div className="flow-member">
              <img src={member.photo} alt="" />
              <strong>{member.name}</strong>
              <span>{member.years}</span>
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
  });

  const edges = visibleMembers
    .filter((member) => member.parentId && visibleIds.has(member.parentId))
    .map((member) => ({
      id: `${member.parentId}-${member.id}`,
      source: member.parentId,
      target: member.id,
      type: 'smoothstep',
      animated: selectedMemberId === member.id,
      style: { stroke: getBranchStyle(member.branch).color, strokeWidth: 2 },
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

export default function App() {
  const [query, setQuery] = useState('');
  const [customMembers, setCustomMembers] = useState(() => readStorageList(customMembersStorageKey));
  const [customGallery, setCustomGallery] = useState(() => readStorageList(customGalleryStorageKey));
  const [memberForm, setMemberForm] = useState(emptyMemberForm);
  const [photoForm, setPhotoForm] = useState(emptyPhotoForm);
  const [adminMessage, setAdminMessage] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [generationFilter, setGenerationFilter] = useState('all');
  const [session, setSession] = useState(() => {
    const savedSession = localStorage.getItem(sessionStorageKey);
    return savedSession ? JSON.parse(savedSession) : null;
  });
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
    const text = `${member.name} ${member.branch} ${member.origin} ${member.role}`.toLowerCase();
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

  function getUsers() {
    const savedUsers = localStorage.getItem(usersStorageKey);
    return savedUsers ? JSON.parse(savedUsers) : [];
  }

  function saveSession(user) {
    const cleanUser = { name: user.name, email: user.email };
    localStorage.setItem(sessionStorageKey, JSON.stringify(cleanUser));
    setSession(cleanUser);
  }

  function handleAuth(event) {
    event.preventDefault();
    setAuthMessage('');

    const name = authForm.name.trim();
    const email = authForm.email.trim().toLowerCase();
    const formPassword = authForm.password.trim();
    const users = getUsers();

    if (!email || !formPassword || (authMode === 'register' && !name)) {
      setAuthMessage('Completa los campos para continuar.');
      return;
    }

    if (authMode === 'register') {
      if (users.some((user) => user.email === email)) {
        setAuthMessage('Ese correo ya tiene una cuenta. Usa iniciar sesion.');
        return;
      }

      const newUser = {
        name,
        email,
        password: formPassword,
        createdAt: new Date().toISOString(),
      };
      const nextUsers = [...users, newUser];
      localStorage.setItem(usersStorageKey, JSON.stringify(nextUsers));
      saveSession(newUser);
      return;
    }

    const existingUser = users.find(
      (user) => user.email === email && user.password === formPassword,
    );

    if (!existingUser) {
      setAuthMessage('No encontre una cuenta con esos datos.');
      return;
    }

    saveSession(existingUser);
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

  function readFileAsDataUrl(file, callback) {
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onload = () => callback(String(reader.result));
    reader.readAsDataURL(file);
  }

  function addMember(event) {
    event.preventDefault();
    setAdminMessage('');

    if (!memberForm.name.trim() || !memberForm.branch.trim()) {
      setAdminMessage('Agrega al menos nombre y rama familiar.');
      return;
    }

    const years = memberForm.deathYear.trim()
      ? `${memberForm.birthYear.trim() || 'Sin fecha'} - ${memberForm.deathYear.trim()}`
      : memberForm.birthYear.trim() || 'Sin fecha';
    const newMember = {
      id: `persona-${Date.now()}`,
      name: memberForm.name.trim(),
      branch: memberForm.branch.trim(),
      role: memberForm.role.trim() || 'Miembro familiar',
      years,
      origin: memberForm.origin.trim() || 'Por documentar',
      photo: memberForm.photo.trim() || '/assets/family-album-cover.jpg',
      story: memberForm.story.trim() || 'Historia pendiente de documentar.',
      parentId: memberForm.parentId || null,
      custom: true,
    };

    const nextMembers = [...customMembers, newMember];
    setCustomMembers(nextMembers);
    localStorage.setItem(customMembersStorageKey, JSON.stringify(nextMembers));
    setSelectedMember(newMember);
    setMemberForm(emptyMemberForm);
    setAdminMessage('Persona agregada al arbol familiar.');
  }

  function addPhoto(event) {
    event.preventDefault();
    setAdminMessage('');

    if (!photoForm.title.trim() || !photoForm.image.trim()) {
      setAdminMessage('Agrega titulo y una imagen para guardar la foto.');
      return;
    }

    const newPhoto = {
      id: `foto-${Date.now()}`,
      title: photoForm.title.trim(),
      year: photoForm.year.trim() || 'Sin fecha',
      branch: photoForm.branch.trim() || 'General',
      image: photoForm.image.trim(),
      custom: true,
    };

    const nextGallery = [...customGallery, newPhoto];
    setCustomGallery(nextGallery);
    localStorage.setItem(customGalleryStorageKey, JSON.stringify(nextGallery));
    setPhotoForm(emptyPhotoForm);
    setAdminMessage('Imagen agregada a la galeria familiar.');
  }

  function deleteCustomMember(memberId) {
    const nextMembers = customMembers.filter((member) => member.id !== memberId);
    setCustomMembers(nextMembers);
    localStorage.setItem(customMembersStorageKey, JSON.stringify(nextMembers));
    if (selectedMember?.id === memberId) {
      setSelectedMember(nextMembers[0] || null);
    }
  }

  function deleteCustomPhoto(photoId) {
    const nextGallery = customGallery.filter((item) => item.id !== photoId);
    setCustomGallery(nextGallery);
    localStorage.setItem(customGalleryStorageKey, JSON.stringify(nextGallery));
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

  return (
    <main>
      <header className="hero">
        <nav>
          <a href="#arbol">Arbol</a>
          <a href="#administrar">Administrar</a>
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

      <section className="admin-section" id="administrar">
        <div className="section-heading">
          <p className="eyebrow">Administracion familiar</p>
          <h2>Cargar personas e imagenes</h2>
        </div>
        <div className="admin-grid">
          <form className="admin-panel" onSubmit={addMember}>
            <div className="panel-title">
              <UserRound size={20} />
              <h3>Nueva persona</h3>
            </div>
            <label htmlFor="member-name">Nombre completo</label>
            <input
              id="member-name"
              value={memberForm.name}
              onChange={(event) => updateMemberForm('name', event.target.value)}
              placeholder="Ej. Jose Gonzalez Vargas"
            />
            <div className="form-row">
              <div>
                <label htmlFor="member-branch">Rama</label>
                <input
                  id="member-branch"
                  value={memberForm.branch}
                  onChange={(event) => updateMemberForm('branch', event.target.value)}
                  placeholder="Gonzalez"
                />
              </div>
              <div>
                <label htmlFor="member-role">Relacion o rol</label>
                <input
                  id="member-role"
                  value={memberForm.role}
                  onChange={(event) => updateMemberForm('role', event.target.value)}
                  placeholder="Abuela, hijo, nieta"
                />
              </div>
            </div>
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
              placeholder="Ciudad, departamento o pais"
            />
            <label htmlFor="member-parent">Conectar debajo de</label>
            <select
              id="member-parent"
              value={memberForm.parentId}
              onChange={(event) => updateMemberForm('parentId', event.target.value)}
            >
              <option value="">Tronco principal</option>
              {allMembers.map((member) => (
                <option key={member.id} value={member.id}>
                  {member.name}
                </option>
              ))}
            </select>
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
              onChange={(event) => readFileAsDataUrl(event.target.files?.[0], (value) => updateMemberForm('photo', value))}
            />
            <label htmlFor="member-story">Historia o anecdota</label>
            <textarea
              id="member-story"
              value={memberForm.story}
              onChange={(event) => updateMemberForm('story', event.target.value)}
              placeholder="Escribe una historia corta, oficio, recuerdo o contexto familiar."
            />
            <button type="submit">
              <Plus size={18} />
              Agregar persona
            </button>
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
              onChange={(event) => readFileAsDataUrl(event.target.files?.[0], (value) => updatePhotoForm('image', value))}
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
              Todavia no hay personas en el arbol. Crea la primera desde Administrar.
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
                    <dt>Generacion</dt>
                    <dd>{selectedGeneration + 1}</dd>
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
              <p>Agrega una persona desde Administrar y escribe su rama familiar para empezar.</p>
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
              <p>Sube la primera fotografia familiar desde Administrar.</p>
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

      <button className="floating-close" onClick={() => {
        localStorage.removeItem(sessionStorageKey);
        setSession(null);
      }} title="Cerrar sesion" type="button">
        <X size={18} />
      </button>
    </main>
  );
}
