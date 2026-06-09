'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Modo "Scout Profesional" con ponderación por posición y modificadores contextuales.
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
  explanation: z.string().describe('Explicación técnica del cálculo y desglose de pesos'),
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

MÉTRICAS DETALLADAS (Escala 1-5, donde 0 es "no evaluado"):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

REGLAS DE CÁLCULO ESTRICTAS:
1. EVALUACIÓN DE CALIDAD: Considera únicamente las métricas que tengan un valor superior a 0.
2. CÁLCULO DE PIM: 
   - Si no hay datos suficientes, no des un 1. Asume un perfil de jugador promedio (valor 3 en todas las métricas).
   - Calcula el PIM basándote en la media ponderada de las métricas presentes (Escala 1-5 convertida a 0-100: (Promedio / 5) * 100).
3. MODIFICADORES DE POSICIÓN:
   - Porteros/Defensas: Táctico 35%, Mental 25%, Técnico 20%, Físico 20%.
   - Mediocentros: Táctico 30%, Técnico 30%, Mental 20%, Físico 20%.
   - Atacantes: Técnico 35%, Táctico 20%, Físico 25%, Mental 20%.
4. AJUSTES FINALES:
   - Si minPlayed < 60: Resta 5 puntos al total final.
   - Si matchImportance es "high" o "decisive" y el rendimiento medio es > 4: Suma 10 puntos al total.
5. RANGO: El resultado final debe ser un entero entre 10 y 100. NUNCA devuelvas 0 ni 1.

REGLAS DE FORMATO:
- Debes responder EXCLUSIVAMENTE con un JSON válido.
- No añadas texto explicativo antes ni después del bloque JSON.`,
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

    // Fallback de emergencia agresivo
    const text = response.text || "";
    const scoreMatch = text.match(/"playerImpactMetric":\s*(\d+)/) || 
                      text.match(/playerImpactMetric[:\s]+(\d+)/) ||
                      text.match(/(\d+)/); 
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 10;
    
    return {
      playerImpactMetric: Math.max(10, Math.min(100, Math.round(score))),
      explanation: text.substring(0, 500) || "Cálculo realizado mediante análisis de texto (Modo Scout Pro)."
    };
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 10,
      explanation: "Error en el motor de cálculo. Se asigna puntuación base profesional mínima."
    };
  }
}
