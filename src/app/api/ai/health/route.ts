import { successResponse, errorResponse } from '@/lib/api-response';
import { isAiConfigured } from '@/lib/ai-client';
import { AI_MODELS } from '@/types/ai';

// GET /api/ai/health — Check AI configuration + list available models
export async function GET() {
    try {
        const configured = await isAiConfigured();
        return successResponse({
            configured,
            available_models: AI_MODELS,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
