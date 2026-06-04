import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';
import { updateNdSchema } from '@/services/nd.validation';

const ndService = new NdService();

// GET /api/nd/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await ndService.getNd(id);

        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// PATCH /api/nd/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();

        // Validate input
        const validatedData = updateNdSchema.parse(body);

        // TODO: Get real user ID
        const userId = 'system';

        const result = await ndService.updateNd(id, validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/nd/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;

        // TODO: Get real user ID
        const userId = 'system';

        const result = await ndService.deleteNd(id, userId);
        if (!result.success) throw result.error;

        return successResponse(null);
    } catch (error) {
        return errorResponse(error);
    }
}
