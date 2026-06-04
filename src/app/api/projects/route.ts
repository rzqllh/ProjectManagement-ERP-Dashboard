import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { ProjectService } from '@/services/project.service';
import { createProjectSchema, projectFilterSchema } from '@/services/project.validation';

const projectService = new ProjectService();

// GET /api/projects
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const filters = {
            status: searchParams.get('status') || undefined,
            category: searchParams.get('category') || undefined,
            priority: searchParams.get('priority') || undefined,
        };

        const parsedFilters = projectFilterSchema.parse(filters);
        const activeFilters = Object.fromEntries(
            Object.entries(parsedFilters).filter(([_, v]) => v !== undefined)
        );

        const result = await projectService.listProjects(activeFilters);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/projects
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createProjectSchema.parse(body);

        const userId = 'system';
        const result = await projectService.createProject(validatedData, userId);
        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
