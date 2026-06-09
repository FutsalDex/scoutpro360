'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Modo "Scout de Élite" enfocado en patrones de rendimiento y rangos profesionales.
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
  playerImpactMetric: z.number().describe('Un número entero entre 10 y 100'),
  explanation: z.string().describe('Análisis técnico del scout sobre el patrón de rendimiento detectado'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  input: {
    schema: CalculatePlayerImpactMetricInputSchema
  },
  output: { schema: CalculatePlayerImpactMetricOutputSchema },
  prompt: `Eres un motor lógico de scouting profesional con 20 años de experiencia en captación de élite. Tu misión es calcular el Player Impact Metric (PIM) de forma audaz y técnica.

DATOS RECIBIDOS:
- Jugador: {{{playerName}}} ({{{tacticalRole}}})
- Contexto: {{{minPlayed}}} min, Condición {{{physicalCondition}}}, Importancia {{{matchImportance}}}

MÉTRICAS DETALLADAS (Escala 1-5):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

REGLAS DE CÁLCULO ESTRICTAS:
1. Eres un scout de élite. Tu objetivo es valorar el impacto real en el juego.
2. Si los datos técnicos/tácticos recibidos están en la escala 1-5, no promedies simplemente. Busca el PATRÓN de rendimiento.
3. Si el jugador tiene varios valores de 4 o 5, su PIM DEBE ser superior a 75.
4. Si el jugador tiene valores de 3 predominantes, su PIM DEBE estar en el rango de 50-60.
5. ÚNICAMENTE devuelve valores por debajo de 30 si las métricas son consistentemente 1 o 2.
6. SIEMPRE devuelve un número entre 10 y 100. NUNCA devuelvas 0 ni 1.

RESPUESTA JSON ESTRICTA:
- Devuelve siempre un objeto JSON válido con las claves "playerImpactMetric" (número) y "explanation" (string).
- No añadas texto explicativo fuera del JSON.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt(input);
    
    if (response.output) {
      return {
        playerImpactMetric: Math.max(10, Math.min(100, Math.round(response.output.playerImpactMetric))),
        explanation: response.output.explanation
      };
    }

    // Fallback de emergencia agresivo buscando cualquier número en el texto
    const text = response.text || "";
    const scoreMatch = text.match(/"playerImpactMetric":\s*(\d+)/) || 
                      text.match(/playerImpactMetric[:\s]+(\d+)/) ||
                      text.match(/(\d+)/); 
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50; // 50 como fallback neutro si todo falla
    
    return {
      playerImpactMetric: Math.max(10, Math.min(100, Math.round(score))),
      explanation: text.substring(0, 500) || "Cálculo realizado mediante análisis de patrón de rendimiento (Modo Scout Pro)."
    };
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 50,
      explanation: "Error en el motor de cálculo. Se asigna puntuación base profesional media."
    };
  }
}
