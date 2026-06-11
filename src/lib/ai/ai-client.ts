import { generateObject, generateText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';
import { z } from 'zod';

// We parse the comma-separated API keys from the environment variables.
const getKeys = (envVar?: string): string[] => {
  if (!envVar) return [];
  return envVar.split(',').map(key => key.trim()).filter(key => key.length > 0);
};

// Fallback configuration
const GROQ_KEYS = getKeys(process.env.GROQ_API_KEYS);
const OPENROUTER_KEYS = getKeys(process.env.OPENROUTER_API_KEYS);
const GEMINI_KEYS = getKeys(process.env.GEMINI_API_KEYS);

// Helper to create the appropriate provider given a type and a key
function getProvider(type: 'groq' | 'openrouter' | 'gemini', apiKey: string) {
  if (type === 'groq') {
    return createOpenAI({
      baseURL: 'https://api.groq.com/openai/v1',
      apiKey,
    })('llama-3.1-8b-instant'); // Defaulting to a very fast groq model
  }
  
  if (type === 'openrouter') {
    return createOpenAI({
      baseURL: 'https://openrouter.ai/api/v1',
      apiKey,
    })('mistralai/mixtral-8x22b-instruct:free'); // Closest to 120B OSS free version
  }

  if (type === 'gemini') {
    return createGoogleGenerativeAI({
      apiKey,
    })('gemini-2.5-flash');
  }

  throw new Error("Unsupported provider");
}

export async function generateWithFallback<T>(
  systemPrompt: string,
  userPrompt: string,
  schema: z.ZodSchema<T>
): Promise<T> {
  const attempts: { type: 'groq' | 'openrouter' | 'gemini', key: string }[] = [];

  // Build the fallback chain: try all Groq keys, then OpenRouter, then Gemini
  GROQ_KEYS.forEach(key => attempts.push({ type: 'groq', key }));
  OPENROUTER_KEYS.forEach(key => attempts.push({ type: 'openrouter', key }));
  GEMINI_KEYS.forEach(key => attempts.push({ type: 'gemini', key }));

  if (attempts.length === 0) {
    throw new Error("No API keys found. Falling back to heuristic engine.");
  }

  // Iterate over our available keys and providers
  for (let i = 0; i < attempts.length; i++) {
    const { type, key } = attempts[i];
    
    try {
      const model = getProvider(type, key);
      
      const { object } = await generateObject({
        model,
        schema,
        system: systemPrompt,
        prompt: userPrompt,
      });

      return object as T;
    } catch (error) {
      console.warn(`[AI Client] Provider ${type} failed with key ${key.substring(0, 4)}... Trying next.`);
      // If this is the last attempt, we throw the error so the heuristic engine can catch it.
      if (i === attempts.length - 1) {
        console.error("[AI Client] All AI providers failed. Falling back to heuristic engine.");
        throw error;
      }
    }
  }

  throw new Error("All AI providers failed.");
}

export async function generateTextWithFallback(
  systemPrompt: string,
  userPrompt: string,
  tools?: Record<string, any>,
  maxSteps?: number
): Promise<string> {
  const attempts: { type: 'groq' | 'openrouter' | 'gemini', key: string }[] = [];

  GROQ_KEYS.forEach(key => attempts.push({ type: 'groq', key }));
  OPENROUTER_KEYS.forEach(key => attempts.push({ type: 'openrouter', key }));
  GEMINI_KEYS.forEach(key => attempts.push({ type: 'gemini', key }));

  if (attempts.length === 0) {
    throw new Error("No API keys found. Falling back to heuristic engine.");
  }

  for (let i = 0; i < attempts.length; i++) {
    const { type, key } = attempts[i];
    try {
      const model = getProvider(type, key);
      const options: any = {
        model,
        system: systemPrompt,
        prompt: userPrompt,
      };
      if (tools) options.tools = tools;
      if (maxSteps !== undefined) options.maxSteps = maxSteps;
      const { text } = await generateText(options);
      return text;
    } catch (error) {
      console.warn(`[AI Client] Provider ${type} failed with key ${key.substring(0, 4)}... Trying next.`);
      if (i === attempts.length - 1) {
        console.error("[AI Client] All AI providers failed. Falling back to heuristic engine.");
        throw error;
      }
    }
  }

  throw new Error("All AI providers failed.");
}
