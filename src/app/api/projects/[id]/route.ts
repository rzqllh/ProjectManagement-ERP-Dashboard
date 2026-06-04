import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ProjectService } from '@/services/project.service';
import { updateProjectSchema } from '@/services/project.validation';

const projectService = new ProjectService();

// GET /api/projects/[id]
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await projectService.getProject(id);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// PATCH /api/projects/[id]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const validatedData = updateProjectSchema.parse(body);

        const userId = 'system';
        const result = await projectService.updateProject(id, validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/projects/[id]
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const userId = 'system';

        const result = await projectService.deleteProject(id, userId);
        if (!result.success) throw result.error;

        return successResponse(null);
    } catch (error) {
        return errorResponse(error);
    }
}
