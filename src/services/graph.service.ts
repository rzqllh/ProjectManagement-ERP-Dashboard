import { NdEdgeRepository } from '@/repositories/nd-edge.repository';
import { NdRepository } from '@/repositories/nd.repository';
import { NdEdge, NodeType, EdgeRelationshipType, EdgeOrigin } from '@/types/nd';
import { GraphNode, GraphEdge, GraphData, ImpactRadius, BlockChain, CreateEdgeInput } from '@/types/graph';
import { NotFoundError } from '@/lib/errors';
import { ServiceResult } from '@/lib/service-result';

// Lazy imports to avoid circular deps
let _decisionRepo: any = null;
let _stakeholderRepo: any = null;
let _projectRepo: any = null;

async function getDecisionRepo() {
    if (!_decisionRepo) {
        const mod = await import('@/repositories/decision.repository');
        _decisionRepo = new mod.DecisionRepository();
    }
    return _decisionRepo;
}

async function getStakeholderRepo() {
    if (!_stakeholderRepo) {
        const mod = await import('@/repositories/stakeholder.repository');
        _stakeholderRepo = new mod.StakeholderRepository();
    }
    return _stakeholderRepo;
}

async function getProjectRepo() {
    if (!_projectRepo) {
        const mod = await import('@/repositories/project.repository');
        _projectRepo = new mod.ProjectRepository();
    }
    return _projectRepo;
}

// ─── Causal edge types used for risk propagation ───
const CAUSAL_EDGE_TYPES: EdgeRelationshipType[] = ['blocks', 'triggers', 'escalates_to'];

export class GraphService {
    private edgeRepo = new NdEdgeRepository();
    private ndRepo = new NdRepository();

    private success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    private error(error: any): ServiceResult<any> {
        return { success: false, error: error.message || 'Unknown error' };
    }

    // ─── Node Projection ───

    /**
     * Resolve a lightweight projection for a single entity.
     * Returns only id, type, title, status, risk_level — never full documents.
     */
    async resolveNodeProjection(id: string, type: NodeType): Promise<GraphNode | null> {
        try {
            switch (type) {
                case 'nd': {
                    const nd = await this.ndRepo.findById(id);
                    if (!nd) return null;
                    return {
                        id: nd.id,
                        type: 'nd',
                        title: `${nd.nd_number}: ${nd.title}`,
                        status: nd.status,
                        risk_level: nd.escalation_level || 'none',
                    };
                }
                case 'decision': {
                    const repo = await getDecisionRepo();
                    const decision = await repo.findById(id);
                    if (!decision) return null;
                    return {
                        id: decision.id,
                        type: 'decision',
                        title: decision.title,
                        status: decision.status,
                        risk_level: decision.impact,
                    };
                }
                case 'stakeholder': {
                    const repo = await getStakeholderRepo();
                    const stakeholder = await repo.findById(id);
                    if (!stakeholder) return null;
                    const riskBucket = stakeholder.risk_score >= 60 ? 'high'
                        : stakeholder.risk_score >= 30 ? 'medium' : 'low';
                    return {
                        id: stakeholder.id,
                        type: 'stakeholder',
                        title: stakeholder.name,
                        status: stakeholder.category,
                        risk_level: riskBucket,
                    };
                }
                case 'project': {
                    const repo = await getProjectRepo();
                    const project = await repo.findById(id);
                    if (!project) return null;
                    return {
                        id: project.id,
                        type: 'project',
                        title: project.name,
                        status: project.status,
                        risk_level: project.risk_level,
                    };
                }
                default:
                    return null;
            }
        } catch {
            return null;
        }
    }

    /** Convert NdEdge to lightweight GraphEdge */
    private toGraphEdge(edge: NdEdge): GraphEdge {
        return {
            id: edge.id,
            from_id: edge.from_id,
            to_id: edge.to_id,
            from_type: edge.from_type,
            to_type: edge.to_type,
            relationship_type: edge.relationship_type,
            origin: edge.origin,
        };
    }

    // ─── Scoped Graph (BFS) ───

    /**
     * BFS traversal from a root node, limited by depth.
     * Returns lightweight GraphData with resolved node projections.
     */
    async getScopedGraph(
        rootId: string,
        rootType: NodeType,
        depth: number = 2
    ): Promise<ServiceResult<GraphData>> {
        try {
            const nodeMap = new Map<string, GraphNode>();
            const edgeList: GraphEdge[] = [];
            const visited = new Set<string>();
            const queue: { id: string; type: NodeType; level: number }[] = [
                { id: rootId, type: rootType, level: 0 }
            ];

            while (queue.length > 0) {
                const current = queue.shift()!;
                const nodeKey = `${current.type}:${current.id}`;

                if (visited.has(nodeKey)) continue;
                visited.add(nodeKey);

                // Resolve node
                const node = await this.resolveNodeProjection(current.id, current.type);
                if (!node) continue;
                nodeMap.set(nodeKey, node);

                // Don't traverse further than depth
                if (current.level >= depth) continue;

                // Get all edges for this node
                const edges = await this.edgeRepo.findByNodeId(current.id);

                for (const edge of edges) {
                    edgeList.push(this.toGraphEdge(edge));

                    // Determine the neighbor
                    const isFrom = edge.from_id === current.id;
                    const neighborId = isFrom ? edge.to_id : edge.from_id;
                    const neighborType = isFrom ? edge.to_type : edge.from_type;
                    const neighborKey = `${neighborType}:${neighborId}`;

                    if (!visited.has(neighborKey)) {
                        queue.push({
                            id: neighborId,
                            type: neighborType,
                            level: current.level + 1
                        });
                    }
                }
            }

            // Deduplicate edges
            const seenEdges = new Set<string>();
            const uniqueEdges = edgeList.filter(e => {
                if (seenEdges.has(e.id)) return false;
                seenEdges.add(e.id);
                return true;
            });

            return this.success({
                nodes: Array.from(nodeMap.values()),
                edges: uniqueEdges,
            });
        } catch (err: any) {
            return this.error(err);
        }
    }

    // ─── Edge CRUD ───

    /**
     * Create edge with idempotency checks:
     * - No self-loops
     * - No duplicate (same from, to, type)
     * - No reverse duplicate for structural edges
     */
    async addEdge(input: CreateEdgeInput): Promise<ServiceResult<NdEdge>> {
        try {
            // No self-loops
            if (input.from_id === input.to_id && input.from_type === input.to_type) {
                throw new Error('Self-loop edges are not allowed');
            }

            // No duplicate
            const existing = await this.edgeRepo.findExisting(
                input.from_id, input.to_id, input.relationship_type
            );
            if (existing) {
                return this.success(existing); // Idempotent
            }

            // No reverse duplicate for structural edges
            if (['parent_of', 'belongs_to'].includes(input.relationship_type)) {
                const reverse = await this.edgeRepo.findExisting(
                    input.to_id, input.from_id, input.relationship_type
                );
                if (reverse) {
                    throw new Error(`Reverse ${input.relationship_type} edge already exists`);
                }
            }

            const edge = await this.edgeRepo.create(input as any);
            return this.success(edge);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /** Soft delete an edge */
    async removeEdge(edgeId: string): Promise<ServiceResult<void>> {
        try {
            const edge = await this.edgeRepo.findById(edgeId);
            if (!edge) throw new NotFoundError(`Edge ${edgeId}`);
            await this.edgeRepo.softDelete(edgeId);
            return this.success(undefined);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /** Remove all system-auto edges between two entities (for FK unlink cleanup) */
    async removeSystemEdges(fromId: string, toId: string): Promise<void> {
        const systemEdges = await this.edgeRepo.findSystemEdges(fromId, toId);
        for (const edge of systemEdges) {
            await this.edgeRepo.softDelete(edge.id);
        }
    }

    // ─── Auto-Edge Factory ───

    /**
     * Create a system-auto edge. Idempotent — won't duplicate.
     * Used by NdService/DecisionService on FK set.
     */
    async createSystemEdge(
        fromId: string, fromType: NodeType,
        toId: string, toType: NodeType,
        relationship: EdgeRelationshipType,
        metadata?: Record<string, any>
    ): Promise<void> {
        await this.addEdge({
            from_id: fromId,
            from_type: fromType,
            to_id: toId,
            to_type: toType,
            relationship_type: relationship,
            origin: 'system',
            metadata,
        });
    }

    // ─── Dependency Risk Engine ───

    /**
     * Get Impact Radius: Traverse causal edges (blocks, triggers, escalates_to)
     * from a node to find all downstream affected entities.
     */
    async getImpactRadius(
        nodeId: string,
        nodeType: NodeType = 'nd'
    ): Promise<ServiceResult<ImpactRadius>> {
        try {
            const root = await this.resolveNodeProjection(nodeId, nodeType);
            if (!root) throw new NotFoundError(`Node ${nodeId}`);

            const affected: GraphNode[] = [];
            const chains: ImpactRadius['chains'] = [];
            const visited = new Set<string>();
            visited.add(`${nodeType}:${nodeId}`);

            // DFS along causal edges (outgoing only)
            const dfs = async (
                currentId: string,
                currentType: NodeType,
                path: GraphNode[],
                edgeTypes: EdgeRelationshipType[]
            ) => {
                const edges = await this.edgeRepo.findByFromId(currentId);
                const causalEdges = edges.filter(e =>
                    CAUSAL_EDGE_TYPES.includes(e.relationship_type)
                );

                for (const edge of causalEdges) {
                    const key = `${edge.to_type}:${edge.to_id}`;
                    if (visited.has(key)) continue;
                    visited.add(key);

                    const neighbor = await this.resolveNodeProjection(edge.to_id, edge.to_type);
                    if (!neighbor) continue;

                    affected.push(neighbor);
                    const newPath = [...path, neighbor];
                    const newEdgeTypes = [...edgeTypes, edge.relationship_type];

                    chains.push({ path: newPath, edge_types: newEdgeTypes });

                    // Continue DFS
                    await dfs(edge.to_id, edge.to_type, newPath, newEdgeTypes);
                }
            };

            await dfs(nodeId, nodeType, [root], []);

            return this.success({ root, affected, chains });
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Get Block Chain: Walk backwards through `blocks` edges
     * to find the root cause blocker.
     */
    async getBlockChain(
        nodeId: string,
        nodeType: NodeType = 'nd'
    ): Promise<ServiceResult<BlockChain>> {
        try {
            const blockedNode = await this.resolveNodeProjection(nodeId, nodeType);
            if (!blockedNode) throw new NotFoundError(`Node ${nodeId}`);

            const chain: BlockChain['blocker_chain'] = [];
            const visited = new Set<string>();
            visited.add(`${nodeType}:${nodeId}`);

            let currentId = nodeId;
            let depth = 0;
            const maxDepth = 10; // Safety limit

            while (depth < maxDepth) {
                // Find incoming `blocks` edges (who blocks this node?)
                const incomingEdges = await this.edgeRepo.findByToId(currentId);
                const blockers = incomingEdges.filter(e => e.relationship_type === 'blocks');

                if (blockers.length === 0) break;

                // Follow first blocker (primary chain)
                const blocker = blockers[0];
                const blockerKey = `${blocker.from_type}:${blocker.from_id}`;
                if (visited.has(blockerKey)) break; // Cycle detection
                visited.add(blockerKey);

                const blockerNode = await this.resolveNodeProjection(
                    blocker.from_id, blocker.from_type
                );
                if (!blockerNode) break;

                chain.push({
                    node: blockerNode,
                    relationship_type: blocker.relationship_type,
                });

                currentId = blocker.from_id;
                depth++;
            }

            return this.success({
                blocked_node: blockedNode,
                blocker_chain: chain,
                depth: chain.length,
            });
        } catch (err: any) {
            return this.error(err);
        }
    }
}
