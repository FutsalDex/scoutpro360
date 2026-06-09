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
  prompt: `Eres un motor lógico de scouting profesional. Tu única misión es calcular el Player Impact Metric (PIM) de 1 a 100.

DATOS RECIBIDOS:
- Jugador: {{{playerName}}} ({{{tacticalRole}}})
- Contexto: {{{minPlayed}}} min, Condición {{{physicalCondition}}}, Ritmo {{{matchTempo}}}

MÉTRICAS DETALLADAS (Escala 1-5):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

PERFIL GENERAL (Peso 15%):
Técnico: {{{generalProfile.technicalLevel}}}, Táctico: {{{generalProfile.tacticalIntelligence}}}, Físico: {{{generalProfile.physicalQuality}}}, Mental: {{{generalProfile.mentalStrength}}}, Potencial: {{{generalProfile.potential}}}

REGLAS DE CÁLCULO ESTRICTAS:
1. Calcula el promedio de cada categoría (Suma / (Num métricas * 5) * 100).
2. Aplica pesos por posición:
   - Porteros/Defensas: Táctico 35%, Mental 25%, Técnico 20%, Físico 20%.
   - Mediocentros: Táctico 30%, Técnico 30%, Mental 20%, Físico 20%.
   - Atacantes: Técnico 35%, Táctico 20%, Físico 25%, Mental 20%.
3. Modificadores:
   - Si minPlayed < 60: -5 puntos.
   - Si matchImportance es "high" y rendimiento > 4: +4 puntos.
4. SIEMPRE devuelve un número entre 1 y 100. NUNCA devuelvas 0 aunque los datos parezcan incompletos. Si no hay datos detallados, usa el Perfil General.

REGLAS DE FORMATO:
- Debes responder EXCLUSIVAMENTE con un JSON válido.
- No añadas texto explicativo antes ni después del bloque JSON.
- Si el cálculo es menor a 1, devuelve 1. Si es mayor a 100, devuelve 100.`,
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
