import { z } from 'zod';
import { TaskCategory, TaskPriority, ResponseType } from '@prisma/client';
import { grokClient } from './grok.client.js';
import { buildTaskPrompt, TaskGenerationInput } from './prompts/task.js';
import { AIContext } from './context.builder.js';
import { AI_CONFIG, TASK_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// ─── Zod schema for validating AI task output ─────────────────────────────────
const taskOutputSchema = z.object({
  title: z.string().min(3).max(200),
  description: z.string().min(10).max(2000),
  aiMessage: z.string().min(5).max(1000),
  category: z.nativeEnum(TaskCategory),
  priority: z.nativeEnum(TaskPriority),
  absurdityLevel: z.number().int().min(1).max(5),
  isEmergency: z.boolean(),
  expectedResponseType: z.nativeEnum(ResponseType),
  deadlineSeconds: z.number().int().min(60).max(86400).default(600),
  businessValue: z.string().default('NEGLIGIBLE'),
  evaluationCriteria: z.array(z.string()).min(1).max(6),
});

export type GeneratedTask = z.infer<typeof taskOutputSchema>;

export async function generateTask(
  context: AIContext,
  opts: { isEmergency?: boolean; overrideAbsurdityLevel?: number } = {},
): Promise<GeneratedTask> {
  const absurdityLevel = opts.overrideAbsurdityLevel ?? context.employee.absurdityLevel;
  const isEmergency = opts.isEmergency ?? false;

  // Decide self-delegation
  const selfDelegationRoll = Math.random() < TASK_CONFIG.SELF_DELEGATION_PROBABILITY;

  const promptInput: TaskGenerationInput = {
    recentTaskCategories: context.recentTasks.map((t) => t.category),
    recentTaskTitles: context.recentTasks.map((t) => t.title),
    absurdityLevel,
    rank: context.employee.rank,
    score: context.employee.score,
    isEmergency,
    selfDelegationAllowed: selfDelegationRoll,
    memories: context.memories,
  };

  const taskPrompt = buildTaskPrompt(promptInput);

  const messages: Parameters<typeof grokClient.chatCompletion>[0] = [
    { role: 'system', content: context.systemPrompt },
    { role: 'user', content: taskPrompt },
  ];

  for (let attempt = 0; attempt < AI_CONFIG.MAX_RETRIES; attempt++) {
    try {
      const result = await grokClient.chatCompletionJson(
        messages,
        (raw) => taskOutputSchema.parse(raw),
        {
          temperature: AI_CONFIG.TASK_GENERATION_TEMPERATURE,
          operation: 'task_generation',
        },
      );

      logger.info({ title: result.title, category: result.category }, 'Task generated');
      return result;
    } catch (err: any) {
      logger.warn({ attempt, error: err?.message }, 'Task generation attempt failed');
      if (attempt === AI_CONFIG.MAX_RETRIES - 1) throw err;
    }
  }

  throw new Error('Task generation failed after all retries');
}
