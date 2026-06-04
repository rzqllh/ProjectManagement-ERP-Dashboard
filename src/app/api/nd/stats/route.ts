import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';

const ndService = new NdService();

// GET /api/nd/stats
export async function GET(request: NextRequest) {
    try {
        const result = await ndService.getStats();
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
