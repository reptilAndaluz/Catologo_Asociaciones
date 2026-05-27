# 2. ESTUDIO DE VIABILIDAD

## 2.1. Introducción al Estudio de Viabilidad

En el presente capítulo se realiza un análisis de las condiciones técnicas, operativas y temporales que enmarcan el proyecto para evaluar su viabilidad.

El análisis evalúa la situación actual del entorno hospitalario y formula una propuesta de mejora. Posteriormente, se definen los perfiles de usuario, se delimitan las funcionalidades del sistema y se realiza un inventario de los recursos humanos, hardware y software necesarios. Finalmente, se establece la metodología de trabajo y la planificación temporal.

---

## 2.2. Objeto del Proyecto

### 2.2.1. Situación Actual

La iniciativa de participación ciudadana está impulsada por la Comisión de Participación Ciudadana del Hospital Universitario Clínico San Cecilio de Granada, la cual consolida la participación de 26 asociaciones y fundaciones. 

El flujo de trabajo actual se basa en la difusión quincenal de campañas de concienciación mediante material audiovisual. Sin embargo, no se dispone de un repositorio digital unificado y público donde el ciudadano pueda buscar y filtrar este tejido asociativo de forma autónoma.

### 2.2.2. Propuesta de Mejora

Se propone el desarrollo e implementación de un Portal Web Centralizado. Esta herramienta permitirá a los ciudadanos consultar la información de las asociaciones vinculadas al hospital mediante un entorno filtrable. Asimismo, dotará a los administradores del hospital de un Panel de Control para añadir nuevas asociaciones, modificar datos existentes y revisar peticiones de ingreso, reduciendo la dependencia de soporte técnico externo para la actualización de contenidos.

### 2.2.3. Perfiles de Usuario del Proyecto

El sistema está diseñado en torno a un modelo de control de accesos basado en dos roles:

| Perfil de Usuario | Nivel de Privilegios | Funcionalidades Principales |
| :--- | :--- | :--- |
| **Usuario No Registrado (Visitante)** | Público (Nivel 1) | Acceso al directorio completo. Búsqueda por nombre/siglas. Uso de filtros de categoría, etiquetas y localización. Lectura de las fichas de detalle y envío de formularios de solicitud de alta. |
| **Gestor de Contenidos (Administrador)** | Privado (Nivel 2) | Acceso protegido mediante login. Capacidad para **Crear, Leer, Actualizar y Eliminar (CRUD)** asociaciones, categorías y etiquetas. Procesamiento de solicitudes de inclusión e importación masiva de datos (CSV). |

### 2.2.4. Objetivos del Estudio

A corto plazo, el objetivo es facilitar el acceso público a los servicios de participación ciudadana. A medio plazo, se busca agilizar el trabajo administrativo mediante la centralización del directorio en formato digital. A largo plazo, se proyecta estructurar una API RESTful escalable que permita migrar el sistema de almacenamiento a un motor de base de datos relacional si fuera necesario.

---

## 2.3. Descripción del Sistema

### 2.3.1. Funcionalidades Troncales

La aplicación es una plataforma compuesta por una capa de presentación interactiva servida estáticamente, que se comunica con una API dinámica. Sus funcionalidades clave incluyen un motor de búsqueda y filtrado de múltiples variables. Se implementa un panel de control con formularios para la gestión de logotipos y la actualización de registros. Destaca la automatización del etiquetado de asociaciones. La seguridad de las operaciones administrativas se gestiona mediante autenticación por JSON Web Tokens (JWT), garantizando que las comunicaciones con el servidor de datos estén autenticadas.

---

## 2.4. Análisis de Recursos

### 2.4.1. Recursos Humanos
El ciclo de vida completo de la primera versión funcional recaerá sobre el alumnado de prácticas. Estos perfiles asumirán de manera coordinada el desarrollo del Frontend y del Backend durante su periodo formativo en la empresa.

### 2.4.2. Recursos Hardware

| Entorno | Requisitos Mínimos | Justificación |
| :--- | :--- | :--- |
| **Máquina Cliente** | PC, Tablet o Smartphone con conexión a Internet (>56 Kbps) | El procesamiento reside en el servidor; el cliente únicamente renderiza la interfaz. |
| **Servidor Físico / VPS** | CPU de 1-2 núcleos, 1GB RAM, 10GB Almacenamiento HDD/SSD | El uso de JSON y FastAPI (Uvicorn) reduce la huella de memoria necesaria en comparación con stacks tradicionales. |

### 2.4.3. Recursos Software

La pila tecnológica se ha seleccionado priorizando el rendimiento, la escalabilidad y el uso de software de código abierto.

Para el cliente, se requiere soporte en navegadores web modernos (Chromium, Gecko, WebKit). La interfaz se construye utilizando HTML5, CSS3 y Vanilla JavaScript, sin depender de frameworks de interfaz adicionales.

Para el servidor, se recomienda el despliegue sobre un sistema operativo basado en Linux, como Debian Server. El backend se programa en Python 3.9 o superior, ejecutando el framework FastAPI sobre el servidor Uvicorn.

El equipo se apoyará en Visual Studio Code como editor principal, Visual Paradigm para el modelado de diagramas UML, y Git para el control de versiones.

---

## 2.5. Planificación del Proyecto

### 2.5.1. Temporalización Inicial
El proyecto se enmarca entre el 15 de mayo y el 2 de junio de 2026, coincidiendo con el periodo de prácticas. Se estima una dedicación de 6 horas diarias en un marco de tiempo flexible adaptado a la operativa administrativa del hospital.

### 2.5.2. Metodología y Modelo de Desarrollo
Se ha optado por el Modelo Ágil Scrum en lugar de los modelos de desarrollo en cascada, debido a la necesidad de obtener retroalimentación continua por parte de la Comisión de Participación Ciudadana. El enfoque ágil facilita la entrega rápida de prototipos funcionales y la iteración sobre las interfaces conforme se reciben comentarios del equipo médico. La ejecución operativa se segmenta en sprints que abarcan la toma de requisitos, redacción de especificaciones, desarrollo del catálogo público, panel de administración y fase de pruebas.

---

## 2.6. Conclusiones de Viabilidad

Tras la evaluación de las dimensiones operativas, económicas y técnicas, se determina que el proyecto es viable. La elección de arquitecturas ligeras, como FastAPI con almacenamiento JSON, permite el cumplimiento de los plazos sin la necesidad de infraestructura de servidores complejos en la fase inicial. El producto final logrará digitalizar procesos previamente manuales y ofrecer una herramienta funcional para los pacientes y el personal hospitalario.
