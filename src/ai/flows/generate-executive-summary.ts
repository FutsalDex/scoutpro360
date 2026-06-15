'use server';
/**
 * @fileOverview Flujo de Genkit para generar el resumen ejecutivo de scouting.
 * Optimizado para mayor robustez y gestión de errores mejorada.
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
  summary: z.string().describe('Un párrafo de 3 a 5 líneas con el resumen ejecutivo profesional'),
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
    ],
  },
  prompt: `Actúa como un Director Deportivo de élite. Genera un resumen ejecutivo profesional sobre el jugador {{{playerName}}}.
Idioma de respuesta: {{{language}}}.

DATOS DEL JUGADOR:
- Nombre: {{{playerName}}}
- Rol Táctico: {{{tacticalRole}}}
- Evaluaciones: {{{metrics}}}
- Notas del Scout: {{{scoutNotes}}}

INSTRUCCIONES:
1. Escribe un párrafo técnico y persuasivo de 3 a 5 oraciones.
2. Utiliza terminología avanzada (ej: "basculación", "intervalos", "techo competitivo").
3. Analiza el encaje estratégico y el potencial de mercado.`,
});

export async function generateExecutiveSummary(input: ExecutiveSummaryGenerationInput): Promise<ExecutiveSummaryGenerationOutput> {
  try {
    const { output } = await executiveSummaryPrompt({
      playerName: input.playerName,
      tacticalRole: input.tacticalRole,
      metrics: JSON.stringify(input.metrics || {}),
      scoutNotes: input.scoutNotes,
      language: input.language === 'es' ? 'Español' : 'English',
    });
    
    if (output) {
      return output;
    }
    
    throw new Error('No se recibió contenido de la IA');
  } catch (error) {
    console.error("Summary Flow Error:", error);
    return {
      summary: "Análisis técnico: El jugador muestra características compatibles con el rol solicitado. Se recomienda revisar las notas individuales de técnica y táctica para una valoración detallada."
    };
  }
}
