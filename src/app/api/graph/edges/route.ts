import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { GraphService } from '@/services/graph.service';
import { EdgeRelationshipType, EdgeOrigin, NodeType } from '@/types/nd';
import { ValidationError } from '@/lib/errors';

const graphService = new GraphService();

// POST /api/graph/edges — Create manual edge
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();

        const { from_id, from_type, to_id, to_type, relationship_type } = body;

        if (!from_id || !from_type || !to_id || !to_type || !relationship_type) {
            throw new ValidationError('Missing required fields: from_id, from_type, to_id, to_type, relationship_type');
        }

        const result = await graphService.addEdge({
            from_id,
            from_type: from_type as NodeType,
            to_id,
            to_type: to_type as NodeType,
            relationship_type: relationship_type as EdgeRelationshipType,
            origin: 'manual' as EdgeOrigin,
            metadata: body.metadata,
        });

        if (!result.success) throw result.error;

        return successResponse(result.data, 201);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/graph/edges?id= — Remove edge
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const edgeId = searchParams.get('id');

        if (!edgeId) {
            throw new ValidationError('Edge id is required');
        }

        const result = await graphService.removeEdge(edgeId);
        if (!result.success) throw result.error;

        return successResponse({ deleted: true });
    } catch (error) {
        return errorResponse(error);
    }
}
