'use server';
/**
 * @fileOverview Flujo de Genkit para escanear hojas de alineaciones mediante OCR inteligente.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ScanLineupInputSchema = z.object({
  photoDataUri: z.string().describe("Imagen de la hoja de alineaciones en formato data URI (base64)."),
});
export type ScanLineupInput = z.infer<typeof ScanLineupInputSchema>;

const ScanLineupOutputSchema = z.object({
  detectedPlayers: z.array(z.object({
    name: z.string().describe("Nombre completo del jugador."),
    dorsal: z.string().optional().describe("Número de dorsal."),
    position: z.string().optional().describe("Posición abreviada (PO, DC, MC, etc)."),
  })),
  teamName: z.string().optional().describe("Nombre del equipo si se detecta."),
});
export type ScanLineupOutput = z.infer<typeof ScanLineupOutputSchema>;

export async function scanLineup(input: ScanLineupInput): Promise<ScanLineupOutput> {
  const { output } = await ai.generate({
    model: 'googleai/gemini-1.5-flash',
    input: {
      schema: ScanLineupInputSchema,
      data: input,
    },
    output: {
      schema: ScanLineupOutputSchema,
    },
    prompt: [
      { text: "Eres un experto analista de fútbol. Escanea esta imagen de una hoja de alineaciones oficial y extrae la lista de jugadores." },
      { media: { url: input.photoDataUri, contentType: 'image/jpeg' } }
    ],
  });

  return output as ScanLineupOutput;
}
