import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';

const ndService = new NdService();

// GET /api/nd/[id]/timeline
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await ndService.getTimeline(id);

        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
