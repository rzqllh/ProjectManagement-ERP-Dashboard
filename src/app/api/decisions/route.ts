import { NextRequest } from 'next/server';
import { decisionService } from '@/services/decision.service';
import { createDecisionSchema, decisionFilterSchema } from '@/services/decision.validation';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = {
            status: searchParams.get('status') || undefined,
            priority: searchParams.get('priority') || undefined,
            project_id: searchParams.get('project_id') || undefined,
            nd_id: searchParams.get('nd_id') || undefined,
        };

        // Validate filters
        const parsedFilters = decisionFilterSchema.parse(filters);

        // Remove undefined keys
        const activeFilters = Object.fromEntries(
            Object.entries(parsedFilters).filter(([_, v]) => v !== undefined)
        );

        const result = await decisionService.listDecisions(activeFilters);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validatedData = createDecisionSchema.parse(body);

        // TODO: Get real user ID from auth context
        const userId = 'system';

        const result = await decisionService.createDecision(validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
