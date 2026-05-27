# Portal Web

Bienvenido al repositorio del proyecto del **Catálogo de Asociaciones**. Esta plataforma web ha sido desarrollada para centralizar, gestionar y difundir la información de las distintas asociaciones médicas y de pacientes vinculadas al hospital, facilitando a los usuarios un acceso directo, dinámico y filtrable a los servicios ofrecidos.

## Tecnologías Utilizadas
- **Frontend**: HTML5 Semántico, CSS3 (Flexbox/Grid, Responsive), Vanilla JavaScript.
- **Backend**: Python 3.9+, FastAPI, Uvicorn (ASGI).
- **Almacenamiento**: Persistencia estructurada en texto plano (archivos JSON) y soporte de importación/exportación masiva mediante CSV y hojas de cálculo libres (ODS).
- **Seguridad**: Autenticación mediante JSON Web Tokens (JWT), mitigación XSS, políticas CSP, Filtro Honeypot antispam y validación de esquemas con Pydantic.

---

## Índice de Documentación Técnica

La documentación del proyecto se encuentra estructurada y almacenada en el directorio `Documentation/`. A continuación se detalla el índice con enlaces directos a cada uno de los puntos desarrollados:

### Capítulos Iniciales
*   [Capítulo 1. Introducción](Documentation/1_introduccion.md)
*   [Capítulo 2. Estudio de Viabilidad](Documentation/2_estudio_viabilidad.md)
*   [Capítulo 3. Análisis del Proyecto](Documentation/3_analisis_proyecto.md)

### Capítulo 4. Diseño
*   [4.1. Diseño y Entorno de Desarrollo](Documentation/4.1_diseno_y_entorno.md)
*   [4.2. Configuración de la plataforma](Documentation/4.2_configuracion_plataforma.md)
*   [4.3. Capas de la aplicación](Documentation/4.3_capas_aplicacion.md)
*   [4.4. Estructura de la Base de Datos (Archivos JSON)](Documentation/4.4_estructura_base_datos.md)
*   [4.5. Arquitectura de la aplicación](Documentation/4.5_arquitectura_aplicacion.md)
*   [4.6. Interfaz (Entornos y Vistas del Portal)](Documentation/4.6_interfaz_usuario.md)
*   [4.7. Seguridad y Control de Acceso](Documentation/4.7_seguridad_acceso.md)

### Capítulo 5. Implementación
*   [5. Implementación, Despliegue y Puesta en Marcha](Documentation/5_implementacion.md)

### Capítulo 6. Pruebas y Validación
*   [6. Pruebas Funcionales, de Seguridad y de Compatibilidad](Documentation/6_pruebas.md)

### Capítulo 7. Conclusiones
*   [7. Conclusiones, Resultados y Líneas de Mejora](Documentation/7_conclusiones.md)

### Capítulo 8. Bibliografía
*   [8. Bibliografía, Referencias y Librerías](Documentation/8_bibliografia.md)

---

## Estructura de Directorios del Proyecto

```text
/
├── Documentation/        # Documentación técnica en formato Markdown
├── html/                 # Archivos estáticos del Frontend (HTML, CSS, JS, Imágenes)
├── data/                 # Capa de datos y persistencia (Archivos JSON)
├── server.py             # Script principal del backend (Servidor FastAPI)
├── requirements.txt      # Dependencias y librerías de Python requeridas
└── README.md             # Este archivo
```

## Puesta en Marcha Rápida
Para ejecutar la plataforma en modo desarrollo:
1. Instalar dependencias: `pip install -r requirements.txt`
2. Arrancar el servidor: `python -m uvicorn server:app --reload --port 8080`
3. Navegar a: `http://localhost:8080/html/index.html`
