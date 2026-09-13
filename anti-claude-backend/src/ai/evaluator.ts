import { z } from 'zod';
import { Verdict } from '@prisma/client';
import { grokClient } from './grok.client.js';
import { buildEvaluationPrompt, EvaluationInput } from './prompts/evaluation.js';
import { AIContext } from './context.builder.js';
import { AI_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

const evaluationOutputSchema = z.object({
  score: z.number().int().min(0).max(100),
  creativity: z.number().int().min(0).max(100),
  compliance: z.number().int().min(0).max(100),
  initiative: z.number().int().min(0).max(100),
  reasoning: z.number().int().min(0).max(100),
  speed: z.number().int().min(0).max(100),
  feedback: z.string().min(5).max(500),
  verdict: z.nativeEnum(Verdict),
  memoryCandidates: z.array(z.string()).default([]),
});

export type EvaluationResult = z.infer<typeof evaluationOutputSchema>;

export async function evaluateResponse(
  context: AIContext,
  taskTitle: string,
  taskDescription: string,
  taskCategory: string,
  taskAbsurdityLevel: number,
  evaluationCriteria: string[],
  humanResponse: string,
  deliveredAt: Date,
  respondedAt: Date,
): Promise<EvaluationResult> {
  const promptInput: EvaluationInput = {
    taskTitle,
    taskDescription,
    taskCategory,
    taskAbsurdityLevel,
    evaluationCriteria,
    humanResponse,
    deliveredAt,
    respondedAt,
    employeeRank: context.employee.rank,
  };

  const evalPrompt = buildEvaluationPrompt(promptInput);

  const messages: Parameters<typeof grokClient.chatCompletion>[0] = [
    { role: 'system', content: context.systemPrompt },
    { role: 'user', content: evalPrompt },
  ];

  for (let attempt = 0; attempt < AI_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const result = await grokClient.chatCompletionJson(
        messages,
        (raw) => evaluationOutputSchema.parse(raw),
        {
          temperature: AI_CONFIG.EVALUATION_TEMPERATURE,
          operation: 'evaluation',
        },
      );

      logger.info(
        { score: result.score, verdict: result.verdict },
        'Evaluation completed',
      );
      return result;
    } catch (err: any) {
      logger.warn({ attempt, error: err?.message }, 'Evaluation attempt failed');
      if (attempt === AI_CONFIG.MAX_RETRIES - 1) throw err;
    }
  }

  throw new Error('Evaluation failed after all retries');
}
