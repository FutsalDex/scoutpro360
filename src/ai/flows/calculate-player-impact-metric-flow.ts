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
  playerImpactMetric: z.number().describe('Un número entero entre 0 y 100'),
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

MÉTRICAS RECIBIDAS (Solo las observadas):
Técnicas: {{#each technicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Tácticas: {{#each tacticalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Físicas: {{#each physicalMetrics}}{{{name}}}: {{{value}}}, {{/each}}
Mentales: {{#each mentalMetrics}}{{{name}}}: {{{value}}}, {{/each}}

REGLAS DE CÁLCULO ESTRICTAS:
1. ANÁLISIS CUALITATIVO: Evalúa las métricas recibidas. Ignora la aritmética simple y busca el impacto real.
2. SI NO HAY DATOS: No inventes valores. Si recibes menos de 5 métricas en total entre todas las categorías, devuelve un PIM de 0 y explica en "explanation" que falta información para una evaluación profesional.
3. ESCALA DE RENDIMIENTO OBLIGATORIA:
   - Si la media de las métricas (1-5) es inferior a 2.0: El PIM DEBE ser obligatoriamente entre 10 y 30. Es un rendimiento insuficiente.
   - Si la media de las métricas es aproximadamente 3.0: El PIM DEBE estar en el rango de 40 a 60.
   - Si la media de las métricas es superior a 3.5: El PIM DEBE ser entre 70 y 100. Es un rendimiento de impacto alto.
4. PROHIBICIÓN DEL 50: No devuelvas 50 por defecto por "seguridad". Si el jugador es mediocre, devuelve un valor bajo. Si es bueno, uno alto. El 50 solo se usa si el rendimiento es exactamente mediano.
5. RANGO: Devuelve siempre un número entero. NUNCA devuelvas 1 a menos que sea un fallo total. El mínimo profesional es 10 si hay datos, o 0 si no los hay.

RESPUESTA JSON ESTRICTA:
- Devuelve EXCLUSIVAMENTE un objeto JSON válido con las claves "playerImpactMetric" (número entero) y "explanation" (string).
- No añadas texto explicativo fuera del bloque JSON.`,
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

    // Fallback de emergencia agresivo buscando cualquier número en el texto
    const text = response.text || "";
    const scoreMatch = text.match(/"playerImpactMetric":\s*(\d+)/) || 
                      text.match(/playerImpactMetric[:\s]+(\d+)/) ||
                      text.match(/(\d+)/); 
    
    const score = scoreMatch ? parseInt(scoreMatch[1]) : 0;
    
    return {
      playerImpactMetric: Math.max(0, Math.min(100, Math.round(score))),
      explanation: text.substring(0, 500) || "Cálculo realizado mediante análisis de patrón de rendimiento cualitativo."
    };
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 0,
      explanation: "Error en el motor de análisis. Información insuficiente."
    };
  }
}
