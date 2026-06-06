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

export interface ScoutingAction {
  minute: string;
  action: string;
  result: string;
  notes: string;
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

export interface PlayerList {
  id: string;
  name: string;
  playerIds: string[];
  scoutId: string;
  createdAt: any;
}

export interface ScheduledMatch {
  id: string;
  homeTeam: string;
  awayTeam: string;
  category: string;
  dateTime: any;
  scoutId: string;
  status: 'scheduled' | 'in-progress' | 'completed';
}

export interface QuickNote {
  id: string;
  content: string;
  scoutId: string;
  assignedPlayerId?: string;
  createdAt: any;
  type: 'text' | 'voice';
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
  actions?: ScoutingAction[];
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

export const getLocalizedKPIs = (t: any) => ({
  technical: {
    observation: t.report.kpis.technical.obs,
    impact: t.report.kpis.technical.imp
  },
  tactical: {
    observation: t.report.kpis.tactical.obs,
    impact: t.report.kpis.tactical.imp
  },
  physical: {
    observation: t.report.kpis.physical.obs,
    impact: t.report.kpis.physical.imp
  },
  mental: {
    observation: t.report.kpis.mental.obs,
    impact: t.report.kpis.mental.imp
  }
});

export const TACTICAL_ROLES: TacticalRoleConfig[] = [
  { id: 'po', name: 'PO – Portero', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'dc-def', name: 'DC – Defensa Central', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'ld', name: 'LD – Lateral Derecho', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'li', name: 'LI – Lateral Izquierdo', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'mcd', name: 'MCD – Mediocentro Defensivo', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'mc', name: 'MC – Mediocentro', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'mco', name: 'MCO – Mediapunta', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'ed', name: 'ED – Extremo Derecho', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'ei', name: 'EI – Extremo Izquierdo', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'sd', name: 'SD – Segunda Punta', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
  { id: 'dc-fwd', name: 'DC – Delantero Centro', kpis: { technical: { observation: [], impact: [] }, tactical: { observation: [], impact: [] }, physical: { observation: [], impact: [] }, mental: { observation: [], impact: [] } } },
];