
# ScoutPro 360 Football: Elite AI Scouting Platform

**ScoutPro 360** es una plataforma SaaS de grado profesional diseñada para departamentos de captación, agencias de representación y direcciones deportivas de élite. Su objetivo es transformar la observación subjetiva en datos objetivos mediante Inteligencia Artificial (Genkit) y una arquitectura de datos en tiempo real.

---

## 1. Visión y Propuesta de Valor
El sistema se basa en el principio de **"Conciencia Situacional"**, permitiendo que un scout en el estadio o un director deportivo en la oficina tengan acceso instantáneo al patrimonio de inteligencia del club.

- **Métrica PIM (Player Impact Metric)**: Algoritmo propio de IA que puntúa el rendimiento (1-100) ponderado por posición táctica.
- **Patrimonio de Inteligencia**: Evita la fuga de información cuando los scouts abandonan el club, centralizando cada informe en una base de datos privada.
- **Live Reporting**: Interfaz optimizada para móviles que permite la toma de datos tácticos y cronológicos durante el transcurso del partido.

---

## 2. Ecosistema de Módulos

### A. Centro de Mando (Dashboard)
Visualización analítica de la red de captación.
- **KPIs Operativos**: Jugadores detectados, informes generados y media PIM global.
- **Sincronización en Tiempo Real**: Uso de `onSnapshot` para actualizaciones instantáneas de los últimos prospectos identificados.

### B. Identificación Pro (Ficha de Talento)
El paso previo a la evaluación técnica.
- **Metadatos Detallados**: Contacto, valor de mercado, pie dominante, redes sociales y edad calculada.
- **Gestión de Seguimiento**: Clasificación de jugadores en fase de "Captación inicial" antes de generar informes.

### C. Informe 360 & Inteligencia Técnica (IA)
El corazón del sistema. Un flujo de 9 etapas que garantiza rigor metodológico:
1.  **Jugador**: Posicionamiento táctico mediante un **Canvas SVG Interactivo**.
2.  **Contexto**: Análisis del entorno (sistema de juego, clima, importancia del partido).
3.  **Evaluación Multidimensional**: KPIs específicos (1-5) en áreas Técnica, Táctica, Física y Mental.
4.  **Registro de Acciones**: Diario cronológico de eventos clave (exitosos/fallidos).
5.  **Motor Genkit (IA)**: Procesamiento de datos mediante Gemini 2.0 Flash para calcular el **PIM Score** y generar un **Resumen Ejecutivo Profesional**.

### D. Agenda de Scouting
Planificación logística y operativa.
- **Calendario Táctico**: Vista visual de cuadrícula para gestionar la carga de trabajo mensual.
- **Vinculación Directa**: Permite iniciar informes directamente desde un partido programado, ahorrando tiempo al analista.

### E. Historial Cronológico
A diferencia de otros sistemas, ScoutPro permite **múltiples informes por jugador**.
- **Seguimiento de Progresión**: Compara cómo evoluciona el PIM de un jugador a lo largo de la temporada.
- **Análisis de Consistencia**: Detecta si el jugador rinde igual ante rivales de diferentes niveles.

---

## 3. Arquitectura Técnica (Stack)
- **Frontend**: `Next.js 15` (App Router) con `TypeScript`.
- **Backend**: `Firebase Suite`
  - **Auth**: Control de acceso basado en roles (RBAC).
  - **Firestore**: Base de datos NoSQL para alta disponibilidad.
  - **Storage**: Almacenamiento multimedia organizado por nombre de usuario.
- **AI Engine**: `Google Genkit` integrado con `Gemini 2.5 Flash`.
- **UI/UX**: `ShadCN UI` + `Tailwind CSS`. Estética "Tactical Navy" con efectos de cristalografía.

---

## 4. Estructura de Seguridad (RBAC)
La plataforma protege los datos mediante reglas granulares:
- **Analista**: Solo gestiona sus propios informes y talentos.
- **Director/Gestión**: Visión global de toda la red del club (Modo Club).
- **Admin**: Gestión total del sistema y nodos de usuario.

---

## 5. Próximos Pasos (Roadmap)
- [ ] **Mapeo de Talento**: Visualización geoespacial de hotspots de rendimiento.
- [ ] **Benchmarking Táctico**: Comparativa automática de prospectos contra la plantilla actual.
- [ ] **Exportación PDF Pro**: Generación de dossiers corporativos automáticos.

---
**ScoutPro 360** - *La inteligencia que define el futuro de tu equipo.*
