'use server';
/**
 * @fileOverview This file implements a Genkit flow for calculating the Player Impact Metric (PIM).
 * Optimized with relaxed safety filters and robust prompt logic.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerId: z.string().describe('The ID of the player being evaluated.'),
  currentEvaluation: z.object({
    tacticalRole: z.string().describe('The specific tactical role of the player.'),
    metrics: z.object({
      technical: z.record(z.number().min(1).max(5)),
      tactical: z.record(z.number().min(1).max(5)),
      physical: z.record(z.number().min(1).max(5)),
      mental: z.record(z.number().min(1).max(5)),
    }),
  }),
  historicalClubData: z.string().optional(),
  language: z.enum(['en', 'es']).default('es'),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number().describe('A score from 0 to 100'),
  explanation: z.string().describe('A brief explanation of the score'),
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
      historicalClubData: z.string(),
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
  prompt: `You are an elite football performance data scientist. Your task is to calculate the Player Impact Metric (PIM) from 0 to 100.
The PIM is a composite score representing the player's potential success in a top-tier professional environment.

STRICTLY provide the explanation in {{{language}}}.

CONTEXT DATA:
- Tactical Role: {{{tacticalRole}}}
- Technical: {{{technical}}}
- Tactical: {{{tactical}}}
- Physical: {{{physical}}}
- Mental: {{{mental}}}
- Context: {{{historicalClubData}}}

INSTRUCTIONS:
1. Weight attributes based on the Tactical Role importance.
2. If metrics are empty or sparse, provide a reasonable estimate based on the role and any available data.
3. Return a clean integer between 0 and 100.
4. The explanation must be professional, technical, and strictly in {{{language}}}.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const result = await calculatePlayerImpactMetricFlow(input);
    return result;
  } catch (error) {
    console.error("PIM Flow Error:", error);
    // Fallback response to avoid complete UI breakage
    return {
      playerImpactMetric: 50,
      explanation: "Error en el cálculo automático. Por favor, revisa las métricas e inténtalo de nuevo."
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
      historicalClubData: input.historicalClubData || "Club Standard Benchmark: 70",
      language: input.language === 'es' ? 'Spanish' : 'English',
    });
    
    if (!output) {
      throw new Error('AI output was null or blocked by safety filters.');
    }

    return output;
  }
);
