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
- Arbol genealogico interactivo con zoom y arrastre.
- Filtros por rama familiar y generacion.
- Perfil documental con descendencia, material asociado y ubicacion historica.
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
- React Flow para arbol genealogico interactivo
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

### 7. Mejoras tipo MyHeritage adaptadas al proyecto

Se tomaron ideas clave de plataformas genealogicas modernas y se adaptaron al enfoque privado, familiar y documental del proyecto.

Resultado:

- Se instalo `@xyflow/react`.
- El arbol manual fue reemplazado por un arbol interactivo con React Flow.
- El arbol permite zoom, arrastre, controles visuales y minimapa.
- Se agregaron filtros por rama familiar.
- Se agregaron filtros por generacion.
- Se agrego leyenda visual por ramas con colores.
- El perfil familiar se amplio como expediente documental.
- El expediente muestra descendientes directos, fotos asociadas, biografia, documentos pendientes, audio pendiente y ubicacion historica.
- Las ramas familiares ahora tienen color visual propio.

Nota:

La integracion actual usa datos locales y de ejemplo. Para escalar a miles de miembros, el siguiente paso es mover los datos a Supabase y mantener React Flow como capa visual.

### 8. Limpieza de datos de ejemplo

Se eliminaron todos los datos ficticios para que el proyecto pueda empezar con la familia real del usuario.

Resultado:

- `familyMembers` queda vacio.
- `branches` queda vacio.
- `gallery` queda vacio.
- `timeline` queda vacio.
- Se agregaron estados vacios para arbol, perfil, ramas, galeria y linea de tiempo.
- Se cambiaron las claves de almacenamiento local de personas e imagenes a una nueva version para evitar que registros del prototipo anterior vuelvan a aparecer.
- El modulo `Administrar` queda como punto de entrada para crear la primera persona, cargar imagenes y construir el arbol propio.

### 9. Separacion del panel administrativo

Se separo el panel administrativo de la pagina principal del album para que la experiencia familiar no parezca una pantalla de mantenimiento.

Resultado:

- El album principal queda en `/`.
- El panel de gestion queda en `/admin`.
- Se elimino `Administrar` de la navegacion principal del album.
- Se agrego un acceso discreto `Gestionar` desde el hero para entrar al panel.
- Los mensajes vacios del album ahora hablan de panel de gestion, no de una seccion interna.
- El panel administrativo conserva formularios, listas y acciones de carga/eliminacion.

### 10. Normalizacion de nombres y correccion de estado vacio

Se corrigio el flujo de captura para que los datos escritos en mayusculas se guarden como nombre propio.

Resultado:

- Nombre completo se normaliza al salir del campo y al guardar.
- Rama familiar se normaliza al salir del campo y al guardar.
- Relacion o rol se normaliza al salir del campo y al guardar.
- Lugar de origen se normaliza al salir del campo y al guardar.
- Titulo de imagen y rama de imagen tambien se normalizan.
- Se mantiene en minuscula conectores comunes como `de`, `del`, `la`, `las`, `los` y `y` cuando no son la primera palabra.
- Se verifico que la pantalla no reporte errores de consola al abrir `/admin` sin personas cargadas.

### 11. Mejora de conexiones genealogicas

Se mejoro el manejo visual y conceptual de relaciones familiares en el arbol.

Resultado:

- Las lineas del arbol ahora usan conexion vertical desde la parte inferior de la persona origen hacia la parte superior de la persona relacionada.
- Se agrego mas separacion horizontal y vertical para evitar tarjetas pegadas.
- Las lineas tienen mayor grosor, flecha y etiqueta de vinculo.
- Se agrego el campo `Vinculo con la persona seleccionada` en el panel administrativo.
- Se reemplazo `Tronco principal` por `Persona inicial del arbol`.
- El perfil muestra el vinculo guardado.
- Se agrego ayuda en el formulario explicando que, para un arbol genealogico correcto, lo ideal es conectar hijos con padre/madre directo y usar sobrina/nieta/prima como descripcion si falta una generacion intermedia.

### 12. Refuerzo visual de descendencia

Se ajusto el arbol para que la linea de descendencia y la etiqueta de relacion sean mas claras.

Resultado:

- Mayor separacion vertical entre generaciones.
- Lineas de conexion mas gruesas y con sombra.
- Etiqueta de relacion movida fuera de la tarjeta y colocada sobre la linea.
- Etiqueta con flecha visual, por ejemplo `↓ Hija`.
- Tarjeta del familiar mas compacta para evitar que tape la conexion.

### 13. Migracion de nombres existentes a formato propio

Se agrego una migracion local para corregir registros ya guardados antes de la normalizacion.

Resultado:

- Al abrir la app, las personas existentes en `localStorage` se normalizan automaticamente.
- Se corrigen nombre, rama, rol, vinculo y origen.
- Las imagenes existentes tambien normalizan titulo y rama.
- Esto evita que registros previos como nombres escritos en mayusculas sigan apareciendo sin formato de nombre propio.

### 14. Campo de cedula para identificacion futura

Se agrego un campo de cedula a los registros familiares para facilitar busquedas, cruces y asistencia futura con IA.

Resultado:

- El formulario administrativo permite capturar `Numero de cedula`.
- La cedula se guarda en cada persona.
- La cedula aparece en el perfil documental.
- La busqueda del arbol tambien encuentra personas por cedula.
- El dato se conserva en el formato digitado para respetar guiones o formatos oficiales.

### 15. Preparacion de Supabase Storage y conversion WebP

Se inicio la integracion real con Supabase Storage para imagenes familiares.

Resultado:

- Las claves reales se guardaron solo en `C:\python\respaldo_claves_albun_familiar.txt`.
- Se verifico que el repositorio no contenga las claves reales.
- Se agrego `VITE_SUPABASE_MEDIA_BUCKET` a `.env.example`.
- Se agrego `SUPABASE_SETUP.md` con configuracion de bucket, politicas recomendadas y advertencia de no usar `service_role` en frontend.
- Se agrego conversion de imagenes a WebP en navegador antes de subir o previsualizar.
- Se limita la imagen fuente a 10 MB.
- Se reduce la dimension maxima a 1600 px.
- Se usa WebP calidad 82%.
- Se sube a Supabase Storage con `upsert: false`.
- Si Supabase no esta configurado, la app convierte a WebP localmente para vista previa y avisa al usuario.

Referencia consultada en `C:\python`:

- `TRATO_DE_IMAGENES.md`: estandar WebP calidad 85 y variantes responsivas.
- `Apps-Projects/albergues/import_shelters_supabase.py`: conversion a WebP antes de subir a Supabase.
- `Apps-Projects/busqueda-parques-mascotas/sync_park_images.py`: uso de `.env`, WebP y subida a Storage.

### 16. Edicion de personas cargadas

Se agrego edicion de registros existentes para completar informacion faltante sin duplicar familiares.

Resultado:

- Cada persona cargada en `/admin` tiene boton de editar.
- El formulario se precarga con los datos existentes.
- El boton cambia a `Guardar cambios`.
- Se agrego accion `Cancelar edicion`.
- Al guardar, se actualiza el registro existente en `localStorage`.
- El perfil seleccionado se actualiza con los cambios guardados.

### 17. Esquema de base de datos Supabase

Se verifico Supabase por REST usando las claves guardadas localmente fuera del repositorio.

Resultado:

- Las tablas `familiares`, `fotos`, `historias`, `documentos` y `eventos_familiares` no existian.
- Se creo el bucket `family-media` desde Storage API.
- Se agrego migracion SQL en `supabase/migrations/20260524142000_family_schema.sql`.
- Se agrego `supabase/README.md`.
- La migracion incluye campos actuales y futuros: cedula, rama, vinculo, padre, madre, pareja, foto principal, storage paths, ubicacion, metadata, historias, documentos, fotos y eventos.
- Se agregaron indices para cedula, rama y relaciones familiares.
- Se agregaron triggers `updated_at`.
- Se agregaron politicas RLS iniciales para usuarios autenticados.

Nota:

La API REST de Supabase no permite crear tablas directamente. Para aplicar la migracion se debe ejecutar el SQL desde Supabase SQL Editor, Supabase CLI o una conexion directa a Postgres.

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
- Arbol interactivo con React Flow compilado correctamente.
- Estado inicial sin personas compilado correctamente.
- Panel administrativo separado de la pagina principal.
- Normalizacion automatica a nombre propio en el panel administrativo.
- Correccion de error por perfil sin persona seleccionada.
- Lineas genealogicas mas visibles con etiqueta de vinculo.
- Refuerzo visual de descendencia entre tarjetas.
- Migracion automatica de registros existentes a nombre propio.
- Campo de cedula disponible para busqueda e identificacion futura.
- Supabase Storage preparado con conversion WebP y controles de cuota.
- Edicion de personas existentes desde el panel administrativo.
- Migracion SQL de Supabase creada para todos los campos del modelo familiar.

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
- Filtrar el arbol por rama y generacion.
- Usar zoom, arrastre, minimapa y controles del arbol.
- Seleccionar familiares.
- Consultar perfiles.
- Consultar expediente documental basico por persona.
- Empezar desde una base limpia sin familiares ficticios.
- Administrar datos desde `/admin` sin mezclar formularios en el album.
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
- El mapa historico esta descrito en el perfil, pero falta implementar Leaflet/Mapbox.
- Documentos, audios y videos estan representados como estado pendiente dentro del expediente.

## Proximos pasos recomendados

1. Conectar Supabase Auth para registro e inicio de sesion real.
2. Crear tablas en Supabase para familiares, ramas, fotos, historias y eventos.
3. Migrar el modulo administrativo a Supabase Database y Supabase Storage.
4. Agregar edicion de familiares e imagenes existentes.
5. Crear editor avanzado de historias y anecdotas.
6. Implementar mapa historico con Leaflet o Mapbox.
7. Agregar documentos, audios y videos por persona.
8. Agregar roles: administrador, familiar invitado y lector.
9. Agregar exportacion a PDF o album imprimible.
10. Crear pagina de respaldo y organizacion de archivos familiares.
11. Reemplazar datos de ejemplo por datos reales de la familia.
12. Preparar despliegue en Vercel, Netlify o GitHub Pages.

## Historial de commits

```text
Pendiente Agregar esquema Supabase de familia
0b4a4ba Agregar edicion de personas
6df1d6e Preparar Supabase Storage con WebP
ddf9360 Agregar campo de cedula familiar
b13cdd2 Normalizar registros existentes
4aee52e Reforzar lineas de descendencia
668245a Mejorar conexiones y vinculos genealogicos
e7204c9 Normalizar captura de nombres familiares
c8d2db3 Separar panel administrativo del album
feea566 Limpiar datos de ejemplo familiar
58414b1 Agregar arbol interactivo y filtros familiares
9f906da Agregar modulo administrativo familiar
7fa9456 Agregar fondo de arbol genealogico
afa1978 Agregar favicon del album
7ac066a Agregar registro e inicio de sesion
dd155c2 Ajustar imagenes al tono familiar
b54e85f Crear proyecto Albun Familiar
```
