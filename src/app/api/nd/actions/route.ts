import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';

const ndService = new NdService();

// GET /api/nd/actions
// Returns a list of immediate actions required
export async function GET(request: NextRequest) {
    try {
        const actions = await ndService.getImmediateActions();
        return successResponse(actions);
    } catch (error) {
        return errorResponse(error);
    }
}
