'use server';
/**
 * @fileOverview This file implements a Genkit flow for calculating the Player Impact Metric (PIM).
 *
 * - calculatePlayerImpactMetric - A function that calculates the PIM for a player.
 * - CalculatePlayerImpactMetricInput - The input type for the calculatePlayerImpactMetric function.
 * - CalculatePlayerImpactMetricOutput - The return type for the calculatePlayerImpactMetric function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerId: z.string().describe('The ID of the player being evaluated.'),
  currentEvaluation: z.object({
    tacticalRole: z.string().describe('The specific tactical role of the player (e.g., Inverted Fullback, Deep-Lying Playmaker).'),
    metrics: z.object({
      technical: z.record(z.number().min(1).max(5)).describe('Technical skill ratings (1-5 stars) e.g., passing: 4, dribbling: 3.'),
      tactical: z.record(z.number().min(1).max(5)).describe('Tactical understanding ratings (1-5 stars) e.g., positioning: 5, decisionMaking: 4.'),
      physical: z.record(z.number().min(1).max(5)).describe('Physical attributes ratings (1-5 stars) e.g., stamina: 4, strength: 3.'),
      mental: z.record(z.number().min(1).max(5)).describe('Mental attributes ratings (1-5 stars) e.g., leadership: 3, composure: 4.'),
    }).describe('Detailed evaluations across various categories.'),
  }).describe('The current evaluation of the player.'),
  historicalClubData: z.string().describe('JSON string representing aggregated historical performance data for similar players in the club.'),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number().describe('A numerical score representing the Player Impact Metric (PIM), ranging from 0 to 100.'),
  explanation: z.string().describe('A detailed explanation of how the PIM was calculated.'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  model: 'googleai/gemini-1.5-pro',
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
  output: {schema: CalculatePlayerImpactMetricOutputSchema},
  prompt: `You are an expert football scout and data analyst. Your task is to calculate the Player Impact Metric (PIM) for a player based on their current evaluation and compare it against historical club data.
The PIM should be a score from 0 to 100.

**Player's Current Evaluation:**
Tactical Role: {{{tacticalRole}}}
Technical Metrics: {{{technical}}}
Tactical Metrics: {{{tactical}}}
Physical Metrics: {{{physical}}}
Mental Metrics: {{{mental}}}

**Historical Club Data for Context:**
{{{historicalClubData}}}

**Instructions:**
1.  Analyze the player's current evaluation, paying close attention to their tactical role. Consider which metrics are most critical for this specific role.
2.  Use the historical club data to benchmark the player's performance against similar roles and successful players in the club's history.
3.  Calculate the playerImpactMetric (0-100) based on this comparison. Weight the importance of different metrics according to the player's tactical role. 
4.  Provide a comprehensive explanation for the calculated score.`,
});

const calculatePlayerImpactMetricFlow = ai.defineFlow(
  {
    name: 'calculatePlayerImpactMetricFlow',
    inputSchema: CalculatePlayerImpactMetricInputSchema,
    outputSchema: CalculatePlayerImpactMetricOutputSchema,
  },
  async (input) => {
    const {output} = await calculatePlayerImpactMetricPrompt({
      tacticalRole: input.currentEvaluation.tacticalRole,
      technical: JSON.stringify(input.currentEvaluation.metrics.technical),
      tactical: JSON.stringify(input.currentEvaluation.metrics.tactical),
      physical: JSON.stringify(input.currentEvaluation.metrics.physical),
      mental: JSON.stringify(input.currentEvaluation.metrics.mental),
      historicalClubData: input.historicalClubData,
    });
    return output!;
  }
);

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  return calculatePlayerImpactMetricFlow(input);
}
