import { BaseRepository } from './base.repository';
import { StakeholderInteraction } from '@/types/stakeholder';

export class StakeholderInteractionRepository extends BaseRepository<StakeholderInteraction> {
    constructor() {
        super('stakeholder_interactions');
    }

    /**
     * Find interactions for a specific stakeholder
     */
    async findByStakeholderId(stakeholderId: string): Promise<StakeholderInteraction[]> {
        return this.findAll({ stakeholder_id: stakeholderId });
    }

    /**
     * Find interactions related to a specific ND
     */
    async findByNdId(ndId: string): Promise<StakeholderInteraction[]> {
        return this.findAll({ nd_id: ndId });
    }

    /**
     * Count interactions for a stakeholder
     */
    async countByStakeholderId(stakeholderId: string): Promise<number> {
        const interactions = await this.findByStakeholderId(stakeholderId);
        return interactions.length;
    }
}
