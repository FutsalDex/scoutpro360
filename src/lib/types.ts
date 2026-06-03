export type Grade = 'A' | 'B' | 'C' | 'D' | 'F';

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

export interface TacticalRoleConfig {
  id: string;
  name: string;
  kpis: {
    technical: string[];
    tactical: string[];
    physical: string[];
    mental: string[];
  };
}

export const TACTICAL_ROLES: TacticalRoleConfig[] = [
  {
    id: 'inverted-fullback',
    name: 'Inverted Fullback',
    kpis: {
      technical: ['Short Passing', 'Ball Control', 'Interceptions'],
      tactical: ['Positioning', 'Vision', 'Tactical Discipline'],
      physical: ['Agility', 'Stamina', 'Balance'],
      mental: ['Decision Making', 'Composure', 'Work Rate'],
    },
  },
  {
    id: 'deep-lying-playmaker',
    name: 'Deep-Lying Playmaker',
    kpis: {
      technical: ['Long Passing', 'Vision', 'First Touch'],
      tactical: ['Game Intelligence', 'Positioning', 'Switching Play'],
      physical: ['Balance', 'Endurance', 'Strength'],
      mental: ['Composure', 'Anticipation', 'Leadership'],
    },
  },
  {
    id: 'false-9',
    name: 'False 9',
    kpis: {
      technical: ['Dribbling', 'Finishing', 'Short Passing'],
      tactical: ['Off-the-ball Movement', 'Creative Vision', 'Pressing'],
      physical: ['Explosiveness', 'Agility', 'Balance'],
      mental: ['Composure', 'Decisions', 'Flair'],
    },
  },
  {
    id: 'mezzala',
    name: 'Mezzala',
    kpis: {
      technical: ['Final Third Passing', 'Shooting', 'Crossing'],
      tactical: ['Half-space Penetration', 'Transition Support', 'Pressing'],
      physical: ['Acceleration', 'Stamina', 'Pace'],
      mental: ['Aggression', 'Determination', 'Work Rate'],
    },
  },
];
