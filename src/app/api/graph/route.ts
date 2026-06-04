import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { GraphService } from '@/services/graph.service';
import { NodeType } from '@/types/nd';
import { ValidationError } from '@/lib/errors';

const graphService = new GraphService();

// GET /api/graph?root_id=&root_type=&depth=2
export async function GET(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const rootId = searchParams.get('root_id');
        const rootType = (searchParams.get('root_type') || 'nd') as NodeType;
        const depth = parseInt(searchParams.get('depth') || '2', 10);

        if (!rootId) {
            throw new ValidationError('root_id is required');
        }

        if (depth < 1 || depth > 5) {
            throw new ValidationError('depth must be between 1 and 5');
        }

        const result = await graphService.getScopedGraph(rootId, rootType, depth);
        if (!result.success) throw result.error;

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}
