export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export type UserRole = 'admin' | 'analista' | 'gestion' | 'invitado' | 'entrenador' | 'director';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  organization?: string;
  createdAt: any;
}

export interface Player {
  id: string;
  name: string;
  age: number;
  club: string;
  nationality: string;
  marketValue: string;
  currentPIM: number;
  tacticalRole: string;
  grade: Grade;
}

export interface KPISection {
  observation: string[];
  impact: string[];
}

export interface TacticalRoleConfig {
  id: string;
  name: string;
  kpis: {
    technical: KPISection;
    tactical: KPISection;
    physical: KPISection;
    mental: KPISection;
  };
}

export const TACTICAL_ROLES: TacticalRoleConfig[] = [
  {
    id: 'inverted-fullback',
    name: 'Inverted Fullback',
    kpis: {
      technical: {
        observation: ['Primer toque', 'Pase corto', 'Pase largo', 'Pase en profundidad', 'Regate 1vs1', 'Control de balón', 'Posesión', 'Disparo', 'Centro', 'Finalización', 'Juego aéreo', 'Balón parado', 'Técnica bajo presión'],
        impact: ['Con posesión', 'Sin posesión', 'Momentos clave', 'Consistencia', 'Bajo presión', 'En el resultado']
      },
      tactical: {
        observation: ['Posicionamiento', 'Lectura de juego', 'Disciplina táctica', 'Coberturas', 'Presión', 'Apoyo ofensivo', 'Vigilancias', 'Anticipación', 'Inteligencia espacial'],
        impact: ['Equilibrio defensivo', 'Salida de balón', 'Transiciones', 'Organización', 'Adaptabilidad']
      },
      physical: {
        observation: ['Velocidad', 'Aceleración', 'Resistencia', 'Fuerza', 'Agilidad', 'Equilibrio', 'Salto/Juego aéreo', 'Coordinación', 'Recuperación'],
        impact: ['Duelos ganados', 'Intensidad', 'Presencia física', 'Despliegue', 'Potencia']
      },
      mental: {
        observation: ['Liderazgo', 'Determinación', 'Agresividad', 'Compostura', 'Toma de decisiones', 'Concentración', 'Sacrificio', 'Valentía', 'Madurez'],
        impact: ['Resiliencia', 'Comunicación', 'Impacto anímico', 'Enfoque', 'Espíritu de equipo']
      }
    },
  },
  {
    id: 'deep-lying-playmaker',
    name: 'Deep-Lying Playmaker',
    kpis: {
      technical: {
        observation: ['Primer toque', 'Pase corto', 'Pase largo', 'Pase en profundidad', 'Visión', 'Control de balón', 'Cambios de orientación', 'Protección de balón'],
        impact: ['Distribución', 'Control del tiempo', 'Asistencias', 'Bajo presión']
      },
      tactical: {
        observation: ['Ubicación', 'Intercepciones', 'Apoyos', 'Coberturas'],
        impact: ['Ritmo de juego', 'Organización', 'Transiciones']
      },
      physical: {
        observation: ['Resistencia', 'Equilibrio', 'Agilidad'],
        impact: ['Cobertura de campo', 'Duelos']
      },
      mental: {
        observation: ['Visión estratégica', 'Compostura', 'Concentración'],
        impact: ['Claridad', 'Confianza']
      }
    }
  }
];