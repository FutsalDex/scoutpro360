import { config } from 'dotenv';
config();

import '@/ai/flows/process-voice-notes.ts';
import '@/ai/flows/calculate-player-impact-metric-flow.ts';
import '@/ai/flows/generate-executive-summary.ts';