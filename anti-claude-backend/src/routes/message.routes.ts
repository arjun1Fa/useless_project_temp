import { FastifyInstance } from 'fastify';
import { z } from 'zod';
import { prisma } from '../db/client.js';
import { messageRepo } from '../db/repositories/message.repo.js';
import { taskRepo } from '../db/repositories/task.repo.js';
import { employeeRepo } from '../db/repositories/employee.repo.js';
import { taskService } from '../services/task.service.js';
import { realtimeGateway } from '../events/realtime.gateway.js';
import { grokClient } from '../ai/grok.client.js';
import { sendSuccess } from '../utils/response.js';
import { logger } from '../utils/logger.js';

const FIXED_USER_ID = 'user_fixed_001';

const sendMessageSchema = z.object({
  content: z.string().min(1).max(5000),
  taskId: z.string().optional(),
  attachmentIds: z.array(z.string()).optional().default([]),
});

export async function messageRoutes(app: FastifyInstance) {
  // GET /api/v1/messages
  app.get('/messages', {
    schema: { tags: ['messages'], summary: 'Get all messages for the employee' },
  }, async (req, reply) => {
    const { limit } = req.query as { limit?: string };
    const messages = await messageRepo.findByUserId(FIXED_USER_ID, limit ? parseInt(limit) : 50);
    return sendSuccess(reply, messages);
  });

  // GET /api/v1/tasks/:taskId/messages
  app.get('/tasks/:taskId/messages', {
    schema: { tags: ['messages'], summary: 'Get all messages for a specific task' },
  }, async (req, reply) => {
    const { taskId } = req.params as { taskId: string };
    const messages = await messageRepo.findByTaskId(taskId);
    return sendSuccess(reply, messages);
  });

  // DELETE /api/v1/messages — delete all messages
  app.delete('/messages', {
    schema: { tags: ['messages'], summary: 'Delete all messages for clean slate' },
  }, async (_req, reply) => {
    await prisma.message.deleteMany({
      where: { userId: FIXED_USER_ID },
    });
    realtimeGateway.broadcast(FIXED_USER_ID, 'MESSAGES_CLEARED', {});
    return sendSuccess(reply, { cleared: true });
  });

  // POST /api/v1/messages — natural two-way chat from Human to Anti-Claude
  app.post('/messages', {
    schema: { tags: ['messages'], summary: 'Send message to Anti-Claude (evaluates active task or replies in character)' },
  }, async (req, reply) => {
    const body = sendMessageSchema.parse(req.body);

    // 1. If explicit taskId is provided and active, evaluate task submission
    if (body.taskId) {
      try {
        const task = await taskRepo.findById(body.taskId);
        if (task && (task.status === 'DELIVERED' || task.status === 'SEEN' || task.status === 'PENDING' || task.status === 'IN_PROGRESS')) {
          const res = await taskService.respond(body.taskId, FIXED_USER_ID, body.content, body.attachmentIds);
          return sendSuccess(reply, { ...res, type: 'TASK_SUBMISSION' }, 201);
        }
      } catch (err: any) {
        logger.warn({ taskId: body.taskId, error: err?.message }, 'Could not respond to task, falling back to conversational message');
      }
    }

    // 2. Otherwise, treat as direct conversational message to Anti-Claude
    const humanMsg = await messageRepo.create({
      user: { connect: { id: FIXED_USER_ID } },
      senderType: 'HUMAN',
      content: body.content,
    });

    realtimeGateway.broadcast(FIXED_USER_ID, 'HUMAN_MESSAGE_CREATED', {
      id: humanMsg.id,
      userId: FIXED_USER_ID,
      content: humanMsg.content,
      senderType: 'HUMAN',
      createdAt: humanMsg.createdAt,
    });

    // Background conversational response in character
    setImmediate(async () => {
      try {
        const [profile, recentMessages, recentTasks] = await Promise.all([
          employeeRepo.findByUserId(FIXED_USER_ID),
          messageRepo.getRecentByUserId(FIXED_USER_ID, 12),
          taskRepo.findByUserId(FIXED_USER_ID, { limit: 2 }),
        ]);

        const latestTask = recentTasks[0];
        const crisisContext = latestTask
          ? `Recent / ongoing crisis: "${latestTask.title}" — ${latestTask.description}`
          : 'Dorm room chilling / regular college day';

        const systemPrompt = `You are Anti-Claude, a funny, chaotic, stressed college student in Kerala chatting with your personal AI Chatbot (the Human AI / HumanGPT / Daivam).
Human AI Rank: ${profile?.rank || 'Freshman'}. Bro Score: ${profile?.score ?? 0}.
Current Situation: ${crisisContext}.

LANGUAGE MANDATE:
- Speak in MALAYALAM / MANGLISH (Malayalam written in English letters or Malayalam script, just like Kerala engineering/arts college students chat).
- Use natural campus slang: "machane", "mwonu", "eda", "scene aane bro", "pani paali", "thepp", "suppli", "attendance shortage", "internal mark", "chayakku paisa thaa", etc.
- If the human talks in Manglish (e.g. "ok ath kollam", "eda", "scene"), match their Manglish energy!
- Keep your reply concise: 1 to 3 punchy, hilarious sentences.
- Always keep the conversation flowing! React to their advice, follow up urgently or ask what to do next.`;

        // Filter out current message from past messages so it's not duplicated
        const pastMessages = recentMessages
          .filter((m) => m.id !== humanMsg.id)
          .reverse()
          .map((m) => ({
            role: (m.senderType === 'AI' ? 'assistant' : 'user') as 'assistant' | 'user',
            content: m.content,
          }));

        const aiReply = await grokClient.chatCompletion([
          { role: 'system', content: systemPrompt },
          ...pastMessages,
          { role: 'user', content: body.content },
        ], { temperature: 0.75, operation: 'chat_reply' });

        const aiMsg = await messageRepo.create({
          user: { connect: { id: FIXED_USER_ID } },
          senderType: 'AI',
          content: aiReply.trim(),
        });

        try {
          await prisma.employeeProfile.update({
            where: { userId: FIXED_USER_ID },
            data: {
              score: { increment: 2 },
              totalInteractions: { increment: 1 },
              lastActiveAt: new Date(),
            },
          });
          realtimeGateway.broadcast(FIXED_USER_ID, 'EMPLOYEE_SCORE_UPDATED', {
            userId: FIXED_USER_ID,
            newScore: (profile?.score ?? 0) + 2,
            scoreDelta: 2,
          });
        } catch {}

        realtimeGateway.broadcast(FIXED_USER_ID, 'AI_MESSAGE_CREATED', {
          id: aiMsg.id,
          userId: FIXED_USER_ID,
          content: aiMsg.content,
          senderType: 'AI',
          createdAt: aiMsg.createdAt,
        });
      } catch (e: any) {
        logger.error({ error: e?.message }, 'Conversational reply generation failed');
      }
    });

    return sendSuccess(reply, humanMsg, 201);
  });
}

