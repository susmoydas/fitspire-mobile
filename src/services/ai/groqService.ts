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
  try {
    const response = await fetch(`${AI_CONFIG.groqBaseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${AI_CONFIG.groqApiKey}`,
      },
      body: JSON.stringify({
        model: AI_CONFIG.groqModel,
        messages,
        temperature,
        max_tokens: maxTokens,
      }),
    });

    if (!response.ok) {
      const body = await response.text().catch(() => '');
      throw new Error(`Groq API error ${response.status}: ${body}`);
    }

    const data = await response.json();
    const content = data?.choices?.[0]?.message?.content;

    if (!content) {
      return { success: false, error: 'AI assistant is not available right now. Please try again later.' };
    }

    return { success: true, content: content.trim() };
  } catch (error) {
    if (__DEV__) console.warn('[groqService]', error);
    return { success: false, error: getUserFriendlyError() };
  }
}
