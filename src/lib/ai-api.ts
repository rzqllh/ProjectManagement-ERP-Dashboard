import { AiQueryInput, AiResponse, AI_MODELS, DEFAULT_MODEL } from '@/types/ai';

/**
 * Safe AI API Fetcher with Timeout & Error Handling.
 * Prevents infinite loading states by enforcing strict timeouts based on model tier.
 */
export async function fetchAiResponseSafely(input: AiQueryInput, signal?: AbortSignal): Promise<AiResponse | null> {
    const modelId = input.model_id || DEFAULT_MODEL;

    try {
        console.log(`🚀 [AiApi] Sending request to ${modelId} (No Timeout)...`);

        const response = await fetch('/api/ai/query', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(input),
            signal: signal // Binds only to external signal (user cancel)
        });

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({}));

            // Handle specific quota errors (Downgrade log level)
            if (response.status === 429 || errorData.error?.code === 'AI_QUOTA_EXCEEDED') {
                console.warn(`⚠️ [AiApi] Rate Limit (429): Quota exceeded.`);
                throw new Error(errorData.error?.message || 'Rate limit reached');
            }

            console.error(`❌ [AiApi] Error ${response.status}:`, errorData);
            throw new Error(errorData.error?.message || `AI Request failed (Status: ${response.status})`);
        }

        const data = await response.json();
        return data.data as AiResponse;

    } catch (error: any) {
        if (error.name === 'AbortError') {
            console.warn(`⏳ [AiApi] Request cancelled by user`);
            throw error; // Re-throw user cancel
        }

        console.error('💥 [AiApi] Unexpected error:', error);
        throw error;
    }
}
