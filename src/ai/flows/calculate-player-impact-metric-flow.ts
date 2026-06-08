'use server';
/**
 * @fileOverview Flujo de Genkit para calcular la Métrica de Impacto del Jugador (PIM).
 * Optimizado para robustez técnica y cumplimiento estricto del rango 0-100.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerId: z.string(),
  currentEvaluation: z.object({
    tacticalRole: z.string(),
    metrics: z.object({
      technical: z.record(z.number()),
      tactical: z.record(z.number()),
      physical: z.record(z.number()),
      mental: z.number().or(z.record(z.number())),
    }),
  }),
  historicalClubData: z.string().optional(),
  language: z.enum(['en', 'es']).default('es'),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number().describe('Un número entero entre 0 y 100'),
  explanation: z.string().describe('Explicación técnica breve del impacto'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  input: {
    schema: z.object({
      tacticalRole: z.string(),
      technical: z.string(),
      tactical: z.string(),
      physical: z.string(),
      mental: z.string(),
      context: z.string(),
      language: z.string(),
    })
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
  prompt: `Actúa como un científico de datos de rendimiento deportivo.
Calcula el Player Impact Metric (PIM) de 0 a 100.

IMPORTANTE: 100 es el valor máximo absoluto (Jugador generacional).
Idioma de respuesta: {{{language}}}.

DATOS:
- Rol: {{{tacticalRole}}}
- Técnica: {{{technical}}}
- Táctica: {{{tactical}}}
- Física: {{{physical}}}
- Mental: {{{mental}}}
- Contexto: {{{context}}}

INSTRUCCIONES:
1. Pesa los atributos según el rol táctico.
2. Evalúa el potencial de impacto inmediato en fútbol profesional.
3. El resultado final debe ser un número entero entre 0 y 100.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt({
      tacticalRole: input.currentEvaluation.tacticalRole,
      technical: JSON.stringify(input.currentEvaluation.metrics.technical || {}),
      tactical: JSON.stringify(input.currentEvaluation.metrics.tactical || {}),
      physical: JSON.stringify(input.currentEvaluation.metrics.physical || {}),
      mental: JSON.stringify(input.currentEvaluation.metrics.mental || {}),
      context: input.historicalClubData || "Sin contexto adicional.",
      language: input.language === 'es' ? 'Español' : 'English',
    });
    
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
