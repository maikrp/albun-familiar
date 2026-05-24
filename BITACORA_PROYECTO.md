# Bitacora del Proyecto: Albun Familiar

Fecha de actualizacion: 2026-05-24  
Repositorio: https://github.com/maikrp/albun-familiar.git  
Rama principal: `main`  
Estado general: prototipo web funcional publicado en GitHub

## Objetivo

Crear un album familiar digital serio, duradero y visualmente atractivo, basado en una pagina web privada, que permita conservar:

- Arbol genealogico estructurado.
- Album fotografico organizado por ramas familiares.
- Historias, perfiles y contexto de cada persona.
- Linea de tiempo historica.
- Base preparada para integracion futura con Supabase.

## Alcance implementado

Se creo una aplicacion web con React y Vite llamada **Albun Familiar**.

La aplicacion incluye:

- Pantalla privada de acceso.
- Crear cuenta local.
- Iniciar sesion local.
- Cerrar sesion.
- Hero principal con imagen familiar historica.
- Estadisticas generales del archivo.
- Seccion de arbol genealogico maestro.
- Fondo visual de arbol en la seccion del arbol genealogico.
- Tarjetas interactivas de familiares.
- Perfil destacado de cada familiar seleccionado.
- Busqueda por nombre, rama, origen o rol.
- Modulo administrativo para cargar personas.
- Modulo administrativo para cargar imagenes.
- Guardado local de registros administrativos.
- Ramas familiares con portadas.
- Galeria de fotografias.
- Linea de tiempo documental.
- Flujo recomendado de preservacion del archivo familiar.
- Favicon propio del proyecto.
- Preparacion inicial para Supabase mediante variables de entorno.

## Estructura tecnica

Tecnologias usadas:

- React
- Vite
- JavaScript
- CSS personalizado
- lucide-react para iconos
- Supabase JS client preparado para uso futuro

Archivos principales:

- `src/App.jsx`: interfaz principal, acceso, administracion, arbol, perfiles, ramas, galeria y linea de tiempo.
- `src/styles.css`: estilos visuales y responsivos.
- `src/data/familyData.js`: datos iniciales de familiares, ramas, galeria y eventos.
- `src/lib/supabase.js`: cliente Supabase condicionado por variables de entorno.
- `public/assets/`: imagenes locales del proyecto.
- `public/favicon.svg`: favicon del album.
- `.env.example`: ejemplo de variables de entorno.
- `README.md`: instrucciones basicas del proyecto.

## Seguridad y claves

La clave compartida de Supabase no fue incluida dentro del repositorio para evitar exponer informacion sensible en GitHub.

Se creo un respaldo local en:

```text
C:\python\respaldo_claves_albun_familiar.txt
```

Pendiente recomendado:

- Migrar el acceso local a Supabase Auth.
- Usar variables de entorno reales en `.env.local`.
- Definir reglas de seguridad para fotos, perfiles e historias.

## Avances por etapa

### 1. Creacion inicial del proyecto

Se inicializo el proyecto como una app React/Vite, se instalaron dependencias y se preparo el repositorio Git.

Resultado:

- Proyecto local creado.
- `package.json` configurado.
- `README.md` creado.
- `.gitignore` creado.
- Remote configurado hacia GitHub.
- Primer push realizado a `main`.

Commit:

```text
b54e85f Crear proyecto Albun Familiar
```

### 2. Ajuste visual hacia tema familiar

Se reemplazaron imagenes externas que no comunicaban correctamente el concepto de legado familiar.

Resultado:

- Imagen principal del hero cambiada por archivo familiar historico.
- Portadas de ramas cambiadas por imagenes locales.
- Galeria actualizada con recursos visuales de tono familiar, archivo y generaciones.

Commit:

```text
dd155c2 Ajustar imagenes al tono familiar
```

### 3. Registro e inicio de sesion

Se reemplazo el acceso con clave unica por una pantalla mas clara con opciones de cuenta.

Resultado:

- Pestaña `Crear cuenta`.
- Pestaña `Iniciar sesion`.
- Campos de nombre familiar, correo y clave.
- Sesion guardada localmente.
- Cierre de sesion.
- Mensajes de validacion.

Nota:

El registro actual funciona en el navegador local. Para produccion debe moverse a Supabase Auth.

Commit:

```text
7ac066a Agregar registro e inicio de sesion
```

### 4. Favicon del album

Se corrigio el error de consola por favicon faltante.

Resultado:

- Se agrego `public/favicon.svg`.
- Se enlazo desde `index.html`.
- Se verifico que la consola no mostrara el 404 de favicon.

Commit:

```text
afa1978 Agregar favicon del album
```

### 5. Fondo de arbol genealogico

Se agrego una imagen de fondo de un arbol en el panel del arbol genealogico maestro.

Resultado:

- Imagen generada y guardada como `public/assets/genealogy-tree-bg.png`.
- Fondo aplicado en `.tree-shell`.
- Capa semitransparente para mantener legibilidad de tarjetas y lineas.

Commit:

```text
7fa9456 Agregar fondo de arbol genealogico
```

### 6. Modulo administrativo de personas e imagenes

Se agrego una seccion administrativa para capturar informacion familiar directamente desde la app.

Resultado:

- Nueva navegacion hacia `Administrar`.
- Formulario para cargar personas.
- Campos de nombre completo, rama, relacion, nacimiento, fallecimiento, origen, conexion familiar, fotografia e historia.
- Opcion para usar URL de fotografia o cargar archivo desde el equipo.
- Personas agregadas visibles en busqueda, arbol genealogico, perfil y contador de personas.
- Formulario para cargar imagenes del album.
- Campos de titulo, ano, rama, URL de imagen o archivo local.
- Imagenes agregadas visibles en la galeria y contador de fotos.
- Listas administrativas para revisar y eliminar personas o imagenes cargadas localmente.

Nota:

Los registros administrativos se guardan en `localStorage`. Esto permite avanzar en captura de informacion, pero el siguiente paso serio es mover estos datos a Supabase.

## Verificaciones realizadas

Se ejecuto:

```bash
npm.cmd install
npm.cmd run build
```

Resultados:

- Instalacion completada sin vulnerabilidades reportadas.
- Compilacion de produccion exitosa.
- App abierta en navegador local.
- Flujo de crear cuenta probado.
- Cierre de sesion probado.
- Favicon verificado.
- Fondo de arbol genealogico compilado correctamente.
- Modulo administrativo compilado correctamente.

URL local de desarrollo:

```text
http://127.0.0.1:5173/
```

## Estado actual

El proyecto esta funcional como prototipo visual e interactivo.

Actualmente permite:

- Crear una cuenta local.
- Entrar al album.
- Cargar personas desde el modulo administrativo.
- Cargar imagenes desde el modulo administrativo.
- Navegar el arbol genealogico.
- Seleccionar familiares.
- Consultar perfiles.
- Ver ramas familiares.
- Ver galeria.
- Revisar linea de tiempo.
- Cerrar sesion.

El repo esta publicado en GitHub y sincronizado con la rama `main`.

## Limitaciones actuales

- Los usuarios se guardan en `localStorage`; no existen todavia en una base de datos real.
- Las personas e imagenes cargadas desde administracion tambien se guardan en `localStorage`.
- Las contrasenas locales no estan cifradas, porque el flujo actual es solo prototipo.
- Las fotos y perfiles son datos de ejemplo.
- Supabase esta preparado en codigo, pero falta configurar URL, llave anonima y tablas.
- El modulo administrativo permite crear y eliminar registros locales, pero todavia no edita registros existentes.
- La carga de imagenes por archivo usa datos locales del navegador; falta almacenamiento permanente en Supabase Storage.

## Proximos pasos recomendados

1. Conectar Supabase Auth para registro e inicio de sesion real.
2. Crear tablas en Supabase para familiares, ramas, fotos, historias y eventos.
3. Migrar el modulo administrativo a Supabase Database y Supabase Storage.
4. Agregar edicion de familiares e imagenes existentes.
5. Crear editor avanzado de historias y anecdotas.
6. Agregar roles: administrador, familiar invitado y lector.
7. Agregar exportacion a PDF o album imprimible.
8. Crear pagina de respaldo y organizacion de archivos familiares.
9. Reemplazar datos de ejemplo por datos reales de la familia.
10. Preparar despliegue en Vercel, Netlify o GitHub Pages.

## Historial de commits

```text
9f906da Agregar modulo administrativo familiar
7fa9456 Agregar fondo de arbol genealogico
afa1978 Agregar favicon del album
7ac066a Agregar registro e inicio de sesion
dd155c2 Ajustar imagenes al tono familiar
b54e85f Crear proyecto Albun Familiar
```
