export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

export type UserRole = 'admin' | 'analista' | 'gestion' | 'invitado' | 'entrenador' | 'director';

export type SubscriptionPlan = 'básico' | 'profesional' | 'enterprise';

export interface Point {
  x: number;
  y: number;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  subscriptionPlan?: SubscriptionPlan;
  organization?: string;
  phoneNumber?: string;
  nationality?: string;
  socials?: {
    twitter?: string;
    linkedin?: string;
    instagram?: string;
  };
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
  birthDate?: string;
  height?: string;
  weight?: string;
  dominantFoot?: string;
  secondaryPositions?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface KPISection {
  observation: string[];
  impact: string[];
}

export interface ScoutingReport {
  id?: string;
  playerId: string;
  playerName: string;
  scoutId: string;
  scoutName: string;
  pimScore: number;
  summary: string;
  ratings: Record<string, number>;
  notes: Record<string, string>;
  dorsal?: string;
  rivalName?: string;
  competition?: string;
  matchDate?: string;
  minPlayed?: string;
  physicalCondition?: string;
  selectedRoles?: string[];
  pitchPosition?: Point;
  heatmapPoints?: Point[];
  createdAt: any;
  updatedAt?: any;
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

const DEFAULT_KPIS = {
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
};

export const TACTICAL_ROLES: TacticalRoleConfig[] = [
  { id: 'po', name: 'PO – Portero', kpis: DEFAULT_KPIS },
  { id: 'dc-def', name: 'DC – Defensa Central', kpis: DEFAULT_KPIS },
  { id: 'ld', name: 'LD – Lateral Derecho', kpis: DEFAULT_KPIS },
  { id: 'li', name: 'LI – Lateral Izquierdo', kpis: DEFAULT_KPIS },
  { id: 'mcd', name: 'MCD – Mediocentro Defensivo', kpis: DEFAULT_KPIS },
  { id: 'mc', name: 'MC – Mediocentro', kpis: DEFAULT_KPIS },
  { id: 'mco', name: 'MCO – Mediapunta', kpis: DEFAULT_KPIS },
  { id: 'ed', name: 'ED – Extremo Derecho', kpis: DEFAULT_KPIS },
  { id: 'ei', name: 'EI – Extremo Izquierdo', kpis: DEFAULT_KPIS },
  { id: 'sd', name: 'SD – Segunda Punta', kpis: DEFAULT_KPIS },
  { id: 'dc-fwd', name: 'DC – Delantero Centro', kpis: DEFAULT_KPIS },
];
