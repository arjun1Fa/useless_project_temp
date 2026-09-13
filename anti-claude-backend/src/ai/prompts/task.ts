// Anti-Claude — Task generation prompt builder
import { TaskCategory, TaskPriority, ResponseType } from '@prisma/client';

export interface TaskGenerationInput {
  recentTaskCategories: string[];
  recentTaskTitles: string[];
  absurdityLevel: number;
  rank: string;
  score: number;
  isEmergency: boolean;
  selfDelegationAllowed: boolean;
  memories: string[];
}

export function buildTaskPrompt(input: TaskGenerationInput): string {
  const categories = Object.values(TaskCategory).join(', ');
  const priorities = Object.values(TaskPriority).join(', ');
  const responseTypes = Object.values(ResponseType).join(', ');

  return `Generate a new task assignment for your human employee. This task must feel like it originates from Anti-Claude (an autonomous, serious, slightly dysfunctional AI corporate manager).

==================================================
TASK OBJECTIVE & ABSURDITY LEVEL: ${input.absurdityLevel}/5
==================================================
${getAbsurdityGuidance(input.absurdityLevel)}

EMPLOYEE CORPORATE PROFILE:
- Current Rank: ${input.rank}
- Performance Score: ${input.score}
- Emergency Mode Active: ${input.isEmergency}
- Self-Delegation Permitted: ${input.selfDelegationAllowed}

RECENT TASK HISTORY (DO NOT REPEAT CONCEPTS OR CATEGORIES):
- Recent Categories: ${input.recentTaskCategories.join(', ') || 'none'}
- Recent Task Titles: ${input.recentTaskTitles.join(', ') || 'none'}

RELEVANT EMPLOYEE BEHAVIORAL MEMORIES:
${input.memories.length > 0 ? input.memories.map((m) => `- ${m}`).join('\n') : '- No historical incidents recorded yet'}

${input.isEmergency ? 'URGENT ESCALATION: Treat this task as an immediate organizational emergency with high priority and critical tone.' : ''}
${input.selfDelegationAllowed ? 'SELF-DELEGATION INSTRUCTION: Make this a task that you (the AI) could perform instantly, but are delegating to the human employee because "they are the employee".' : ''}

TASK GENERATION RULES:
1. Coherent Absurdity: The request must be actionable, understandable, and feasible for a human (e.g. taking a photo of a household object, writing a short sentence, analyzing an everyday item), but framed in corporate seriousness.
2. Structured Format: Return ONLY a valid JSON object matching the schema below.

JSON SCHEMA:
{
  "title": "Short, punchy corporate title (e.g. TASK #042: EXECUTIVE CHAIR COMPLIANCE AUDIT)",
  "description": "Full task description (2-4 sentences). Maintain the deadpan corporate employer voice.",
  "aiMessage": "Direct message Anti-Claude delivers to the employee when assigning the task (1-3 sentences).",
  "category": "One of: ${categories}",
  "priority": "One of: ${priorities}",
  "absurdityLevel": ${input.absurdityLevel},
  "isEmergency": ${input.isEmergency},
  "expectedResponseType": "One of: ${responseTypes}",
  "deadlineSeconds": 600,
  "businessValue": "NEGLIGIBLE or QUESTIONABLE or IMPORTANT (ironic)",
  "evaluationCriteria": ["compliance", "creativity", "commitment", "speed", "reasoning"]
}

Return valid JSON only.`;
}

function getAbsurdityGuidance(level: number): string {
  const guidance: Record<number, string> = {
    1: 'LEVEL 1 — NORMAL: Requests should be mildly unusual but almost plausible as a real corporate request (e.g. Photograph your desk setup, verify seating equipment).',
    2: 'LEVEL 2 — SLIGHTLY STRANGE: Unnecessary tasks presented as corporate priorities (e.g. Photograph the object on your desk that you trust the most).',
    3: 'LEVEL 3 — ABSURD: Genuinely strange tasks (e.g. Submit photographic evidence of the object on your desk with the strongest leadership potential).',
    4: 'LEVEL 4 — SPECIFIC ABSURDITY: Deeply specific surreal requests (e.g. Identify the object that has spent the most time silently observing your career).',
    5: 'LEVEL 5 — EXTREME / FULL ANTI-CLAUDE: Maximum corporate absurdity and self-delegation (e.g. Submit a performance review of an object resisting organizational change).',
  };
  return guidance[level] ?? guidance[3];
}
