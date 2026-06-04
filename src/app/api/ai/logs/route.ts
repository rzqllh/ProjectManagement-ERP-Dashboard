import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AiService } from '@/services/ai.service';

const aiService = new AiService();

// GET /api/ai/logs — Fetch recent AI query logs (audit trail)
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit') || '20', 10);

        const result = await aiService.getRecentLogs(Math.min(limit, 100));
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
