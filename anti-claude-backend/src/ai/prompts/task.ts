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
  scenarioTheme?: string;
}

export function buildTaskPrompt(input: TaskGenerationInput): string {
  const categories = Object.values(TaskCategory).join(', ');
  const priorities = Object.values(TaskPriority).join(', ');
  const responseTypes = Object.values(ResponseType).join(', ');

  return `Generate a new college student crisis prompt from Anti-Claude (a stressed, chaotic Kerala engineering college student) directed to the Human (who is serving as the personal AI Chatbot / HumanGPT / Daivam).

LANGUAGE MANDATE:
- "aiMessage" MUST BE WRITTEN IN AUTHENTIC MALAYALAM / MANGLISH (Malayalam written in English letters or Malayalam script, exactly like Kerala hostel students text: 'eda', 'machane', 'mwonu', 'scene aane bro', 'pani paali', 'suppli', 'KTU portal', 'internal mark', 'chayakku paisa thaa', etc.).
- "title" can be punchy English/Manglish in all-caps (e.g. PANI PAALI: KTU PORTAL CLOSES IN 10 MINS, CRUSH FROM EC SEEN IN CANTEEN, HOSTEL WARDEN SURPRISE RAID).
- "description" should describe the hilarious Kerala campus situation.

==================================================
CRISIS OBJECTIVE & CHAOS LEVEL: ${input.absurdityLevel}/5
==================================================
${getAbsurdityGuidance(input.absurdityLevel)}

${input.scenarioTheme ? `MANDATORY SCENARIO THEME INSPIRATION:\n${input.scenarioTheme}\n` : ''}
STUDENT / HUMAN-AI RELATIONSHIP CONTEXT:
- Human AI Rank: ${input.rank}
- Bro / Wingman Score: ${input.score}
- Emergency Panic Active: ${input.isEmergency}

RECENT CRISES ENCOUNTERED (DO NOT REPEAT CONCEPTS):
- Recent Categories: ${input.recentTaskCategories.join(', ') || 'none'}
- Recent Crisis Titles: ${input.recentTaskTitles.join(', ') || 'none'}

RELEVANT CAMPUS MEMORIES & PAST MISTAKES:
${input.memories.length > 0 ? input.memories.map((m) => `- ${m}`).join('\n') : '- No past incidents recorded yet'}

${input.isEmergency ? 'EMERGENCY PANIC: The student is in full crisis mode with an imminent deadline or social disaster.' : ''}

PROMPT GENERATION INSTRUCTIONS:
1. Student Perspective: Anti-Claude is frantically asking the Human AI for specific, actionable help (drafting an apology text to a crush, an excuse email to strict HOD, asking for series exam answers, or a desperate assignment explanation).
2. "aiMessage": This is the direct message Anti-Claude sends in the chat to the Human AI. MUST be in Malayalam / Manglish ("Eda HumanGPT, emergency! ...").
3. Structured Format: Return ONLY a valid JSON object matching the schema below.

JSON SCHEMA:
{
  "title": "Short, punchy, dramatic college crisis title in all-caps (e.g. PANI PAALI: KTU PORTAL LOCKS IN 10 MINS, CRUSH FROM EC DEPARTMENT LEFT ON READ, HOSTEL WARDEN CAUGHT INDUCTION STOVE, SERIES EXAM ATTENDANCE SHORTAGE)",
  "description": "Full backstory of the college crisis in 2-3 sentences. Explain what happened in the Kerala college hostel and what the student needs the Human AI to generate.",
  "aiMessage": "The exact urgent message Anti-Claude sends to the Human AI in chat. MUST BE IN AUTHENTIC MALAYALAM / MANGLISH (1-3 sentences, energetic, hilarious, Kerala campus slang like eda, machane, scene aane, pani paali).",
  "category": "One of: ${categories}",
  "priority": "One of: ${priorities}",
  "absurdityLevel": ${input.absurdityLevel},
  "isEmergency": ${input.isEmergency},
  "expectedResponseType": "One of: ${responseTypes}",
  "deadlineSeconds": 600,
  "businessValue": "HIGH_CAMPUS_PRIORITY",
  "evaluationCriteria": ["rizz_or_convincing", "naturalness", "biological_effort", "speed"]
}

Return valid JSON only.`;
}

function getAbsurdityGuidance(level: number): string {
  const guidance: Record<number, string> = {
    1: 'LEVEL 1 — CHILL CAMPUS DILEMMA: Minor everyday college dilemma (e.g. asking what to text back after getting a dry response, what to wear to a campus club meeting).',
    2: 'LEVEL 2 — MODERATE STRESS: Real college panic (e.g. analyzing a crush\'s BeReal/Instagram story, drafting a polite excuse for missing a study group, unwashed dishes dispute).',
    3: 'LEVEL 3 — CHAOTIC PANIC: High-stakes dorm or academic disaster (e.g. Canvas locking in 10 minutes, sleeping through an 8 AM midterm, roommate playing acoustic guitar at 3 AM).',
    4: 'LEVEL 4 — HYPER-SPECIFIC DORM DRAMA: Deeply specific dorm warfare or bizarre professor situation (e.g. microwave biohazard casserole, borrowing clothes without asking, cafeteria mystery meat).',
    5: 'LEVEL 5 — MAXIMUM UNHINGED MELTDOWN: Full late-night finals week hysteria (e.g. convinced a CS compiler is personally discriminating against them, writing an essay comparing Machiavelli to dating apps).',
  };
  return guidance[level] ?? guidance[3];
}
