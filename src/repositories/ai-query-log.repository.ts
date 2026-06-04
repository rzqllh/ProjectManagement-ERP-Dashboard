import { BaseRepository } from './base.repository';
import { AiQueryLog } from '@/types/ai';

export class AiQueryLogRepository extends BaseRepository<AiQueryLog> {
    constructor() {
        super('ai_query_logs');
    }

    /** Fetch recent query logs, ordered by created_at descending */
    async findRecent(limit: number = 20): Promise<AiQueryLog[]> {
        const all = await this.findAll();
        return all
            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, limit);
    }
}
