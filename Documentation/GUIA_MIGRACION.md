# Guía de Migración — De Python a Node.js y Base de Datos

> **Catálogo de Asociaciones — AsociAcción**
> Hospital Universitario Clínico San Cecilio

Este documento plantea la hoja de ruta para una futura migración de la plataforma a un backend en **Node.js** con una **base de datos relacional (PostgreSQL)**, sustituyendo el actual backend en Python/FastAPI con almacenamiento en archivos JSON.

---

## Índice

1. [¿Por qué migrar?](#1-por-qué-migrar)
2. [Arquitectura actual vs. arquitectura propuesta](#2-arquitectura-actual-vs-arquitectura-propuesta)
3. [Tecnologías propuestas](#3-tecnologías-propuestas)
4. [Plan de migración por fases](#4-plan-de-migración-por-fases)
5. [Fase 1 — Preparar la base de datos](#5-fase-1--preparar-la-base-de-datos)
6. [Fase 2 — Crear el nuevo backend en Node.js](#6-fase-2--crear-el-nuevo-backend-en-nodejs)
7. [Fase 3 — Migrar los datos existentes](#7-fase-3--migrar-los-datos-existentes)
8. [Fase 4 — Adaptar el frontend](#8-fase-4--adaptar-el-frontend)
9. [Fase 5 — Pruebas y validación](#9-fase-5--pruebas-y-validación)
10. [Fase 6 — Despliegue y corte](#10-fase-6--despliegue-y-corte)
11. [Cambios en el despliegue del servidor](#11-cambios-en-el-despliegue-del-servidor)
12. [Riesgos y cómo mitigarlos](#12-riesgos-y-cómo-mitigarlos)
13. [Estimación de esfuerzo](#13-estimación-de-esfuerzo)
14. [Decisiones pendientes](#14-decisiones-pendientes)

---

## 1. ¿Por qué migrar?

La aplicación actual funciona correctamente, pero tiene limitaciones que una migración resolvería:

| Limitación actual | Cómo lo resuelve la migración |
|---|---|
| Los datos se guardan en **archivos JSON** en disco | Una **base de datos PostgreSQL** ofrece consultas rápidas, integridad de datos y escalabilidad |
| Si dos usuarios modifican datos a la vez, uno puede sobrescribir al otro | PostgreSQL gestiona la **concurrencia** de forma segura con transacciones |
| No hay búsquedas avanzadas (ej: "asociaciones de Granada con más de 3 servicios") | SQL permite **consultas complejas** sobre los datos |
| Python requiere un entorno virtual y dependencias específicas | Node.js es ampliamente utilizado en entornos web y más fácil de desplegar en la nube |
| No hay copias de seguridad automáticas de los datos | PostgreSQL permite **backups automáticos** integrados |
| Si el servidor se reinicia en un entorno cloud, los archivos JSON pueden perderse | La base de datos es **externa y persistente**, los datos no se pierden |

> **Nota importante**: La migración no es urgente. El sistema actual es funcional y estable. Esta guía plantea un camino para cuando se necesite escalar o profesionalizar la plataforma.

---

## 2. Arquitectura actual vs. arquitectura propuesta

### Arquitectura actual

```
  Navegador del usuario
         │
         ▼
  ┌─────────────┐
  │    Nginx     │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Python     │
  │   FastAPI    │
  │   Uvicorn    │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  Archivos   │     ← asociaciones.json, categorias.json, etc.
  │    JSON     │        Almacenamiento en disco local
  └─────────────┘
```

### Arquitectura propuesta

```
  Navegador del usuario
         │
         ▼
  ┌─────────────┐
  │    Nginx     │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Node.js    │
  │   Express    │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ PostgreSQL   │     ← Base de datos relacional
  │ (servidor    │        Puede estar en el mismo servidor
  │  o en la     │        o en un servicio externo (Supabase, Neon, etc.)
  │  nube)       │
  └─────────────┘
```

### ¿Qué cambia y qué no cambia?

| Componente | ¿Cambia? | Detalle |
|---|---|---|
| **Frontend** (HTML, CSS, JS) | Apenas cambia | Solo se ajustan las URLs de la API si cambian |
| **Backend** (servidor) | Cambia por completo | De Python/FastAPI a Node.js/Express |
| **Base de datos** | Cambia por completo | De archivos JSON a tablas PostgreSQL |
| **Nginx** | No cambia | Sigue actuando como proxy inverso |
| **Certificado SSL** | No cambia | Let's Encrypt sigue funcionando igual |
| **Firewall** | No cambia | Mismas reglas |

---

## 3. Tecnologías propuestas

| Tecnología | Versión recomendada | Función |
|---|---|---|
| **Node.js** | 20 LTS o superior | Entorno de ejecución del backend |
| **Express** | 4.x | Framework web para la API |
| **PostgreSQL** | 15 o superior | Base de datos relacional |
| **pg** (npm) | Última estable | Driver de Node.js para conectar con PostgreSQL |
| **jsonwebtoken** (npm) | Última estable | Gestión de tokens JWT (autenticación) |
| **bcryptjs** (npm) | Última estable | Hash seguro de contraseñas |
| **multer** (npm) | Última estable | Gestión de subida de archivos |
| **dotenv** (npm) | Última estable | Lectura de variables de entorno (.env) |
| **PM2** | Última estable | Gestor de procesos (reemplaza a systemd para Node.js) |

---

## 4. Plan de migración por fases

```
  Fase 1          Fase 2          Fase 3          Fase 4          Fase 5          Fase 6
┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐   ┌──────────┐
│ Preparar │──>│  Crear   │──>│ Migrar   │──>│ Adaptar  │──>│ Pruebas  │──>│Despliegue│
│   Base   │   │  nuevo   │   │  datos   │   │ frontend │   │    y     │   │    y     │
│ de Datos │   │ backend  │   │existentes│   │          │   │validación│   │  corte   │
└──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘   └──────────┘
   ~1 día         ~5 días       ~1 día          ~1 día         ~2 días        ~1 día
```

---

## 5. Fase 1 — Preparar la base de datos

### 5.1. Instalar PostgreSQL en el servidor

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl enable postgresql
sudo systemctl start postgresql
```

### 5.2. Crear la base de datos y el usuario

```bash
sudo -u postgres psql
```

```sql
-- Crear un usuario para la aplicación
CREATE USER catalogo_user WITH PASSWORD 'contraseña_segura';

-- Crear la base de datos
CREATE DATABASE catalogo_asociaciones OWNER catalogo_user;

-- Dar permisos
GRANT ALL PRIVILEGES ON DATABASE catalogo_asociaciones TO catalogo_user;

\q
```

### 5.3. Crear las tablas

Conectarse a la nueva base de datos:

```bash
sudo -u postgres psql -d catalogo_asociaciones
```

```sql
-- Tabla de categorías
CREATE TABLE categorias (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

-- Tabla de etiquetas
CREATE TABLE etiquetas (
    id VARCHAR(50) PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL
);

-- Tabla de asociaciones
CREATE TABLE asociaciones (
    id VARCHAR(50) PRIMARY KEY,
    nombre_asociacion VARCHAR(255) NOT NULL,
    siglas VARCHAR(50) NOT NULL,
    logo TEXT DEFAULT '',
    descripcion TEXT NOT NULL,
    categoria_id VARCHAR(50) REFERENCES categorias(id),
    cartera_servicios TEXT NOT NULL,
    videos JSONB DEFAULT '[]',
    ubicacion JSONB DEFAULT '{}',
    contactos JSONB DEFAULT '[]',
    etiquetas JSONB DEFAULT '[]'
);

-- Tabla de configuración del sitio
CREATE TABLE config (
    id SERIAL PRIMARY KEY,
    fondo TEXT DEFAULT ''
);

-- Tabla de solicitudes de inclusión
CREATE TABLE solicitudes (
    id VARCHAR(50) PRIMARY KEY,
    nombre_asociacion VARCHAR(255) NOT NULL,
    siglas VARCHAR(50) NOT NULL,
    descripcion TEXT NOT NULL,
    categoria_sugerida VARCHAR(255) DEFAULT '',
    web VARCHAR(500) DEFAULT '',
    ubicacion JSONB DEFAULT '{}',
    mensaje TEXT DEFAULT '',
    representante JSONB NOT NULL,
    fecha VARCHAR(50) NOT NULL,
    estado VARCHAR(20) DEFAULT 'pendiente'
);
```

### 5.4. Alternativa: usar PostgreSQL en la nube

En lugar de instalar PostgreSQL en el servidor, se puede usar un servicio gestionado (la base de datos se mantiene y respalda de forma automática):

| Servicio | Plan gratuito | Ideal para |
|---|---|---|
| [Supabase](https://supabase.com) | Sí (500 MB) | Proyectos pequeños-medianos |
| [Neon](https://neon.tech) | Sí (512 MB) | Escalado automático |
| [ElephantSQL](https://www.elephantsql.com) | Sí (20 MB) | Pruebas y prototipos |

En este caso, solo se necesita la **URL de conexión** que el servicio proporciona:

```
postgresql://catalogo_user:contraseña@servidor:5432/catalogo_asociaciones
```

---

## 6. Fase 2 — Crear el nuevo backend en Node.js

### 6.1. Instalar Node.js en el servidor

```bash
# Instalar Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar
node --version   # Debe ser v20.x o superior
npm --version
```

### 6.2. Inicializar el proyecto

```bash
cd /home/catalogo/app
npm init -y
npm install express pg jsonwebtoken bcryptjs multer dotenv cors
```

### 6.3. Equivalencia entre endpoints actuales y nuevos

La API debe replicar exactamente los mismos endpoints para que el frontend no necesite cambios significativos:

| Endpoint actual (Python) | Endpoint nuevo (Node.js) | Función |
|---|---|---|
| `POST /token` | `POST /token` | Login y obtención de token JWT |
| `GET /api/asociaciones` | `GET /api/asociaciones` | Listar asociaciones |
| `POST /api/asociaciones` | `POST /api/asociaciones` | Crear asociación |
| `PUT /api/asociaciones/{id}` | `PUT /api/asociaciones/:id` | Editar asociación |
| `DELETE /api/asociaciones/{id}` | `DELETE /api/asociaciones/:id` | Eliminar asociación |
| `GET /api/categorias` | `GET /api/categorias` | Listar categorías |
| `GET /api/etiquetas` | `GET /api/etiquetas` | Listar etiquetas |
| `GET /api/config` | `GET /api/config` | Obtener configuración |
| `POST /api/config` | `POST /api/config` | Guardar configuración |
| `POST /api/upload-logo` | `POST /api/upload-logo` | Subir logo |
| `GET /api/fondos` | `GET /api/fondos` | Listar fondos |
| `POST /api/upload-fondo` | `POST /api/upload-fondo` | Subir fondo |
| `POST /api/importar` | `POST /api/importar` | Importar CSV/ODS |
| `GET /api/exportar/csv` | `GET /api/exportar/csv` | Exportar CSV |
| `POST /api/solicitudes` | `POST /api/solicitudes` | Enviar solicitud |
| `GET /api/solicitudes` | `GET /api/solicitudes` | Listar solicitudes |

> **Regla clave**: Si los endpoints y las respuestas JSON mantienen la misma estructura, el frontend no necesita cambios.

### 6.4. Estructura del nuevo backend

```
app/
├── server.js                  ← Punto de entrada principal
├── package.json               ← Dependencias de Node.js
├── .env                       ← Variables de entorno
├── db.js                      ← Conexión y consultas a PostgreSQL
├── auth.js                    ← Lógica de autenticación JWT
├── routes/
│   ├── asociaciones.js        ← Endpoints de asociaciones
│   ├── categorias.js          ← Endpoints de categorías
│   ├── etiquetas.js           ← Endpoints de etiquetas
│   ├── config.js              ← Endpoints de configuración
│   ├── solicitudes.js         ← Endpoints de solicitudes
│   ├── importar.js            ← Lógica de importación
│   └── exportar.js            ← Lógica de exportación
├── html/                      ← Frontend (sin cambios)
└── data/                      ← Solo como respaldo local (opcional)
```

### 6.5. Variables de entorno (.env)

```env
# Base de datos
DATABASE_URL=postgresql://catalogo_user:contraseña@localhost:5432/catalogo_asociaciones

# Autenticación
SECRET_KEY=clave_secreta_larga_y_aleatoria
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ContraseñaDeAdministrador1!

# Servidor
PORT=8080
```

---

## 7. Fase 3 — Migrar los datos existentes

### 7.1. Script de migración de JSON a PostgreSQL

Se debe crear un script que lea los archivos JSON actuales y los inserte en la base de datos:

```javascript
// migrar_datos.js — Ejecutar una sola vez
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: 'postgresql://catalogo_user:contraseña@localhost:5432/catalogo_asociaciones'
});

async function migrar() {
    // 1. Migrar categorías
    const categorias = JSON.parse(fs.readFileSync('data/categorias.json', 'utf8'));
    for (const cat of categorias) {
        await pool.query(
            'INSERT INTO categorias (id, nombre) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
            [cat.id, cat.nombre]
        );
    }
    console.log(`Migradas ${categorias.length} categorías`);

    // 2. Migrar etiquetas
    const etiquetas = JSON.parse(fs.readFileSync('data/etiquetas.json', 'utf8'));
    for (const eti of etiquetas) {
        await pool.query(
            'INSERT INTO etiquetas (id, nombre) VALUES ($1, $2) ON CONFLICT (id) DO NOTHING',
            [eti.id, eti.nombre]
        );
    }
    console.log(`Migradas ${etiquetas.length} etiquetas`);

    // 3. Migrar asociaciones
    const asociaciones = JSON.parse(fs.readFileSync('data/asociaciones.json', 'utf8'));
    for (const aso of asociaciones) {
        await pool.query(
            `INSERT INTO asociaciones
             (id, nombre_asociacion, siglas, logo, descripcion, categoria_id,
              cartera_servicios, videos, ubicacion, contactos, etiquetas)
             VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
             ON CONFLICT (id) DO NOTHING`,
            [
                aso.id, aso.nombre_asociacion, aso.siglas, aso.logo || '',
                aso.descripcion, aso.categoria, aso.cartera_servicios,
                JSON.stringify(aso.videos || []),
                JSON.stringify(aso.ubicacion || {}),
                JSON.stringify(aso.contactos || []),
                JSON.stringify(aso.etiquetas || [])
            ]
        );
    }
    console.log(`Migradas ${asociaciones.length} asociaciones`);

    // 4. Migrar solicitudes
    if (fs.existsSync('data/solicitudes.json')) {
        const solicitudes = JSON.parse(fs.readFileSync('data/solicitudes.json', 'utf8'));
        for (const sol of solicitudes) {
            await pool.query(
                `INSERT INTO solicitudes
                 (id, nombre_asociacion, siglas, descripcion, categoria_sugerida,
                  web, ubicacion, mensaje, representante, fecha, estado)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
                 ON CONFLICT (id) DO NOTHING`,
                [
                    sol.id, sol.nombre_asociacion, sol.siglas, sol.descripcion,
                    sol.categoria_sugerida || '', sol.web || '',
                    JSON.stringify(sol.ubicacion || {}), sol.mensaje || '',
                    JSON.stringify(sol.representante), sol.fecha, sol.estado
                ]
            );
        }
        console.log(`Migradas ${solicitudes.length} solicitudes`);
    }

    console.log('\nMigración completada con éxito.');
    pool.end();
}

migrar().catch(console.error);
```

### 7.2. Ejecutar la migración

```bash
cd /home/catalogo/app
node migrar_datos.js
```

### 7.3. Verificar los datos

```bash
sudo -u postgres psql -d catalogo_asociaciones -c "SELECT COUNT(*) FROM asociaciones;"
sudo -u postgres psql -d catalogo_asociaciones -c "SELECT COUNT(*) FROM categorias;"
sudo -u postgres psql -d catalogo_asociaciones -c "SELECT COUNT(*) FROM etiquetas;"
```

---

## 8. Fase 4 — Adaptar el frontend

El frontend (HTML, CSS, JavaScript) **no debería necesitar cambios significativos** si se respetan estas reglas:

1. **Los endpoints mantienen las mismas rutas** (`/api/asociaciones`, `/api/categorias`, etc.).
2. **Las respuestas JSON tienen la misma estructura** (mismos nombres de campos).
3. **El token de autenticación sigue siendo JWT** con el mismo formato.
4. **Los archivos estáticos se sirven desde la misma ruta** (`/html/...`).

### Posibles ajustes menores

| Caso | Qué revisar |
|---|---|
| El formato de `id` cambia (de número a texto o viceversa) | Ajustar comparaciones en JavaScript del frontend |
| La ubicación de los logos cambia | Actualizar las rutas en el frontend |
| El campo `categoria` pasa de almacenar un ID a almacenar un objeto | Adaptar la renderización en `index.js` y `detalle.js` |

---

## 9. Fase 5 — Pruebas y validación

### 9.1. Lista de comprobación funcional

| Función | Verificación |
|---|---|
| Página principal carga | Las asociaciones se muestran correctamente |
| Filtros funcionan | Categoría, etiqueta, provincia, comunidad, país |
| Detalle de asociación | Muestra contactos, servicios, vídeos |
| Login de administrador | Devuelve token y redirige al panel |
| Crear asociación | Se guarda en la base de datos |
| Editar asociación | Se actualiza correctamente |
| Eliminar asociación | Desaparece del listado |
| Subir logo | Se almacena y se muestra en la ficha |
| Importar CSV | Se procesan las filas correctamente |
| Exportar CSV | Se descarga con todos los datos |
| Formulario de solicitud | Se envía y aparece en el panel de admin |
| Cambiar fondo | Se aplica en la página principal |

### 9.2. Pruebas de rendimiento

Comparar tiempos de respuesta entre la versión actual (JSON) y la nueva (PostgreSQL):

```bash
# Medir tiempo de respuesta del listado de asociaciones
time curl -s http://localhost:8080/api/asociaciones > /dev/null
```

---

## 10. Fase 6 — Despliegue y corte

### 10.1. Estrategia de corte recomendada

1. **Instalar la nueva versión** en una carpeta separada (`/home/catalogo/app_nueva`).
2. **Ejecutar el script de migración** de datos.
3. **Probar la nueva versión** en un puerto diferente (ej: 8081).
4. **Cuando todo funcione**, detener el servicio antiguo y redirigir Nginx al nuevo.
5. **Conservar la versión anterior** durante al menos una semana por si hay que volver atrás.

### 10.2. Cambiar Nginx al nuevo backend

Solo hay que modificar el puerto en la configuración de Nginx:

```nginx
proxy_pass http://127.0.0.1:8080;   # Apuntar al nuevo backend Node.js
```

```bash
sudo nginx -t && sudo systemctl reload nginx
```

---

## 11. Cambios en el despliegue del servidor

### 11.1. Diferencias respecto al despliegue actual

| Aspecto | Versión actual (Python) | Versión nueva (Node.js) |
|---|---|---|
| **Lenguaje** | Python 3.9+ | Node.js 20+ |
| **Framework** | FastAPI + Uvicorn | Express |
| **Gestor de paquetes** | pip + requirements.txt | npm + package.json |
| **Entorno virtual** | `python3 -m venv venv` | No necesario (usa `node_modules/`) |
| **Instalar dependencias** | `pip install -r requirements.txt` | `npm install` |
| **Arrancar** | `uvicorn server:app --port 8080` | `node server.js` o `pm2 start server.js` |
| **Gestor de procesos** | systemd | PM2 (recomendado) o systemd |
| **Base de datos** | Archivos JSON en `data/` | PostgreSQL (local o en la nube) |
| **Backups** | Copiar carpeta `data/` | `pg_dump` (volcado de base de datos) |

### 11.2. Nuevo servicio systemd (si no se usa PM2)

```ini
[Unit]
Description=Catálogo de Asociaciones - Node.js
After=network.target postgresql.service

[Service]
Type=simple
User=catalogo
Group=catalogo
WorkingDirectory=/home/catalogo/app
EnvironmentFile=/home/catalogo/app/.env
ExecStart=/usr/bin/node server.js
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

### 11.3. Backups de PostgreSQL

En lugar de copiar archivos JSON, los backups se hacen con `pg_dump`:

```bash
# Backup manual
pg_dump -U catalogo_user catalogo_asociaciones > backup_$(date +%Y%m%d).sql

# Restaurar
psql -U catalogo_user catalogo_asociaciones < backup_20260529.sql
```

Script de backup automático (reemplaza al actual):

```bash
#!/bin/bash
FECHA=$(date +%Y-%m-%d_%H%M)
BACKUP_DIR="/home/catalogo/backups"
mkdir -p "$BACKUP_DIR"

# Backup de la base de datos
pg_dump -U catalogo_user catalogo_asociaciones | gzip > "$BACKUP_DIR/db_${FECHA}.sql.gz"

# Backup de los logos y fondos (siguen en disco)
tar -czf "$BACKUP_DIR/archivos_${FECHA}.tar.gz" \
    /home/catalogo/app/html/img/logos/ \
    /home/catalogo/app/html/img/fondos/

# Limpiar backups antiguos (más de 30 días)
find "$BACKUP_DIR" -name "*.gz" -mtime +30 -delete

echo "Backup completado: ${FECHA}"
```

---

## 12. Riesgos y cómo mitigarlos

| Riesgo | Probabilidad | Impacto | Cómo mitigarlo |
|---|---|---|---|
| Pérdida de datos durante la migración | Baja | Alto | Hacer backup completo antes de migrar. Conservar los JSON originales |
| El frontend deja de funcionar | Media | Alto | Mantener la misma estructura de endpoints y respuestas JSON |
| PostgreSQL se cae | Baja | Alto | Implementar un sistema de fallback a archivos JSON locales como respaldo |
| Errores de traducción Python → JavaScript | Media | Medio | Buscar restos de sintaxis Python (`append`, `None`, `True`) en el código JS |
| El equipo no tiene experiencia en Node.js | Media | Medio | Documentar bien y usar código sencillo. Node.js tiene una comunidad muy grande |
| Tiempo de inactividad durante el corte | Baja | Bajo | Desplegar la nueva versión en paralelo y hacer el cambio en Nginx en segundos |

---

## 13. Estimación de esfuerzo

| Fase | Duración estimada | Perfil necesario |
|---|---|---|
| Fase 1: Base de datos | 1 día | Técnico con conocimientos de SQL |
| Fase 2: Backend Node.js | 3–5 días | Desarrollador con experiencia en JavaScript/Node.js |
| Fase 3: Migración de datos | 0,5–1 día | Técnico |
| Fase 4: Ajustes frontend | 0,5–1 día | Desarrollador frontend |
| Fase 5: Pruebas | 1–2 días | QA o el propio desarrollador |
| Fase 6: Despliegue | 0,5 día | Administrador de sistemas |
| **Total estimado** | **7–10 días laborables** | |

---

## 14. Decisiones pendientes

Antes de iniciar la migración, se deben tomar las siguientes decisiones:

| Decisión | Opciones | Recomendación |
|---|---|---|
| ¿PostgreSQL local o en la nube? | Local (en el servidor) / Nube (Supabase, Neon) | **Nube** si se quiere reducir mantenimiento; **local** si se prefiere control total |
| ¿Usar PM2 o systemd? | PM2 (más funcionalidades para Node.js) / systemd (ya configurado) | **PM2** si el equipo lo conoce; **systemd** si se quiere consistencia con la infraestructura actual |
| ¿Migrar las contraseñas a hash seguro? | Mantener texto plano como ahora / Migrar a bcrypt | **Migrar a bcrypt** para mayor seguridad |
| ¿Mantener el fallback a JSON? | Sí (como red de seguridad) / No (solo base de datos) | **Sí** durante los primeros meses; eliminar cuando sea estable |
| ¿Cuándo se ejecuta la migración? | Coordinarlo con un periodo de baja actividad del portal | Elegir un viernes por la tarde o un fin de semana |

---

