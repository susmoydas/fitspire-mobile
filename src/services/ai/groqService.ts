import { AI_CONFIG } from '../../config/aiConfig';

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface GroqResponse {
  success: boolean;
  content?: string;
  error?: string;
}

function getUserFriendlyError(): string {
  return 'AI assistant is not available right now. Please try again later.';
}

export async function sendGroqChatCompletion(
  messages: GroqMessage[],
  temperature = 0.6,
  maxTokens = 700,
): Promise<GroqResponse> {
  const key = AI_CONFIG.geminiApiKey;
  if (!key) {
    return { success: false, error: getUserFriendlyError() };
  }

  const model = AI_CONFIG.geminiModel || 'gemini-2.0-flash';

  try {
    const systemMsg = messages.find((m) => m.role === 'system');
    const userMsg = messages.find((m) => m.role === 'user');

    const body: Record<string, unknown> = {
      contents: [
        {
          parts: [{ text: userMsg?.content || '' }],
        },
      ],
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    };

    if (systemMsg?.content) {
      body.systemInstruction = {
        parts: [{ text: systemMsg.content }],
      };
    }

    const response = await fetch(
      `${AI_CONFIG.geminiBaseUrl}/models/${model}:generateContent?key=${key}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      },
    );

    if (!response.ok) {
      const bodyText = await response.text().catch(() => '');
      throw new Error(`Gemini API error ${response.status}: ${bodyText}`);
    }

    const data = await response.json();
    const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;

    if (!text) {
      return { success: false, error: getUserFriendlyError() };
    }

    return { success: true, content: text.trim() };
  } catch (error) {
    if (__DEV__) console.warn('[geminiService]', error);
    return { success: false, error: getUserFriendlyError() };
  }
}
