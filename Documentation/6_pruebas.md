# 6. PRUEBAS Y VALIDACIÓN

## 6.1. Introducción

Este capítulo detalla la batería de pruebas diseñada y ejecutada tras concluir la fase de implementación. El objetivo de estas pruebas es verificar que el portal web cumple con los requerimientos funcionales, arquitectónicos y de seguridad definidos en la planificación del proyecto.

Las pruebas se han dividido en tres categorías. Las pruebas funcionales se encargan de validar la operatividad de los flujos de interacción para usuarios y administradores. Las pruebas de seguridad evalúan la protección del sistema ante accesos no autorizados y vulnerabilidades web comunes. Por último, las pruebas de compatibilidad certifican el correcto funcionamiento del diseño responsivo en diversos entornos de renderizado y navegadores.

---

## 6.2. Pruebas Funcionales

Las pruebas funcionales se enfocan en confirmar que cada módulo de la aplicación responde adecuadamente a las acciones esperadas.

Para el usuario no registrado, se evaluó el renderizado inicial del catálogo. Al acceder a la raíz del directorio, el sistema lee correctamente el archivo JSON y renderiza la cuadrícula de tarjetas de forma inmediata, inyectando imágenes por defecto en aquellos registros sin logotipo asignado. Posteriormente, se comprobó el filtrado dinámico mediante la selección concurrente de categorías y etiquetas en los menús desplegables; la interfaz actualiza los resultados en el cliente de manera instantánea filtrando los nodos sin generar peticiones adicionales al servidor. Finalmente, la prueba del buscador de texto libre demostró una respuesta reactiva, filtrando las coincidencias por siglas y nombres mientras se teclea, sin distinguir entre mayúsculas y minúsculas.

Para el usuario administrador, se validó el mecanismo de creación de entradas. Tras rellenar un formulario con todos los datos requeridos y adjuntar una imagen válida, el backend recibe la petición, valida la estructura mediante Pydantic, renombra la imagen con un identificador único, persiste los datos y devuelve un código de éxito que actualiza la interfaz. También se ejecutaron pruebas de manejo de errores, como enviar un formulario omitiendo campos obligatorios; en este caso, FastAPI intercepta la petición inválida, rechaza la escritura y devuelve un error HTTP 422, preservando la integridad del archivo de datos. Por último, se comprobó que las opciones de modificación y borrado operan de forma precisa, actualizando datos descriptivos sin alterar identificadores, o eliminando entidades completas de la base de datos y de la vista en tiempo real.

Adicionalmente, se auditó exhaustivamente el **Módulo de Gestión de Categorías**:
- **Consistencia de Cuentas:** Se verificó que cada tarjeta reflejase con precisión la cantidad de asociaciones asignadas cruzando los datos devueltos por `/api/asociaciones`.
- **Integridad Referencial en Borrado:** Al pulsar el botón de eliminación en categorías con vinculaciones activas, se comprobó que el botón estuviera deshabilitado nativamente y que el tooltip visual advirtiera de la imposibilidad de la acción. Para categorías con 0 asociaciones, el borrado se ejecutó correctamente en el servidor mediante `DELETE` tras confirmación.
- **Sincronización en Caliente:** Al confirmarse la supresión de una categoría vacía, se verificó la desaparición inmediata de su tarjeta y su remoción en el selector dinámico del formulario de entrada de datos sin provocar recargas del navegador.

---

## 6.3. Pruebas de Seguridad y Control de Accesos

Se realizaron pruebas específicas para verificar la protección del sistema ante accesos ilegítimos y vulnerabilidades comunes, dado el carácter sensible de la administración de la plataforma.

En el apartado de autenticación JWT, se simuló un intento de acceso directo a los endpoints protegidos (API) sin incluir la cabecera de autorización. El middleware de FastAPI rechazó correctamente la conexión devolviendo un estado HTTP 401. Asimismo, se auditó la expiración del token iniciando una sesión legítima y rebasando el límite temporal de caducidad. Al intentar realizar una modificación posterior, el servidor detectó la caducidad temporal de la firma, devolvió un error de acceso no autorizado y el script cliente forzó la redirección al formulario de autenticación, limpiando las variables locales.

Para prevenir la inyección de código (*Cross-Site Scripting*), se insertaron cadenas maliciosas de JavaScript en los campos de los formularios. La interfaz neutraliza estos vectores de ataque gracias a la manipulación segura del DOM mediante el uso exclusivo de la propiedad `textContent`, que renderiza el contenido como texto plano. Además, las funciones de sanitización bloquearon el uso de pseudoprotocolos maliciosos (como `javascript:`) en las direcciones web. Adicionalmente, el formulario de contacto público se evaluó mediante herramientas que simulan tráfico bot, comprobando que el campo oculto (Honeypot) intercepta con éxito envíos automatizados, abortando la petición HTTP localmente y protegiendo el backend de sobrecargas de spam.

---

## 6.4. Pruebas de Compatibilidad y Diseño (Frontend)

Para garantizar una experiencia de usuario uniforme en múltiples plataformas, se ejecutaron pruebas de renderizado visual.

La adaptabilidad a dispositivos móviles se confirmó redimensionando la ventana del navegador. Las reglas de maquetación fundamentadas en CSS Grid reestructuraron correctamente la cuadrícula principal, pasando de varias columnas a un diseño de columna única en resoluciones correspondientes a teléfonos móviles. El menú de navegación se ocultó adecuadamente, sustituyéndose por elementos desplegables que previenen el desbordamiento horizontal, mientras que los formularios ajustaron su ancho para ocupar la totalidad de la pantalla.

Se realizaron pruebas de robustez visual ante sobrecarga de información:
- **Prueba de Títulos Extensos:** Se inyectaron nombres de asociaciones de más de 80 caracteres. El script cliente truncó con éxito la denominación a 55 caracteres en la tarjeta pública añadiendo los puntos suspensivos e inyectando el tooltip nativo `title` visible en hover.
- **Prueba de Saturación de Etiquetas:** Se asignaron más de 12 etiquetas secundarias a un solo registro. Las reglas de maquetación CSS contuvieron las etiquetas en un máximo de dos filas (`max-height: 3.6rem` con envoltura), manteniendo perfectamente alineado el botón de detalles de la tarjeta y el resto de la rejilla.
- **Páginas Institucionales y Fondo Dinámico:** Se visitaron las nuevas páginas enlazadas del pie de página (`guia.html`, `aviso.html`, `privacidad.html`, `accesibilidad.html`) comprobando que cargaran correctamente el fondo de pantalla personalizado establecido desde el panel de administración HUSC de forma síncrona.

La prueba de compatibilidad cruzada de navegadores consistió en acceder al portal desde las versiones más recientes de Google Chrome, Mozilla Firefox, Microsoft Edge y Safari. Las validaciones arrojaron resultados satisfactorios: las propiedades CSS avanzadas, las transiciones y las tipografías corporativas se renderizaron correctamente y sin discrepancias en todos los motores probados.

---

## 6.5. Conclusión de las Pruebas

Los resultados del ciclo de auditoría técnica certifican la estabilidad y seguridad de la aplicación web. Los mecanismos de protección JWT y las defensas contra XSS operan correctamente, mitigando las amenazas perimetrales evaluadas. A nivel funcional, la lógica cliente desarrollada en JavaScript procesa los datos JSON del servidor asíncrono con precisión y rendimiento adecuado. Por lo tanto, el software cumple los estándares requeridos y se declara apto para su paso a entorno de producción o despliegue definitivo.
