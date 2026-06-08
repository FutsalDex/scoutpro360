'use server';
/**
 * @fileOverview This file defines a Genkit flow for generating an objective executive summary.
 * Optimized with relaxed safety filters.
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
      { category: 'HARM_CATEGORY_CIVIC_INTEGRITY', threshold: 'BLOCK_NONE' },
    ],
  },
  prompt: `Generate a professional, concise executive scouting summary STRICTLY in {{{language}}}.
Use elite professional football terminology.

Player: {{{playerName}}}
Role: {{{tacticalRole}}}
Key Ratings: {{{formattedMetrics}}}
Scout Observations: {{{scoutNotes}}}

Provide a 3-4 sentence high-impact summary. Focus on performance ceiling and immediate impact.`,
});

export async function generateExecutiveSummary(input: ExecutiveSummaryGenerationInput): Promise<ExecutiveSummaryGenerationOutput> {
  try {
    const result = await executiveSummaryFlow(input);
    return result;
  } catch (error) {
    console.error("Summary Flow Error:", error);
    return {
      summary: "Error generando el resumen automático. Por favor, redacta el resumen manualmente basándote en tus observaciones."
    };
  }
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
      throw new Error('No se pudo generar el resumen (bloqueo IA).');
    }
    
    return output;
  }
);
