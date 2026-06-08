'use server';
/**
 * @fileOverview Flujo de Genkit para generar el resumen ejecutivo de scouting.
 * Optimizado con filtros de seguridad relajados y mejores instrucciones de formato.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const ExecutiveSummaryGenerationInputSchema = z.object({
  playerName: z.string(),
  tacticalRole: z.string(),
  metrics: z.record(z.any()).optional(),
  scoutNotes: z.string(),
  language: z.enum(['en', 'es']).default('es'),
});
export type ExecutiveSummaryGenerationInput = z.infer<typeof ExecutiveSummaryGenerationInputSchema>;

const ExecutiveSummaryGenerationOutputSchema = z.object({
  summary: z.string().describe('Un párrafo de 3 a 5 líneas con el resumen ejecutivo'),
});
export type ExecutiveSummaryGenerationOutput = z.infer<typeof ExecutiveSummaryGenerationOutputSchema>;

const executiveSummaryPrompt = ai.definePrompt({
  name: 'executiveSummaryPrompt',
  input: {
    schema: z.object({
      playerName: z.string(),
      tacticalRole: z.string(),
      metrics: z.string(),
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
  prompt: `Genera un resumen ejecutivo profesional para un informe de scouting de fútbol.
Idioma: {{{language}}}.
Nivel: Profesional / Dirección Deportiva.

DATOS DISPONIBLES:
Jugador: {{{playerName}}}
Rol Táctico: {{{tacticalRole}}}
Puntuaciones Clave: {{{metrics}}}
Observaciones del Scout: {{{scoutNotes}}}

INSTRUCCIONES:
1. Sintetiza la información en un párrafo de alto impacto (3-5 oraciones).
2. Usa terminología técnica de élite (ej: "transición defensiva", "techo competitivo", "volumen de juego").
3. Enfócate en el potencial de mercado y el impacto inmediato en la plantilla.
4. Devuelve el resultado exclusivamente en formato JSON bajo la clave "summary".`,
});

export async function generateExecutiveSummary(input: ExecutiveSummaryGenerationInput): Promise<ExecutiveSummaryGenerationOutput> {
  try {
    const result = await executiveSummaryFlow(input);
    return result;
  } catch (error) {
    console.error("Summary Flow Error:", error);
    return {
      summary: "No se ha podido procesar el resumen automático. Por favor, revisa la conexión con el servidor IA o redacta las conclusiones manualmente."
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
    const { output } = await executiveSummaryPrompt({
      playerName: input.playerName,
      tacticalRole: input.tacticalRole,
      metrics: JSON.stringify(input.metrics || {}),
      scoutNotes: input.scoutNotes,
      language: input.language === 'es' ? 'Español' : 'English',
    });
    
    if (!output || !output.summary) {
      throw new Error('IA Output was empty or invalid format');
    }
    
    return { summary: output.summary };
  }
);
