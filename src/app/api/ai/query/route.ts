import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { AiService } from '@/services/ai.service';
import { ValidationError } from '@/lib/errors';

const aiService = new AiService();

// POST /api/ai/query — Main AI query endpoint
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { query, model_id, scope_entity_id, scope_entity_type } = body;

        if (!query || typeof query !== 'string' || query.trim().length === 0) {
            throw new ValidationError('query is required and must be a non-empty string');
        }

        if (query.length > 2000) {
            throw new ValidationError('query must be 2000 characters or less');
        }

        const result = await aiService.query({
            query: query.trim(),
            model_id,
            scope_entity_id,
            scope_entity_type,
        });

        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
