/**
 * AI Service — Full RAG pipeline orchestrator.
 *
 * Pipeline (per Master Spec):
 * 1. Detect intent from query text
 * 2. Retrieve related records from existing services
 * 3. Build structured context for LLM
 * 4. Send to LLM via ai-client
 * 5. Return structured AiResponse (never raw output)
 *
 * RULES:
 * - AI must NOT mutate database
 * - All outputs are structured JSON
 * - Every query is logged to ai_query_logs
 */

import { BaseService, ServiceResult } from './base.service';
import { AiQueryLogRepository } from '@/repositories/ai-query-log.repository';
import { NdRepository } from '@/repositories/nd.repository';
import { generateStructuredResponse, isAiConfigured } from '@/lib/ai-client';
import { AppError, ValidationError } from '@/lib/errors';
import {
    AiDetectedIntent,
    AiContext,
    AiQueryInput,
    AiResponse,
    AiQueryLog,
    DEFAULT_MODEL,
} from '@/types/ai';
import { AiAgentService } from './ai-agent.service';

/** Strip undefined values (Firestore rejects them) */
function stripUndefined<T>(obj: T): T {
    return JSON.parse(JSON.stringify(obj));
}

// Lazy imports to avoid circular deps
let _decisionRepo: any = null;
async function getDecisionRepo() {
    if (!_decisionRepo) {
        const mod = await import('@/repositories/decision.repository');
        _decisionRepo = new mod.DecisionRepository();
    }
    return _decisionRepo;
}

let _stakeholderRepo: any = null;
async function getStakeholderRepo() {
    if (!_stakeholderRepo) {
        const mod = await import('@/repositories/stakeholder.repository');
        _stakeholderRepo = new mod.StakeholderRepository();
    }
    return _stakeholderRepo;
}

let _graphService: any = null;
async function getGraphService() {
    if (!_graphService) {
        const mod = await import('@/services/graph.service');
        _graphService = new mod.GraphService();
    }
    return _graphService;
}

// Keywords removed - Agent handles intent dynamically

export class AiService extends BaseService {
    private logRepo = new AiQueryLogRepository();
    private ndRepo = new NdRepository();

    private agent = new AiAgentService();

    // ─── 0. Health Check ───
    async healthCheck(): Promise<{ configured: boolean; message: string }> {
        const configured = await isAiConfigured();
        return {
            configured,
            message: configured ? 'AI Service Online (Agentic)' : 'Gemini API Key missing',
        };
    }

    // ─── Query Delegate to Agent ───
    async query(input: AiQueryInput): Promise<ServiceResult<AiResponse & { query_log_id: string }>> {
        return this.agent.query(input.query, input.model_id);
    }

    // ─── Get recent logs ───
    async getRecentLogs(limit: number = 20): Promise<ServiceResult<AiQueryLog[]>> {
        try {
            const logs = await this.logRepo.findRecent(limit);
            return this.success(logs);
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Failed to fetch logs';
            return this.error(new AppError(message, 500, 'AI_LOG_ERROR'));
        }
    }
}
