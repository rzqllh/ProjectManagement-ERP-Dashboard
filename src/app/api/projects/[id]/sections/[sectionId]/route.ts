import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ProjectService } from '@/services/project.service';
import { updateSectionSchema } from '@/services/project.validation';

const projectService = new ProjectService();

// PATCH /api/projects/[id]/sections/[sectionId]
export async function PATCH(
    request: NextRequest,
    { params }: { params: Promise<{ id: string; sectionId: string }> }
) {
    try {
        const { id, sectionId } = await params;
        const body = await request.json();
        const validatedData = updateSectionSchema.parse(body);

        const userId = 'system';
        const result = await projectService.updateSection(id, sectionId, validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
