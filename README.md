# Albun Familiar

Proyecto web privado para conservar un legado familiar con arbol genealogico, album fotografico, perfiles, historias, ramas familiares y linea de tiempo.

## Funciones incluidas

- Acceso privado por contrasena local.
- Arbol genealogico interactivo.
- Perfiles familiares con fotografia, origen, periodo e historia corta.
- Busqueda por nombre, rama u origen.
- Album dividido por ramas familiares.
- Galeria fotografica documentada.
- Linea de tiempo historica.
- Preparado para conectar Supabase mediante variables de entorno.

## Ejecutar en local

```bash
npm install
npm run dev
```

En PowerShell, si `npm` esta bloqueado por politicas de ejecucion, usa:

```powershell
npm.cmd install
npm.cmd run dev
```

## Variables de entorno

Copia `.env.example` a `.env.local` y completa los datos:

```env
VITE_SUPABASE_URL=https://tu-proyecto.supabase.co
VITE_SUPABASE_ANON_KEY=coloca_aqui_la_clave_publica_anon
VITE_SUPABASE_MEDIA_BUCKET=family-media
VITE_FAMILY_PASSWORD=familia
```

`VITE_FAMILY_PASSWORD` controla la contrasena de acceso del prototipo. La clave real de Supabase no se incluye en git; queda respaldada localmente en la ruta solicitada.

Consulta `SUPABASE_SETUP.md` para crear el bucket de imagenes y las politicas recomendadas. Nunca uses la llave `service_role` en el frontend.

## Estructura futura recomendada

```text
Familia/
  Rama_Gonzalez/
    Fotos_Originales/
    Restauradas/
    Documentos/
    Audio/
  Rama_Vargas/
  Rama_Mora/
  Rama_Chaves/
```

## GitHub

Repositorio remoto configurado:

```text
https://github.com/maikrp/albun-familiar.git
```
