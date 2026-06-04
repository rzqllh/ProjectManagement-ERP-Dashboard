import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdRepository } from '@/repositories/nd.repository';
import { TimelineRepository } from '@/repositories/timeline.repository';
import { getEscalationStatus } from '@/lib/nd-utils';
import { EscalationLevel } from '@/types/nd';

const ndRepo = new NdRepository();
const timelineRepo = new TimelineRepository();

// Lazy import to avoid circular deps
let _stakeholderService: any = null;
async function getStakeholderService() {
    if (!_stakeholderService) {
        const mod = await import('@/services/stakeholder.service');
        _stakeholderService = new mod.StakeholderService();
    }
    return _stakeholderService;
}

// GET /api/cron/escalation
// Option B: Cached + Deterministic
// Updates `escalation_level` and `escalation_last_evaluated_at`
export async function GET(request: NextRequest) {
    try {
        const allNds = await ndRepo.findAll();
        const activeNds = allNds.filter(n => n.status !== 'clear' && n.status !== 'escalated');
        const updates = [];
        const now = new Date().toISOString();
        const affectedStakeholderIds = new Set<string>();

        for (const nd of activeNds) {
            // Calculate deterministic risk
            const risk = getEscalationStatus(nd);
            const newLevel = risk.level as EscalationLevel;

            // Current stored state
            const currentLevel = nd.escalation_level || 'none';

            // Always update last_evaluated_at to prove it ran
            const patch: any = {
                escalation_last_evaluated_at: now
            };

            // Only update level if changed
            if (newLevel !== currentLevel) {
                patch.escalation_level = newLevel;
                console.log(`[Escalation] ND ${nd.nd_number}: ${currentLevel} -> ${newLevel}`);

                const isWorsening = (currentLevel === 'none' && newLevel !== 'none') ||
                    (currentLevel === 'risk' && newLevel === 'escalated');

                // Log detailed event with new schema fields
                updates.push(timelineRepo.create({
                    // Legacy
                    related_type: 'nd',
                    related_id: nd.id,

                    // New Schema
                    entity_type: 'nd',
                    entity_id: nd.id,
                    actor_type: 'automation',
                    severity: isWorsening ? (newLevel === 'escalated' ? 'critical' : 'warning') : 'info',

                    event_type: 'escalation_flagged',
                    description: isWorsening
                        ? `Escalation level increased: ${risk.label}`
                        : `Escalation level decreased to ${newLevel}`,
                    event_date: now,
                    metadata: {
                        old_level: currentLevel,
                        new_level: newLevel,
                        reason: risk.label,
                        actor: 'system_cron'
                    }
                }));

                // Track affected stakeholders for metric recompute
                if (isWorsening && nd.receiver_id) {
                    affectedStakeholderIds.add(nd.receiver_id);
                }
            }

            updates.push(ndRepo.update(nd.id, patch));
        }

        await Promise.all(updates);

        // Event-driven: Recompute metrics for affected stakeholders
        if (affectedStakeholderIds.size > 0) {
            try {
                const svc = await getStakeholderService();
                const recomputePromises = Array.from(affectedStakeholderIds).map(
                    id => svc.recomputeMetrics(id).catch((e: any) =>
                        console.error(`[Cron] Stakeholder recompute failed for ${id}:`, e)
                    )
                );
                await Promise.all(recomputePromises);
            } catch (e) {
                console.error('[Cron] Stakeholder recompute batch failed:', e);
            }
        }

        return successResponse({
            processed: activeNds.length,
            updates: updates.length,
            stakeholders_recomputed: affectedStakeholderIds.size,
            message: 'Escalation check complete',
            timestamp: now
        });
    } catch (error) {
        return errorResponse(error);
    }
}
