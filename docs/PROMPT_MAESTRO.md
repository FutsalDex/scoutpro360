# Prompt Maestro: ScoutPro 360 Football

## 1. Visión General
**ScoutPro 360** es una plataforma SaaS de grado profesional para departamentos de scouting y direcciones deportivas de élite. Su objetivo es transformar la observación subjetiva en datos objetivos mediante Inteligencia Artificial (Genkit) y una arquitectura de datos en tiempo real (Firebase).

## 2. Objetivos del Sistema
- **Objetivación del Talento**: Implementar el algoritmo **PIM (Player Impact Metric)** para puntuar jugadores de 0 a 100.
- **Eficiencia Operativa**: Digitalizar la toma de datos en vivo durante los partidos (Live Reporting).
- **Patrimonio de Inteligencia**: Crear una base de datos global propia del club, evitando la fuga de información.
- **Benchmarking Táctico**: Comparar prospectos externos contra el rendimiento medio de la plantilla actual.

## 3. Arquitectura Técnica
- **Frontend**: Next.js 15 (App Router) con TypeScript.
- **Backend**: Firebase Suite (Auth para RBAC, Firestore para datos, Storage para multimedia).
- **AI Engine**: Google Genkit con Gemini 2.0 Flash para cálculo de PIM y resúmenes ejecutivos.
- **UI Components**: ShadCN UI (Radix Primitives) para una interfaz consistente y accesible.
- **Estilos**: Tailwind CSS con un sistema de diseño basado en variables HSL.

## 4. Diseño y Estética (UI/UX)
- **Concepto**: "Modern Tactical Ops". Una interfaz que evoca centros de mando militares o financieros, transmitiendo precisión y seriedad.
- **Paleta de Colores**:
  - `Background`: Deep Navy (`#1B263B`) - Autoridad y profundidad.
  - `Primary`: Golden Harvest (`#E0B050`) - Excelencia y valor.
  - `Accent`: Tech Teal (`#48CAE4`) - Innovación y frescura.
- **Tipografía**:
  - `Headline`: Space Grotesk (Moderna, geométrica).
  - `Body`: Inter (Legibilidad máxima en densidades altas de datos).
- **Componentes Clave**: Tarjetas con bordes redondeados (`0.75rem`), sombras suaves, efectos de cristalografía (backdrop-blur) y micro-interacciones sutiles.

## 5. Módulos Críticos
### A. Centro de Mando (Dashboard)
Visualización de KPIs operativos: Jugadores Pendientes, Evaluados y Total de Informes. Uso de suscripciones `onSnapshot` para actualización sin refresco.

### B. Informe 360 (Formulario de 8 Etapas)
1. **Jugador**: Metadatos y Posicionamiento Táctico en Canvas SVG.
2. **Contexto**: Estilo de juego y comportamiento sin balón.
3. **Técnico/Táctico/Físico/Mental**: Evaluación de KPIs específicos traducidos y localizados.
4. **Acciones**: Registro cronológico de eventos clave en el partido.
5. **IA Analytics**: Generación de PIM y Resumen Ejecutivo mediante Flows de servidor.

### C. Mapeo de Talento
Visualización geográfica de la red de captación y hotspots de rendimiento.

## 6. Seguridad y Permisos (RBAC)
- **Admin**: Acceso total y gestión de red.
- **Analista/Entrenador**: Foco en captación (Dashboard, Informes, Base de Datos).
- **Gestión Club**: Foco en estrategia (Analytics, Benchmarking).
- **Seguridad Firestore**: Reglas granulares que validan `isAuthenticated()`, `isAdmin()` y propiedad del documento (`isOwner`).

## 7. Enfoque de Desarrollo
Priorizar siempre el rendimiento en dispositivos móviles (para scouts en el estadio), la integridad de los tipos de TypeScript y la consistencia del idioma (Español/Inglés) en todas las capas del software.
