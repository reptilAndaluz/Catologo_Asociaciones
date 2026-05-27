# 1. INTRODUCCIÓN

Este proyecto consiste en el diseño, desarrollo e implementación de un portal web integral dedicado a la centralización, agrupación y gestión dinámica de un catálogo que alberga información detallada sobre distintas asociaciones médicas, fundaciones y entidades sin ánimo de lucro vinculadas al entorno de la salud y al hospital.

El presente documento técnico (dividido en siete capítulos principales más bibliografía) abarca todo el ciclo de vida del desarrollo del software: desde la viabilidad inicial, pasando por el análisis de requisitos, el diseño de la arquitectura (Frontend y Backend), hasta la implementación técnica, pruebas y conclusiones finales.

## 1.1. Objetivo y Alcance Previsto

La iniciativa surge de la necesidad de digitalizar los canales de colaboración impulsados por la Comisión de Participación Ciudadana del HUSC. Actualmente, el hospital difunde quincenalmente el trabajo de 26 asociaciones mediante campañas audiovisuales, pero carecía de un espacio centralizado interactivo donde pacientes y profesionales pudieran consultar este ecosistema de apoyo.

### 1.1.1. Objetivos Principales
El objetivo principal es la centralización del acceso a la información, facilitando al usuario (pacientes, familiares o profesionales sanitarios) el acceso estructurado a los datos de las asociaciones, tales como su misión, servicios, localización y métodos de contacto. Simultáneamente, se busca implementar una gestión autónoma, dotando a la administración del hospital de un panel de control privado para crear, modificar, eliminar y filtrar las asociaciones registradas sin depender de personal técnico. Finalmente, el proyecto se orienta a visibilizar la función que desarrollan estas agrupaciones en el voluntariado, el acompañamiento emocional y la educación comunitaria.

### 1.1.2. Alcance del Proyecto
El alcance de esta fase abarca la creación de una interfaz de usuario pública responsiva para consultar el directorio mediante filtros cruzados (categorías, etiquetas, ubicación y búsqueda de texto libre). A esto se suma el desarrollo de un panel de administración restringido por autenticación para la gestión del catálogo. En el backend, se implementa una API RESTful en Python para gestionar peticiones asíncronas, procesar imágenes y validar la integridad de los datos. La persistencia de datos se resuelve mediante almacenamiento en formato JSON, permitiendo salvaguardar el estado del catálogo sin requerir un motor de base de datos relacional en esta etapa inicial. El alcance excluye en esta fase la integración con el historial clínico de los pacientes del HUSC y la gestión de citas médicas a través del portal.

## 1.2. Estado del Arte

El portal web desarrollado es un directorio dinámico avanzado. Existen en la actualidad diversos organismos autonómicos y estatales que ofrecen servicios de catálogos similares en el ámbito de la salud. Para fundamentar el diseño de la solución, se ha realizado un análisis comparativo de portales de referencia:

| Portal de Referencia | Descripción General | Características Clave | Mejora en el proyecto |
| :--- | :--- | :--- | :--- |
| **Censo de Asociaciones en Salud (Junta de Andalucía)** | Red de apoyo oficial que permite consultar las entidades legalmente inscritas. | Filtros por provincia, tipo de asociación y buscador de texto. | Nuestra propuesta añade una experiencia interactiva sin recarga de página al aplicar filtros. |
| **Directorio de Pacientes Sacyl (Castilla y León)** | Portal de salud que mantiene un registro público dividido por categorías clínicas. | Información de contacto operativo (teléfono, email, web, dirección física). | El catálogo implementa un modelo de etiquetado múltiple que complementa la clasificación jerárquica. |
| **Directorio de Salud Mental (Andalucía)** | Catálogo gestionado por la federación autonómica que lista asociaciones orientadas a la salud mental. | Estructura de datos (nombre, dirección, correo, presidencia). | El proyecto del HUSC incluye un flujo de solicitudes de inclusión desde el propio portal. |

La solución asimila las prácticas estructurales del estado del arte, incorporando una arquitectura basada en el desacoplamiento entre cliente y servidor.
