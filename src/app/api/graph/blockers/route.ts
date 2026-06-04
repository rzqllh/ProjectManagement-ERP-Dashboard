import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { GraphService } from '@/services/graph.service';
import { NodeType } from '@/types/nd';
import { ValidationError } from '@/lib/errors';

const graphService = new GraphService();

// GET /api/graph/blockers?node_id=&node_type=nd
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const nodeId = searchParams.get('node_id');
        const nodeType = (searchParams.get('node_type') || 'nd') as NodeType;

        if (!nodeId) {
            throw new ValidationError('node_id is required');
        }

        const result = await graphService.getBlockChain(nodeId, nodeType);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
