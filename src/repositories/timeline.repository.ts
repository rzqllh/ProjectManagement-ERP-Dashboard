import { BaseRepository } from './base.repository';
import { TimelineEvent, TimelineRelatedType } from '@/types/timeline';

export class TimelineRepository extends BaseRepository<TimelineEvent> {
    constructor() {
        super('timeline_events');
    }

    async findByRelated(relatedType: TimelineRelatedType, relatedId: string): Promise<TimelineEvent[]> {
        const snapshot = await this.collection
            .where('related_type', '==', relatedType)
            .where('related_id', '==', relatedId)
            .where('soft_delete', '==', false)
            .orderBy('event_date', 'desc')
            .get();

        return snapshot.docs.map(doc => doc.data());
    }
}
