import { NdeRecord, CreateNdeRecordInput, UpdateNdeRecordInput, NdStatus, NdEdge, EdgeRelationshipType } from '@/types/nd';
import { TimelineEventType, TimelineRelatedType } from '@/types/timeline';
import { NdRepository } from '@/repositories/nd.repository';
import { TimelineRepository } from '@/repositories/timeline.repository';
import { NdEdgeRepository } from '@/repositories/nd-edge.repository';
import { StakeholderRepository } from '@/repositories/stakeholder.repository';
import { ServiceResult } from '@/services/base.service';
import { NotFoundError, ValidationError, ConflictError, AppError } from '@/lib/errors';

// Lazy imports to avoid circular deps
let _stakeholderService: any = null;
async function getStakeholderService() {
    if (!_stakeholderService) {
        const mod = await import('@/services/stakeholder.service');
        _stakeholderService = new mod.StakeholderService();
    }
    return _stakeholderService;
}

let _graphService: any = null;
async function getGraphService() {
    if (!_graphService) {
        const mod = await import('@/services/graph.service');
        _graphService = new mod.GraphService();
    }
    return _graphService;
}

export class NdService {
    private ndRepo = new NdRepository();
    private timelineRepo = new TimelineRepository();
    private edgeRepo = new NdEdgeRepository();
    private stakeholderRepo = new StakeholderRepository();

    private success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    private error(err: any): ServiceResult<any> {
        const error = err instanceof AppError ? err : new AppError(err.message || 'Unknown error');
        return { success: false, error };
    }

    /**
     * Fire-and-forget: triggers stakeholder metric recomputation.
     * Uses lazy import to avoid circular dependency with StakeholderService.
     */
    private triggerStakeholderRecompute(stakeholderId: string): void {
        getStakeholderService()
            .then((svc: any) => svc.recomputeMetrics(stakeholderId))
            .catch((err: any) => console.error(`[StakeholderRecompute] Failed for ${stakeholderId}:`, err));
    }

    /**
     * Fire-and-forget: creates system auto-edges based on ND FK fields.
     * Called on createNd and updateNd.
     */
    private triggerAutoEdges(nd: NdeRecord): void {
        getGraphService()
            .then(async (svc: any) => {
                // parent_nd_id → parent_of edge
                if (nd.parent_nd_id) {
                    await svc.createSystemEdge(nd.parent_nd_id, 'nd', nd.id, 'nd', 'parent_of');
                }
                // related_project_id → belongs_to edge
                if (nd.related_project_id) {
                    await svc.createSystemEdge(nd.id, 'nd', nd.related_project_id, 'project', 'belongs_to');
                }
                // receiver_id → assigned_to edge
                if (nd.receiver_id) {
                    await svc.createSystemEdge(nd.id, 'nd', nd.receiver_id, 'stakeholder', 'assigned_to');
                }
                // sender_id → sent_by edge
                if (nd.sender_id) {
                    await svc.createSystemEdge(nd.id, 'nd', nd.sender_id, 'stakeholder', 'sent_by');
                }
            })
            .catch((err: any) => console.error(`[AutoEdge] Failed for ND ${nd.id}:`, err));
    }

    /**
     * Fire-and-forget: cleans up system edges when FK changes.
     */
    private triggerEdgeCleanup(ndId: string, oldTargetId: string): void {
        getGraphService()
            .then(async (svc: any) => {
                // Remove system edges from ND → old target
                await svc.removeSystemEdges(ndId, oldTargetId);
                // Also check reverse direction (old target → ND, e.g. parent_of)
                await svc.removeSystemEdges(oldTargetId, ndId);
            })
            .catch((err: any) => console.error(`[EdgeCleanup] Failed for ${ndId}→${oldTargetId}:`, err));
    }

    /**
     * Create a new ND Record
     */
    async createNd(input: CreateNdeRecordInput, userId: string = 'system'): Promise<ServiceResult<NdeRecord>> {
        try {
            // 1. Check for duplicate ND number
            const existing = await this.ndRepo.findByNdNumber(input.nd_number);
            if (existing) {
                throw new ConflictError(`ND Number ${input.nd_number} already exists`);
            }

            // 2. Create the record
            const newNd = await this.ndRepo.create(input);

            // 3. Auto-create timeline event
            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: newNd.id,
                entity_type: 'nd',
                entity_id: newNd.id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'info',
                event_type: 'created',
                description: `ND ${newNd.nd_number} created by ${userId}`,
                event_date: new Date().toISOString(),
            });

            // Event-driven: if ND has receiver_id, recompute stakeholder metrics
            if (newNd.receiver_id) {
                this.triggerStakeholderRecompute(newNd.receiver_id);
            }
            if (newNd.sender_id && newNd.sender_id !== newNd.receiver_id) {
                this.triggerStakeholderRecompute(newNd.sender_id);
            }

            // Graph: Auto-create system edges for FKs
            this.triggerAutoEdges(newNd);

            return this.success(newNd);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Update an ND Record
     */
    async updateNd(id: string, input: UpdateNdeRecordInput, userId: string = 'system'): Promise<ServiceResult<NdeRecord>> {
        try {
            // 1. Get current record
            const current = await this.ndRepo.findById(id);
            if (!current) {
                throw new NotFoundError(`ND Record ${id}`);
            }

            // 2. Validate status transition (if changing)
            if (input.status && input.status !== current.status) {
                this.validateStatusTransition(current.status, input.status);
            }

            // 3. Update the record
            const updatedNd = await this.ndRepo.update(id, input);

            // 4. Granular Timeline Logging
            const events: Promise<any>[] = [];
            const now = new Date().toISOString();

            // Helper to create event with defaults
            const logT = (
                evt: TimelineEventType,
                desc: string,
                severity: 'info' | 'warning' | 'critical' = 'info',
                meta?: any
            ) => {
                return this.timelineRepo.create({
                    // Legacy (deprecated but kept for now)
                    related_type: 'nd',
                    related_id: id,

                    // New Schema
                    entity_type: 'nd',
                    entity_id: id,
                    actor_type: userId === 'system' ? 'system' : 'user',
                    severity,

                    event_type: evt,
                    description: desc,
                    event_date: now,
                    metadata: { ...meta, user: userId }
                });
            };

            // Status Change
            if (input.status && input.status !== current.status) {
                events.push(logT(
                    'status_changed',
                    `Status changed from ${current.status} to ${input.status} by ${userId}`,
                    'info',
                    { old: current.status, new: input.status }
                ));
            }

            // PIC Change
            if (input.pic && input.pic !== current.pic) {
                events.push(logT(
                    'pic_changed',
                    `PIC updated by ${userId}`,
                    'info',
                    { old: current.pic, new: input.pic }
                ));
            }

            // Next Action Update
            if (input.next_action && input.next_action !== current.next_action) {
                events.push(logT(
                    'next_action_updated',
                    `Next action checklist updated by ${userId}`,
                    'info'
                ));
            }

            // Deadline Change
            if (input.deadline !== undefined && input.deadline !== current.deadline) {
                const oldDate = current.deadline ? new Date(current.deadline).toLocaleDateString() : 'None';
                const newDate = input.deadline ? new Date(input.deadline).toLocaleDateString() : 'None';
                events.push(logT(
                    'deadline_changed',
                    `Deadline changed from ${oldDate} to ${newDate} by ${userId}`,
                    'warning', // Deadlines are important
                    { old: current.deadline, new: input.deadline }
                ));
            }

            // Project Linking
            if (input.related_project_id && input.related_project_id !== current.related_project_id) {
                events.push(logT(
                    'linked_to_project',
                    `Linked to project ID ${input.related_project_id} by ${userId}`,
                    'info',
                    { project_id: input.related_project_id }
                ));
            }

            // Fallback: Generic Update
            if (events.length === 0) {
                events.push(logT(
                    'updated',
                    `Record updated by ${userId}`,
                    'info',
                    { changes: Object.keys(input) }
                ));
            }

            await Promise.all(events);

            // Event-driven: Stakeholder metric recomputation
            // Trigger when ND exits waiting_external OR reaches clear
            if (input.status && input.status !== current.status) {
                const isExitFromWaiting = current.status === 'waiting_external';
                const isCleared = input.status === 'clear';

                if (isExitFromWaiting || isCleared) {
                    if (current.receiver_id) {
                        this.triggerStakeholderRecompute(current.receiver_id);
                    }
                }
            }

            // Graph: Auto-edge cleanup + recreation on FK changes
            // parent_nd_id changed
            if (input.parent_nd_id !== undefined && input.parent_nd_id !== current.parent_nd_id) {
                if (current.parent_nd_id) this.triggerEdgeCleanup(id, current.parent_nd_id);
            }
            // related_project_id changed
            if (input.related_project_id !== undefined && input.related_project_id !== current.related_project_id) {
                if (current.related_project_id) this.triggerEdgeCleanup(id, current.related_project_id);
            }
            // receiver_id changed
            if (input.receiver_id !== undefined && input.receiver_id !== current.receiver_id) {
                if (current.receiver_id) this.triggerEdgeCleanup(id, current.receiver_id);
            }
            // sender_id changed
            if (input.sender_id !== undefined && input.sender_id !== current.sender_id) {
                if (current.sender_id) this.triggerEdgeCleanup(id, current.sender_id);
            }
            // Recreate auto-edges for updated record
            this.triggerAutoEdges(updatedNd);

            return this.success(updatedNd);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Get ND by ID
     */
    async getNd(id: string): Promise<ServiceResult<NdeRecord>> {
        try {
            const nd = await this.ndRepo.findById(id);
            if (!nd) throw new NotFoundError(`ND Record ${id}`);
            return this.success(nd);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * List all NDs with optional filters
     */
    async listNds(filters?: any): Promise<ServiceResult<NdeRecord[]>> {
        try {
            const nds = await this.ndRepo.findAll(filters);
            return this.success(nds);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Get timeline events for an ND
     */
    async getTimeline(ndId: string): Promise<ServiceResult<any[]>> {
        try {
            const events = await this.timelineRepo.findByRelated('nd', ndId);
            return this.success(events);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Delete (Soft)
     */
    async deleteNd(id: string, userId: string = 'system'): Promise<ServiceResult<void>> {
        try {
            await this.ndRepo.softDelete(id);
            // Log deletion event before it's gone from view
            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: id,
                entity_type: 'nd',
                entity_id: id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'warning',
                event_type: 'updated',
                description: `Record archived/deleted by ${userId}`,
                event_date: new Date().toISOString(),
            });
            return this.success(undefined);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Get immediate actions for dashboard
     */
    async getImmediateActions() {
        try {
            // Get all active NDs (not clear)
            const snapshot = await this.ndRepo.findAll();
            const activeNds = snapshot.filter(nd => nd.status !== 'clear');
            const now = Date.now();
            const OneDay = 86400000;

            const actions: { id: string; nd_number: string; title: string; type: string; severity: 'high' | 'medium' | 'critical'; message: string }[] = [];

            for (const nd of activeNds) {
                // 1. Overdue (Critical)
                if (nd.deadline) {
                    const deadlineTime = new Date(nd.deadline).getTime();
                    if (now > deadlineTime) {
                        const daysOver = Math.floor((now - deadlineTime) / OneDay);
                        actions.push({
                            id: nd.id,
                            nd_number: nd.nd_number,
                            title: nd.title,
                            type: 'overdue',
                            severity: 'critical',
                            message: `${daysOver} days overdue`
                        });
                        continue; // Prioritize overdue
                    }
                }

                // 2. Stuck External (High)
                if (nd.status === 'waiting_external') {
                    const updatedTime = new Date(nd.updated_at).getTime();
                    const daysStuck = Math.floor((now - updatedTime) / OneDay);

                    if (daysStuck > 5) {
                        actions.push({
                            id: nd.id,
                            nd_number: nd.nd_number,
                            title: nd.title,
                            type: 'stuck_external',
                            severity: daysStuck > 10 ? 'critical' : 'high',
                            message: `Waiting external for ${daysStuck} days`
                        });
                        continue;
                    }
                }

                // 3. No Next Action (Medium)
                const hasAction = nd.next_action && nd.next_action.trim().length > 0;
                const hasUnchecked = nd.next_action.split('\n').some(l => l.includes('[ ]'));

                if (!hasAction || (!hasUnchecked && nd.next_action.includes('[x]'))) {
                    actions.push({
                        id: nd.id,
                        nd_number: nd.nd_number,
                        title: nd.title,
                        type: 'missing_action',
                        severity: 'medium',
                        message: 'No next action defined'
                    });
                    continue;
                }

                // 4. Stagnant Draft (Medium)
                if (nd.status === 'drafting') {
                    const updatedTime = new Date(nd.updated_at).getTime();
                    const daysStagnant = Math.floor((now - updatedTime) / OneDay);
                    if (daysStagnant > 3) {
                        actions.push({
                            id: nd.id,
                            nd_number: nd.nd_number,
                            title: nd.title,
                            type: 'stagnant_draft',
                            severity: 'medium',
                            message: `Draft untouched for ${daysStagnant} days`
                        });
                    }
                }
            }

            // Sort by severity (critical > high > medium)
            const severityScore = { critical: 3, high: 2, medium: 1 };
            return actions.sort((a, b) => severityScore[b.severity] - severityScore[a.severity]).slice(0, 5); // Top 5
        } catch (error) {
            console.error('Error getting actions:', error);
            return [];
        }
    }

    /**
     * Get Statistics for Dashboard
     */
    async getStats(): Promise<ServiceResult<any>> {
        try {
            const [total, drafting, waitingInternal, waitingExternal, issued, clear, escalated] = await Promise.all([
                this.ndRepo.countAll(),
                this.ndRepo.countByStatus('drafting'),
                this.ndRepo.countByStatus('waiting_internal'),
                this.ndRepo.countByStatus('waiting_external'),
                this.ndRepo.countByStatus('issued'),
                this.ndRepo.countByStatus('clear'),
                this.ndRepo.countByStatus('escalated')
            ]);

            return this.success({
                total,
                status_counts: {
                    drafting,
                    waiting_internal: waitingInternal,
                    waiting_external: waitingExternal,
                    issued,
                    clear,
                    escalated
                }
            });
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Add a relationship between two NDs
     */
    async addRelation(fromId: string, toId: string, type: EdgeRelationshipType, userId: string = 'system'): Promise<ServiceResult<NdEdge>> {
        try {
            if (fromId === toId) throw new ValidationError("Cannot link ND to itself");

            const [fromNd, toNd] = await Promise.all([
                this.ndRepo.findById(fromId),
                this.ndRepo.findById(toId)
            ]);

            if (!fromNd || !toNd) throw new NotFoundError("One or both ND records not found");

            // Check existing
            const existing = await this.edgeRepo.findExisting(fromId, toId, type);
            if (existing) throw new ValidationError("Relationship already exists");

            // Create Edge
            const edge = await this.edgeRepo.create({
                from_type: 'nd',
                from_id: fromId,
                to_type: 'nd',
                to_id: toId,
                relationship_type: type,
                origin: 'manual'
            });

            // Log Events
            const now = new Date().toISOString();
            await Promise.all([
                this.timelineRepo.create({
                    related_type: 'nd',
                    related_id: fromId,
                    entity_type: 'nd',
                    entity_id: fromId,
                    actor_type: userId === 'system' ? 'system' : 'user',
                    severity: 'info',
                    // event_type: 'linked_to_project', // Removed duplicate
                    event_type: 'updated',
                    description: `Linked to ${toNd.nd_number} (${type})`,
                    event_date: now,
                    metadata: { type, target_id: toId, action: 'add_relation' }
                }),
                this.timelineRepo.create({
                    related_type: 'nd',
                    related_id: toId,
                    entity_type: 'nd',
                    entity_id: toId,
                    actor_type: userId === 'system' ? 'system' : 'user',
                    severity: 'info',
                    event_type: 'updated',
                    description: `Linked from ${fromNd.nd_number} (${type})`,
                    event_date: now,
                    metadata: { type, source_id: fromId, action: 'add_relation_passive' }
                })
            ]);

            return this.success(edge);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Remove a relationship
     */
    async removeRelation(edgeId: string, userId: string = 'system'): Promise<ServiceResult<void>> {
        try {
            const edge = await this.edgeRepo.findById(edgeId);
            if (!edge) throw new NotFoundError("Relationship not found");

            await this.edgeRepo.hardDelete(edgeId); // Edges are hard deleted

            // Log Unlink
            // Fetch names for logging? Expensive. Just log ID.
            const now = new Date().toISOString();
            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: edge.from_id,
                entity_type: 'nd',
                entity_id: edge.from_id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'info',
                event_type: 'updated',
                description: `Unlinked relation (${edge.relationship_type})`,
                event_date: now,
                metadata: { edge_id: edgeId, action: 'remove_relation' }
            });

            return this.success(undefined);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Get all relations for an ND, resolved with details
     */
    async getRelations(ndId: string): Promise<ServiceResult<any>> {
        try {
            const [outgoing, incoming] = await Promise.all([
                this.edgeRepo.findByFromId(ndId),
                this.edgeRepo.findByToId(ndId)
            ]);

            // IDs to fetch
            const relatedIds = new Set<string>();
            outgoing.forEach(e => relatedIds.add(e.to_id));
            incoming.forEach(e => relatedIds.add(e.from_id));

            // Fetch details (could be optimized with `whereIn` chunks if many)
            const relatedNds: Record<string, NdeRecord> = {};
            if (relatedIds.size > 0) {
                // Determine how to fetch. parallel findByIds or findAll filtering?
                // findAll is bad. `findById` parallel is okay for < 20 items.
                // Firestore `where('id', 'in', ...)` limits to 10.
                // Let's do parallel findByIds.
                const promises = Array.from(relatedIds).map(id => this.ndRepo.findById(id));
                const results = await Promise.all(promises);
                results.forEach(r => {
                    if (r) relatedNds[r.id] = r;
                });
            }

            // Categorize
            // Structure: { blocked_by: [], blocking: [], parent: [], child: [], related: [] }
            const mapEdge = (e: NdEdge, isOutgoing: boolean) => {
                const otherId = isOutgoing ? e.to_id : e.from_id;
                const otherNd = relatedNds[otherId];
                if (!otherNd) return null;

                return {
                    edge_id: e.id,
                    type: e.relationship_type,
                    direction: isOutgoing ? 'outgoing' : 'incoming',
                    nd: {
                        id: otherNd.id,
                        nd_number: otherNd.nd_number,
                        title: otherNd.title,
                        status: otherNd.status
                    }
                };
            };

            const relations = {
                blocked_by: [] as any[],
                blocking: [] as any[],
                parents: [] as any[], // Parents of this ND
                children: [] as any[], // Children of this ND
                related: [] as any[]
            };

            // Outgoing: This ND -> [type] -> Other
            // e.g. This triggers Other
            // e.g. This parent_of Other (Other is child)
            for (const e of outgoing) {
                const item = mapEdge(e, true);
                if (!item) continue;

                switch (e.relationship_type) {
                    case 'blocks': relations.blocking.push(item); break; // This blocks Other
                    case 'parent_of': relations.children.push(item); break; // This is parent of Other
                    case 'escalates_to': relations.related.push(item); break; // Special case
                    default: relations.related.push(item);
                }
            }

            // Incoming: Other -> [type] -> This ND
            // e.g. Other blocks This (This is blocked by Other)
            // e.g. Other parent_of This (Other is parent)
            for (const e of incoming) {
                const item = mapEdge(e, false);
                if (!item) continue;

                switch (e.relationship_type) {
                    case 'blocks': relations.blocked_by.push(item); break; // Other blocks This
                    case 'parent_of': relations.parents.push(item); break; // Other is parent of This
                    default: relations.related.push(item);
                }
            }

            return this.success(relations);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Private: Validate Status Transitions
     */
    private validateStatusTransition(current: NdStatus, next: NdStatus): void {
        const allowed: Record<NdStatus, NdStatus[]> = {
            'drafting': ['waiting_internal', 'waiting_external', 'issued'],
            'waiting_internal': ['drafting', 'issued', 'escalated'],
            'waiting_external': ['drafting', 'issued', 'escalated', 'clear'],
            'issued': ['clear', 'waiting_external'],
            'escalated': ['waiting_internal', 'waiting_external', 'clear'],
            'clear': [],
        };

        // Allow going to same status (update info without status change)
        if (current === next) return;

        if (!allowed[current]?.includes(next)) {
            throw new ValidationError(`Invalid status transition from ${current} to ${next}`);
        }
    }
}
