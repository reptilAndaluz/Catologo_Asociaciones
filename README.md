# Catálogo de Asociaciones — Plataforma Web

Esta plataforma web ha sido desarrollada para centralizar, gestionar y difundir la información de las distintas asociaciones médicas y de pacientes vinculadas al hospital, facilitando a los usuarios un acceso directo, dinámico y filtrable a los servicios ofrecidos.

## Tecnologías Utilizadas

- **Frontend**: HTML5 Semántico, CSS3 de última generación (Flexbox/Grid, Diseño Adaptativo y Responsivo) y Vanilla JavaScript.
- **Backend**: Python 3.9+ utilizando la biblioteca de alto rendimiento FastAPI y el servidor ASGI Uvicorn.
- **Almacenamiento**: Persistencia estructurada en texto plano (archivos JSON) con soporte nativo de importación y exportación masiva mediante plantillas en formato CSV y ODS.
- **Seguridad**: Autenticación robusta mediante JSON Web Tokens (JWT), mitigación activa de ataques de Scripting entre Sitios (XSS), inyección de cabeceras seguras (CSP, HSTS), Filtro Honeypot antispam para peticiones públicas y validación rigurosa de esquemas con Pydantic.

---

## Documentación Técnica Completa

Para facilitar la lectura y el mantenimiento de la plataforma, se dispone de formatos de documentación técnica oficial:

### 1. Documentación Técnica Unificada
- **[Manual Técnico Completo (Markdown)](Documentation/Documentacion_Tecnica.md)**: Volumen integral auto-contenido de 2,900 líneas que unifica toda la arquitectura, diseño de bases de datos, protocolos de seguridad y planes de pruebas bajo una única numeración jerárquica y coherente.
- **[Manual Técnico Completo (PDF)](Documentacion_Tecnica.pdf)**: Versión de alta calidad tipográfica lista para impresión o consulta fuera de línea.
- **[Guía de Despliegue en Servidor de Producción](GUIA_DESPLIEGUE.md)**: Manual específico para la instalación, configuración de Nginx como proxy inverso, SSL con Let's Encrypt, servicios del sistema con Systemd y seguridad de puertos mediante Firewall en servidores de producción Linux.

### 2. Capítulos Individuales de la Memoria
El directorio `Documentation/` también alberga los capítulos independientes del proyecto para consultas modulares:
- **[Capítulo 1. Introducción](Documentation/1_introduccion.md)**: Justificación del proyecto, objetivos y estado del arte.
- **[Capítulo 2. Estudio de Viabilidad](Documentation/2_estudio_viabilidad.md)**: Análisis de recursos, temporalización, viabilidad legal y técnica.
- **[Capítulo 3. Análisis del Proyecto](Documentation/3_analisis_proyecto.md)**: Requerimientos funcionales y no funcionales, diagramas de casos de uso y de secuencia.
- **[Capítulo 4. Diseño de la Aplicación](Documentation/4.1_diseno_y_entorno.md)**: Selección del entorno, capas del sistema, modelo JSON y arquitectura de seguridad detallada.
- **[Capítulo 5. Implementación](Documentation/5_implementacion.md)**: Desarrollo de capas de presentación, negocio y datos.
- **[Capítulo 6. Pruebas y Validación](Documentation/6_pruebas.md)**: Protocolos de pruebas de caja negra, seguridad y compatibilidad multi-navegador.
- **[Capítulo 7. Conclusión y Resultados](Documentation/7_conclusiones.md)**: Valoración final del cumplimiento de objetivos y futuras líneas de desarrollo.
- **[Capítulo 8. Bibliografía y Referencias](Documentation/8_bibliografia.md)**: Fuentes, estándares y librerías utilizadas.

---

## Estructura de Directorios del Proyecto

La organización física de los recursos en el repositorio está estructurada según las siguientes directrices:

```text
/
├── Documentation/        # Capítulos individuales y documento técnico unificado
├── data/                 # Capa de almacenamiento persistente (Archivos JSON estructurados)
├── html/                 # Código fuente del Frontend (Vistas HTML, Estilos CSS y Lógica JS)
├── server.py             # Servidor principal y endpoints de la API en Python/FastAPI
├── requirements.txt      # Archivo de definición de dependencias del entorno de ejecución
├── plantilla.csv         # Plantilla estándar para la carga y registro masivo de asociaciones
├── generar_cert.py       # Script utilitario para la generación automática de certificados SSL locales
├── cert.pem / key.pem    # Certificado y clave privada local para conexiones seguras HTTPS
└── README.md             # Este manual introductorio
```

---

## Instrucciones de Instalación y Puesta en Marcha

Para desplegar la aplicación localmente en su entorno de desarrollo, siga los siguientes pasos:

### 1. Preparación del Entorno
Es recomendable crear y activar un entorno virtual de Python antes de instalar las dependencias:
```bash
# Crear entorno virtual
python3 -m venv venv

# Activar entorno virtual
source venv/bin/activate
```

### 2. Instalación de Dependencias
Instale los paquetes requeridos utilizando el gestor de paquetes pip:
```bash
pip install -r requirements.txt
```

### 3. Ejecución del Servidor de Desarrollo
Arranque el servidor local Uvicorn con recarga automática para desarrollo en el puerto 8080:
```bash
python -m uvicorn server:app --reload --port 8080
```

### 4. Acceso al Aplicativo
Una vez iniciado el servidor, abra su navegador web de preferencia e ingrese a la siguiente dirección:
```text
http://localhost:8080/html/index.html
```
