'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating an objective executive summary.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExecutiveSummaryGenerationInputSchema = z.object({
  playerName: z.string(),
  tacticalRole: z.string(),
  metrics: z.record(z.string(), z.any()).optional(),
  scoutNotes: z.string(),
  language: z.enum(['en', 'es']).default('en'),
});
export type ExecutiveSummaryGenerationInput = z.infer<typeof ExecutiveSummaryGenerationInputSchema>;

const ExecutiveSummaryGenerationOutputSchema = z.object({
  summary: z.string(),
});
export type ExecutiveSummaryGenerationOutput = z.infer<typeof ExecutiveSummaryGenerationOutputSchema>;

const prompt = ai.definePrompt({
  name: 'executiveSummaryPrompt',
  input: {
    schema: z.object({
      playerName: z.string(),
      tacticalRole: z.string(),
      formattedMetrics: z.string(),
      scoutNotes: z.string(),
      language: z.string(),
    }),
  },
  output: { schema: ExecutiveSummaryGenerationOutputSchema },
  prompt: `Generate a concise summary in {{{language}}}.
Player: {{{playerName}}}
Role: {{{tacticalRole}}}
Metrics: {{{formattedMetrics}}}
Notes: {{{scoutNotes}}}`,
});

export async function generateExecutiveSummary(input: ExecutiveSummaryGenerationInput): Promise<ExecutiveSummaryGenerationOutput> {
  const { output } = await prompt({
    playerName: input.playerName,
    tacticalRole: input.tacticalRole,
    formattedMetrics: JSON.stringify(input.metrics || {}),
    scoutNotes: input.scoutNotes,
    language: input.language === 'es' ? 'Spanish' : 'English',
  });
  return output!;
}
