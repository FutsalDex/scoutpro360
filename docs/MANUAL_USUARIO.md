# Manual de Usuario Detallado - ScoutPro 360 Football

Bienvenido a la guía maestra de **ScoutPro 360**. Este documento define la estructura operativa y de seguridad de la plataforma.

---

## 0. Estructura de Roles y Seguridad
La plataforma utiliza un sistema de Control de Acceso Basado en Roles (RBAC) para proteger la integridad de los datos de captación.

### Usuario Administrador Maestro
*   **Identificador**: `admin.scoutpro360@gmail.com`
*   **Capacidades**: Acceso total, gestión de perfiles y visibilidad completa de todas las analíticas.

### Matriz de Permisos por Rol
*   **Administrador**: Acceso total a todos los módulos.
*   **Analista / Entrenador / Director Deportivo**: Enfocados en la captación. Acceso a Operaciones (Dashboard, Informes en Vivo, Base de Datos Global) y Mapeo de Talento.
*   **Gestión Club**: Enfocados en estrategia. Acceso a Dashboard, Base de Datos, Mapeo y los módulos avanzados de **Analytics** y **Benchmarking**.
*   **Invitado (Guest)**: Acceso de solo lectura al Dashboard y al Mapeo de Talento para demostraciones.

---

## 1. Centro de Mando (Dashboard)
*   **Objetivo**: Obtener una "Conciencia Situacional" inmediata de las operaciones de captación del club.
*   **Funcionamiento**:
    *   **KPIs de Rendimiento**: Muestra el total de jugadores en Firestore y el PIM promedio real de la base de datos.
    *   **Top Targets**: Lista filtrada automáticamente con jugadores de Grado A.
*   **Resultado**: Optimización del tiempo táctico.

## 2. Informe en Vivo (Live Report)
*   **Objetivo**: Estandarizar la toma de datos durante los partidos.
*   **IA Analytics**: 
    *   **Calcular PIM**: Gemini analiza los datos técnicos y tácticos para generar un score de 0 a 100.
    *   **Resumen Ejecutivo**: Generación de texto profesional basado en las notas del scout.
*   **Persistencia**: Los datos se guardan en tiempo real en la colección `reports` vinculada al jugador.

## 3. Base de Datos Global
*   **Objetivo**: Patrimonio de inteligencia centralizado.
*   **Funcionamiento**: Búsqueda avanzada y filtrado de los jugadores registrados por toda la red de scouts del club.

## 4. Mapeo de Talento (Talent Mapping)
*   **Objetivo**: Análisis geográfico estratégico. Visualiza dónde se está detectando el mayor índice de PIM para optimizar recursos de viaje.

## 5. Hub de Analítica & PIM Benchmarking
*   **Objetivo**: Validar si un fichaje es superior a la plantilla actual.
*   **Delta PIM**: Compara al prospecto contra el "Squad Benchmark" (el promedio del club en esa posición).

---
**ScoutPro 360** - *La inteligencia que define el futuro de tu equipo.*
