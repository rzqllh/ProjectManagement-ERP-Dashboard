import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { StakeholderService } from '@/services/stakeholder.service';

const stakeholderService = new StakeholderService();

// POST /api/stakeholders/:id/recompute — Admin fallback
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await stakeholderService.recomputeMetrics(id);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
