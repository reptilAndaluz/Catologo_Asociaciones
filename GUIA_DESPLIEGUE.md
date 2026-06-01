# Guía de Despliegue en Servidor — Catálogo de Asociaciones

> **AsociAcción** — Directorio de Asociaciones del Hospital Universitario Clínico San Cecilio

Guía paso a paso para desplegar la plataforma en un **servidor**, accesible desde internet.
---

## Índice

1. [Resumen de la arquitectura](#1-resumen-de-la-arquitectura)
2. [Requisitos del servidor](#2-requisitos-del-servidor)
3. [Preparar el servidor](#3-preparar-el-servidor)
4. [Subir el proyecto al servidor](#4-subir-el-proyecto-al-servidor)
5. [Instalar dependencias de Python](#5-instalar-dependencias-de-python)
6. [Configurar variables de entorno](#6-configurar-variables-de-entorno)
7. [Crear el servicio del sistema (systemd)](#7-crear-el-servicio-del-sistema-systemd)
8. [Configurar Nginx como proxy inverso](#8-configurar-nginx-como-proxy-inverso)
9. [Obtener certificado SSL con Let's Encrypt](#9-obtener-certificado-ssl-con-lets-encrypt)
10. [Configurar el firewall](#10-configurar-el-firewall)
11. [Verificar el despliegue](#11-verificar-el-despliegue)
12. [Mantenimiento y copias de seguridad](#12-mantenimiento-y-copias-de-seguridad)
13. [Estructura del proyecto en el servidor](#13-estructura-del-proyecto-en-el-servidor)
14. [Solución de problemas](#14-solución-de-problemas)
15. [Resumen rápido (Chuleta)](#15-resumen-rápido-chuleta)

---

## 1. Resumen de la arquitectura

Así funciona la aplicación una vez desplegada en un servidor:

```
  Usuario (Navegador)
        │
        ▼
  ┌─────────────┐
  │   Internet   │    ← El usuario accede con https://tu-dominio.es
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │    Nginx     │    ← Recibe las peticiones y las redirige al backend
  │  (puerto 80  │       También sirve el certificado SSL (HTTPS)
  │   y 443)     │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │   Uvicorn    │    ← El servidor Python que ejecuta la aplicación
  │  (puerto     │             ip-servidor:8080
  │   8080)      │
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │  FastAPI +   │    ← La lógica de la aplicación
  │  Archivos    │       Los datos se guardan en archivos JSON
  │  JSON        │       en la carpeta data/
  └─────────────┘
```

**¿Por qué Nginx delante?** Porque Nginx es un servidor web profesional que gestiona miles de conexiones simultáneas, maneja SSL/HTTPS, comprime respuestas y protege al backend de ataques directos.

---

## 2. Requisitos del servidor

| Requisito | Mínimo recomendado |
|---|---|
| **Sistema operativo** | PreferiblementeUbuntu 22.04 LTS / Debian 12 (esta guía usa Ubuntu) aunque admite cualquier distribución Linux o Windows Server |
| **RAM** | 1 GB |
| **Disco** | 10 GB |
| **CPU** | 1 vCPU |
| **Acceso** | Conexión SSH al servidor |
| **Dominio** (opcional) | Un dominio apuntando a la IP del servidor (ej: `asociaciones.hospital.es`) |
| **Puertos abiertos** | 22 (SSH), 80 (HTTP), 443 (HTTPS) |

> **¿Dónde consigo un servidor?**  Si no se dispone de infraestructura interna, puedes usar proveedores como [Hetzner](https://www.hetzner.com/), [DigitalOcean](https://www.digitalocean.com/), [OVH](https://www.ovhcloud.com/), o el propio departamento de IT del hospital si dispone de infraestructura interna.

---

## 3. Preparar el servidor

### 3.1. Conectarse al servidor por SSH

Desde tu ordenador Windows, abre **PowerShell** (Windows 10/11 ya incluye un cliente SSH) y conéctate:

```
ssh usuario@IP_DEL_SERVIDOR
```

> Sustituye `usuario` por tu nombre de usuario e `IP_DEL_SERVIDOR` por la IP real (ej: `ssh admin@203.0.113.50`).
>
> Si prefieres una interfaz gráfica, puedes usar [PuTTY](https://www.putty.org/): descárgalo, introduce la IP en "Host Name", puerto 22, y pulsa "Open".

### 3.2. Actualizar el sistema

```bash
sudo apt update && sudo apt upgrade -y
```

### 3.3. Instalar el software necesario

```bash
sudo apt install -y python3 python3-pip python3-venv nginx unzip ufw certbot python3-certbot-nginx
```

| Paquete | ¿Para qué sirve? |
|---|---|
| `python3`, `python3-pip`, `python3-venv` | El lenguaje del backend y su gestor de paquetes |
| `nginx` | Servidor web que actúa como proxy inverso |
| `unzip` | Para descomprimir el archivo del proyecto |
| `ufw` | Firewall sencillo para proteger el servidor |
| `certbot` + `python3-certbot-nginx` | Obtener certificados SSL gratuitos (Let's Encrypt) |

### 3.4. Crear un usuario dedicado para la aplicación (buena práctica)

```bash
sudo useradd -m -s /bin/bash catalogo
sudo passwd catalogo
```

> Esto crea un usuario llamado `catalogo` con su propia carpeta. Se le pedirá establecer una contraseña.

---

## 4. Subir el proyecto al servidor

El proyecto se entrega como un archivo comprimido (`.zip`). Hay varias formas de subirlo al servidor desde Windows.

### Opción A: Subir mediante WinSCP o FileZilla (recomendado)

Esta es la forma más sencilla desde Windows, ya que utiliza una interfaz gráfica:

1. Descarga e instala [WinSCP](https://winscp.net/) o [FileZilla](https://filezilla-project.org/).
2. Abre el programa y crea una nueva conexión:
   - **Protocolo**: SFTP
   - **Nombre del servidor**: la IP del servidor (ej: `203.0.113.50`)
   - **Puerto**: 22
   - **Usuario** y **Contraseña**: las credenciales de acceso al servidor
3. Pulsa **Conectar**.
4. En el panel derecho (servidor), navega a `/home/catalogo/`.
5. En el panel izquierdo (tu PC), busca la carpeta del proyecto.
6. Arrastra la carpeta del proyecto al panel derecho y renómbrala a `app`.

### Opción B: Subir con SCP desde PowerShell

Abre **PowerShell** en Windows y ejecuta:

```
# Si el proyecto está en un archivo ZIP:
scp C:\Ruta\al\Catalogo_Asociaciones.zip usuario@IP_DEL_SERVIDOR:/home/catalogo/

# Si es una carpeta descomprimida:
scp -r C:\Ruta\al\Catalogo_Asociaciones\ usuario@IP_DEL_SERVIDOR:/home/catalogo/app
```

Si subiste un ZIP, conéctate al servidor y descomprímelo:

```
ssh usuario@IP_DEL_SERVIDOR
cd /home/catalogo
unzip Catalogo_Asociaciones.zip -d app
```

### Opción C: Subir mediante un pendrive (servidores físicos)

Si el servidor es una máquina física accesible:

1. Copia el archivo comprimido a un pendrive USB.
2. Monta el pendrive en el servidor y copia los archivos a `/home/catalogo/app`.

### Verificar que los archivos están correctamente subidos

```bash
ls /home/catalogo/app/
```

Deberías ver: `server.py`, `requirements.txt`, `html/`, `data/`, etc.

Asegúrate de que el usuario `catalogo` sea el propietario de todos los archivos:

```bash
sudo chown -R catalogo:catalogo /home/catalogo/app
```

---

## 5. Instalar dependencias de Python

```bash
# Cambiar al usuario de la aplicación
sudo -u catalogo -i

# Ir a la carpeta del proyecto
cd /home/catalogo/app

# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate

# Instalar dependencias
pip install -r requirements.txt

# Verificar que funciona (debería arrancar sin errores)
python -m uvicorn server:app --host 127.0.0.1 --port 8080 &
curl http://127.0.0.1:8080
# Si devuelve HTML, funciona correctamente

# Detener la prueba
kill %1
```

---

## 6. Configurar variables de entorno

Crea un archivo `.env` en la carpeta del proyecto:

```bash
sudo nano /home/catalogo/app/.env
```

Escribe lo siguiente (modifica los valores):

```env
# ======================================
# CONFIGURACIÓN DE PRODUCCIÓN
# ======================================

# Clave secreta para firmar tokens JWT (CÁMBIALA por una cadena larga y aleatoria)
SECRET_KEY=pon_aqui_una_clave_muy_larga_y_aleatoria_2026_xyz

# Credenciales del administrador
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ContraseñaDeAdministrador1!
```

Guarda con `Ctrl+O`, `Enter`, y cierra con `Ctrl+X`.

Protege el archivo para que solo el propietario pueda leerlo:

```bash
chmod 600 /home/catalogo/app/.env
chown catalogo:catalogo /home/catalogo/app/.env
```

>**IMPORTANTE**: Nunca uses las credenciales por defecto (`admin` / `1234`) en el servidor

---

## 7. Crear el servicio del sistema (systemd)

Un **servicio systemd** hace que la aplicación se inicie automáticamente cuando el servidor arranca y se reinicie si se cae.

### 7.1. Crear el archivo de servicio

```bash
sudo nano /etc/systemd/system/catalogo.service
```

Pega este contenido:

```ini
[Unit]
Description=Catálogo de Asociaciones - AsociAcción
After=network.target

[Service]
Type=simple
User=catalogo
Group=catalogo
WorkingDirectory=/home/catalogo/app
EnvironmentFile=/home/catalogo/app/.env
ExecStart=/home/catalogo/app/venv/bin/uvicorn server:app --host 127.0.0.1 --port 8080 --workers 2
Restart=always
RestartSec=5

# Seguridad adicional del proceso
NoNewPrivileges=true
PrivateTmp=true

[Install]
WantedBy=multi-user.target
```

Guarda y cierra (`Ctrl+O`, `Enter`, `Ctrl+X`).

### 7.2. Activar y arrancar el servicio

```bash
# Recargar la configuración de systemd
sudo systemctl daemon-reload

# Activar para que arranque con el servidor
sudo systemctl enable catalogo

# Arrancar el servicio ahora
sudo systemctl start catalogo

# Verificar que está funcionando
sudo systemctl status catalogo
```

Deberías ver algo como:

```
● catalogo.service - Catálogo de Asociaciones - AsociAcción
     Active: active (running) since ...
```

### 7.3. Comandos útiles del servicio

| Acción | Comando |
|---|---|
| Ver estado | `sudo systemctl status catalogo` |
| Arrancar | `sudo systemctl start catalogo` |
| Detener | `sudo systemctl stop catalogo` |
| Reiniciar | `sudo systemctl restart catalogo` |
| Ver logs en tiempo real | `sudo journalctl -u catalogo -f` |
| Ver últimos 50 logs | `sudo journalctl -u catalogo -n 50` |

---

## 8. Configurar Nginx como proxy inverso

Nginx recibe las peticiones de internet (puerto 80/443) y las redirige al backend (puerto 8080).

### 8.1. Crear la configuración del sitio

```bash
sudo nano /etc/nginx/sites-available/catalogo
```

Pega este contenido (sustituye `tu-dominio.es` por tu dominio real, o usa la IP del servidor):

```nginx
server {
    listen 80;
    server_name tu-dominio.es www.tu-dominio.es;

    # Tamaño máximo de subida de archivos (logos, CSVs, fondos)
    client_max_body_size 15M;

    # Redirigir la raíz al index
    location = / {
        return 301 /html/index.html;
    }

    # Proxy inverso: redirigir todo al backend de FastAPI/Uvicorn
    location / {
        proxy_pass http://127.0.0.1:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts generosos para importaciones grandes
        proxy_read_timeout 120s;
        proxy_send_timeout 120s;
    }
}
```

### 8.2. Activar el sitio

```bash
# Crear enlace simbólico para activar el sitio
sudo ln -s /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/

# Eliminar la página por defecto de Nginx (opcional)
sudo rm -f /etc/nginx/sites-enabled/default

# Verificar que la configuración no tiene errores
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

> Si `nginx -t` muestra `syntax is ok` y `test is successful`, todo está correcto.

### 8.3. Si no tienes dominio (solo IP)

Sustituye `tu-dominio.es` por `_` (acepta cualquier petición):

```nginx
server_name _;
```

---

## 9. Obtener certificado SSL con Let's Encrypt

>**Requisito**: Necesitas un dominio real apuntando a la IP del servidor. Si solo usas IP, salta este paso (usarás HTTP sin cifrar o un certificado autofirmado).

### 9.1. Generar el certificado (automático)

```bash
sudo certbot --nginx -d tu-dominio.es -d www.tu-dominio.es
```

Certbot te pedirá:
1. Un correo electrónico (para avisos de renovación).
2. Aceptar los términos de servicio.
3. Si quieres redirigir todo HTTP a HTTPS (recomendado: **Sí**).

### 9.2. Verificar la renovación automática

Let's Encrypt caduca cada 90 días, pero Certbot renueva automáticamente:

```bash
sudo certbot renew --dry-run
```

Si no muestra errores, la renovación automática está configurada.

### 9.3. Alternativa: Certificado autofirmado (sin dominio)

Si no tienes dominio, puedes usar el script incluido en el proyecto:

```bash
cd /home/catalogo/app
python3 generar_cert.py
```

Esto genera `cert.pem` y `key.pem`. Luego configura Nginx para usarlos:

```nginx
server {
    listen 443 ssl;
    server_name _;

    ssl_certificate /home/catalogo/app/cert.pem;
    ssl_certificate_key /home/catalogo/app/key.pem;

    # ... resto de la configuración igual que antes
}
```

> Con certificados autofirmados el navegador mostrará un aviso de seguridad.

---

## 10. Configurar el firewall

```bash
# Permitir SSH (para no perder acceso)
sudo ufw allow 22/tcp

# Permitir HTTP y HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Activar el firewall
sudo ufw enable

# Verificar las reglas
sudo ufw status
```

Resultado esperado:

```
Status: active

To                         Action      From
--                         ------      ----
22/tcp                     ALLOW       Anywhere
80/tcp                     ALLOW       Anywhere
443/tcp                    ALLOW       Anywhere
```

> **Nunca bloquees el puerto 22** sin verificar que tienes otro método de acceso al servidor, o perderás la conexión SSH.

---

## 11. Verificar el despliegue

### 11.1. Comprobar que todo está corriendo

```bash
# 1. ¿El servicio está activo?
sudo systemctl status catalogo
# Debe mostrar: Active: active (running)

# 2. ¿Nginx está activo?
sudo systemctl status nginx
# Debe mostrar: Active: active (running)

# 3. ¿El backend responde localmente?
curl http://127.0.0.1:8080
# Debe devolver HTML

# 4. ¿Nginx responde desde fuera?
curl http://tu-dominio.es
# Debe devolver HTML (o redirigir a HTTPS)
```

### 11.2. Probar desde un navegador

Abre el navegador y accede a:

| Página | URL |
|---|---|
| Catálogo público | `https://tu-dominio.es` |
| Login administrador | `https://tu-dominio.es/html/login.html` |
| Panel de gestión | `https://tu-dominio.es/html/crearEntrada.html` |

---

## 12. Mantenimiento y copias de seguridad

### 12.1. Copias de seguridad automáticas

Crea un script de backup:

```bash
sudo nano /home/catalogo/backup.sh
```

```bash
#!/bin/bash
# Backup diario de los datos del Catálogo de Asociaciones
FECHA=$(date +%Y-%m-%d_%H%M)
BACKUP_DIR="/home/catalogo/backups"
mkdir -p "$BACKUP_DIR"

# Copiar la carpeta de datos y los logos
tar -czf "$BACKUP_DIR/backup_${FECHA}.tar.gz" \
    /home/catalogo/app/data/ \
    /home/catalogo/app/html/img/logos/ \
    /home/catalogo/app/html/img/fondos/

# Eliminar backups de más de 30 días
find "$BACKUP_DIR" -name "backup_*.tar.gz" -mtime +30 -delete

echo "Backup completado: backup_${FECHA}.tar.gz"
```

Hazlo ejecutable y programa su ejecución diaria:

```bash
chmod +x /home/catalogo/backup.sh

# Añadir tarea programada (cron) — se ejecutará cada día a las 3:00 AM
sudo crontab -e
```

Añade esta línea al final:

```cron
0 3 * * * /home/catalogo/backup.sh >> /home/catalogo/backups/backup.log 2>&1
```

### 12.2. Actualizar la aplicación

Cuando se reciba una nueva versión del proyecto:

```bash
# 1. Detener el servicio
sudo systemctl stop catalogo

# 2. Hacer una copia de seguridad de los datos actuales
sudo cp -r /home/catalogo/app/data /home/catalogo/data_backup_$(date +%Y%m%d)
sudo cp -r /home/catalogo/app/html/img/logos /home/catalogo/logos_backup_$(date +%Y%m%d)

# 3. Subir la nueva versión al servidor (desde Windows con WinSCP o PowerShell):
#    Sube la nueva carpeta a /home/catalogo/app_nueva

# 4. En el servidor: reemplazar el código manteniendo los datos
sudo -u catalogo bash -c '
  cp -r /home/catalogo/app_nueva/* /home/catalogo/app/
  cd /home/catalogo/app
  source venv/bin/activate
  pip install -r requirements.txt
'

# 5. Restaurar los datos (si se sobrescribieron)
sudo cp -r /home/catalogo/data_backup_*/* /home/catalogo/app/data/

# 6. Reiniciar el servicio
sudo chown -R catalogo:catalogo /home/catalogo/app
sudo systemctl start catalogo
```

> **IMPORTANTE**: Siempre haz una copia de seguridad de la carpeta `data/` y `html/img/logos/` antes de actualizar.

### 12.3. Ver los logs de la aplicación

```bash
# Logs en tiempo real (para detectar errores)
sudo journalctl -u catalogo -f

# Logs de Nginx (accesos y errores)
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

---

## 13. Estructura del proyecto en el servidor

```
/home/catalogo/
├── app/                          ← El proyecto completo
│   ├── server.py                 ← Backend (servidor FastAPI)
│   ├── generar_cert.py           ← Generador de certificados SSL
│   ├── requirements.txt          ← Dependencias Python
│   ├── plantilla.csv             ← Plantilla CSV de ejemplo
│   ├── .env                      ← Variables de entorno (credenciales)
│   ├── venv/                     ← Entorno virtual de Python
│   ├── html/                     ← Frontend (páginas web)
│   │   ├── index.html            ← Página principal del catálogo
│   │   ├── login.html            ← Login del administrador
│   │   ├── crearEntrada.html     ← Panel de gestión
│   │   ├── contacto.html         ← Formulario de solicitud
│   │   ├── css/                  ← Estilos visuales
│   │   ├── js/                   ← Lógica del frontend
│   │   └── img/                  ← Imágenes
│   │       ├── logos/            ← Logos subidos de asociaciones
│   │       └── fondos/           ← Fondos de pantalla
│   └── data/                     ← Base de datos (archivos JSON)
│       ├── asociaciones.json
│       ├── categorias.json
│       ├── etiquetas.json
│       ├── config.json
│       └── solicitudes.json
├── backups/                      ← Copias de seguridad automáticas
└── backup.sh                     ← Script de backup

/etc/systemd/system/
└── catalogo.service              ← Servicio systemd

/etc/nginx/sites-available/
└── catalogo                      ← Configuración de Nginx
```

---

## 14. Solución de problemas

### "El servicio no arranca"

```bash
# Ver el error exacto
sudo journalctl -u catalogo -n 30 --no-pager
```

Causas habituales:
- **Ruta incorrecta** en `catalogo.service` → verifica que `/home/catalogo/app/venv/bin/uvicorn` existe.
- **Puerto ocupado** → otro proceso usa el 8080. Comprueba con `sudo lsof -i :8080`.
- **Error de Python** → activa el venv y ejecuta `python -m uvicorn server:app` manualmente para ver el error.

### "Nginx muestra 502 Bad Gateway"

Significa que Nginx no puede conectar con el backend:
1. Verifica que el servicio `catalogo` está corriendo: `sudo systemctl status catalogo`
2. Verifica que el puerto coincide: el servicio usa `--port 8080` y Nginx apunta a `proxy_pass http://[IP_ADDRESS]:8080`.

### "No puedo subir logos o archivos grandes"

Aumenta `client_max_body_size` en la configuración de Nginx:
```nginx
client_max_body_size 25M;
```
Y recarga: `sudo systemctl reload nginx`

### "Los datos se han perdido tras una actualización"

Los datos viven en `data/`. Si al actualizar se ha sobrescrito esa carpeta, restaura desde un backup:

```bash
cd /home/catalogo/backups
tar -xzf backup_2026-05-29_0300.tar.gz -C /
sudo systemctl restart catalogo
```

### "El certificado SSL ha caducado"

```bash
sudo certbot renew
sudo systemctl reload nginx
```

### "La sesión de admin caduca muy rápido"

Los tokens JWT expiran cada 30 minutos por seguridad. Esto es intencional. Solo hay que volver a iniciar sesión.

---

## 15. Resumen rápido (Chuleta)

Para administradores con experiencia, el despliegue completo resumido:

```bash
# 1. Preparar servidor
sudo apt update && sudo apt install -y python3 python3-pip python3-venv nginx unzip ufw certbot python3-certbot-nginx

# 2. Crear usuario y subir proyecto
sudo useradd -m -s /bin/bash catalogo
# (Desde tu ordenador): scp Catalogo_Asociaciones.zip usuario@IP:/home/catalogo/
sudo -u catalogo unzip /home/catalogo/Catalogo_Asociaciones.zip -d /home/catalogo/app
sudo chown -R catalogo:catalogo /home/catalogo/app

# 3. Instalar dependencias Python
sudo -u catalogo bash -c 'cd /home/catalogo/app && python3 -m venv venv && source venv/bin/activate && pip install -r requirements.txt'

# 4. Crear .env con credenciales seguras
sudo -u catalogo bash -c 'cat > /home/catalogo/app/.env << EOF
SECRET_KEY=clave_super_secreta_aleatoria
ADMIN_USERNAME=admin
ADMIN_PASSWORD=ContraseñaDeAdministrador1!
EOF'
chmod 600 /home/catalogo/app/.env

# 5. Crear servicio systemd (ver sección 7)
# 6. Crear config Nginx (ver sección 8)

# 7. Activar todo
sudo systemctl daemon-reload
sudo systemctl enable --now catalogo
sudo ln -s /etc/nginx/sites-available/catalogo /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx

# 8. SSL + Firewall
sudo certbot --nginx -d tu-dominio.es
sudo ufw allow 22/tcp && sudo ufw allow 80/tcp && sudo ufw allow 443/tcp && sudo ufw enable
```

---

>**¿Necesitas ayuda?** Contacta con el equipo de soporte técnico
>
>**[EMAIL_ADDRESS]** | **[PHONE_NUMBER]**
