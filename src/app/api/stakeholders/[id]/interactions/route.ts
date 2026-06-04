import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { StakeholderService } from '@/services/stakeholder.service';
import { createInteractionSchema } from '@/services/stakeholder.validation';

const stakeholderService = new StakeholderService();

// GET /api/stakeholders/:id/interactions — List interactions
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await stakeholderService.getInteractions(id);
        if (!result.success) throw result.error;
        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/stakeholders/:id/interactions — Log interaction
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = createInteractionSchema.parse({
            ...body,
            stakeholder_id: id,
            created_by: body.created_by || 'system',
        });

        const userId = validatedData.created_by;
        const result = await stakeholderService.logInteraction(validatedData as any, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
