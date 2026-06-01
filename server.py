from fastapi import FastAPI, Depends, HTTPException, status, Body, UploadFile, File, Form
import urllib.request
import uuid
import shutil
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
import csv
import io
from fastapi.staticfiles import StaticFiles
from fastapi.responses import RedirectResponse
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import Response
from pydantic import BaseModel, ValidationError
from typing import List, Optional, Union
from datetime import datetime, timedelta
import jwt
import json
import os
import time
import tempfile

try:
    from pyexcel_ods import get_data, save_data
except ImportError:
    get_data = None
    save_data = None

# Configuración de Seguridad
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SECRET_KEY = os.environ.get("SECRET_KEY", "cambia_esto_por_una_clave_larga_y_secreta_en_produccion")
ADMIN_USERNAME = os.environ.get("ADMIN_USERNAME", "admin")
ADMIN_PASSWORD = os.environ.get("ADMIN_PASSWORD", "1234")
ALGORITHM = "HS256"

app = FastAPI()

# Middleware para inyectar Cabeceras de Seguridad y prevenir ataques (Clickjacking, XSS, MIME Sniffing)
class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response: Response = await call_next(request)
        response.headers["X-Frame-Options"] = "DENY"
        response.headers["X-Content-Type-Options"] = "nosniff"
        response.headers["X-XSS-Protection"] = "1; mode=block"
        response.headers["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response.headers["Content-Security-Policy"] = (
            "default-src 'self'; "
            "script-src 'self' 'unsafe-inline'; "
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; "
            "font-src 'self' https://fonts.gstatic.com; "
            "img-src 'self' data: http: https:; "
            "frame-src https://www.youtube.com https://youtube.com;"
        )
        return response

app.add_middleware(SecurityHeadersMiddleware)

# Esquema de autenticación (indica dónde buscar el token)
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# --- MODELOS PYDANTIC PARA VALIDACIÓN DE DATOS ---

class Contacto(BaseModel):
    tipo: str  # email, linkedin, web, telefono
    valor: str

class Ubicacion(BaseModel):
    pais: Optional[str] = ""
    comunidad: Optional[str] = ""
    provincia: Optional[str] = ""
    municipio: Optional[str] = ""

class Asociacion(BaseModel):
    id: Union[int, str]
    nombre_asociacion: str
    siglas: str
    logo: Optional[str] = ""
    descripcion: str
    categoria: str
    etiquetas: List[str]
    contactos: List[Contacto]
    cartera_servicios: str
    videos: Optional[List[str]] = []
    ubicacion: Optional[Ubicacion] = None

class Categoria(BaseModel):
    id: str
    nombre: str

class Etiqueta(BaseModel):
    id: str
    nombre: str

class ConfigWeb(BaseModel):
    fondo: Optional[str] = ""

class RepresentanteSolicitud(BaseModel):
    nombre: str
    cargo: str
    email: str
    telefono: Optional[str] = ""

class SolicitudAsociacion(BaseModel):
    nombre_asociacion: str
    siglas: str
    descripcion: str
    categoria_sugerida: Optional[str] = ""
    web: Optional[str] = ""
    ubicacion: Optional[Ubicacion] = None
    mensaje: Optional[str] = ""
    representante: RepresentanteSolicitud

# --- MÉTODOS AUXILIARES ---

def get_resource_file(recurso: str) -> str:
    if recurso not in ['asociaciones', 'categorias', 'etiquetas']:
        raise HTTPException(status_code=404, detail="Recurso no encontrado")
    return os.path.join(BASE_DIR, "data", f"{recurso}.json")

def read_data(recurso: str) -> list:
    filename = get_resource_file(recurso)
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def write_data(recurso: str, data: list):
    filename = get_resource_file(recurso)
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

# --- LÓGICA DE AUTENTICACIÓN ---

def create_access_token(data: dict):
    to_encode = data.copy()
    # Expiración real de 30 minutos para mitigar secuestro de sesión
    expire = datetime.utcnow() + timedelta(minutes=30)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def verify_token(token: str = Depends(oauth2_scheme)):
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("sub") != ADMIN_USERNAME:
            raise HTTPException(status_code=401, detail="Usuario no válido")
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expirado")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Token inválido")

@app.post("/token")
async def login(form_data: OAuth2PasswordRequestForm = Depends()):
    # Validación segura contra credenciales definidas
    if form_data.username == ADMIN_USERNAME and form_data.password == ADMIN_PASSWORD:
        access_token = create_access_token(data={"sub": form_data.username})
        return {"access_token": access_token, "token_type": "bearer"}
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Credenciales incorrectas",
        headers={"WWW-Authenticate": "Bearer"},
    )

# --- LÓGICA DE LA API PROTEGIDA (RESTful) ---

@app.get("/api/config")
async def leer_config():
    filename = os.path.join(BASE_DIR, "data", "config.json")
    if os.path.exists(filename):
        try:
            with open(filename, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return {"fondo": ""}
    return {"fondo": ""}

@app.post("/api/config")
async def guardar_config(payload: ConfigWeb, token: dict = Depends(verify_token)):
    filename = os.path.join(BASE_DIR, "data", "config.json")
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(payload.dict(), f, ensure_ascii=False, indent=4)
    return {"status": "success"}

# --- ENDPOINTS DE SOLICITUDES DE INCLUSIÓN (PÚBLICO: POST / PRIVADO: GET, DELETE) ---

SOLICITUDES_FILE = os.path.join(BASE_DIR, "data", "solicitudes.json")

def read_solicitudes() -> list:
    if os.path.exists(SOLICITUDES_FILE):
        try:
            with open(SOLICITUDES_FILE, 'r', encoding='utf-8') as f:
                return json.load(f)
        except json.JSONDecodeError:
            return []
    return []

def write_solicitudes(data: list):
    os.makedirs(os.path.join(BASE_DIR, 'data'), exist_ok=True)
    with open(SOLICITUDES_FILE, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=4)

@app.post("/api/solicitudes")
async def crear_solicitud(payload: SolicitudAsociacion):
    """Endpoint público para que asociaciones soliciten su inclusión en el directorio."""
    solicitudes = read_solicitudes()
    nueva_solicitud = payload.dict()
    nueva_solicitud["id"] = f"sol_{int(time.time() * 1000)}"
    nueva_solicitud["fecha"] = datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ")
    nueva_solicitud["estado"] = "pendiente"  # pendiente | revisada | aprobada | rechazada
    solicitudes.append(nueva_solicitud)
    write_solicitudes(solicitudes)
    return {"status": "success", "id": nueva_solicitud["id"]}

@app.get("/api/solicitudes")
async def listar_solicitudes(token: dict = Depends(verify_token)):
    """Endpoint protegido para que el administrador vea todas las solicitudes."""
    return read_solicitudes()

@app.put("/api/solicitudes/{solicitud_id}")
async def actualizar_estado_solicitud(solicitud_id: str, payload: dict = Body(...), token: dict = Depends(verify_token)):
    """Actualiza el estado de una solicitud (pendiente, revisada, aprobada, rechazada)."""
    solicitudes = read_solicitudes()
    for sol in solicitudes:
        if sol.get("id") == solicitud_id:
            estado = payload.get("estado", sol["estado"])
            if estado not in ["pendiente", "revisada", "aprobada", "rechazada"]:
                raise HTTPException(status_code=400, detail="Estado no válido")
            sol["estado"] = estado
            write_solicitudes(solicitudes)
            return {"status": "success"}
    raise HTTPException(status_code=404, detail="Solicitud no encontrada")

@app.delete("/api/solicitudes/{solicitud_id}")
async def eliminar_solicitud(solicitud_id: str, token: dict = Depends(verify_token)):
    """Elimina una solicitud del registro."""
    solicitudes = read_solicitudes()
    nuevas = [s for s in solicitudes if s.get("id") != solicitud_id]
    if len(nuevas) == len(solicitudes):
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    write_solicitudes(nuevas)
    return {"status": "success"}

# Extensiones de imagen permitidas para logos y fondos
ALLOWED_LOGO_EXTENSIONS = {'.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'}
LOGO_UPLOAD_DIR = os.path.join(BASE_DIR, 'html', 'img', 'logos')

# Configuración y migración de fondos
FONDO_UPLOAD_DIR = os.path.join(BASE_DIR, 'html', 'img', 'fondos')
os.makedirs(FONDO_UPLOAD_DIR, exist_ok=True)
_fondos_migrar = [
    "Sanidad, presidencia y emergencias (2) (1).jpeg",
    "Sanidad, presidencia y emergencias (5) (1).jpeg",
    "HORIZONTAL 50%GRIS (1).jpg",
    "HORIZONTAL 4525C (1).jpg",
    "fondo2.png"
]
for _fname in _fondos_migrar:
    _src = os.path.join(BASE_DIR, 'html', 'img', _fname)
    _dst = os.path.join(FONDO_UPLOAD_DIR, _fname)
    if os.path.exists(_src) and not os.path.exists(_dst):
        try:
            shutil.move(_src, _dst)
        except Exception:
            pass

@app.post("/api/upload-logo")
async def subir_logo(file: UploadFile = File(...), token: dict = Depends(verify_token)):
    """Endpoint para subir una imagen de logo de asociación al servidor."""
    # Validar extensión del archivo
    original_name = file.filename or ''
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_LOGO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Solo se aceptan: {', '.join(ALLOWED_LOGO_EXTENSIONS)}"
        )
    
    # Generar nombre único para evitar colisiones
    unique_name = f"{uuid.uuid4().hex}{ext}"
    
    # Crear directorio si no existe
    os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(LOGO_UPLOAD_DIR, unique_name)
    
    # Guardar archivo con límite de 5MB
    MAX_SIZE = 5 * 1024 * 1024  # 5 MB
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="El archivo supera el tamaño máximo permitido (5 MB).")
    
    with open(file_path, 'wb') as f:
        f.write(content)
    
    # Devolver la URL pública relativa al servidor
    public_url = f"/html/img/logos/{unique_name}"
    return {"status": "success", "url": public_url}

@app.get("/api/fondos")
async def listar_fondos():
    """Devuelve la lista de nombres de archivo en la carpeta fondos."""
    os.makedirs(FONDO_UPLOAD_DIR, exist_ok=True)
    archivos = [{"file": "", "label": "Sin Fondo (Gris Plano)"}]
    try:
        for f in os.listdir(FONDO_UPLOAD_DIR):
            if os.path.isfile(os.path.join(FONDO_UPLOAD_DIR, f)):
                ext = os.path.splitext(f)[1].lower()
                if ext in ALLOWED_LOGO_EXTENSIONS:
                    archivos.append({"file": f, "label": f})
    except Exception:
        pass
    return archivos

@app.post("/api/upload-fondo")
async def subir_fondo(file: UploadFile = File(...), token: dict = Depends(verify_token)):
    """Sube una imagen de fondo a la carpeta fondos."""
    original_name = file.filename or ''
    ext = os.path.splitext(original_name)[1].lower()
    if ext not in ALLOWED_LOGO_EXTENSIONS:
        raise HTTPException(
            status_code=400,
            detail=f"Tipo de archivo no permitido. Solo se aceptan: {', '.join(ALLOWED_LOGO_EXTENSIONS)}"
        )
    
    unique_name = f"{uuid.uuid4().hex}{ext}"
    os.makedirs(FONDO_UPLOAD_DIR, exist_ok=True)
    file_path = os.path.join(FONDO_UPLOAD_DIR, unique_name)
    
    MAX_SIZE = 10 * 1024 * 1024  # 10 MB
    content = await file.read()
    if len(content) > MAX_SIZE:
        raise HTTPException(status_code=400, detail="El archivo supera el tamaño máximo permitido (10 MB).")
    
    with open(file_path, 'wb') as f:
        f.write(content)
        
    return {"status": "success", "file": unique_name}

@app.post("/api/importar")
async def importar_asociaciones(
    file: UploadFile = File(...), 
    modo: str = Form("añadir"),
    descargar_logos: str = Form("false"),
    token: dict = Depends(verify_token)
):
    filename = (file.filename or '').lower()
    contents = await file.read()
    
    rows_data = []
    raw_headers = []
    
    if filename.endswith('.ods'):
        if get_data is None:
            raise HTTPException(status_code=500, detail="La librería pyexcel-ods no está instalada en el servidor.")
        try:
            ods_io = io.BytesIO(contents)
            data = get_data(ods_io)
            if not data:
                raise HTTPException(status_code=400, detail="El archivo ODS está vacío.")
            sheet_name = list(data.keys())[0]
            sheet_rows = data[sheet_name]
            if len(sheet_rows) < 2:
                raise HTTPException(status_code=400, detail="El archivo ODS no contiene datos o cabeceras.")
            
            raw_headers = [str(h) for h in sheet_rows[0]]
            for row_list in sheet_rows[1:]:
                if not row_list:
                    continue
                row_dict = {}
                for i, h in enumerate(raw_headers):
                    val = str(row_list[i]) if i < len(row_list) else ""
                    row_dict[h] = val
                rows_data.append(row_dict)
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"Error al procesar ODS: {str(e)}")
            
    else: # Asumir CSV
        try:
            content_str = contents.decode('utf-8')
        except UnicodeDecodeError:
            try:
                content_str = contents.decode('latin-1')
            except Exception:
                raise HTTPException(status_code=400, detail="No se pudo decodificar el archivo CSV. Usa UTF-8 o Latin-1.")
                
        csv_file = io.StringIO(content_str)
        first_line = csv_file.readline()
        delimiter = ';' if ';' in first_line else ','
        csv_file.seek(0)
        
        reader = csv.DictReader(csv_file, delimiter=delimiter)
        if not reader.fieldnames:
            raise HTTPException(status_code=400, detail="El archivo CSV está vacío o no contiene cabeceras.")
            
        raw_headers = list(reader.fieldnames)
        rows_data = list(reader)

    headers_lower = [str(h).strip().lower() for h in raw_headers]
    required = ['nombre', 'siglas', 'descripcion', 'categoria', 'cartera_servicios']
    for req in required:
        match_found = False
        for h in headers_lower:
            clean_h = h.replace('ó', 'o').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ú', 'u')
            if clean_h == req:
                match_found = True
                break
        if not match_found:
            raise HTTPException(status_code=400, detail=f"Cabecera requerida '{req}' no encontrada.")

    # Mapear los nombres de columna reales a las columnas internas
    col_mapping = {}
    for h in raw_headers:
        clean_h = str(h).strip().lower().replace('ó', 'o').replace('í', 'i').replace('á', 'a').replace('é', 'e').replace('ú', 'u').replace('_', '').replace(' ', '')
        if clean_h == 'nombre':
            col_mapping['nombre'] = h
        elif clean_h == 'siglas':
            col_mapping['siglas'] = h
        elif clean_h == 'logourl' or clean_h == 'logo':
            col_mapping['logo'] = h
        elif clean_h == 'descripcion':
            col_mapping['descripcion'] = h
        elif clean_h == 'categoria':
            col_mapping['categoria'] = h
        elif clean_h == 'etiquetas':
            col_mapping['etiquetas'] = h
        elif clean_h == 'contactos':
            col_mapping['contactos'] = h
        elif clean_h == 'carteraservicios' or clean_h == 'cartera':
            col_mapping['cartera'] = h
        elif 'video' in clean_h or 'youtube' in clean_h:
            col_mapping['videos'] = h
        elif clean_h == 'pais':
            col_mapping['pais'] = h
        elif clean_h == 'comunidad':
            col_mapping['comunidad'] = h
        elif clean_h == 'provincia':
            col_mapping['provincia'] = h
        elif clean_h == 'municipio':
            col_mapping['municipio'] = h

    asociaciones_existentes = read_data('asociaciones')
    categorias_existentes = read_data('categorias')
    etiquetas_existentes = read_data('etiquetas')
    
    if modo.lower() == "restaurar":
        asociaciones_existentes = []
        categorias_existentes = []
        etiquetas_existentes = []
        
    nombres_existentes = {a.get('nombre_asociacion', '').lower().strip(): idx for idx, a in enumerate(asociaciones_existentes)}
    siglas_existentes = {a.get('siglas', '').lower().strip(): idx for idx, a in enumerate(asociaciones_existentes) if a.get('siglas')}
    
    nuevas_asociaciones = []
    nuevas_categorias = []
    nuevas_etiquetas = []
    asociaciones_actualizadas = 0
    
    # Copias de apoyo para búsqueda rápida e inserción inline
    cat_temp = list(categorias_existentes)
    eti_temp = list(etiquetas_existentes)
    
    # Conjuntos para evitar duplicados dentro del mismo archivo
    nombres_vistos = set()
    siglas_vistas = set()
    
    # Analizar filas
    for idx, row in enumerate(rows_data, start=2):
        nombre = row.get(col_mapping.get('nombre', 'Nombre'), '').strip()
        siglas = row.get(col_mapping.get('siglas', 'Siglas'), '').strip()
        logo = row.get(col_mapping.get('logo', 'Logo_URL'), '').strip()
        
        if descargar_logos.lower() == "true" and logo.startswith('http'):
            try:
                ext = ".jpg"
                if ".png" in logo.lower(): ext = ".png"
                elif ".webp" in logo.lower(): ext = ".webp"
                unique_name = f"{uuid.uuid4().hex}{ext}"
                os.makedirs(LOGO_UPLOAD_DIR, exist_ok=True)
                local_path = os.path.join(LOGO_UPLOAD_DIR, unique_name)
                
                # Configurar SSL y User-Agent para evitar bloqueos
                import ssl
                ctx = ssl.create_default_context()
                ctx.check_hostname = False
                ctx.verify_mode = ssl.CERT_NONE
                
                req = urllib.request.Request(logo, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'})
                with urllib.request.urlopen(req, context=ctx, timeout=10) as response, open(local_path, 'wb') as out_file:
                    out_file.write(response.read())
                logo = f"/html/img/logos/{unique_name}"
            except Exception as e:
                error_msg = f"No se pudo descargar el logo de {nombre} ({logo}): {str(e)}"
                print(error_msg)
                with open("error_logos.log", "a", encoding="utf-8") as err_log:
                    err_log.write(error_msg + "\n")
                if 'errores_logos' not in locals(): errores_logos = []
                errores_logos.append(error_msg)
        desc = row.get(col_mapping.get('descripcion', 'Descripcion'), '').strip()
        categoria_nombre = row.get(col_mapping.get('categoria', 'Categoria'), '').strip()
        etiquetas_raw = row.get(col_mapping.get('etiquetas', 'Etiquetas'), '').strip()
        contactos_raw = row.get(col_mapping.get('contactos', 'Contactos'), '').strip()
        cartera = row.get(col_mapping.get('cartera', 'Cartera_Servicios'), '').strip()
        videos_raw = row.get(col_mapping.get('videos', 'Videos_YouTube'), '').strip()
        pais_val = row.get(col_mapping.get('pais', 'Pais'), '').strip()
        comunidad_val = row.get(col_mapping.get('comunidad', 'Comunidad'), '').strip()
        provincia_val = row.get(col_mapping.get('provincia', 'Provincia'), '').strip()
        municipio_val = row.get(col_mapping.get('municipio', 'Municipio'), '').strip()
        
        # Saltarse filas vacías
        if not nombre and not siglas and not desc:
            continue
            
        nombre_key = nombre.lower().strip()
        siglas_key = siglas.lower().strip() if siglas else ""

        # Prevenir duplicados dentro del propio archivo (gana la primera aparición)
        if nombre_key in nombres_vistos or (siglas_key and siglas_key in siglas_vistas):
            continue
            
        nombres_vistos.add(nombre_key)
        if siglas_key:
            siglas_vistas.add(siglas_key)
            
        is_duplicate = (nombre_key in nombres_existentes) or (siglas_key and siglas_key in siglas_existentes)
        
        if modo.lower() == "añadir" and is_duplicate:
            continue
            
        if not nombre or not siglas or not desc or not categoria_nombre or not cartera:
            raise HTTPException(
                status_code=400, 
                detail=f"Fila {idx}: Faltan campos requeridos. Nombre, Siglas, Descripcion, Categoria y Cartera_Servicios son obligatorios."
            )
            
        # 1. Resolver Categoría
        cat_id = ""
        for c in cat_temp:
            if c['nombre'].lower().strip() == categoria_nombre.lower():
                cat_id = c['id']
                break
        if not cat_id:
            cat_id = f"cat_{int(time.time() * 1000)}_{idx}"
            nueva_cat = {"id": cat_id, "nombre": categoria_nombre}
            cat_temp.append(nueva_cat)
            nuevas_categorias.append(nueva_cat)
            
        # 2. Resolver Etiquetas
        tag_ids = []
        if etiquetas_raw:
            tags_list = [t.strip() for t in etiquetas_raw.split(',') if t.strip()]
            for tname in tags_list:
                formatted_name = tname if tname.startswith('#') else f"#{tname}"
                tag_id = ""
                for e in eti_temp:
                    if e['nombre'].lower().strip() == formatted_name.lower():
                        tag_id = e['id']
                        break
                if not tag_id:
                    tag_id = f"eti_{int(time.time() * 1000)}_{len(eti_temp)}"
                    nueva_eti = {"id": tag_id, "nombre": formatted_name}
                    eti_temp.append(nueva_eti)
                    nuevas_etiquetas.append(nueva_eti)
                tag_ids.append(tag_id)
                
        # Parsear contactos
        contactos = []
        if contactos_raw:
            for c_str in contactos_raw.split('|'):
                c_str = c_str.strip()
                if ':' in c_str:
                    tipo, valor = c_str.split(':', 1)
                    contactos.append({"tipo": tipo.strip(), "valor": valor.strip()})
                    
        # Parsear videos
        videos = []
        if videos_raw:
            videos = [v.strip() for v in videos_raw.split(',') if v.strip()]
            
        # Parsear ubicacion
        ubicacion_dict = {
            "pais": pais_val,
            "comunidad": comunidad_val,
            "provincia": provincia_val,
            "municipio": municipio_val
        }
                
        # 4. Crear/Actualizar Asociación y validar esquema Pydantic
        try:
            if modo.lower() == "actualizar" and is_duplicate:
                existing_index = nombres_existentes.get(nombre_key)
                if existing_index is None and siglas_key:
                    existing_index = siglas_existentes.get(siglas_key)
                
                if existing_index is not None:
                    existing_id = asociaciones_existentes[existing_index]["id"]
                    nueva_aso = {
                        "id": existing_id,
                        "nombre_asociacion": nombre,
                        "siglas": siglas,
                        "logo": logo if logo else asociaciones_existentes[existing_index].get("logo", ""),
                        "descripcion": desc,
                        "categoria": cat_id,
                        "etiquetas": tag_ids,
                        "contactos": contactos,
                        "cartera_servicios": cartera,
                        "videos": videos if videos else asociaciones_existentes[existing_index].get("videos", []),
                        "ubicacion": ubicacion_dict
                    }
                    validated_asoc = Asociacion(**nueva_aso)
                    asociaciones_existentes[existing_index] = validated_asoc.dict()
                    asociaciones_actualizadas += 1
            else:
                nueva_aso = {
                    "id": f"aso_{uuid.uuid4().hex[:8]}",
                    "nombre_asociacion": nombre,
                    "siglas": siglas,
                    "logo": logo,
                    "descripcion": desc,
                    "categoria": cat_id,
                    "etiquetas": tag_ids,
                    "contactos": contactos,
                    "cartera_servicios": cartera,
                    "videos": videos,
                    "ubicacion": ubicacion_dict
                }
                validated_asoc = Asociacion(**nueva_aso)
                nuevas_asociaciones.append(validated_asoc.dict())
        except ValidationError as e:
            raise HTTPException(
                status_code=400, 
                detail=f"Fila {idx}: Los datos de la asociación no cumplen con el esquema de validación. Error: {e.errors()}"
            )
            
    # 5. Escribir resultados finales
    if nuevas_asociaciones:
        write_data('asociaciones', asociaciones_existentes + nuevas_asociaciones)
    if nuevas_categorias:
        write_data('categorias', cat_temp)
    if nuevas_etiquetas:
        write_data('etiquetas', eti_temp)
        
    mensaje_exito = f"Importación completada. Se añadieron {len(nuevas_asociaciones)} nuevas asociaciones."
    if modo.lower() == "actualizar":
        mensaje_exito += f" Se actualizaron {asociaciones_actualizadas} asociaciones existentes."
        
    errores = locals().get('errores_logos', [])
    if errores:
        mensaje_exito += f"\n\n⚠ Advertencia: Hubo {len(errores)} logos que no se pudieron descargar (las URLs podrían no existir o bloquear descargas automatizadas). Revisa error_logos.log para más detalles."
        
    return {
        "status": "success",
        "message": mensaje_exito,
        "count": len(nuevas_asociaciones) + asociaciones_actualizadas,
        "errores_logos": errores
    }

from fastapi.responses import FileResponse

def _generar_tabla_exportacion():
    asociaciones = read_data('asociaciones')
    categorias = read_data('categorias')
    etiquetas = read_data('etiquetas')
    
    cat_dict = {c['id']: c['nombre'] for c in categorias}
    eti_dict = {e['id']: e['nombre'] for e in etiquetas}
    
    cabeceras = ['Nombre', 'Siglas', 'Descripcion', 'Categoria', 'Cartera_Servicios', 'Logo_URL', 'Etiquetas', 'Contactos', 'Videos_YouTube', 'Pais', 'Comunidad', 'Provincia', 'Municipio']
    filas = []
    
    for a in asociaciones:
        cat_nombre = cat_dict.get(a.get('categoria'), a.get('categoria', ''))
        
        etiquetas_res = [eti_dict.get(e, e) for e in a.get('etiquetas', [])]
        etiquetas_str = ", ".join(etiquetas_res)
        
        contactos = a.get('contactos', [])
        contactos_str = "|".join([f"{c.get('tipo')}:{c.get('valor')}" for c in contactos])
        
        videos = a.get('videos', [])
        videos_str = ", ".join(videos)
        ubicacion = a.get('ubicacion') or {}
        
        fila = [
            a.get('nombre_asociacion', ''),
            a.get('siglas', ''),
            a.get('descripcion', ''),
            cat_nombre,
            a.get('cartera_servicios', ''),
            a.get('logo', ''),
            etiquetas_str,
            contactos_str,
            videos_str,
            ubicacion.get('pais', ''),
            ubicacion.get('comunidad', ''),
            ubicacion.get('provincia', ''),
            ubicacion.get('municipio', '')
        ]
        filas.append(fila)
    return cabeceras, filas

@app.get("/api/exportar/csv")
async def exportar_csv(token: dict = Depends(verify_token)):
    cabeceras, filas = _generar_tabla_exportacion()
    
    fd, path = tempfile.mkstemp(suffix=".csv")
    with os.fdopen(fd, 'w', encoding='utf-8', newline='') as f:
        writer = csv.writer(f, delimiter=';')
        writer.writerow(cabeceras)
        writer.writerows(filas)
        
    return FileResponse(path, media_type="text/csv", filename="backup_asociaciones.csv")

@app.get("/api/exportar/ods")
async def exportar_ods(token: dict = Depends(verify_token)):
    if save_data is None:
        raise HTTPException(status_code=500, detail="pyexcel-ods no está instalado para exportar a ODS.")
        
    cabeceras, filas = _generar_tabla_exportacion()
    data = {"Asociaciones": [cabeceras] + filas}
    
    fd, path = tempfile.mkstemp(suffix=".ods")
    os.close(fd)
    
    save_data(path, data)
    
    return FileResponse(path, media_type="application/vnd.oasis.opendocument.spreadsheet", filename="backup_asociaciones.ods")

@app.get("/api/{recurso}")
async def leer_datos(recurso: str):
    # Obtención pública de datos de catálogo
    return read_data(recurso)

@app.post("/api/{recurso}")
async def escribir_datos(recurso: str, payload: Union[dict, list] = Body(...), token: dict = Depends(verify_token)):
    # Validar el recurso y obtener datos existentes
    get_resource_file(recurso)
    existing_data = read_data(recurso)
    
    # Caso 1: Creación de un solo registro (Envío individual desde el frontend)
    if isinstance(payload, dict):
        try:
            if recurso == 'asociaciones':
                if "id" not in payload or not payload["id"]:
                    payload["id"] = int(time.time() * 1000)
                validated_item = Asociacion(**payload)
                existing_data.append(validated_item.dict())
            elif recurso == 'categorias':
                if "id" not in payload or not payload["id"]:
                    payload["id"] = f"cat_{int(time.time() * 1000)}"
                validated_item = Categoria(**payload)
                existing_data.append(validated_item.dict())
            elif recurso == 'etiquetas':
                if "id" not in payload or not payload["id"]:
                    payload["id"] = f"eti_{int(time.time() * 1000)}"
                validated_item = Etiqueta(**payload)
                existing_data.append(validated_item.dict())
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Datos malformados: {e.errors()}")
        
        write_data(recurso, existing_data)
        return {"status": "success", "item": payload}
        
    # Caso 2: Sobreescritura total en bloque (Para compatibilidad de listados)
    elif isinstance(payload, list):
        validated_list = []
        try:
            for item in payload:
                if recurso == 'asociaciones':
                    validated_list.append(Asociacion(**item).dict())
                elif recurso == 'categorias':
                    validated_list.append(Categoria(**item).dict())
                elif recurso == 'etiquetas':
                    validated_list.append(Etiqueta(**item).dict())
        except ValidationError as e:
            raise HTTPException(status_code=400, detail=f"Lista de datos malformados: {e.errors()}")
        
        write_data(recurso, validated_list)
        return {"status": "success"}
    
    raise HTTPException(status_code=400, detail="Formato de carga inválido")

@app.put("/api/{recurso}/{id}")
async def actualizar_registro(recurso: str, id: str, payload: dict = Body(...), token: dict = Depends(verify_token)):
    get_resource_file(recurso)
    existing_data = read_data(recurso)
    
    # Buscar el registro por ID
    found_index = -1
    for index, item in enumerate(existing_data):
        if str(item.get("id")) == str(id):
            found_index = index
            break
            
    if found_index == -1:
        raise HTTPException(status_code=404, detail="Registro no encontrado")
        
    # Conservar el ID original para evitar mutaciones de ID en BD
    payload["id"] = existing_data[found_index]["id"]
    
    try:
        if recurso == 'asociaciones':
            validated_item = Asociacion(**payload)
            existing_data[found_index] = validated_item.dict()
        elif recurso == 'categorias':
            validated_item = Categoria(**payload)
            existing_data[found_index] = validated_item.dict()
        elif recurso == 'etiquetas':
            validated_item = Etiqueta(**payload)
            existing_data[found_index] = validated_item.dict()
    except ValidationError as e:
        raise HTTPException(status_code=400, detail=f"Datos de actualización malformados: {e.errors()}")
        
    write_data(recurso, existing_data)
    return {"status": "success", "item": existing_data[found_index]}

@app.delete("/api/{recurso}/{id}")
async def eliminar_registro(recurso: str, id: str, token: dict = Depends(verify_token)):
    get_resource_file(recurso)
    existing_data = read_data(recurso)
    
    # Filtrar excluyendo el ID seleccionado
    new_data = [item for item in existing_data if str(item.get("id")) != str(id)]
    
    if len(new_data) == len(existing_data):
        raise HTTPException(status_code=404, detail="Registro no encontrado para eliminar")
        
    write_data(recurso, new_data)
    return {"status": "success"}

# --- SERVIDOR DE ARCHIVOS ESTÁTICOS ---

HTML_DIR = os.path.join(BASE_DIR, "html")
app.mount("/html", StaticFiles(directory=HTML_DIR), name="html")

@app.get("/")
async def root():
    return RedirectResponse(url="/html/index.html")

if __name__ == "__main__":
    import uvicorn
    print("\nIniciando el Catálogo de Asociaciones de forma segura...")
    print("Accede en: https://127.0.0.1:8080\n")
    uvicorn.run(
        "server:app",
        host="127.0.0.1",
        port=8080,
        reload=True,
        ssl_keyfile=os.path.join(BASE_DIR, "key.pem"),
        ssl_certfile=os.path.join(BASE_DIR, "cert.pem")
    )