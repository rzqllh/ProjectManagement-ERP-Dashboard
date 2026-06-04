import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdService } from '@/services/nd.service';
import { EdgeRelationshipType } from '@/types/nd';

const ndService = new NdService();

// GET /api/nd/[id]/relations
// Fetch all relations for an ND
export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const result = await ndService.getRelations(id);
        if (!result.success) throw new Error(result.error);
        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// POST /api/nd/[id]/relations
// Add a new relation
export async function POST(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const body = await request.json();
        const { targetId, type, userId } = body;

        if (!targetId || !type) throw new Error("Missing targetId or type");

        // Validate type manually if needed, or let service handle implicit cast check
        const validTypes: EdgeRelationshipType[] = ['parent_of', 'triggers', 'blocks', 'references', 'escalates_to'];
        if (!validTypes.includes(type as any)) {
            throw new Error("Invalid relationship type");
        }

        const result = await ndService.addRelation(id, targetId, type as EdgeRelationshipType, userId || 'system');
        if (!result.success) throw new Error(result.error);

        return successResponse(result.data);
    } catch (error) {
        return errorResponse(error);
    }
}

// DELETE /api/nd/[id]/relations
// Remove a relation
export async function DELETE(
    request: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        // We need the edgeId. It can be passed in body or query param. 
        // REST standard usually DELETE /api/resource/ID. 
        // Example: /api/nd/[id]/relations?edgeId=XYZ
        const { searchParams } = new URL(request.url);
        const edgeId = searchParams.get('edgeId');
        const userId = searchParams.get('userId') || 'system';

        if (!edgeId) throw new Error("Missing edgeId query parameter");

        const result = await ndService.removeRelation(edgeId, userId);
        if (!result.success) throw new Error(result.error);

        return successResponse({ deleted: true });
    } catch (error) {
        return errorResponse(error);
    }
}
