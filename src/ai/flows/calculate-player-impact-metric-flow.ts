'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Optimizado para devolver un valor entero y corregir errores de mapeo que causaban el valor 0.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerName: z.string(),
  tacticalRole: z.string(),
  minPlayed: z.string(),
  physicalCondition: z.string(),
  dominantFoot: z.string(),
  matchStyle: z.string(),
  matchTempo: z.string(),
  teamDominance: z.string(),
  score: z.string(),
  matchImportance: z.string(),
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
  prompt: `Eres un sistema experto de scouting de fútbol profesional. Tu tarea es calcular el 
Player Impact Metric (PIM) de un jugador en una escala de 0 a 100.

## DATOS DEL JUGADOR
- Nombre: {{{playerName}}}
- Posición: {{{tacticalRole}}}
- Minutos jugados: {{{minPlayed}}}
- Condición física: {{{physicalCondition}}}
- Pie dominante: {{{dominantFoot}}}

## CONTEXTO DEL PARTIDO
- Estilo de juego del equipo: {{{matchStyle}}}
- Ritmo del partido: {{{matchTempo}}}
- Dominio del equipo: {{{teamDominance}}}
- Marcador al observar: {{{score}}}
- Importancia del partido: {{{matchImportance}}}

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

### Opciones de recomendación:
- "Fichaje inmediato" (PIM ≥ 85)
- "Seguimiento prioritario" (PIM 70-84)
- "Monitorizar" (PIM 55-69)
- "Reevaluar" (PIM < 55)

Responde SIEMPRE en formato JSON estructurado.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt(input);
    
    if (response.output) {
      return {
        playerImpactMetric: Math.max(0, Math.min(100, Math.round(response.output.playerImpactMetric))),
        explanation: response.output.explanation
      };
    }

    // Fallback: Si el modelo no devuelve JSON pero sí texto, intentamos extraer el número
    if (response.text) {
      const scoreMatch = response.text.match(/playerImpactMetric":\s*(\d+)/) || 
                        response.text.match(/(\d+)\/100/) ||
                        response.text.match(/PIM:\s*(\d+)/);
      
      const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
      return {
        playerImpactMetric: Math.max(0, Math.min(100, Math.round(score))),
        explanation: response.text.substring(0, 500)
      };
    }

    throw new Error("Respuesta vacía de IA");
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 0,
      explanation: "Error en el motor de cálculo. Por favor, revisa que todas las métricas de perfil general tengan puntuación."
    };
  }
}
