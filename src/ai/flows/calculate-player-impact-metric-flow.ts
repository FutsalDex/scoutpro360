'use server';
/**
 * @fileOverview This file implements a Genkit flow for calculating the Player Impact Metric (PIM).
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
    ],
  },
  prompt: `You are an expert football performance analyst. Your task is to calculate the Player Impact Metric (PIM) on a scale of 0 to 100.
The PIM represents the projected impact this player would have in a professional top-tier team based on their current performance metrics.

STRICTLY provide the explanation in {{{language}}}. Do not use any other language than {{{language}}}.
It is CRITICAL that the explanation is written entirely in {{{language}}}.

CONTEXT DATA:
- Tactical Role: {{{tacticalRole}}}
- Technical Evaluation: {{{technical}}}
- Tactical Intelligence: {{{tactical}}}
- Physical Condition: {{{physical}}}
- Mental Attributes: {{{mental}}}
- Reference Data: {{{historicalClubData}}}

CALCULATION LOGIC:
1. Weight the metrics according to the importance for the tactical role.
2. If some metrics are missing, provide the best estimation based on available data.
3. Generate a final score from 0 to 100 as an integer.
4. Provide a professional, concise scout-style explanation in {{{language}}}.`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  const result = await calculatePlayerImpactMetricFlow(input);
  return result;
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
      technical: JSON.stringify(input.currentEvaluation.metrics.technical),
      tactical: JSON.stringify(input.currentEvaluation.metrics.tactical),
      physical: JSON.stringify(input.currentEvaluation.metrics.physical),
      mental: JSON.stringify(input.currentEvaluation.metrics.mental),
      historicalClubData: input.historicalClubData || "Standard Benchmark: 70",
      language: input.language === 'es' ? 'Spanish' : 'English',
    });
    
    if (!output) {
      throw new Error('El modelo de IA no devolvió un resultado válido.');
    }

    return output;
  }
);
