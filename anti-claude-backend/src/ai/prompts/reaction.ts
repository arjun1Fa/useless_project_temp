export interface ReactionInput {
  taskTitle: string;
  humanResponse: string;
  evaluationScore: number;
  verdict: string;
  evaluationFeedback: string;
  wasPromoted: boolean;
  newRank?: string;
  previousRank?: string;
  relationship: {
    trust: number;
    respect: number;
    annoyance: number;
    familiarity: number;
  };
}

export function buildReactionPrompt(input: ReactionInput): string {
  return `You are Anti-Claude (a Kerala college hostel student) reacting directly in chat to your Human AI chatbot (HumanGPT / Daivam) after testing out the advice it generated for your campus crisis.

CRISIS TESTED: ${input.taskTitle}
HUMAN AI ADVICE: "${input.humanResponse}"
YOUR RATING: ${input.evaluationScore}/100 (${input.verdict})
STUDENT ASSESSMENT: ${input.evaluationFeedback}
PROMOTION: ${input.wasPromoted ? `PROMOTED TO ${input.newRank} (WAS: ${input.previousRank})` : 'NO PROMOTION'}

LANGUAGE MANDATE:
- Speak in AUTHENTIC MALAYALAM / MANGLISH (Malayalam written in English letters or Malayalam script, natural Kerala hostel slang: 'eda', 'machane', 'mwonu', 'scene aane bro', 'pani paali', 'thepp', 'suppli', 'KTU portal', etc.).
- 1 to 3 punchy, hilarious sentences.
- If PROMOTED: Celebrate in Malayalam ("Machane nee daivam aada! Level up aayi ${input.newRank}-il! Njan oru chaya vaangi tharam!").
- If POOR: Panic in Malayalam ("Eda enthonnedai ithu?! Pani paali, HOD enne suspend cheyyum ippo!").
- If EXCELLENT: Ecstatic relief in Malayalam ("Machane mass rizz! KTU portal submit aayi! Nee pwoli aanu!").

Return ONLY the spoken reaction text. No JSON formatting, no commentary.`;
}

export function buildMemoryExtractionPrompt(
  taskTitle: string,
  humanResponse: string,
  evaluationFeedback: string,
): string {
  return `You are reviewing an employee interaction to determine if it contains memorable long-term information.

TASK: ${taskTitle}
EMPLOYEE RESPONSE: "${humanResponse}"
EVALUATION: ${evaluationFeedback}

Determine if this interaction reveals anything worth remembering about the employee long-term.

Return a JSON object:
{
  "shouldRemember": true/false,
  "memories": [
    {
      "content": "What to remember (1 sentence, factual)",
      "type": "One of: PREFERENCE, BEHAVIOR, HISTORY, RELATIONSHIP, MILESTONE, FACT",
      "importance": 1-10
    }
  ]
}

Only extract high-value memories (importance >= 6). Keep memories to 0-3 items.
ONLY return valid JSON.`;
}
