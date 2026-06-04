import { BaseRepository } from './base.repository';
import { Decision, DecisionStatus } from '@/types/decision';

export class DecisionRepository extends BaseRepository<Decision> {
    constructor() {
        super('decisions');
    }

    async findByStatus(status: DecisionStatus): Promise<Decision[]> {
        const snapshot = await this.collection
            .where('status', '==', status)
            .where('soft_delete', '==', false)
            .orderBy('created_at', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    async findByProject(projectId: string): Promise<Decision[]> {
        const snapshot = await this.collection
            .where('related_project_id', '==', projectId)
            .where('soft_delete', '==', false)
            .orderBy('created_at', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }

    async findByNd(ndId: string): Promise<Decision[]> {
        const snapshot = await this.collection
            .where('related_nd_id', '==', ndId)
            .where('soft_delete', '==', false)
            .orderBy('created_at', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }
}
