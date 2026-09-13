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

export const SCENARIO_THEMES = [
  'Academic Cram: Canvas portal locks in 8 minutes — urgent essay paragraphs or philosophical argument needed before zero grade',
  'Crush Dilemma: Crush posted an Instagram story or sent a cryptic text ("k." or "👍") — craft a witty, high-rizz reply without looking down-bad',
  'Roommate Warfare: Roommate committed dorm crimes (radioactive food in microwave, unwashed pans) — draft a passive-aggressive sticky note',
  'Professor Negotiation: Slept through an 8 AM midterm or need a paper extension — write a medically tragic, blameless excuse email',
  'Dorm Survival: 3 AM all-nighter culinary disaster or running on pure caffeine — need an emergency survival pep-talk',
  'Group Project Betrayal: Slackers in the group project did zero work — write a savage yet professional message to the group chat',
  'Campus Fashion & Fit Check: Need a photographic fit check or verification that an outfit does not look completely unhinged',
  'Late-Night Coding Meltdown: Convinced a Python/C++ compiler error is personally haunting the dorm — need diagnostic advice',
];

export async function generateTask(
  context: AIContext,
  opts: { isEmergency?: boolean; overrideAbsurdityLevel?: number; scenarioTheme?: string } = {},
): Promise<GeneratedTask> {
  const absurdityLevel = opts.overrideAbsurdityLevel ?? context.employee.absurdityLevel;
  const isEmergency = opts.isEmergency ?? false;

  // Pick a random creative scenario theme if not provided
  const scenarioTheme = opts.scenarioTheme ?? SCENARIO_THEMES[Math.floor(Math.random() * SCENARIO_THEMES.length)];

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
    scenarioTheme,
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
