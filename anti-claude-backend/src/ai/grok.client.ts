import OpenAI from 'openai';
import { env } from '../config/env.js';
import { AI_CONFIG } from '../config/constants.js';
import { logger } from '../utils/logger.js';

// xAI Grok uses the OpenAI-compatible API
const XAI_BASE_URL = 'https://api.x.ai/v1';

/**
 * Multi-key Grok client with sequential fallback.
 * Tries GROK_API_KEY_1 first. If it hits a rate limit or error, tries key 2, etc.
 * All LLM calls in the system MUST go through this client.
 */
class GrokClient {
  private clients: OpenAI[];
  private currentKeyIndex = 0;

  constructor() {
    this.clients = env.GROK_API_KEYS.map(
      (key) =>
        new OpenAI({
          apiKey: key,
          baseURL: XAI_BASE_URL,
          timeout: env.GROK_TIMEOUT_MS,
          maxRetries: 0, // We handle retries manually for key rotation
        }),
    );
    logger.info(`✅ GrokClient initialized with ${this.clients.length} API key(s)`);
  }

  /**
   * Core chat completion with Gemini / Grok key rotation + bounded retries.
   */
  async chatCompletion(
    messages: OpenAI.ChatCompletionMessageParam[],
    opts: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'json' | 'text';
      operation?: string;
    } = {},
  ): Promise<string> {
    // 1. Try Gemini first if GEMINI_API_KEY is configured
    if (env.GEMINI_API_KEY) {
      try {
        const start = Date.now();
        const content = await this.callGemini(messages, opts);
        logger.debug({
          operation: opts.operation ?? 'chat_completion',
          provider: 'gemini',
          latencyMs: Date.now() - start,
        }, 'Gemini AI call succeeded');
        return content;
      } catch (err: any) {
        logger.warn({
          operation: opts.operation ?? 'chat_completion',
          provider: 'gemini',
          error: err?.message,
        }, 'Gemini call failed, falling back to Grok keys');
      }
    }

    // 2. Try Grok keys
    const maxAttempts = (this.clients.length || 1) * AI_CONFIG.MAX_RETRIES;
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      if (this.clients.length === 0) break;
      const keyIndex = attempt % this.clients.length;
      const client = this.clients[keyIndex];

      try {
        const start = Date.now();
        const response = await client.chat.completions.create({
          model: env.GROK_MODEL,
          messages,
          temperature: opts.temperature ?? AI_CONFIG.TASK_GENERATION_TEMPERATURE,
          max_tokens: opts.maxTokens ?? env.GROK_MAX_TOKENS,
          ...(opts.responseFormat === 'json'
            ? { response_format: { type: 'json_object' } }
            : {}),
        });

        const latency = Date.now() - start;
        const content = response.choices[0]?.message?.content ?? '';

        logger.debug({
          operation: opts.operation ?? 'chat_completion',
          keyIndex,
          latencyMs: latency,
          tokensUsed: response.usage?.total_tokens,
        }, 'Grok call succeeded');

        return content;
      } catch (err: any) {
        lastError = err;
        const isRateLimit = err?.status === 429 || err?.code === 'rate_limit_exceeded';

        logger.warn({
          operation: opts.operation ?? 'chat_completion',
          keyIndex,
          attempt,
          error: err?.message,
          isRateLimit,
        }, 'Grok call failed, trying next key');

        if (attempt < maxAttempts - 1) {
          await new Promise((r) => setTimeout(r, AI_CONFIG.RETRY_DELAY_MS * (attempt + 1)));
        }
      }
    }

    logger.error({ lastError }, 'All AI API keys exhausted');
    throw new Error(`AI API unavailable: ${lastError?.message ?? 'No valid response'}`);
  }

  /**
   * Direct Google Gemini API call
   */
  private async callGemini(
    messages: OpenAI.ChatCompletionMessageParam[],
    opts: {
      temperature?: number;
      maxTokens?: number;
      responseFormat?: 'json' | 'text';
    } = {},
  ): Promise<string> {
    const systemMessage = messages.find((m) => m.role === 'system');
    const nonSystemMessages = messages.filter((m) => m.role !== 'system');

    const mergedContents: Array<{ role: string; parts: Array<{ text: string }> }> = [];

    for (const m of nonSystemMessages) {
      const role = m.role === 'assistant' ? 'model' : 'user';
      const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
      if (!text || !text.trim()) continue;

      if (mergedContents.length > 0 && mergedContents[mergedContents.length - 1].role === role) {
        mergedContents[mergedContents.length - 1].parts.push({ text });
      } else {
        mergedContents.push({ role, parts: [{ text }] });
      }
    }

    // Gemini multiturn requires first content role to be 'user'
    if (mergedContents.length > 0 && mergedContents[0].role === 'model') {
      mergedContents.unshift({
        role: 'user',
        parts: [{ text: '[Prior Context]' }],
      });
    }

    const body: Record<string, any> = {
      contents: mergedContents,
      generationConfig: {
        temperature: opts.temperature ?? AI_CONFIG.TASK_GENERATION_TEMPERATURE,
        maxOutputTokens: opts.maxTokens ?? env.GROK_MAX_TOKENS,
        ...(opts.responseFormat === 'json' ? { responseMimeType: 'application/json' } : {}),
      },
    };

    if (systemMessage && typeof systemMessage.content === 'string') {
      body.systemInstruction = {
        parts: [{ text: systemMessage.content }],
      };
    }

    const candidateModels = Array.from(new Set([
      env.GEMINI_MODEL || 'gemini-flash-lite-latest',
      'gemini-flash-lite-latest',
      'gemini-3.1-flash-lite',
      'gemini-3.5-flash-lite',
    ]));

    let lastError: Error | null = null;
    for (const model of candidateModels) {
      try {
        const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${env.GEMINI_API_KEY}`;
        const res = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });

        if (!res.ok) {
          const errorText = await res.text();
          throw new Error(`Gemini (${model}) HTTP ${res.status}: ${errorText}`);
        }

        const data: any = await res.json();
        const candidateText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!candidateText) {
          throw new Error(`Gemini (${model}) returned empty candidate content`);
        }

        return candidateText;
      } catch (err: any) {
        lastError = err;
        logger.warn({ model, error: err?.message }, 'Gemini model attempt failed, trying fallback');
      }
    }

    throw lastError || new Error('All Gemini model fallbacks exhausted');
  }

  /**
   * Convenience: call Grok and parse JSON response. Validates with provided parser fn.
   * Throws if JSON is invalid or parser rejects it.
   */
  async chatCompletionJson<T>(
    messages: OpenAI.ChatCompletionMessageParam[],
    parser: (raw: unknown) => T,
    opts: Parameters<GrokClient['chatCompletion']>[1] = {},
  ): Promise<T> {
    const raw = await this.chatCompletion(messages, { ...opts, responseFormat: 'json' });

    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch {
      logger.error({ raw }, 'Failed to parse Grok JSON response');
      throw new Error('Grok returned invalid JSON');
    }

    return parser(parsed);
  }
}

// Singleton
export const grokClient = new GrokClient();
