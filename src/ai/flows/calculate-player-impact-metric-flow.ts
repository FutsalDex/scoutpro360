'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Implementa pesos por posición, multiplicadores de contexto y normalización de categorías.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerInfo: z.object({
    name: z.string(),
    tacticalRole: z.string(),
    minPlayed: z.string(),
    physicalCondition: z.string(),
    dominantFoot: z.string(),
  }),
  matchContext: z.object({
    matchStyle: z.string(),
    matchTempo: z.string(),
    teamDominance: z.string(),
    score: z.string(),
    matchImportance: z.string(),
    weather: z.string().optional(),
  }),
  technicalMetrics: z.array(MetricSchema),
  tacticalMetrics: z.array(MetricSchema),
  physicalMetrics: z.array(MetricSchema),
  mentalMetrics: z.array(MetricSchema),
  generalProfile: z.object({
    technicalLevel: z.number(),
    tacticalIntelligence: z.number(),
    physicalQuality: z.number(),
    mentalStrength: z.number(),
    competitiveLevel: z.number(),
    potential: z.number(),
    currentLevel: z.number(),
  }),
  language: z.enum(['en', 'es']).default('es'),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number().describe('Un número entero entre 0 y 100'),
  explanation: z.string().describe('Explicación técnica del cálculo y recomendación final'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  input: {
    schema: CalculatePlayerImpactMetricInputSchema
  },
  output: { schema: CalculatePlayerImpactMetricOutputSchema },
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Eres un sistema experto de scouting de fútbol profesional. Tu tarea es calcular el 
Player Impact Metric (PIM) de un jugador en una escala de 0 a 100.

## DATOS DEL JUGADOR
- Nombre: {{{playerInfo.name}}}
- Posición: {{{playerInfo.tacticalRole}}}
- Minutos jugados: {{{playerInfo.minPlayed}}}
- Condición física: {{{playerInfo.physicalCondition}}}
- Pie dominante: {{{playerInfo.dominantFoot}}}

## CONTEXTO DEL PARTIDO
- Estilo de juego del equipo: {{{matchContext.matchStyle}}}
- Ritmo del partido: {{{matchContext.matchTempo}}}
- Dominio del equipo: {{{matchContext.teamDominance}}}
- Marcador al observar: {{{matchContext.score}}}
- Importancia del partido: {{{matchContext.matchImportance}}}
{{#if matchContext.weather}}- Condiciones climáticas: {{{matchContext.weather}}}{{/if}}

## MÉTRICAS TÉCNICAS (escala 1-5)
{{#each technicalMetrics}}
- {{{name}}}: {{{value}}}/5
{{/each}}

## MÉTRICAS TÁCTICAS (escala 1-5)
{{#each tacticalMetrics}}
- {{{name}}}: {{{value}}}/5
{{/each}}

## MÉTRICAS FÍSICAS (escala 1-5)
{{#each physicalMetrics}}
- {{{name}}}: {{{value}}}/5
{{/each}}

## MÉTRICAS MENTALES (escala 1-5)
{{#each mentalMetrics}}
- {{{name}}}: {{{value}}}/5
{{/each}}

## PERFIL GENERAL (escala 1-5)
- Nivel técnico: {{{generalProfile.technicalLevel}}}/5
- Inteligencia táctica: {{{generalProfile.tacticalIntelligence}}}/5
- Calidad física: {{{generalProfile.physicalQuality}}}/5
- Fortaleza mental: {{{generalProfile.mentalStrength}}}/5
- Nivel competitivo: {{{generalProfile.competitiveLevel}}}/5
- Potencial: {{{generalProfile.potential}}}/5
- Nivel actual: {{{generalProfile.currentLevel}}}/5

## INSTRUCCIONES DE CÁLCULO

Aplica la siguiente fórmula ponderada según la posición del jugador:

### Pesos por posición:
- Portero (PO): Técnico 25%, Táctico 30%, Físico 20%, Mental 25%
- Defensa Central (DC): Técnico 20%, Táctico 30%, Físico 25%, Mental 25%
- Lateral (LD/LI): Técnico 25%, Táctico 25%, Físico 30%, Mental 20%
- Mediocentro Defensivo (MCD): Técnico 20%, Táctico 35%, Físico 20%, Mental 25%
- Mediocentro (MC): Técnico 30%, Táctico 30%, Físico 20%, Mental 20%
- Mediapunta (MCO): Técnico 35%, Táctico 25%, Físico 15%, Mental 25%
- Extremo (ED/EI): Técnico 30%, Táctico 20%, Físico 35%, Mental 15%
- Delantero (DC/SD): Técnico 35%, Táctico 20%, Físico 25%, Mental 20%

### Proceso:
1. Normaliza cada categoría: suma de valores / (número de métricas × 5) × 100
2. Aplica los pesos de posición
3. Aplica multiplicadores de contexto:
   - Partido de alta importancia + rendimiento destacado: +3 puntos
   - Partido en condiciones adversas (lluvia/frío/viento): +2 puntos
   - Equipo en desventaja + rendimiento destacado: +3 puntos
   - Menos de 60 minutos jugados: -5 puntos
4. Incorpora el perfil general con peso del 15% sobre el total
5. Redondea al entero más cercano
6. El resultado final debe estar entre 0 y 100

### Escala de grados:
- 90-100: A+ (Élite mundial)
- 80-89: A (Élite)
- 70-79: B (Alto rendimiento)
- 60-69: C (Buen nivel)
- 50-59: D (Nivel medio)
- 0-49: F (Por debajo del estándar)

### Opciones de recomendación en la explicación:
- "Fichaje inmediato" (PIM ≥ 85)
- "Seguimiento prioritario" (PIM 70-84)
- "Monitorizar" (PIM 55-69)
- "Reevaluar" (PIM < 55)

Idioma de respuesta: {{{language}}}.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt(input);
    
    let score = 50;
    let explanation = "No se pudo procesar la explicación técnica.";

    if (response.output) {
      score = response.output.playerImpactMetric;
      explanation = response.output.explanation;
    }

    // Clamping estricto
    const finalScore = Math.max(0, Math.min(100, Math.round(score)));

    return {
      playerImpactMetric: finalScore,
      explanation: explanation
    };
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 50,
      explanation: "Error de sincronización con el analista virtual. Se ha asignado una puntuación base de seguridad."
    };
  }
}
