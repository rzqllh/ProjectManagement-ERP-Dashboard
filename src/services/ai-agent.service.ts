import { ChatGoogleGenerativeAI } from '@langchain/google-genai';
import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import { HumanMessage, SystemMessage, BaseMessage } from '@langchain/core/messages';
import { AppError } from '@/lib/errors';
import { BaseService, ServiceResult } from './base.service';
import { AiQueryLogRepository } from '@/repositories/ai-query-log.repository';
import { AiResponse, DEFAULT_MODEL } from '@/types/ai';
import { isAiConfigured, resolveApiKey } from '@/lib/ai-client';
import { VectorService } from './vector.service';
import { NdRepository } from '@/repositories/nd.repository';
import { DecisionRepository } from '@/repositories/decision.repository';
import { GraphService } from './graph.service';
import { adminDb } from '@/lib/firebase/admin';

export class AiAgentService extends BaseService {
    private vectorService = new VectorService();
    private ndRepo = new NdRepository();
    private decisionRepo = new DecisionRepository();
    private graphService = new GraphService();
    private logRepo = new AiQueryLogRepository();

    private model: ChatGoogleGenerativeAI | null = null;

    async initialize(modelId?: string) {
        const apiKey = await resolveApiKey();
        if (!apiKey) throw new Error('AI API Key not found');

        await this.vectorService.initialize();

        const targetModel = modelId || DEFAULT_MODEL;

        this.model = new ChatGoogleGenerativeAI({
            apiKey,
            model: targetModel,
            temperature: 0,
            maxOutputTokens: 2048,
            maxRetries: 1,
        });
    }

    async query(input: string, modelId?: string): Promise<ServiceResult<AiResponse & { query_log_id: string }>> {
        if (!(await isAiConfigured())) return this.error(new AppError('AI not configured', 500, 'AI_CONFIG_ERROR'));

        const targetModelId = modelId || DEFAULT_MODEL;

        try {
            // 1. Detect Intent (Naive Regex for now, can be smarter later)
            // Valid intents: 'nd' | 'project' | 'decision' | 'risk' | 'report' | 'general'
            const isStatusQuery = /status|overview|summary/i.test(input);
            const detected_intent = /risk/i.test(input) ? 'risk'
                : /decision/i.test(input) ? 'decision'
                    : /nd|non-?delivery/i.test(input) ? 'nd'
                        : /project/i.test(input) ? 'project'
                            : 'general';

            // 2. CACHE SHORT-CIRCUIT (Optimization)
            if (isStatusQuery) {
                // Calculate current system hash to ensure freshness
                const allNd = await this.ndRepo.findAll();
                const allDecisions = await this.decisionRepo.findAll();
                const active = allNd.filter(n => n.status !== 'clear');
                const risks = allNd.filter(n => n.escalation_level === 'risk' || n.escalation_level === 'escalated');

                // Hash: Count + ID of latest item (to catch new additions)
                const latestNd = allNd.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                const currentHash = `nds:${allNd.length}|active:${active.length}|risks:${risks.length}|decs:${allDecisions.length}|latest:${latestNd?.id || 'none'}`;

                const cacheRef = adminDb.collection('ai_cache').doc(`system_status_${targetModelId.replace(/[^a-zA-Z0-9]/g, '_')}`);
                const cacheSnap = await cacheRef.get();

                if (cacheSnap.exists) {
                    const cached = cacheSnap.data();
                    // Check if Hash matches AND cache is reasonably fresh (< 10 mins to be safe, though hash check covers data changes)
                    // We trust hash primarily.
                    if (cached?.hash === currentHash && cached?.ai_summary) {
                        const logId = await this.logRepo.create({
                            query_text: input,
                            model_id: 'cache-hit',
                            detected_intent: 'general', // Status is general high-level
                            response_summary: cached.ai_summary.summary,
                            confidence: 1.0,
                            response_time_ms: 0,
                            related_ids: [],
                            // Omitted context_snapshot for cache hit or pass minimal
                        } as any);

                        return this.success({ ...cached.ai_summary, query_log_id: logId.id });
                    }
                }
            }

            // 3. Initialize Model (Only if no cache hit)
            await this.initialize(modelId);

            // Define tools
            const tools = [
                new DynamicStructuredTool({
                    name: 'search_knowledge_base',
                    description: 'Search for NDs, Decisions, and Projects by semantic meaning.',
                    schema: z.object({ query: z.string() }),
                    func: async ({ query }: { query: string }) => {
                        const results = await this.vectorService.similaritySearch(query, 3);
                        return JSON.stringify(results.map((d: any) => ({
                            content: d.pageContent.slice(0, 1000) + '...',
                            meta: d.metadata
                        })));
                    },
                }),
                new DynamicStructuredTool({
                    name: 'lookup_nd',
                    description: 'Find a specific ND record by its exact ND Number.',
                    schema: z.object({ nd_number: z.string() }),
                    func: async ({ nd_number }: { nd_number: string }) => {
                        const nds = await this.ndRepo.findAll();
                        const match = nds.find(n => n.nd_number.includes(nd_number));
                        return match ? JSON.stringify(match) : 'ND not found.';
                    },
                }),
                new DynamicStructuredTool({
                    name: 'analyze_blockers',
                    description: 'Analyze what is blocking a specific entity.',
                    schema: z.object({ id: z.string(), type: z.enum(['nd', 'project']) }),
                    func: async ({ id, type }: { id: string, type: 'nd' | 'project' }) => {
                        const result = await this.graphService.getBlockChain(id, type);
                        return result.success ? JSON.stringify(result.data) : `Error: ${result.error}`;
                    },
                }),
                new DynamicStructuredTool({
                    name: 'get_system_status',
                    description: 'Get a comprehensive status overview of the system (Active NDs, Risks, Recent Decisions). Use this for "overview" queries.',
                    schema: z.object({}),
                    func: async () => {
                        // Re-fetch only if tool is called (though we fetched for cache check, redundant but safe)
                        const allNd = await this.ndRepo.findAll();
                        const allDecisions = await this.decisionRepo.findAll();
                        const active = allNd.filter(n => n.status !== 'clear');
                        const risks = allNd.filter(n => n.escalation_level === 'risk' || n.escalation_level === 'escalated');

                        const recentNd = [...allNd]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 5)
                            .map(r => ({ nd: r.nd_number, status: r.status, title: r.title, pic: r.pic }));

                        const recentDecisions = [...allDecisions]
                            .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
                            .slice(0, 5)
                            .map(d => ({ title: d.title, status: d.status, priority: d.priority }));

                        // Pass hash for saving later
                        const latestNd = allNd.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())[0];
                        const currentHash = `nds:${allNd.length}|active:${active.length}|risks:${risks.length}|decs:${allDecisions.length}|latest:${latestNd?.id || 'none'}`;

                        return JSON.stringify({
                            _current_hash: currentHash,
                            metrics: {
                                total_nds: allNd.length,
                                active_nds: active.length,
                                critical_risks: risks.length,
                                decision_count: allDecisions.length
                            },
                            critical_risks: risks.slice(0, 20).map(r => ({
                                nd: r.nd_number,
                                level: r.escalation_level,
                                title: r.title,
                                pic: r.pic
                            })),
                            recent_activity: {
                                nds: recentNd,
                                decisions: recentDecisions
                            }
                        });
                    },
                }),
            ];

            // Bind tools to model
            console.log(`[AiAgent] Binding tools to model ${targetModelId}...`);
            const modelWithTools = (this.model as any).bindTools(tools);

            // Chat loop
            const messages: BaseMessage[] = [
                new SystemMessage(`You are Caneris, an expert ERP Program Manager Agent.
PAS (Persona/Action/Style):
- ROLE: You are a high-level PMO Consultant.
- GOAL: Provide strategic insights.
- STYLE: Professional, concise, risk-focused.

RULES:
1. Research the user query.
2. If user asks about "status" or "overview", use 'get_system_status' to fetch data.
3. Analyze the data like a consultant. Identify patterns, blockers, or risks.
4. FINAL RESPONSE must be JSON:
{
  "summary": "...",
  "risk_identified": [],
  "recommended_action": [],
  "reasoning": "...",
  "confidence_level": 0.0-1.0
}
`),
                new HumanMessage(input)
            ];

            let finalResponse: AiResponse | null = null;
            let currentHashToSave: string | null = null;
            let iterations = 0;

            console.log(`[AiAgent] Starting thinking loop for: "${input.slice(0, 50)}..."`);

            while (iterations < 5) {
                console.log(`[AiAgent] Iteration ${iterations + 1}/5 - Invoking Model...`);
                const response = await modelWithTools.invoke(messages);
                messages.push(response);

                // Check for tool calls
                if (response.tool_calls && response.tool_calls.length > 0) {
                    console.log(`[AiAgent] Tool calls detected: ${response.tool_calls.map((t: any) => t.name).join(', ')}`);
                    for (const toolCall of response.tool_calls) {
                        const tool = tools.find(t => t.name === toolCall.name);
                        if (tool) {
                            console.log(`[AiAgent] Executing tool: ${toolCall.name}`);
                            const output = await (tool as any).invoke(toolCall.args);
                            console.log(`[AiAgent] Tool executed. Output length: ${output.length} chars`);

                            if (toolCall.name === 'get_system_status') {
                                try {
                                    const parsedOptions = JSON.parse(output);
                                    if (parsedOptions._current_hash) {
                                        currentHashToSave = parsedOptions._current_hash;
                                    }
                                } catch (e) { }
                            }

                            messages.push({
                                role: 'tool',
                                content: output,
                                tool_call_id: toolCall.id,
                                name: toolCall.name
                            } as any);
                        }
                    }
                } else {
                    // No tool calls, assume final answer
                    console.log('[AiAgent] No more tool calls. Parsing final response...');
                    try {
                        const text = response.content as string;
                        const cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();
                        finalResponse = JSON.parse(cleaned);

                        // SAVE CACHE (Optimization)
                        if (currentHashToSave && finalResponse) {
                            console.log('[AiAgent] Saving response to cache...');
                            await adminDb.collection('ai_cache').doc(`system_status_${targetModelId.replace(/[^a-zA-Z0-9]/g, '_')}`).set({
                                hash: currentHashToSave,
                                ai_summary: finalResponse, // Store full response
                                updated_at: new Date().toISOString()
                            });
                        }
                        break;
                    } catch (parseError) {
                        console.warn('[AiAgent] JSON Parse Error:', parseError);
                        messages.push(new HumanMessage("Please format your previous response as valid JSON matching the schema."));
                    }
                }
                iterations++;
                await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limit mitigation
            }

            if (!finalResponse) {
                finalResponse = {
                    summary: "AI could not generate a structured response.",
                    risk_identified: [],
                    recommended_action: [],
                    reasoning: "Agent loop exhausted or output malformed.",
                    confidence_level: 0.0
                };
            }

            // Log it
            const logId = await this.logRepo.create({
                query_text: input,
                model_id: modelId || 'gemini-agent-1.0',
                detected_intent: detected_intent as any,
                response_summary: finalResponse.summary,
                confidence: finalResponse.confidence_level,
                response_time_ms: 0,
                // Simple string snapshot to avoid nested object depth issues in Firestore
                context_snapshot: { raw: JSON.stringify(messages.map(m => typeof m.content === 'string' ? m.content : 'Object')) },
                related_ids: [],
            } as any);

            return this.success({ ...finalResponse, query_log_id: logId.id });

        } catch (err: any) {
            console.error('[AiAgent] Query failed:', err);

            if (err.message?.includes('429') || err.message?.includes('Quota') || err.message?.includes('Resource has been exhausted')) {
                return this.error(new AppError(
                    'AI Quota limit reached. Please  wait a moment.',
                    429,
                    'AI_QUOTA_EXCEEDED'
                ));
            }

            if (err.message?.includes('404') || err.message?.includes('not found')) {
                return this.error(new AppError(
                    `The selected model (${modelId}) is not available to your API key. Try default model.`,
                    400,
                    'AI_MODEL_NOT_FOUND'
                ));
            }

            return this.error(new AppError(err instanceof Error ? err.message : 'AI agent failed', 500, 'AI_AGENT_ERROR'));
        }
    }
}
