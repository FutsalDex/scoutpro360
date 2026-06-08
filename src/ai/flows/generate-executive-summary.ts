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
  language: z.enum(['en', 'es']).default('es'),
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
  config: {
    safetySettings: [
      { category: 'HARM_CATEGORY_HARASSMENT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_HATE_SPEECH', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT', threshold: 'BLOCK_NONE' },
      { category: 'HARM_CATEGORY_DANGEROUS_CONTENT', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Generate a professional and concise summary STRICTLY in {{{language}}}. Use professional football scouting terminology in {{{language}}}.
It is CRITICAL that the summary is written entirely in {{{language}}}.

Player: {{{playerName}}}
Role: {{{tacticalRole}}}
Metrics: {{{formattedMetrics}}}
Notes: {{{scoutNotes}}}

Provide a 3-4 sentence executive summary focusing on the player's potential and key performance indicators observed.`,
});

export async function generateExecutiveSummary(input: ExecutiveSummaryGenerationInput): Promise<ExecutiveSummaryGenerationOutput> {
  const result = await executiveSummaryFlow(input);
  return result;
}

const executiveSummaryFlow = ai.defineFlow(
  {
    name: 'executiveSummaryFlow',
    inputSchema: ExecutiveSummaryGenerationInputSchema,
    outputSchema: ExecutiveSummaryGenerationOutputSchema,
  },
  async (input) => {
    const { output } = await prompt({
      playerName: input.playerName,
      tacticalRole: input.tacticalRole,
      formattedMetrics: JSON.stringify(input.metrics || {}),
      scoutNotes: input.scoutNotes,
      language: input.language === 'es' ? 'Spanish' : 'English',
    });
    
    if (!output) {
      throw new Error('No se pudo generar el resumen.');
    }
    
    return output;
  }
);
