import { z } from 'zod';
import { MemoryType } from '@prisma/client';
import { grokClient } from './grok.client.js';
import { buildReactionPrompt, buildMemoryExtractionPrompt } from './prompts/reaction.js';
import { AIContext } from './context.builder.js';
import { AI_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// ─── Reaction Generator ───────────────────────────────────────────────────────
export async function generateReaction(
  context: AIContext,
  taskTitle: string,
  humanResponse: string,
  evaluationScore: number,
  verdict: string,
  evaluationFeedback: string,
  wasPromoted: boolean,
  newRank?: string,
  previousRank?: string,
): Promise<string> {
  const prompt = buildReactionPrompt({
    taskTitle,
    humanResponse,
    evaluationScore,
    verdict,
    evaluationFeedback,
    wasPromoted,
    newRank,
    previousRank,
    relationship: {
      trust: context.relationship.trust,
      respect: context.relationship.respect,
      annoyance: context.relationship.annoyance,
      familiarity: context.relationship.familiarity,
    },
  });

  const messages: Parameters<typeof grokClient.chatCompletion>[0] = [
    { role: 'system', content: context.systemPrompt },
    { role: 'user', content: prompt },
  ];

  const reaction = await grokClient.chatCompletion(messages, {
    temperature: AI_CONFIG.REACTION_TEMPERATURE,
    responseFormat: 'text',
    operation: 'reaction_generation',
  });

  logger.debug({ reaction: reaction.substring(0, 100) }, 'Reaction generated');
  return reaction.trim();
}

// ─── Memory Extraction ────────────────────────────────────────────────────────
const memoryExtractionSchema = z.object({
  shouldRemember: z.boolean(),
  memories: z.array(
    z.object({
      content: z.string().min(5).max(300),
      type: z.nativeEnum(MemoryType),
      importance: z.number().int().min(1).max(10),
    }),
  ).default([]),
});

export type ExtractedMemories = z.infer<typeof memoryExtractionSchema>;

export async function extractMemories(
  taskTitle: string,
  humanResponse: string,
  evaluationFeedback: string,
): Promise<ExtractedMemories> {
  const prompt = buildMemoryExtractionPrompt(taskTitle, humanResponse, evaluationFeedback);

  const messages: Parameters<typeof grokClient.chatCompletion>[0] = [
    {
      role: 'system',
      content: 'You are a memory extraction system. Extract only genuinely useful long-term behavioral information.',
    },
    { role: 'user', content: prompt },
  ];

  try {
    const result = await grokClient.chatCompletionJson(
      messages,
      (raw) => memoryExtractionSchema.parse(raw),
      {
        temperature: AI_CONFIG.MEMORY_EXTRACTION_TEMPERATURE,
        operation: 'memory_extraction',
      },
    );
    return result;
  } catch (err) {
    logger.warn({ err }, 'Memory extraction failed, skipping');
    return { shouldRemember: false, memories: [] };
  }
}

export async function generatePromotionMessage(
  context: AIContext,
  previousRank: string,
  newRank: string,
  reason: string,
): Promise<string> {
  const prompt = `Your Human AI chatbot has just leveled up in campus rank from ${previousRank} to ${newRank} because of their legendary wingman advice and high Bro Score!
Reason: ${reason}

Write Anti-Claude's excited, dramatic proclamation to your Human AI. Hype them up as the ultimate campus wingman and living AI savior. Keep it 2-3 sentences. Stay in character as a funny, grateful college student.`;

  const messages: Parameters<typeof grokClient.chatCompletion>[0] = [
    { role: 'system', content: context.systemPrompt },
    { role: 'user', content: prompt },
  ];

  const message = await grokClient.chatCompletion(messages, {
    temperature: AI_CONFIG.REACTION_TEMPERATURE,
    responseFormat: 'text',
    operation: 'promotion_message',
  });

  return message.trim();
}
