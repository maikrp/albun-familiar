import React, { useMemo, useState } from 'react';
import {
  BookOpen,
  Camera,
  Clock3,
  Download,
  Eye,
  FolderArchive,
  GitBranch,
  Heart,
  Lock,
  Search,
  Shield,
  Sparkles,
  TreePine,
  UserRound,
  X,
} from 'lucide-react';
import { archiveSteps, branches, familyMembers, gallery, timeline } from './data/familyData.js';
import { isSupabaseConfigured } from './lib/supabase.js';

const usersStorageKey = 'family-users';
const sessionStorageKey = 'family-session';

function buildTree(members, parentId = null) {
  return members
    .filter((member) => member.parentId === parentId)
    .map((member) => ({
      ...member,
      children: buildTree(members, member.id),
    }));
}

function TreeNode({ node, onSelect }) {
  return (
    <li>
      <button className="member-card" onClick={() => onSelect(node)} type="button">
        <img src={node.photo} alt={node.name} />
        <strong>{node.name}</strong>
        <span>{node.years}</span>
      </button>
      {node.children.length > 0 && (
        <ul>
          {node.children.map((child) => (
            <TreeNode key={child.id} node={child} onSelect={onSelect} />
          ))}
        </ul>
      )}
    </li>
  );
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

export default function App() {
  const [query, setQuery] = useState('');
  const [selectedMember, setSelectedMember] = useState(familyMembers[0]);
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
  const familyTree = useMemo(() => buildTree(familyMembers), []);

  const filteredMembers = familyMembers.filter((member) => {
    const text = `${member.name} ${member.branch} ${member.origin} ${member.role}`.toLowerCase();
    return text.includes(query.toLowerCase());
  });

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
          <Stat icon={UserRound} label="Personas" value={familyMembers.length} />
          <Stat icon={GitBranch} label="Ramas" value={branches.length} />
          <Stat icon={Camera} label="Fotos base" value={gallery.length} />
          <Stat icon={Shield} label="Supabase" value={isSupabaseConfigured ? 'Listo' : 'Pendiente'} />
        </div>
      </section>

      <section className="section-grid" id="arbol">
        <div className="section-copy">
          <p className="eyebrow">Tronco principal</p>
          <h2>Arbol genealogico maestro</h2>
          <p>
            La estructura parte de los miembros mas antiguos conocidos y baja hacia hijos, nietos y
            nuevas generaciones. Cada tarjeta abre un perfil con contexto, origen y anecdota.
          </p>
          <div className="search-box">
            <Search size={18} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por nombre, rama u origen"
            />
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
        <div className="tree-shell">
          <div className="tree">
            <ul>
              {familyTree.map((node) => (
                <TreeNode key={node.id} node={node} onSelect={setSelectedMember} />
              ))}
            </ul>
          </div>
        </div>
      </section>

      <section className="profile-band" id="historias">
        <div className="profile">
          <img src={selectedMember.photo} alt={selectedMember.name} />
          <div>
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
            </dl>
          </div>
        </div>
      </section>

      <section className="content-section" id="ramas">
        <div className="section-heading">
          <p className="eyebrow">Album por ramas</p>
          <h2>Organizacion familiar clara</h2>
        </div>
        <div className="branch-grid">
          {branches.map((branch) => (
            <article className="branch-card" key={branch.name}>
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
          {gallery.map((item) => (
            <article className="photo-card" key={item.title}>
              <img src={item.image} alt={item.title} />
              <div>
                <span>{item.year} · Rama {item.branch}</span>
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
          {timeline.map((event) => (
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
