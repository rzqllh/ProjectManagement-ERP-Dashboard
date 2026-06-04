import { Decision, CreateDecisionInput, UpdateDecisionInput } from '@/types/decision';
import { DecisionRepository } from '@/repositories/decision.repository';
import { TimelineRepository } from '@/repositories/timeline.repository';
import { ServiceResult } from '@/services/base.service';
import { NotFoundError, ValidationError, AppError } from '@/lib/errors';
import { TimelineEventType, TimelineRelatedType } from '@/types/timeline';

export class DecisionService {
    private decisionRepo = new DecisionRepository();
    private timelineRepo = new TimelineRepository();

    private success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    private error(err: any): ServiceResult<any> {
        const error = err instanceof AppError ? err : new AppError(err.message || 'Unknown error');
        return { success: false, error };
    }

    // ─── Generate Decision Number ──────────────────────────────────────
    private generateDecisionNumber(): string {
        const timestamp = Date.now().toString().slice(-6);
        return `DEC-${new Date().getFullYear()}-${timestamp}`;
    }

    // ─── Create Decision ───────────────────────────────────────────────
    async createDecision(input: CreateDecisionInput, userId: string = 'system'): Promise<ServiceResult<Decision>> {
        try {
            const decisionNumber = this.generateDecisionNumber();

            const decision = await this.decisionRepo.create({
                ...input,
                decision_number: decisionNumber,
                decision_type: input.decision_type || 'technical',
                status: input.status || 'draft',
                priority: input.priority || 'medium',
                attachment_links: input.attachment_links || [],
                tags: input.tags || [],
            } as any);

            // Log creation
            await this.timelineRepo.create({
                entity_id: decision.id,
                entity_type: 'decision' as TimelineRelatedType,
                related_type: 'decision' as TimelineRelatedType,
                related_id: decision.id,
                event_date: new Date().toISOString(),
                event_type: 'created' as TimelineEventType,
                description: `Decision "${decision.title}" (${decision.decision_number}) created`,
                actor_id: userId,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'info',
                metadata: { priority: decision.priority }
            });

            // If related to project, log there too
            if (decision.related_project_id) {
                await this.timelineRepo.create({
                    entity_id: decision.related_project_id,
                    entity_type: 'project' as TimelineRelatedType,
                    related_type: 'decision' as TimelineRelatedType,
                    related_id: decision.id,
                    event_date: new Date().toISOString(),
                    event_type: 'linked_to_project' as TimelineEventType,
                    description: `Decision "${decision.decision_number}" linked to project`,
                    actor_id: userId,
                    actor_type: 'user',
                    severity: 'info'
                });
            }

            return this.success(decision);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Get Decision ──────────────────────────────────────────────────
    async getDecision(id: string): Promise<ServiceResult<Decision>> {
        try {
            const decision = await this.decisionRepo.findById(id);
            if (!decision) throw new NotFoundError(`Decision with ID ${id}`);
            return this.success(decision);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── List Decisions ────────────────────────────────────────────────
    async listDecisions(filters?: Record<string, any>): Promise<ServiceResult<Decision[]>> {
        try {
            // If filtering by project, use specific query
            if (filters?.project_id) {
                const decisions = await this.decisionRepo.findByProject(filters.project_id);
                return this.success(decisions);
            }
            if (filters?.nd_id) {
                const decisions = await this.decisionRepo.findByNd(filters.nd_id);
                return this.success(decisions);
            }

            // Default findAll
            const decisions = await this.decisionRepo.findAll(filters);
            return this.success(decisions);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Update Decision ───────────────────────────────────────────────
    async updateDecision(id: string, input: UpdateDecisionInput, userId: string = 'system'): Promise<ServiceResult<Decision>> {
        try {
            const existing = await this.decisionRepo.findById(id);
            if (!existing) throw new NotFoundError(`Decision with ID ${id}`);

            // Handle Approval Logic if status changing to approved
            let updateData = { ...input };
            if (input.status === 'approved' && existing.status !== 'approved') {
                updateData.approval_date = new Date().toISOString();
                // approver should be passed in input or inferred from userId, but input takes precedence
                if (!updateData.approver) updateData.approver = userId;
            }

            const updated = await this.decisionRepo.update(id, updateData);

            // Log changes
            if (input.status && input.status !== existing.status) {
                await this.timelineRepo.create({
                    entity_id: id,
                    entity_type: 'decision' as TimelineRelatedType,
                    related_type: 'decision' as TimelineRelatedType,
                    related_id: id,
                    event_date: new Date().toISOString(),
                    event_type: 'status_changed' as TimelineEventType,
                    description: `Decision status changed from ${existing.status} to ${input.status}`,
                    actor_id: userId,
                    actor_type: 'user',
                    severity: input.status === 'rejected' ? 'warning' : 'info',
                    metadata: { old: existing.status, new: input.status }
                });
            }

            return this.success(updated);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Delete Decision ───────────────────────────────────────────────
    async deleteDecision(id: string, userId: string = 'system'): Promise<ServiceResult<void>> {
        try {
            const existing = await this.decisionRepo.findById(id);
            if (!existing) throw new NotFoundError(`Decision with ID ${id}`);

            await this.decisionRepo.softDelete(id);

            await this.timelineRepo.create({
                entity_id: id,
                entity_type: 'decision' as TimelineRelatedType,
                related_type: 'decision' as TimelineRelatedType,
                related_id: id,
                event_date: new Date().toISOString(),
                event_type: 'deleted' as TimelineEventType,
                description: `Decision "${existing.decision_number}" deleted`,
                actor_id: userId,
                actor_type: 'user',
                severity: 'warning'
            });

            return this.success(undefined);
        } catch (err) {
            return this.error(err);
        }
    }
}

export const decisionService = new DecisionService();
