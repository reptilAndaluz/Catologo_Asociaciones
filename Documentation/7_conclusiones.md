# 7. CONCLUSIÓN Y RESULTADOS

## 7.1. Introducción

En este último capítulo se realiza una evaluación global del proyecto desarrollado para el Hospital Universitario Clínico San Cecilio. El objetivo es analizar el cumplimiento de los requerimientos iniciales, evaluar los resultados técnicos obtenidos y proponer líneas de mejora funcional y arquitectónica para futuras iteraciones de la plataforma.

---

## 7.2. Consecución de los Objetivos

Tras la finalización de las fases de diseño, implementación y pruebas, los objetivos definidos en el estudio de viabilidad se han alcanzado satisfactoriamente.

Se ha logrado centralizar la información, agrupando los datos de las distintas asociaciones médicas y de pacientes vinculadas al área de influencia del hospital en un único directorio digital accesible. Frente a catálogos estáticos, la plataforma implementada ofrece un sistema funcional de categorización clínica, etiquetado múltiple y un motor de búsqueda asíncrono que facilita la localización rápida de recursos de apoyo por parte de los usuarios.

Para la gestión de la plataforma, se ha desarrollado un panel de administración que otorga autonomía a la Comisión de Participación Ciudadana. Este portal privado permite a los usuarios autorizados crear, editar, subir logotipos y eliminar entradas de manera intuitiva y visual, eliminando la dependencia de perfiles técnicos para la actualización periódica del contenido. Además, el proyecto se ha construido bajo un enfoque de desarrollo seguro, utilizando FastAPI para mitigar vulnerabilidades web, implementando autenticación mediante tokens JWT y añadiendo mecanismos preventivos antispam y validación estricta de esquemas.

---

## 7.3. Resultados Obtenidos y Beneficios

La implantación de este proyecto aporta beneficios directos tanto a los ciudadanos como a la administración del hospital.

Desde el punto de vista del usuario no registrado o paciente, la plataforma mejora la accesibilidad a la información. El diseño responsivo garantiza una navegación fluida desde dispositivos móviles y de escritorio. La presentación estructurada de datos de contacto, carteras de servicios, vídeos institucionales y ubicaciones reduce la curva de aprendizaje, permitiendo que cualquier visitante encuentre el apoyo requerido de forma clara y directa.

Para el perfil de administrador, la eficiencia operativa se incrementa significativamente. La publicación de nuevas asociaciones se realiza en pocos pasos gracias al sistema de gestión y carga de imágenes optimizado. Asimismo, la integración del formulario público automatiza la recepción de solicitudes de inclusión externas; estas peticiones se estandarizan, se limpian de envíos ilegítimos mediante barreras antispam, y se centralizan ordenadamente en la bandeja de auditoría para su revisión.

---

## 7.4. Líneas de Mejora del Proyecto (Trabajo Futuro)

A pesar de que el producto final cumple con los requerimientos técnicos fijados, se plantean diversas ampliaciones y mejoras arquitectónicas para asegurar la escalabilidad del sistema a medio y largo plazo.

En relación a la persistencia de datos, el sistema actual opera mediante archivos JSON. Ante un futuro incremento significativo del volumen de asociaciones y peticiones concurrentes, sería recomendable migrar la capa de persistencia a un motor de base de datos relacional robusto (como MySQL o PostgreSQL), implementando un modelo entidad-relación formal que mejore la transaccionalidad.

A nivel de seguridad y roles, la autenticación actual se basa en credenciales estandarizadas en variables de entorno. Una línea de mejora consistiría en el diseño de un sistema de gestión de usuarios dinámico, con almacenamiento de contraseñas cifradas y establecimiento de privilegios granulares o roles jerárquicos (por ejemplo, administradores y superadministradores), lo que permitiría mantener registros de auditoría por usuario.

Para optimizar el rendimiento de la red y el renderizado en cliente, en caso de que el censo de entidades crezca de forma notable, será necesario implementar un sistema de paginación en el servidor. Modificando los endpoints para admitir parámetros de paginación, el backend podría enviar paquetes fraccionados de datos bajo demanda, aliviando el ancho de banda y el consumo de recursos en el navegador.

Finalmente, se propone incorporar un módulo de estadísticas en el panel de administración que registre métricas de uso y búsquedas frecuentes, aportando valor analítico a la toma de decisiones institucionales. Del mismo modo, la plataforma podría ampliarse con un sistema de tablón de noticias o agenda de eventos, permitiendo a las asociaciones comunicar talleres o reuniones de manera directa y dinámica dentro de la web del hospital.
