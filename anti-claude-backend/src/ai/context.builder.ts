import {
  EmployeeProfile,
  RelationshipState,
  Memory,
  Task,
  Message,
  EmployeeSettings,
} from '@prisma/client';
import { buildSystemPrompt, SystemPromptContext } from './prompts/system.js';
import { TASK_CONFIG } from '../config/constants.js';

export interface AIContext {
  systemPrompt: string;
  employee: {
    name: string;
    rank: string;
    score: number;
    absurdityLevel: number;
    stats: {
      tasksCompleted: number;
      tasksIgnored: number;
      tasksRejected: number;
      totalInteractions: number;
      averageResponseTime: number;
    };
  };
  relationship: RelationshipState;
  recentTasks: Array<{
    title: string;
    category: string;
    status: string;
    absurdityLevel: number;
  }>;
  recentMessages: Array<{
    senderType: string;
    content: string;
    createdAt: Date;
  }>;
  memories: string[];
}

export function buildAIContext(
  profile: EmployeeProfile & { relationshipState?: RelationshipState | null },
  memories: Memory[],
  recentTasks: Task[],
  recentMessages: Message[],
): AIContext {
  const relationship = profile.relationshipState ?? {
    trust: 50,
    respect: 50,
    annoyance: 10,
    dependence: 20,
    familiarity: 5,
    suspicion: 5,
  };

  const systemPromptCtx: SystemPromptContext = {
    employeeName: profile.displayName,
    rank: profile.rank,
    score: profile.score,
    absurdityLevel: profile.absurdityLevel,
    relationship: relationship as RelationshipState,
    personalityHints: [],
  };

  return {
    systemPrompt: buildSystemPrompt(systemPromptCtx),
    employee: {
      name: profile.displayName,
      rank: profile.rank,
      score: profile.score,
      absurdityLevel: profile.absurdityLevel,
      stats: {
        tasksCompleted: profile.tasksCompleted,
        tasksIgnored: profile.tasksIgnored,
        tasksRejected: profile.tasksRejected,
        totalInteractions: profile.totalInteractions,
        averageResponseTime: profile.averageResponseTime,
      },
    },
    relationship: relationship as RelationshipState,
    recentTasks: recentTasks.slice(0, TASK_CONFIG.MAX_RECENT_TASKS_CONTEXT).map((t) => ({
      title: t.title,
      category: t.category,
      status: t.status,
      absurdityLevel: t.absurdityLevel,
    })),
    recentMessages: recentMessages.slice(0, TASK_CONFIG.MAX_RECENT_MESSAGES_CONTEXT).map((m) => ({
      senderType: m.senderType,
      content: m.content.substring(0, 300), // Truncate very long messages
      createdAt: m.createdAt,
    })),
    memories: memories.map((m) => m.content),
  };
}
