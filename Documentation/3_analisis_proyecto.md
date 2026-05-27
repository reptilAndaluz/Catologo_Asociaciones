# 3. ANÁLISIS DEL PROYECTO

## 3.1. Introducción

En este capítulo se detallan los requerimientos funcionales y no funcionales que rigen la lógica de negocio y las restricciones del portal web del Hospital Universitario Clínico San Cecilio.

El análisis funcional define los perfiles de usuario, sus privilegios asociados y presenta diagramas de casos de uso y secuencia para ilustrar la interacción entre los actores y el sistema. Asimismo, se establecen las restricciones arquitectónicas y los objetivos de diseño requeridos para asegurar la mantenibilidad y seguridad de la plataforma.

---

## 3.2. Requerimientos Funcionales

Los requerimientos funcionales establecen las operaciones que debe realizar el sistema y los servicios ofrecidos a cada actor.

### 3.2.1. Visión General del Negocio

El proyecto tiene como núcleo funcional la centralización en un entorno web de todas las asociaciones vinculadas al hospital. El sistema debe permitir a los visitantes consultar un directorio interactivo, y proveer a los administradores de un panel de control para gestionar el catálogo público mediante la lectura y escritura de archivos JSON desde la API.

### 3.2.2. Requisitos Funcionales por Perfil de Usuario

El sistema aplica un control de acceso basado en roles. Para esta fase se definen dos niveles de privilegio activos, y se proyecta un tercero para futuras iteraciones:

#### Nivel 1: Usuario No Registrado (Visitante)
Representa al público en general. Sus funciones se limitan a la lectura y envío de solicitudes de contacto. Posee capacidad de búsqueda textual y filtrado por etiquetas, categorías médicas y ubicación geográfica. Tiene acceso a la ficha de detalles de cada asociación (descripción, servicios, redes sociales, vídeos). Asimismo, el visitante puede enviar propuestas de alta de nuevas asociaciones mediante un formulario web público. Finalmente, dispone de acceso al formulario de inicio de sesión para autenticarse si dispone de credenciales.

#### Nivel 2: Usuario Registrado (Gestor de Contenidos)
Representa al personal autorizado del hospital. Este perfil hereda las capacidades del visitante e incorpora privilegios de escritura. Para acceder a sus funciones privadas, debe iniciar sesión mediante credenciales y obtener un token JWT válido. Una vez autenticado, puede crear nuevas asociaciones en el catálogo, editar cualquier campo de asociaciones existentes y gestionar la subida de logotipos e imágenes de fondo globales. También dispone de permisos para eliminar registros permanentemente. El gestor tiene acceso a la bandeja de entrada para revisar y aprobar solicitudes de inclusión ciudadana. Además, puede utilizar una utilidad de importación masiva de datos y descargar copias de seguridad de todo el catálogo en formatos CSV y ODS.

#### Nivel 3: Usuario Administrador (Escalabilidad Futura)
Este nivel se proyecta para fases posteriores de desarrollo. Estará encargado de la creación, gestión y auditoría de los usuarios gestores, asignando o revocando credenciales mediante una interfaz gráfica. En la fase actual, las credenciales del Nivel 2 están gestionadas internamente en el backend.

---

### 3.2.3. Diagramas de Casos de Uso

A continuación se modela de forma gráfica la relación entre los actores y los casos de uso principales.

#### 3.2.3.1. Actores No Registrados (Visitantes)
> ![Diagrama de Casos de Uso Usuarios No Registrados](img/diagrama_casos_uso_1.png)

#### 3.2.3.2. Actores Registrados (Gestores)
> ![Diagrama de Casos de Uso Usuarios Registrados](img/diagrama_casos_uso_2.png)

---

### 3.2.4. Diagramas de Secuencia

Estos diagramas detallan el flujo de mensajes asíncronos entre el cliente, la API y la capa de almacenamiento de datos.

#### 3.2.4.1. Flujo de Lectura y Autenticación (Visitantes)
> ![Diagramas de secuencia usuario no registrado](img/diagrama_secuencia_1.png)

#### 3.2.4.2. Flujo de Escritura y Edición (Gestores de Contenido)
> ![Diagramas de secuencias gestor](img/diagrama_secuencia_2.png)

---

### 3.2.5. Menús de Navegación Condicionales

La interfaz muestra los elementos del menú principal en función de la sesión activa del usuario. Durante la navegación pública, el menú incluye enlaces al inicio, el catálogo y el formulario de contacto. Si se detecta una sesión administrativa válida, la interfaz muestra los enlaces adicionales para la gestión de entidades y transforma el enlace de acceso principal en una opción de cierre de sesión.

---

## 3.3. Requerimientos No Funcionales

Los requerimientos no funcionales definen las restricciones tecnológicas, estándares de rendimiento y normativas de seguridad de la aplicación.

### 3.3.1. Restricciones de Arquitectura y Seguridad

La arquitectura del sistema requiere la separación de capas mediante una API RESTful. El frontend no debe realizar operaciones directas sobre el sistema de archivos de datos; toda lectura o escritura debe realizarse exclusivamente mediante peticiones a los endpoints del servidor en Python.

En cuanto al control de accesos, el servidor opera bajo un modelo sin estado (stateless). La validación de privilegios se realiza verificando el token criptográfico JWT adjunto en la cabecera de las peticiones HTTP. Si el token está ausente, manipulado o expirado, el servidor debe devolver un error de autorización 401.

Para prevenir la inyección de código (Cross-Site Scripting), el frontend debe utilizar propiedades de renderizado de texto plano (`textContent`) en lugar de insertar HTML dinámicamente cuando renderice datos externos. Además, la API backend implementa validaciones estrictas usando Pydantic, garantizando que el servidor compruebe los tipos y campos obligatorios antes de escribir en disco, con el fin de evitar corrupciones en los archivos JSON.

### 3.3.2. Objetivos de Diseño y Experiencia de Usuario (UX)

La plataforma debe implementar un diseño visual centralizado basado en variables CSS, permitiendo futuras actualizaciones a la paleta de colores corporativa del hospital.

La interfaz prioriza la claridad y legibilidad, aplicando un diseño minimalista y sobrio que utiliza predominantemente colores institucionales sobre fondos de alto contraste.

La accesibilidad y adaptabilidad a dispositivos (Responsive Design) es obligatoria en todas las vistas. El catálogo, las ventanas modales y el panel de administración deben reestructurarse dinámicamente mediante propiedades como CSS Grid y Flexbox, asegurando la usabilidad en monitores de escritorio, tablets y dispositivos móviles sin generar barras de desplazamiento horizontales.
