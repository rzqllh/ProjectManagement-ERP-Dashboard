import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { StakeholderService } from '@/services/stakeholder.service';
import { updateStakeholderSchema } from '@/services/stakeholder.validation';

const stakeholderService = new StakeholderService();

// GET /api/stakeholders/:id — Profile
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await stakeholderService.getProfile(id);
        if (!result.success) throw result.error;
        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// PATCH /api/stakeholders/:id — Update
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = updateStakeholderSchema.parse(body);

        const userId = 'system';
        const result = await stakeholderService.updateStakeholder(id, validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/stakeholders/:id — Soft delete
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = 'system';
        const result = await stakeholderService.deleteStakeholder(id, userId);
        if (!result.success) throw result.error;

        return successResponse({ deleted: true });
    } catch (error) {
        return errorResponse(error);
    }
}
