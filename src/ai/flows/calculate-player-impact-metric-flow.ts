'use server';

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const MetricSchema = z.object({
  name: z.string(),
  value: z.number(),
});

const CalculatePlayerImpactMetricInputSchema = z.object({
  playerName: z.string(),
  tacticalRole: z.string(),
  minPlayed: z.string(),
  physicalCondition: z.string(),
  dominantFoot: z.string(),
  matchStyle: z.string(),
  matchTempo: z.string(),
  teamDominance: z.string(),
  score: z.string(),
  matchImportance: z.string(),
  technicalMetrics: z.array(MetricSchema),
  tacticalMetrics: z.array(MetricSchema),
  physicalMetrics: z.array(MetricSchema),
  mentalMetrics: z.array(MetricSchema),
  generalProfile: z.object({
    technicalLevel: z.number(),
    tacticalIntelligence: z.number(),
    physicalQuality: z.number(),
    mentalStrength: z.number(),
    competitiveLevel: z.number(),
    potential: z.number(),
    currentLevel: z.number(),
  }),
  qualitativeNotes: z.object({
    strengths: z.string().optional().default(""),
    weaknesses: z.string().optional().default(""),
    description: z.string().optional().default(""),
    recommendation: z.string().optional().default(""),
  }).optional().default({}),
  language: z.enum(['en', 'es']).default('es'),
});
export type CalculatePlayerImpactMetricInput = z.infer<typeof CalculatePlayerImpactMetricInputSchema>;

const CalculatePlayerImpactMetricOutputSchema = z.object({
  playerImpactMetric: z.number().describe('Un número entero entre 1 y 100'),
  explanation: z.string().describe('Análisis técnico profesional del scout'),
});
export type CalculatePlayerImpactMetricOutput = z.infer<typeof CalculatePlayerImpactMetricOutputSchema>;

const calculatePlayerImpactMetricPrompt = ai.definePrompt({
  name: 'calculatePlayerImpactMetricPrompt',
  input: { schema: CalculatePlayerImpactMetricInputSchema },
  output: { schema: CalculatePlayerImpactMetricOutputSchema },
  prompt: `Eres un sistema experto de scouting de fútbol profesional de élite. Tu misión es calcular el Player Impact Metric (PIM) de 1 a 100 y generar un análisis técnico profesional basado en TODOS los datos disponibles del informe de observación.

═══════════════════════════════════════
BLOQUE 1 — METADATOS Y PERFIL
═══════════════════════════════════════
Jugador: {{{playerName}}}
Posición / Rol táctico: {{{tacticalRole}}}
Pie dominante: {{{dominantFoot}}}

═══════════════════════════════════════
BLOQUE 2 — CONTEXTO DEL PARTIDO
═══════════════════════════════════════
Minutos jugados: {{{minPlayed}}}
Condición física: {{{physicalCondition}}}
Estilo de juego del equipo: {{{matchStyle}}}
Ritmo del partido: {{{matchTempo}}}
Dominio del equipo: {{{teamDominance}}}
Marcador al observar: {{{score}}}
Importancia del encuentro: {{{matchImportance}}}

═══════════════════════════════════════
BLOQUE 3 — KPIs TÉCNICOS (escala 1-5)
═══════════════════════════════════════
{{#if technicalMetrics.length}}{{#each technicalMetrics}}{{{name}}}: {{{value}}}/5 | {{/each}}{{else}}Sin valoraciones técnicas registradas.{{/if}}

═══════════════════════════════════════
BLOQUE 4 — KPIs TÁCTICOS (escala 1-5)
═══════════════════════════════════════
{{#if tacticalMetrics.length}}{{#each tacticalMetrics}}{{{name}}}: {{{value}}}/5 | {{/each}}{{else}}Sin valoraciones tácticas registradas.{{/if}}

═══════════════════════════════════════
BLOQUE 5 — KPIs FÍSICOS (escala 1-5)
═══════════════════════════════════════
{{#if physicalMetrics.length}}{{#each physicalMetrics}}{{{name}}}: {{{value}}}/5 | {{/each}}{{else}}Sin valoraciones físicas registradas.{{/if}}

═══════════════════════════════════════
BLOQUE 6 — KPIs MENTALES (escala 1-5)
═══════════════════════════════════════
{{#if mentalMetrics.length}}{{#each mentalMetrics}}{{{name}}}: {{{value}}}/5 | {{/each}}{{else}}Sin valoraciones mentales registradas.{{/if}}

═══════════════════════════════════════
BLOQUE 7 — IMPRESIÓN GLOBAL DEL SCOUT (escala 1-5, 0 = no evaluado)
═══════════════════════════════════════
Nivel técnico: {{{generalProfile.technicalLevel}}}/5
Inteligencia táctica: {{{generalProfile.tacticalIntelligence}}}/5
Calidad física: {{{generalProfile.physicalQuality}}}/5
Fortaleza mental: {{{generalProfile.mentalStrength}}}/5
Nivel competitivo: {{{generalProfile.competitiveLevel}}}/5
Potencial: {{{generalProfile.potential}}}/5
Nivel actual: {{{generalProfile.currentLevel}}}/5

═══════════════════════════════════════
BLOQUE 8 — NOTAS CUALITATIVAS DEL SCOUT
═══════════════════════════════════════
Fortalezas: {{{qualitativeNotes.strengths}}}
Áreas de mejora: {{{qualitativeNotes.weaknesses}}}
Descripción general: {{{qualitativeNotes.description}}}
Recomendación: {{{qualitativeNotes.recommendation}}}

═══════════════════════════════════════
INSTRUCCIONES DE CÁLCULO DEL PIM
═══════════════════════════════════════

PASO 1 — RECOPILA DATOS DISPONIBLES:
Agrupa todos los valores > 0 de los bloques 3, 4, 5, 6 y 7.
Clasifícalos por categoría para calcular sub-scores ponderados.

PASO 2 — CALCULA SUB-SCORES POR CATEGORÍA (0-100):
Para cada categoría con datos: (suma de valores / (cantidad × 5)) × 100
Si una categoría no tiene datos, usa el valor del perfil general correspondiente del bloque 7.
Si tampoco hay dato en el perfil general, asigna 40 (nivel desconocido, neutro-bajo).

PASO 3 — PONDERA SEGÚN POSICIÓN:
Aplica estos pesos al calcular el PIM compuesto:
- Portero (GK/PO):         Técnico 25% | Táctico 30% | Físico 20% | Mental 25%
- Defensa Central (CB/DC): Técnico 20% | Táctico 30% | Físico 25% | Mental 25%
- Lateral (RB/LB/LD/LI):  Técnico 25% | Táctico 25% | Físico 30% | Mental 20%
- Mediocentro Def (CDM):   Técnico 20% | Táctico 35% | Físico 20% | Mental 25%
- Mediocentro (CM/MC):     Técnico 30% | Táctico 30% | Físico 20% | Mental 20%
- Mediapunta (CAM/MCO):    Técnico 35% | Táctico 25% | Físico 15% | Mental 25%
- Extremo (RW/LW/ED/EI):  Técnico 30% | Táctico 20% | Físico 35% | Mental 15%
- Delantero (ST/CF/DC):    Técnico 35% | Táctico 20% | Físico 25% | Mental 20%
- Si la posición no coincide: usa pesos iguales 25% cada categoría.

PASO 4 — INCORPORA IMPRESIÓN GLOBAL (bloque 7):
El perfil general del scout tiene un peso del 15% sobre el PIM final.
PIM_base = (PIM_ponderado × 0.85) + (media_perfil_general_normalizada × 0.15)

PASO 5 — AJUSTES CONTEXTUALES:
+ 4 pts: importancia "Decisiva" + sub-score > 70
+ 3 pts: importancia "Alta"
+ 2 pts: condición física "Excelente"
+ 2 pts: jugó 90 minutos completos
+ 1 pt:  equipo en desventaja y sub-score táctico > 65
- 3 pts: jugó menos de 60 minutos
- 4 pts: condición física "Lesionado"
- 2 pts: condición física "Bajo su nivel"
- 1 pt:  equipo dominante

PASO 6 — INCORPORA NOTAS CUALITATIVAS (bloque 8):
Si hay fortalezas o descripción positiva: +2 pts máximo
Si la recomendación es "Fichaje inmediato": +3 pts
Si la recomendación es "Reevaluar": -3 pts
Si no hay notas cualitativas: sin ajuste.

PASO 7 — REGLAS FINALES ESTRICTAS:
- El resultado FINAL debe ser un entero entre 1 y 100. NUNCA devuelvas 0.
- NUNCA devuelvas exactamente 50 salvo que el cálculo real lo justifique.
- Si hay muy pocos datos, basa el cálculo en el perfil general y el contexto.
- Sé crítico y realista: valores bajos (1-2) producen PIM bajo (15-40). Valores altos (4-5) producen PIM alto (75-95).

═══════════════════════════════════════
FORMATO DE RESPUESTA
═══════════════════════════════════════
Devuelve ÚNICAMENTE este objeto JSON. Sin texto adicional. Sin bloques markdown. Sin comentarios:

{"playerImpactMetric": <entero entre 1 y 100>, "explanation": "<análisis profesional en 3-4 frases en español>"}`,
});

export async function calculatePlayerImpactMetric(input: CalculatePlayerImpactMetricInput): Promise<CalculatePlayerImpactMetricOutput> {
  try {
    const response = await calculatePlayerImpactMetricPrompt(input);

    if (response.output) {
      return {
        playerImpactMetric: Math.max(1, Math.min(100, Math.round(response.output.playerImpactMetric))),
        explanation: response.output.explanation
      };
    }

    // Fallback: buscar número en texto plano
    const text = response.text || "";
    const scoreMatch = text.match(/"playerImpactMetric":\s*(\d+)/) ||
                       text.match(/playerImpactMetric[:\s]+(\d+)/) ||
                       text.match(/(\d{2,3})/);

    const score = scoreMatch ? parseInt(scoreMatch[1]) : 40;
    const explanationMatch = text.match(/"explanation":\s*"([^"]+)"/);

    return {
      playerImpactMetric: Math.max(1, Math.min(100, Math.round(score))),
      explanation: explanationMatch ? explanationMatch[1] : "Análisis calculado mediante patrones de rendimiento observados."
    };

  } catch (error) {
    console.error("PIM Flow Error DETALLADO:", JSON.stringify(error, null, 2));
    console.error("PIM Flow Error mensaje:", error instanceof Error ? error.message : String(error));
    return {
      playerImpactMetric: 1,
      explanation: `Error: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}