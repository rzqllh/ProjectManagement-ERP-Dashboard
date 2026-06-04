import { BaseEntity } from './base';

// ─── Intents ───
export type AiDetectedIntent = 'nd' | 'project' | 'decision' | 'risk' | 'report' | 'general';

// ─── Model tiers ───
export type AiModelTier = 'thinking' | 'fast';

// ─── Available models ───
export interface AiModelOption {
    id: string;
    label: string;
    tier: AiModelTier;
    description: string;
}

export const AI_MODELS: AiModelOption[] = [
    { id: 'gemini-2.5-flash', label: 'Gemini 2.5 Flash', tier: 'fast', description: 'Next-gen fast model' },
    { id: 'gemini-2.5-pro', label: 'Gemini 2.5 Pro', tier: 'thinking', description: 'Next-gen reasoning model' },
    { id: 'gemini-3-flash-preview', label: 'Gemini 3 Flash (Preview)', tier: 'fast', description: 'Experimental frontier fast model' },
    { id: 'gemini-3-pro-preview', label: 'Gemini 3 Pro (Preview)', tier: 'thinking', description: 'Experimental frontier reasoning model' },
];

// Fallback ke 2.5 Pro yang lebih stabil untuk menghindari API rejection
export const DEFAULT_MODEL = 'gemini-2.5-flash';

// ─── Context shape for RAG retrieval ───
export type AiEscalationLevel = 'none' | 'risk' | 'escalated';

export interface AiContext {
    intent: AiDetectedIntent;
    nds?: { id: string; nd_number: string; title: string; status: string; escalation_level?: AiEscalationLevel }[];
    decisions?: { id: string; title: string; status: string; impact?: string }[];
    stakeholders?: { id: string; name: string; risk_score?: number }[];
    graph?: { nodes: number; edges: number; blockers: string[] };
    raw_query: string;
}

// ─── Query input ───
export interface AiQueryInput {
    query: string;
    model_id?: string;               // Optional override — defaults based on tier
    scope_entity_id?: string;         // Optional: scope to specific ND/project
    scope_entity_type?: 'nd' | 'project' | 'decision' | 'stakeholder';
}

// ─── Structured AI response (per Master Spec) ───
export interface AiResponse {
    summary: string;
    risk_identified: string[];
    recommended_action: string[];
    reasoning: string;
    confidence_level: number;
}

// ─── Query log (Firestore document) ───
export interface AiQueryLog extends BaseEntity {
    query_text: string;
    model_id: string;
    detected_intent: AiDetectedIntent;
    related_ids: string[];
    response_summary: string;
    confidence: number;
    response_time_ms: number;
    context_snapshot?: AiContext;
}
