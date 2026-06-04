import { BaseRepository } from './base.repository';
import { Stakeholder, StakeholderCategory } from '@/types/stakeholder';

export class StakeholderRepository extends BaseRepository<Stakeholder> {
    constructor() {
        super('stakeholders');
    }

    /**
     * Find stakeholders by category
     */
    async findByCategory(category: StakeholderCategory): Promise<Stakeholder[]> {
        return this.findAll({ category });
    }

    /**
     * Find stakeholders by organization
     */
    async findByOrganization(organization: string): Promise<Stakeholder[]> {
        return this.findAll({ organization });
    }

    /**
     * Search stakeholders by name (prefix match for Combobox)
     * Firestore doesn't support full-text; we fetch all and filter client-side.
     */
    async searchByName(query: string): Promise<Stakeholder[]> {
        const all = await this.findAll();
        const q = query.toLowerCase();
        return all.filter(s => s.name.toLowerCase().includes(q));
    }

    /**
     * Update computed intelligence metrics.
     * This bypasses the BaseEntity Omit to allow metric field writes.
     */
    async updateMetrics(
        id: string,
        metrics: {
            average_response_time_days?: number;
            total_nd_count?: number;
            total_escalations?: number;
            interaction_count?: number;
            risk_score?: number;
            last_interaction_at?: string;
            last_escalation_at?: string;
            last_response_at?: string;
        }
    ): Promise<void> {
        const docRef = this.collection.doc(id);
        await docRef.update({
            ...metrics,
            updated_at: new Date().toISOString(),
        } as any);
    }

    /**
     * Soft delete with audit timestamp
     */
    async softDeleteWithTimestamp(id: string): Promise<void> {
        const now = new Date().toISOString();
        const docRef = this.collection.doc(id);
        await docRef.update({
            soft_delete: true,
            deleted_at: now,
            updated_at: now,
        } as any);
    }
}
