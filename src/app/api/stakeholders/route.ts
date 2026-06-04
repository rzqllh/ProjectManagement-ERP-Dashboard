import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { StakeholderService } from '@/services/stakeholder.service';
import { createStakeholderSchema } from '@/services/stakeholder.validation';

const stakeholderService = new StakeholderService();

// GET /api/stakeholders — List with optional filters
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);

        // Search mode
        const search = searchParams.get('search');
        if (search) {
            const result = await stakeholderService.searchStakeholders(search);
            if (!result.success) throw result.error;
            return successResponse(result.data);
        }

        // Filter mode
        const filters: Record<string, any> = {};
        const category = searchParams.get('category');
        const organization = searchParams.get('organization');
        if (category) filters.category = category;
        if (organization) filters.organization = organization;

        const activeFilters = Object.keys(filters).length > 0 ? filters : undefined;
        const result = await stakeholderService.getAllStakeholders(activeFilters);
        if (!result.success) throw result.error;

        // Sort by risk_score descending (highest risk first)
        const sorted = (result.data || []).sort((a, b) => b.risk_score - a.risk_score);

        return successResponse(sorted);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/stakeholders — Create
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const validatedData = createStakeholderSchema.parse(body);

        // TODO: Get real user ID from session
        const userId = 'system';

        const result = await stakeholderService.createStakeholder(
            validatedData as any,
            userId
        );
        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}
