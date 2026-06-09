'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Modo "Scout de Élite" enfocado en patrones cualitativos de rendimiento.
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
  prompt: `Eres un experto en scouting de fútbol profesional con 20 años de experiencia en captación de élite. Tu tarea es analizar las métricas proporcionadas y asignar un Player Impact Metric (PIM) de 0 a 100 basado en la calidad del rendimiento observado.

DATOS DEL JUGADOR:
- Jugador: {{{playerName}}} ({{{tacticalRole}}})
- Contexto: {{{minPlayed}}} min, Condición {{{physicalCondition}}}, Importancia {{{matchImportance}}}

MÉTRICAS RECIBIDAS (Escala 1-5):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

REGLAS DE CÁLCULO ESTRICTAS:
1. ANÁLISIS CUALITATIVO: Analiza los patrones de puntuación (1-5) para determinar el impacto real. Ignora la aritmética simple.
2. ESCALA DE VALORACIÓN:
   - Si las métricas (1-5) son mayoritariamente 1 o 2: El PIM DEBE ser inferior a 30. Es un rendimiento insuficiente.
   - Si las métricas son mayoritariamente 3: El PIM DEBE estar en el rango de 40 a 60. Es un rendimiento sólido/estándar.
   - Si las métricas son mayoritariamente 4 o 5: El PIM DEBE ser superior a 70. Es un rendimiento de impacto alto o élite.
3. CÁLCULO DIRECTO: Si los datos son extremos (ej: todo 1 o todo 5), la puntuación debe reflejarlo drásticamente. Un jugador con todo "1" no puede tener un PIM de 50.
4. RANGO: Devuelve siempre un número entero entre 10 y 100. NUNCA devuelvas 0 ni 1.

RESPUESTA JSON ESTRICTA:
- Devuelve EXCLUSIVAMENTE un objeto JSON válido con las claves "playerImpactMetric" (número entero) y "explanation" (string).
- No añadas texto explicativo fuera del bloque JSON.`,
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
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 50;
    
    return {
      playerImpactMetric: Math.max(10, Math.min(100, Math.round(score))),
      explanation: text.substring(0, 500) || "Cálculo realizado mediante análisis de patrón de rendimiento cualitativo."
    };
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 50,
      explanation: "Error en el motor de análisis. Se asigna valoración estándar."
    };
  }
}
