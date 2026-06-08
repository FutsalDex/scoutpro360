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
  explanation: z.string().describe('Explicación técnica detallada del impacto'),
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
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Actúa como un científico de datos especializado en rendimiento futbolístico de élite.
Calcula el Player Impact Metric (PIM) de 0 a 100 basado en los siguientes datos técnicos.

IMPORTANTE: El valor MÁXIMO absoluto es 100 (Jugador de élite mundial generacional).
Devuelve SIEMPRE el resultado en el formato JSON solicitado. La puntuación debe ser un número entero.
Idioma de respuesta: {{{language}}}.

DATOS DE EVALUACIÓN:
- Rol Táctico: {{{tacticalRole}}}
- Métricas Técnicas: {{{technical}}}
- Métricas Tácticas: {{{tactical}}}
- Métricas Físicas: {{{physical}}}
- Métricas Mentales: {{{mental}}}
- Notas Adicionales: {{{context}}}

INSTRUCCIONES:
1. Pesa los atributos según la importancia del rol (ej: la finalización pesa más en un DC que en un MCD).
2. Analiza el potencial de impacto inmediato en un entorno profesional.
3. El PIM 100 solo se asigna si el jugador es perfecto en todos los KPIs clave de su rol.
4. Proporciona una explicación técnica coherente y breve.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const result = await calculatePlayerImpactMetricFlow(input);
    return result;
  } catch (error) {
    console.error("PIM Flow Error:", error);
    return {
      playerImpactMetric: 50,
      explanation: "Error en la sincronización con el analista virtual. Usando puntuación base de seguridad."
    };
  }
}

const calculatePlayerImpactMetricFlow = ai.defineFlow(
  {
    name: 'calculatePlayerImpactMetricFlow',
    inputSchema: CalculatePlayerImpactMetricInputSchema,
    outputSchema: CalculatePlayerImpactMetricOutputSchema,
  },
  async (input) => {
    const { output } = await calculatePlayerImpactMetricPrompt({
      tacticalRole: input.currentEvaluation.tacticalRole,
      technical: JSON.stringify(input.currentEvaluation.metrics.technical || {}),
      tactical: JSON.stringify(input.currentEvaluation.metrics.tactical || {}),
      physical: JSON.stringify(input.currentEvaluation.metrics.physical || {}),
      mental: JSON.stringify(input.currentEvaluation.metrics.mental || {}),
      context: input.historicalClubData || "No hay contexto adicional.",
      language: input.language === 'es' ? 'Español' : 'English',
    });
    
    if (!output) {
      throw new Error('AI Response was empty');
    }

    // Clamping estricto entre 0 y 100
    const finalScore = Math.max(0, Math.min(100, Math.round(output.playerImpactMetric)));

    return {
      playerImpactMetric: finalScore,
      explanation: output.explanation
    };
  }
);
