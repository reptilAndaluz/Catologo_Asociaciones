# 5. IMPLEMENTACIÓN

## 5.1. Introducción

En este capítulo se describe el proceso de implementación del portal web para el Hospital Universitario San Cecilio. El objetivo de esta fase ha sido trasladar las especificaciones funcionales y técnicas del diseño arquitectónico a código fuente operativo. El desarrollo se ha llevado a cabo de manera modular, dividiendo la aplicación en tres capas principales: la capa de presentación (Frontend), la capa de lógica de negocio (Backend) y la capa de almacenamiento de datos. Esta separación garantiza un código más mantenible, escalable y con un bajo nivel de acoplamiento.

## 5.2. Capa de Presentación (Frontend)

El entorno de usuario se ha desarrollado con el objetivo de proporcionar una interfaz clara e intuitiva tanto para el usuario público como para el administrador. Se ha optado por un enfoque basado en tecnologías web estándar, evitando el uso de frameworks de JavaScript complejos como React o Angular, con el fin de optimizar el rendimiento, reducir el peso de las descargas iniciales y simplificar el mantenimiento futuro.

Para la estructura de los datos se ha empleado HTML5, garantizando una correcta semántica, accesibilidad para lectores de pantalla y un posicionamiento orgánico adecuado en motores de búsqueda. Se han utilizado etiquetas estructurales estándar (`<header>`, `<main>`, `<section>`, `<article>`) para definir las distintas áreas de la aplicación. Esta organización semántica es fundamental en el renderizado del catálogo, donde cada asociación se presenta mediante una estructura modular y coherente. Asimismo, se han empleado validaciones nativas de HTML5 en los formularios para establecer una primera capa de control sobre la entrada de datos por parte del usuario.

El diseño visual se gestiona de forma centralizada mediante hojas de estilo CSS3. Se ha implementado un archivo principal que define variables corporativas, estandarizando los colores (verde institucional), tipografías y sombras. Para la disposición de los elementos en pantalla, se ha hecho un uso extensivo de CSS Grid y Flexbox. Estas tecnologías permiten que la interfaz se adapte de forma responsiva a cualquier resolución de pantalla, desde monitores de escritorio hasta dispositivos móviles, reorganizando los componentes automáticamente. Adicionalmente, se han añadido transiciones y efectos de interacción (como sombras y cambios de color al pasar el cursor) que mejoran la experiencia de usuario de manera sutil y sin afectar el rendimiento de renderizado.

La interactividad de la plataforma recae en scripts desarrollados en Vanilla JavaScript. Esta capa es responsable de capturar los eventos del usuario, gestionar el filtrado dinámico del catálogo, abrir y cerrar ventanas modales, y validar formularios antes de su envío. Para la comunicación con el servidor, JavaScript utiliza la Fetch API de forma asíncrona, lo que permite enviar y recibir datos en formato JSON sin necesidad de recargar la página. Además, desde el cliente se gestiona el token de sesión (JWT), almacenándolo en el `localStorage` e interceptando las respuestas del servidor para detectar expiraciones de sesión de forma proactiva.

## 5.3. Capa de Negocio (Backend)

La lógica de negocio reside en un servidor backend desarrollado en Python, diseñado para ofrecer una API RESTful asíncrona de alto rendimiento. Esta capa actúa como intermediario entre el cliente y los archivos de datos, validando las peticiones y garantizando la seguridad del sistema.

Para el desarrollo del servidor se ha utilizado el framework FastAPI, elegido por su alto rendimiento y soporte nativo para operaciones asíncronas. FastAPI se ejecuta sobre el servidor ASGI Uvicorn, lo que permite manejar múltiples peticiones concurrentes de manera eficiente. Este entorno procesa todas las solicitudes HTTP, gestiona el enrutamiento y aplica funciones middleware para inyectar cabeceras de seguridad en cada respuesta.

Un componente crítico en esta capa es la validación de datos mediante la librería Pydantic. Se han definido modelos de datos estrictos para cada entidad del sistema (asociaciones, categorías, solicitudes). Antes de que cualquier petición de escritura o modificación acceda a la lógica de persistencia, Pydantic verifica que la estructura y los tipos de datos recibidos coincidan exactamente con el esquema esperado. Si se detecta alguna anomalía, el servidor rechaza automáticamente la petición con un código HTTP 422 o 400, protegiendo la base de datos frente a información malformada o maliciosa.

El control de acceso a los endpoints de administración se gestiona mediante tokens JWT (JSON Web Tokens). Al iniciar sesión, el servidor valida las credenciales y emite un token firmado criptográficamente con una vigencia limitada. Este token debe incluirse en la cabecera `Authorization` de todas las peticiones posteriores que requieran privilegios de administrador. El backend descifra y verifica la firma del token en cada solicitud; si el token es inválido o ha expirado, la operación se aborta devolviendo un error HTTP 401.

## 5.4. Capa de Datos (Almacenamiento Estructurado)

La capa de datos se ha implementado mediante un sistema de almacenamiento basado en archivos de texto plano en formato JSON, descartando el uso de bases de datos relacionales tradicionales para mantener la simplicidad y portabilidad del proyecto.

El acceso y manipulación de estos archivos se realiza mediante los módulos estándar de entrada/salida de Python. Para asegurar la integridad de la información durante las operaciones de escritura, el servidor carga el archivo en memoria, aplica las modificaciones correspondientes sobre los objetos JSON (asignando identificadores únicos UUID cuando es necesario) y vuelve a escribir el documento completo en disco. Este proceso incluye el manejo de excepciones para evitar la corrupción de archivos en caso de interrupciones inesperadas.

Además de los archivos de texto, la capa de datos gestiona el almacenamiento físico de imágenes. Cuando se recibe un logotipo a través del formulario de administración, el servidor valida el peso y la extensión del archivo. Para prevenir colisiones y problemas de seguridad (como ataques de path traversal), el archivo se renombra utilizando un UUID aleatorio antes de ser guardado definitivamente en el directorio de imágenes.

## 5.5. Despliegue y Puesta en Marcha

Para iniciar el servidor en el entorno de producción, es necesario contar con una instalación de Python 3.9 o superior y configurar un entorno virtual que aísle las dependencias del proyecto. Las librerías requeridas (tales como `fastapi`, `uvicorn`, `pyjwt`, `pydantic` y dependencias ligeras de procesamiento de hojas de cálculo como `pyexcel-ods`) se encuentran detalladas en el archivo `requirements.txt` y deben ser instaladas previamente.

Una vez preparadas las dependencias y la estructura de directorios (`html/` y `data/`), el servicio se arranca ejecutando el comando correspondiente de Uvicorn. Este proceso inicia el servidor en el puerto especificado, dejándolo a la escucha para recibir peticiones web, procesar datos y servir el contenido de la plataforma de asociaciones de manera continua.
