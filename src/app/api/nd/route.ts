import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';
import { createNdSchema, ndFilterSchema } from '@/services/nd.validation';
import { z } from 'zod';

const ndService = new NdService();

// GET /api/nd
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = {
            status: searchParams.get('status') || undefined,
            escalation_level: searchParams.get('escalation_level') || searchParams.get('escalation_status') || undefined,
            category: searchParams.get('category') || undefined,
            project_id: searchParams.get('project_id') || undefined,
            pic: searchParams.get('pic') || undefined,
        };

        // Validate filters
        const parsedFilters = ndFilterSchema.parse(filters);

        // Remove undefined keys to avoid invalid firestore queries
        const activeFilters = Object.fromEntries(
            Object.entries(parsedFilters).filter(([_, v]) => v !== undefined)
        );

        const result = await ndService.listNds(activeFilters);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/nd
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        // Validate input
        const validatedData = createNdSchema.parse(body);

        // TODO: Get real user ID from session/token
        const userId = 'system';

        const result = await ndService.createNd(validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
