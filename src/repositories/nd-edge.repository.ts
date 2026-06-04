import { BaseRepository } from './base.repository';
import { NdEdge, EdgeRelationshipType, EdgeOrigin } from '@/types/nd';

export class NdEdgeRepository extends BaseRepository<NdEdge> {
    constructor() {
        super('nd_edges');
    }

    async findByFromId(fromId: string): Promise<NdEdge[]> {
        return this.findAll({ from_id: fromId });
    }

    async findByToId(toId: string): Promise<NdEdge[]> {
        return this.findAll({ to_id: toId });
    }

    /** All edges where entity appears as from OR to */
    async findByNodeId(nodeId: string): Promise<NdEdge[]> {
        const [fromEdges, toEdges] = await Promise.all([
            this.findAll({ from_id: nodeId }),
            this.findAll({ to_id: nodeId }),
        ]);
        // Deduplicate by id
        const seen = new Set<string>();
        const result: NdEdge[] = [];
        for (const edge of [...fromEdges, ...toEdges]) {
            if (!seen.has(edge.id)) {
                seen.add(edge.id);
                result.push(edge);
            }
        }
        return result;
    }

    /** Find system-auto edges between two entities for cleanup */
    async findSystemEdges(fromId: string, toId: string): Promise<NdEdge[]> {
        const edges = await this.findAll({ from_id: fromId, to_id: toId });
        return edges.filter(e => e.origin === 'system');
    }

    /** Find edges by relationship type */
    async findByRelationshipType(type: EdgeRelationshipType): Promise<NdEdge[]> {
        return this.findAll({ relationship_type: type });
    }

    async findExisting(fromId: string, toId: string, type: string): Promise<NdEdge | null> {
        const results = await this.findAll({
            from_id: fromId,
            to_id: toId,
            relationship_type: type
        });
        return results[0] || null;
    }
}
