'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Optimizado para devolver un valor entero y obligar a una respuesta JSON estricta.
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
  playerImpactMetric: z.number().describe('Un número entero entre 1 y 100'),
  explanation: z.string().describe('Explicación técnica del cálculo y recomendación final'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  input: {
    schema: CalculatePlayerImpactMetricInputSchema
  },
  output: { schema: CalculatePlayerImpactMetricOutputSchema },
  prompt: `Eres un motor lógico de scouting profesional con 20 años de experiencia en captación de élite. Tu única misión es calcular el Player Impact Metric (PIM) de 1 a 100 de forma audaz y precisa.

DATOS RECIBIDOS:
- Jugador: {{{playerName}}} ({{{tacticalRole}}})
- Contexto: {{{minPlayed}}} min, Condición {{{physicalCondition}}}, Ritmo {{{matchTempo}}}

MÉTRICAS DETALLADAS (Escala 1-5, donde 0 es "no evaluado"):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

REGLAS DE CÁLCULO ESTRICTAS:
1. Solo considera para el promedio las métricas que tengan un valor mayor a 0.
2. Si una categoría completa (técnica, táctica, física o mental) está vacía (todos sus valores son 0), no la penalices con 0; asígnale un valor base de 3 (nivel medio) para esa categoría antes de aplicar pesos.
3. Aplica pesos por posición sobre los promedios calculados:
   - Porteros/Defensas: Táctico 35%, Mental 25%, Técnico 20%, Físico 20%.
   - Mediocentros: Táctico 30%, Técnico 30%, Mental 20%, Físico 20%.
   - Atacantes: Técnico 35%, Táctico 20%, Físico 25%, Mental 20%.
4. Modificadores:
   - Si minPlayed < 60: -5 puntos al total.
   - Si matchImportance es "high" o "decisive" y el rendimiento medio es > 4: +4 puntos.
5. SIEMPRE devuelve un número entero entre 1 y 100. NUNCA devuelvas 0. Si el cálculo final es menor a 1, devuelve 1.

IMPORTANTE: No seas excesivamente conservador. Si el jugador demuestra habilidades básicas, su PIM debe reflejarlo. Un 1 es una puntuación de "jugador amateur que no aporta nada". Si el jugador tiene métricas de 3 o 4, el PIM debe ser coherente (ej: superior a 50). Un jugador con promedios de 4 debe estar cerca de los 80-85 puntos.

REGLAS DE FORMATO:
- Debes responder EXCLUSIVAMENTE con un JSON válido.
- No añadas texto explicativo antes ni después del bloque JSON.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt(input);
    
    if (response.output) {
      return {
        playerImpactMetric: Math.max(1, Math.min(100, Math.round(response.output.playerImpactMetric))),
        explanation: response.output.explanation
      };
    }

    // Fallback de emergencia agresivo: Escaneo profundo de texto
    const text = response.text || "";
    const scoreMatch = text.match(/"playerImpactMetric":\s*(\d+)/) || 
                      text.match(/playerImpactMetric[:\s]+(\d+)/) ||
                      text.match(/PIM:\s*(\d+)/) ||
                      text.match(/(\d+)\/100/) ||
                      text.match(/(\d+)/); // Captura el primer número que aparezca
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 1;
    
    if (score > 0 || text.length > 5) {
      return {
        playerImpactMetric: Math.max(1, Math.min(100, Math.round(score))),
        explanation: text.substring(0, 500) || "Cálculo realizado mediante análisis de texto."
      };
    }

    throw new Error("La IA no generó una puntuación válida.");
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 1,
      explanation: "Error en el motor de cálculo. Se asigna puntuación base mínima."
    };
  }
}
