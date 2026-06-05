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
  historicalClubData: z.string(),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number(),
  explanation: z.string(),
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
    })
  },
  output: { schema: CalculatePlayerImpactMetricOutputSchema },
  prompt: `You are an expert football scout. Calculate PIM (0-100).
Tactical Role: {{{tacticalRole}}}
Technical: {{{technical}}}
Tactical: {{{tactical}}}
Physical: {{{physical}}}
Mental: {{{mental}}}
Context: {{{historicalClubData}}}`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  const { output } = await calculatePlayerImpactMetricPrompt({
    tacticalRole: input.currentEvaluation.tacticalRole,
    technical: JSON.stringify(input.currentEvaluation.metrics.technical),
    tactical: JSON.stringify(input.currentEvaluation.metrics.tactical),
    physical: JSON.stringify(input.currentEvaluation.metrics.physical),
    mental: JSON.stringify(input.currentEvaluation.metrics.mental),
    historicalClubData: input.historicalClubData,
  });
  return output!;
}
