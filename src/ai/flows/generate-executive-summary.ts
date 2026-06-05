'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating an objective executive summary
 * from a scout's detailed report, including player metrics and textual observations.
 *
 * - generateExecutiveSummary - A function that handles the executive summary generation process.
 * - ExecutiveSummaryGenerationInput - The input type for the generateExecutiveSummary function.
 * - ExecutiveSummaryGenerationOutput - The return type for the generateExecutiveSummary function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExecutiveSummaryGenerationInputSchema = z.object({
  playerName: z.string().describe('The name of the player being scouted.'),
  tacticalRole: z.string().describe('The tactical role of the player being evaluated (e.g., Inverted Fullback, Deep-Lying Playmaker).'),
  metrics: z.record(z.string(), z.record(z.string(), z.union([z.number(), z.string()]))).describe('Detailed evaluations divided into Technical, Tactical, Physical, and Mental categories, with sub-metrics and their scores.').optional(),
  scoutNotes: z.string().describe('Comprehensive textual observations and notes from the scout report.'),
  language: z.enum(['en', 'es']).describe('The language in which to generate the summary.').default('en'),
});
export type ExecutiveSummaryGenerationInput = z.infer<typeof ExecutiveSummaryGenerationInputSchema>;

const ExecutiveSummaryGenerationOutputSchema = z.object({
  summary: z.string().describe('A concise, objective executive summary of the scout report.'),
});
export type ExecutiveSummaryGenerationOutput = z.infer<typeof ExecutiveSummaryGenerationOutputSchema>;

async function formatMetricsForPrompt(metrics: ExecutiveSummaryGenerationInput['metrics']): Promise<string> {
  if (!metrics || Object.keys(metrics).length === 0) {
    return 'No specific metric scores provided.';
  }

  let formatted = '';
  for (const category in metrics) {
    if (Object.prototype.hasOwnProperty.call(metrics, category)) {
      formatted += `${category.charAt(0).toUpperCase() + category.slice(1)}:\n`;
      const subMetrics = metrics[category];
      if (typeof subMetrics === 'object' && subMetrics !== null) {
        for (const subMetric in subMetrics) {
          if (Object.prototype.hasOwnProperty.call(subMetrics, subMetric)) {
            formatted += `- ${subMetric.charAt(0).toUpperCase() + subMetric.slice(1)}: ${subMetrics[subMetric]}\n`;
          }
        }
      }
    }
  }
  return formatted;
}

const prompt = ai.definePrompt({
  name: 'executiveSummaryPrompt',
  model: 'googleai/gemini-1.5-pro',
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
  prompt: `You are an expert football analyst tasked with generating an objective executive summary from a scout's detailed report.
Your goal is to synthesize the provided player metrics and textual observations into a concise, high-level overview, eliminating any subjective bias.

The summary MUST be written in {{{language}}}.

Player Name: {{{playerName}}}
Tactical Role: {{{tacticalRole}}}

--- Detailed Metrics ---
{{{formattedMetrics}}}

--- Scout Observations ---
{{{scoutNotes}}}

Based on the above information, generate an objective executive summary of this player's scout report. Focus on their key strengths, areas for development, and overall potential relative to their tactical role. The summary should be professional and suitable for management.`,
});

const executiveSummaryGenerationFlow = ai.defineFlow(
  {
    name: 'executiveSummaryGenerationFlow',
    inputSchema: ExecutiveSummaryGenerationInputSchema,
    outputSchema: ExecutiveSummaryGenerationOutputSchema,
  },
  async (input) => {
    const formattedMetrics = await formatMetricsForPrompt(input.metrics);
    const targetLanguage = input.language === 'es' ? 'Spanish' : 'English';

    const { output } = await prompt({
      playerName: input.playerName,
      tacticalRole: input.tacticalRole,
      formattedMetrics: formattedMetrics,
      scoutNotes: input.scoutNotes,
      language: targetLanguage,
    });
    return output!;
  },
);

export async function generateExecutiveSummary(
  input: ExecutiveSummaryGenerationInput,
): Promise<ExecutiveSummaryGenerationOutput> {
  return executiveSummaryGenerationFlow(input);
}
