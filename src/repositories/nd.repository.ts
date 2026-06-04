import { BaseRepository } from './base.repository';
import { NdeRecord, NdStatus } from '@/types/nd';

export class NdRepository extends BaseRepository<NdeRecord> {
    constructor() {
        super('nd_records');
    }

    async findByNdNumber(ndNumber: string): Promise<NdeRecord | null> {
        const snapshot = await this.collection
            .where('nd_number', '==', ndNumber)
            .where('soft_delete', '==', false)
            .limit(1)
            .get();

        if (snapshot.empty) return null;
        return snapshot.docs[0].data();
    }

    async findByProjectId(projectId: string): Promise<NdeRecord[]> {
        return this.findAll({ related_project_id: projectId });
    }

    async findByParentId(parentId: string): Promise<NdeRecord[]> {
        return this.findAll({ parent_nd_id: parentId });
    }

    async findByStatus(status: NdStatus): Promise<NdeRecord[]> {
        return this.findAll({ status });
    }

    async findByEscalationStatus(status: 'risk' | 'escalated'): Promise<NdeRecord[]> {
        return this.findAll({ escalation_status: status });
    }

    async countByStatus(status: NdStatus): Promise<number> {
        // Using get() and size for now as count() aggregation might need newer SDK/indexes
        // Optimized approach would be to use aggregation queries if available or maintain counters
        const snapshot = await this.collection
            .where('status', '==', status)
            .where('soft_delete', '==', false)
            .select('id') // Optimization: select only ID
            .get();

        return snapshot.size;
    }

    async countAll(): Promise<number> {
        const snapshot = await this.collection
            .where('soft_delete', '==', false)
            .select('id')
            .get();
        return snapshot.size;
    }

    /**
     * Advanced search with multiple filters
     */
    async search(filters: {
        status?: NdStatus;
        category?: string;
        pic?: string;
        project_id?: string;
    }): Promise<NdeRecord[]> {
        // Reuse base findAll which supports simple equality filters
        // Casting filters to Record<string, any> for compatibility
        return this.findAll(filters as Record<string, any>);
    }
}
