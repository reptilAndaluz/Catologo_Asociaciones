# 8. BIBLIOGRAFÍA Y REFERENCIAS

En este apartado se detallan todas las fuentes de información, documentación oficial de lenguajes y librerías, así como los estándares web y la bibliografía técnica exhaustiva consultada para el diseño, el desarrollo estructurado y la implementación segura del portal web del Hospital Universitario Clínico San Cecilio.

## 8.1. Documentación Oficial de Lenguajes y Entornos

El desarrollo estructural del frontend se apoyó intensivamente en la documentación de la Mozilla Developer Network (MDN Web Docs), sirviendo como la guía principal para la implementación de la capa de presentación mediante HTML5 semántico, maquetación avanzada con CSS3 (incluyendo directivas de Flexbox y CSS Grid) y el uso nativo de la API de JavaScript puro para manipular el DOM y gestionar las peticiones asíncronas con Fetch API. 

En lo que respecta al servidor, se recurrió constantemente a la documentación oficial de Python 3 para asegurar un manejo nativo y optimizado de las operaciones de lectura y escritura de archivos físicos mediante el módulo JSON, así como para la gestión segura de directorios del sistema operativo y la captura robusta de excepciones genéricas. Paralelamente, la construcción del backend dependió de la documentación oficial del framework FastAPI, la cual fue consultada en profundidad para diseñar el enrutamiento inteligente, configurar la validación automatizada de esquemas y estructurar el manejo de middlewares interceptores. Todo este andamiaje lógico fue ejecutado apoyándose en la documentación de Uvicorn, el servidor de interfaz de pasarela asíncrona elegido para soportar la ejecución concurrente de la aplicación web en Python.

## 8.2. Librerías y Dependencias del Proyecto

La inmunidad y validación de los datos descansó sobre la librería Pydantic. Su extensa documentación permitió dominar la gestión de configuraciones y la validación estricta utilizando anotaciones de tipos de Python, siendo un pilar esencial para depurar los esquemas correspondientes a asociaciones, ubicaciones y contactos antes de permitir su persistencia en el disco.

Para garantizar el control de acceso, se empleó la librería PyJWT, cuya referencia fue crucial para implementar la codificación y decodificación de tokens bajo el estricto estándar de la industria, garantizando así la generación de firmas criptográficas irrompibles durante el proceso de inicio de sesión de los administradores. Asimismo, la interceptación y lectura de archivos en streaming, como los logotipos de las asociaciones, fue posible gracias a la consulta del analizador python-multipart, un decodificador requerido intrínsecamente por FastAPI para procesar datos en formato de formulario codificado.

## 8.3. Estándares y Protocolos Web

La arquitectura de seguridad se basó fundamentalmente en la especificación abierta JSON Web Token (RFC 7519) dictada por la IETF, la cual definió el modo compacto e inviolable para transmitir información de identidad entre el cliente y el servidor. La comprensión práctica de este estándar se consolidó a través de plataformas interactivas de depuración proporcionadas por Auth0.

Por otro lado, todas las defensas y mitigaciones de ataques inyectados se diseñaron tomando como referencia innegable las directrices del Open Web Application Security Project (OWASP). Sus documentos sobre ciberseguridad aplicada dictaron las normas para prevenir ataques de Cross-Site Scripting (XSS) obligando al uso de texto plano en el cliente, y guiaron el endurecimiento extremo del backend mediante la inyección meticulosa de políticas de seguridad de contenido (CSP) en las cabeceras HTTP. Este blindaje se completó siguiendo las normativas del estándar de Intercambio de Recursos de Origen Cruzado (CORS) consultadas directamente en MDN y aplicadas a través del middleware de FastAPI.

## 8.4. Recursos Gráficos y Herramientas

A nivel estético, la interfaz de usuario adquirió su identidad visual corporativa y moderna gracias al servicio de fuentes en la nube de Google Fonts, desde donde se importaron y sirvieron tipografías optimizadas para lectura digital. Finalmente, la materialización del código en todas sus capas, al igual que la redacción exhaustiva de este mismo documento técnico en formato Markdown, se llevó a cabo utilizando Visual Studio Code, un entorno de desarrollo integrado que centralizó y agilizó toda la operativa del proyecto.
