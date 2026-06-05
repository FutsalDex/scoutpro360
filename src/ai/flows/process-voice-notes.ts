'use server';
/**
 * @fileOverview A Genkit flow for processing and categorizing voice notes from football scouts.
 *
 * - processVoiceNote - A function that takes a raw voice note and categorizes it into relevant report sections.
 * - ProcessVoiceNoteInput - The input type for the processVoiceNote function.
 * - ProcessVoiceNoteOutput - The return type for the processVoiceNote function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ProcessVoiceNoteInputSchema = z.object({
  voiceNoteText: z.string().describe('The raw text transcription of a scout\'s verbal observation.'),
});
export type ProcessVoiceNoteInput = z.infer<typeof ProcessVoiceNoteInputSchema>;

const ProcessVoiceNoteOutputSchema = z.object({
  playerObservations: z.array(z.object({
    playerIdentifier: z.string().optional().describe('Identifier for the player, e.g., jersey number or name mentioned in the note. If not explicitly mentioned, infer if possible, otherwise omit.'),
    observation: z.string().describe('Detailed observation about the player.')
  })).describe('Specific observations about individual players. Provide an identifier if available.'),
  tacticalObservations: z.string().optional().describe('General observations about team tactics, formation, or strategy.'),
  technicalSkills: z.string().optional().describe('Summary of observations related to technical skills like passing, dribbling, shooting, first touch, ball control.'),
  physicalAttributes: z.string().optional().describe('Summary of observations related to physical attributes like speed, stamina, strength, agility, aerial ability.'),
  mentalAttributes: z.string().optional().describe('Summary of observations related to mental attributes like decision-making, composure, leadership, aggression, work rate.'),
  keyMatchEvents: z.array(z.string()).describe('A list of specific, important events or actions mentioned in the note, e.g., "key pass in 23rd minute", "interception in own box", "shot on target".'),
  overallSummary: z.string().describe('A concise overall summary of the entire voice note, capturing the most important points and general sentiment.'),
});
export type ProcessVoiceNoteOutput = z.infer<typeof ProcessVoiceNoteOutputSchema>;

export async function processVoiceNote(input: ProcessVoiceNoteInput): Promise<ProcessVoiceNoteOutput> {
  return processVoiceNoteFlow(input);
}

const processVoiceNotePrompt = ai.definePrompt({
  name: 'processVoiceNotePrompt',
  model: 'googleai/gemini-1.5-flash',
  input: { schema: ProcessVoiceNoteInputSchema },
  output: { schema: ProcessVoiceNoteOutputSchema },
  prompt: `You are an AI assistant for a football scouting application. Your task is to process raw voice notes from scouts on the field and categorize the observations into structured sections for a match report. Extract all relevant information and summarize it concisely into the provided output structure.

Here are the categories:
-   playerObservations: For observations about specific players. Try to identify the player (e.g., by jersey number or name) if mentioned, otherwise leave playerIdentifier empty.
-   tacticalObservations: For notes about team-level tactics, formation, or strategy.
-   technicalSkills: For observations about player\'s technical abilities.
-   physicalAttributes: For observations about player\'s physical capabilities.
-   mentalAttributes: For observations about player\'s mental aspects.
-   keyMatchEvents: For specific, significant actions or events that occurred.
-   overallSummary: A brief, comprehensive summary of the entire voice note.

If a category is not mentioned or relevant in the voice note, its corresponding field can be left empty or an empty array.

Voice Note: """{{{voiceNoteText}}}"""`,
});

const processVoiceNoteFlow = ai.defineFlow(
  {
    name: 'processVoiceNoteFlow',
    inputSchema: ProcessVoiceNoteInputSchema,
    outputSchema: ProcessVoiceNoteOutputSchema,
  },
  async (input) => {
    const { output } = await processVoiceNotePrompt(input);
    return output!;
  }
);
