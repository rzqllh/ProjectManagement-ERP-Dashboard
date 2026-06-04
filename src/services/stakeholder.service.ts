import { BaseService, ServiceResult } from './base.service';
import { StakeholderRepository } from '@/repositories/stakeholder.repository';
import { StakeholderInteractionRepository } from '@/repositories/stakeholder-interaction.repository';
import { TimelineRepository } from '@/repositories/timeline.repository';
import { NdRepository } from '@/repositories/nd.repository';
import {
    Stakeholder,
    CreateStakeholderInput,
    UpdateStakeholderInput,
    StakeholderInteraction,
    CreateInteractionInput,
} from '@/types/stakeholder';
import { NotFoundError } from '@/lib/errors';

export class StakeholderService extends BaseService {
    private stakeholderRepo: StakeholderRepository;
    private interactionRepo: StakeholderInteractionRepository;
    private timelineRepo: TimelineRepository;
    private ndRepo: NdRepository;

    constructor() {
        super();
        this.stakeholderRepo = new StakeholderRepository();
        this.interactionRepo = new StakeholderInteractionRepository();
        this.timelineRepo = new TimelineRepository();
        this.ndRepo = new NdRepository();
    }

    // ─────────────────────────────────────────────────
    // CRUD
    // ─────────────────────────────────────────────────

    async createStakeholder(
        input: CreateStakeholderInput,
        userId: string = 'system'
    ): Promise<ServiceResult<Stakeholder>> {
        try {
            const stakeholder = await this.stakeholderRepo.create({
                ...input,
                // Initialize all computed fields to defaults
                average_response_time_days: 0,
                total_nd_count: 0,
                total_escalations: 0,
                interaction_count: 0,
                risk_score: 20, // Default: no interaction = 20 pts risk
                last_interaction_at: new Date().toISOString(),
            } as any);

            // Timeline event
            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: stakeholder.id,
                entity_type: 'stakeholder',
                entity_id: stakeholder.id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'info',
                event_type: 'created',
                description: `Stakeholder "${input.name}" (${input.organization}) registered`,
                event_date: new Date().toISOString(),
                metadata: { category: input.category, created_by: userId },
            });

            return this.success(stakeholder);
        } catch (err: any) {
            return this.error(err);
        }
    }

    async getStakeholder(id: string): Promise<ServiceResult<Stakeholder>> {
        try {
            const stakeholder = await this.stakeholderRepo.findById(id);
            if (!stakeholder) throw new NotFoundError(`Stakeholder ${id}`);
            return this.success(stakeholder);
        } catch (err: any) {
            return this.error(err);
        }
    }

    async getAllStakeholders(
        filters?: Record<string, any>
    ): Promise<ServiceResult<Stakeholder[]>> {
        try {
            const stakeholders = await this.stakeholderRepo.findAll(filters);
            return this.success(stakeholders);
        } catch (err: any) {
            return this.error(err);
        }
    }

    async updateStakeholder(
        id: string,
        input: UpdateStakeholderInput,
        userId: string = 'system'
    ): Promise<ServiceResult<Stakeholder>> {
        try {
            const current = await this.stakeholderRepo.findById(id);
            if (!current) throw new NotFoundError(`Stakeholder ${id}`);

            const updated = await this.stakeholderRepo.update(id, input);

            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: id,
                entity_type: 'stakeholder',
                entity_id: id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'info',
                event_type: 'updated',
                description: `Stakeholder "${current.name}" updated by ${userId}`,
                event_date: new Date().toISOString(),
                metadata: { changes: Object.keys(input), user: userId },
            });

            return this.success(updated);
        } catch (err: any) {
            return this.error(err);
        }
    }

    async deleteStakeholder(
        id: string,
        userId: string = 'system'
    ): Promise<ServiceResult<void>> {
        try {
            const current = await this.stakeholderRepo.findById(id);
            if (!current) throw new NotFoundError(`Stakeholder ${id}`);

            await this.stakeholderRepo.softDeleteWithTimestamp(id);

            await this.timelineRepo.create({
                related_type: 'nd',
                related_id: id,
                entity_type: 'stakeholder',
                entity_id: id,
                actor_type: userId === 'system' ? 'system' : 'user',
                severity: 'warning',
                event_type: 'deleted',
                description: `Stakeholder "${current.name}" archived by ${userId}`,
                event_date: new Date().toISOString(),
                metadata: { user: userId },
            });

            return this.success(undefined);
        } catch (err: any) {
            return this.error(err);
        }
    }

    // ─────────────────────────────────────────────────
    // INTERACTIONS
    // ─────────────────────────────────────────────────

    async logInteraction(
        input: CreateInteractionInput,
        userId: string = 'system'
    ): Promise<ServiceResult<StakeholderInteraction>> {
        try {
            const stakeholder = await this.stakeholderRepo.findById(input.stakeholder_id);
            if (!stakeholder) throw new NotFoundError(`Stakeholder ${input.stakeholder_id}`);

            const interaction = await this.interactionRepo.create(input);

            // Update interaction count + last_interaction_at
            const count = await this.interactionRepo.countByStakeholderId(input.stakeholder_id);
            await this.stakeholderRepo.updateMetrics(input.stakeholder_id, {
                interaction_count: count,
                last_interaction_at: new Date().toISOString(),
            });

            // Recompute risk score after interaction update
            await this.recomputeRiskScore(input.stakeholder_id);

            return this.success(interaction);
        } catch (err: any) {
            return this.error(err);
        }
    }

    async getInteractions(
        stakeholderId: string
    ): Promise<ServiceResult<StakeholderInteraction[]>> {
        try {
            const interactions = await this.interactionRepo.findByStakeholderId(stakeholderId);
            // Sort newest first
            interactions.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );
            return this.success(interactions);
        } catch (err: any) {
            return this.error(err);
        }
    }

    // ─────────────────────────────────────────────────
    // INTELLIGENCE: Metric Recomputation
    // ─────────────────────────────────────────────────

    /**
     * Full recompute of all metrics for a stakeholder.
     * Called event-driven (NdService, Cron) or as admin fallback.
     *
     * Response Time Formula:
     *   Per ND: avg of all waiting_external → next_status durations
     *   Per Stakeholder: avg of all ND-level response times where receiver_id = stakeholder
     */
    async recomputeMetrics(
        stakeholderId: string
    ): Promise<ServiceResult<Stakeholder>> {
        try {
            const stakeholder = await this.stakeholderRepo.findById(stakeholderId);
            if (!stakeholder) throw new NotFoundError(`Stakeholder ${stakeholderId}`);

            // 1. Fetch all NDs where this stakeholder is receiver
            const allNds = await this.ndRepo.findAll();
            const relatedNds = allNds.filter(nd => nd.receiver_id === stakeholderId);

            const totalNdCount = relatedNds.length;

            // 2. Count escalations
            const escalatedNds = relatedNds.filter(
                nd => nd.escalation_level === 'risk' || nd.escalation_level === 'escalated'
            );
            const totalEscalations = escalatedNds.length;
            const lastEscalation = escalatedNds.length > 0
                ? escalatedNds
                    .map(nd => nd.escalation_last_evaluated_at || nd.updated_at)
                    .sort()
                    .pop()
                : stakeholder.last_escalation_at;

            // 3. Compute average response time
            // For each ND, find timeline events for status changes from waiting_external
            let totalResponseDays = 0;
            let responseWindowCount = 0;
            let lastResponseAt: string | undefined = stakeholder.last_response_at;

            for (const nd of relatedNds) {
                // Get timeline events for this ND, sorted by date
                const events = await this.timelineRepo.findAll({ related_id: nd.id });
                const statusEvents = events
                    .filter(e => e.event_type === 'status_changed' || e.event_type === 'created')
                    .sort((a, b) => new Date(a.event_date).getTime() - new Date(b.event_date).getTime());

                let waitingStart: Date | null = null;

                for (const event of statusEvents) {
                    const meta = event.metadata as any;

                    // Detect entry into waiting_external
                    if (meta?.new_status === 'waiting_external' || meta?.newStatus === 'waiting_external') {
                        waitingStart = new Date(event.event_date);
                    }
                    // Detect exit from waiting_external
                    else if (
                        waitingStart &&
                        (meta?.old_status === 'waiting_external' || meta?.oldStatus === 'waiting_external')
                    ) {
                        const exitDate = new Date(event.event_date);
                        const durationMs = exitDate.getTime() - waitingStart.getTime();
                        const durationDays = durationMs / (1000 * 60 * 60 * 24);

                        if (durationDays >= 0) {
                            totalResponseDays += durationDays;
                            responseWindowCount++;
                            lastResponseAt = exitDate.toISOString();
                        }
                        waitingStart = null;
                    }
                }
            }

            const avgResponseTimeDays =
                responseWindowCount > 0
                    ? Math.round((totalResponseDays / responseWindowCount) * 100) / 100
                    : 0;

            // 4. Get interaction count
            const interactionCount = await this.interactionRepo.countByStakeholderId(stakeholderId);

            // 5. Compute risk score
            const riskScore = this.calculateRiskScore(
                avgResponseTimeDays,
                totalEscalations,
                interactionCount
            );

            // 6. Persist metrics
            const metrics = {
                average_response_time_days: avgResponseTimeDays,
                total_nd_count: totalNdCount,
                total_escalations: totalEscalations,
                interaction_count: interactionCount,
                risk_score: riskScore,
                ...(lastEscalation && { last_escalation_at: lastEscalation }),
                ...(lastResponseAt && { last_response_at: lastResponseAt }),
            };

            await this.stakeholderRepo.updateMetrics(stakeholderId, metrics);

            // Return fresh data
            const updated = await this.stakeholderRepo.findById(stakeholderId);
            return this.success(updated!);
        } catch (err: any) {
            return this.error(err);
        }
    }

    /**
     * Lightweight risk score recompute (no full ND scan).
     * Used after interaction updates.
     */
    private async recomputeRiskScore(stakeholderId: string): Promise<void> {
        const stakeholder = await this.stakeholderRepo.findById(stakeholderId);
        if (!stakeholder) return;

        const riskScore = this.calculateRiskScore(
            stakeholder.average_response_time_days,
            stakeholder.total_escalations,
            stakeholder.interaction_count
        );

        await this.stakeholderRepo.updateMetrics(stakeholderId, { risk_score: riskScore });
    }

    /**
     * Risk Score = composite of response time, escalations, interaction absence.
     * Range: 0–100. Higher = riskier.
     *
     * Formula:
     *   (avg_response_time_days / 10) * 40   → 40% weight: slower = riskier
     *   + (total_escalations * 5)             → 5 pts per escalation
     *   + (interaction_count === 0 ? 20 : 0)  → 20 pts if never interacted
     *   Clamped to 0–100
     */
    private calculateRiskScore(
        avgResponseDays: number,
        totalEscalations: number,
        interactionCount: number
    ): number {
        const responseComponent = Math.min((avgResponseDays / 10) * 40, 40);
        const escalationComponent = totalEscalations * 5;
        const interactionComponent = interactionCount === 0 ? 20 : 0;

        const raw = responseComponent + escalationComponent + interactionComponent;
        return Math.round(Math.min(Math.max(raw, 0), 100));
    }

    // ─────────────────────────────────────────────────
    // PROFILE: Aggregated view
    // ─────────────────────────────────────────────────

    async getProfile(id: string): Promise<
        ServiceResult<{
            stakeholder: Stakeholder;
            recent_nds: any[];
            interactions: StakeholderInteraction[];
        }>
    > {
        try {
            const stakeholder = await this.stakeholderRepo.findById(id);
            if (!stakeholder) throw new NotFoundError(`Stakeholder ${id}`);

            // Recent NDs where this person is sender or receiver
            const allNds = await this.ndRepo.findAll();
            const relatedNds = allNds
                .filter(nd => nd.sender_id === id || nd.receiver_id === id)
                .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())
                .slice(0, 20); // Latest 20

            const interactions = await this.interactionRepo.findByStakeholderId(id);
            interactions.sort(
                (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
            );

            return this.success({
                stakeholder,
                recent_nds: relatedNds,
                interactions: interactions.slice(0, 50), // Latest 50
            });
        } catch (err: any) {
            return this.error(err);
        }
    }

    // ─────────────────────────────────────────────────
    // SEARCH (for Combobox)
    // ─────────────────────────────────────────────────

    async searchStakeholders(query: string): Promise<ServiceResult<Stakeholder[]>> {
        try {
            const results = await this.stakeholderRepo.searchByName(query);
            return this.success(results);
        } catch (err: any) {
            return this.error(err);
        }
    }
}
