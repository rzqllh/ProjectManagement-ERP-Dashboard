import { NextRequest } from 'next/server';
import { decisionService } from '@/services/decision.service';
import { updateDecisionSchema } from '@/services/decision.validation';
import { successResponse, errorResponse } from '@/lib/api-response';

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await decisionService.getDecision(id);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validatedData = updateDecisionSchema.parse(body);

        // TODO: Get real user ID
        const userId = 'system';

        const result = await decisionService.updateDecision(id, validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // TODO: Get real user ID
        const userId = 'system';

        const result = await decisionService.deleteDecision(id, userId);
        if (!result.success) throw result.error;

        return successResponse(undefined);
    } catch (error) {
        return errorResponse(error);
    }
}
