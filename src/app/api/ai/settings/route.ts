import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { resolveApiKey, saveApiKey, removeApiKey } from '@/lib/ai-client';
import { ValidationError } from '@/lib/errors';

// GET /api/ai/settings — Check if API key is configured (never return the actual key)
export async function GET() {
    try {
        const key = await resolveApiKey();
        return successResponse({
            configured: !!key,
            source: key ? (process.env.GEMINI_API_KEY === key ? 'env' : 'app') : null,
        });
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/ai/settings — Save API key
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { api_key } = body;

        if (!api_key || typeof api_key !== 'string' || api_key.trim().length < 10) {
            throw new ValidationError('A valid API key is required (minimum 10 characters)');
        }

        await saveApiKey(api_key.trim());

        return successResponse({ configured: true, source: 'app' });
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/ai/settings — Remove stored API key
export async function DELETE() {
    try {
        await removeApiKey();

        // Check if env fallback exists
        const envKey = process.env.GEMINI_API_KEY;
        return successResponse({
            configured: !!envKey,
            source: envKey ? 'env' : null,
        });
    } catch (error) {
        return errorResponse(error);
    }
}
