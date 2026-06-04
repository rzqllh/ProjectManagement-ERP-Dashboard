/**
 * AI Client Wrapper — Gemini SDK abstraction layer.
 *
 * Rules (per Master Spec):
 * - AI must NOT mutate database automatically
 * - Responses must always be structured AiResponse JSON
 * - No raw AI output allowed
 *
 * API key resolution order:
 * 1. Firestore `app_settings/ai` (set via UI)
 * 2. Environment variable `GEMINI_API_KEY` (fallback)
 */

import { GoogleGenAI } from '@google/genai';
import { AiResponse, DEFAULT_MODEL } from '@/types/ai';

// ─── Client cache (keyed by API key to support runtime changes) ───
let _cachedKey: string | null = null;
let _client: GoogleGenAI | null = null;

function getClient(apiKey: string): GoogleGenAI {
    // Re-use client if key hasn't changed
    if (_client && _cachedKey === apiKey) return _client;

    _client = new GoogleGenAI({ apiKey });
    _cachedKey = apiKey;
    return _client;
}

// ─── Resolve API key: Firestore → env fallback ───
export async function resolveApiKey(): Promise<string | null> {
    // 1. Try Firestore settings
    try {
        const { adminDb } = await import('@/lib/firebase/admin');
        const doc = await adminDb.collection('app_settings').doc('ai').get();
        if (doc.exists) {
            const data = doc.data();
            if (data?.gemini_api_key) return data.gemini_api_key;
        }
    } catch {
        // Firestore read failed — fall through to env
    }

    // 2. Fallback to env
    return process.env.GEMINI_API_KEY || null;
}

// ─── Save API key to Firestore ───
export async function saveApiKey(apiKey: string): Promise<void> {
    const { adminDb } = await import('@/lib/firebase/admin');
    await adminDb.collection('app_settings').doc('ai').set(
        { gemini_api_key: apiKey, updated_at: new Date().toISOString() },
        { merge: true }
    );
    // Invalidate cached client so next call uses new key
    _client = null;
    _cachedKey = null;
}

// ─── Remove API key from Firestore ───
export async function removeApiKey(): Promise<void> {
    const { adminDb } = await import('@/lib/firebase/admin');
    await adminDb.collection('app_settings').doc('ai').set(
        { gemini_api_key: '', updated_at: new Date().toISOString() },
        { merge: true }
    );
    _client = null;
    _cachedKey = null;
}

// ─── System prompt for CANERIS AI Brain ───
const SYSTEM_PROMPT = `You are CANERIS AI Brain, an operational intelligence assistant for a PMO ERP system.

Your job is to analyze Nota Dinas (ND) records, decisions, stakeholder data, and project graphs to provide actionable insights.

RULES:
1. Always respond in valid JSON matching this exact schema:
{
  "summary": "Brief executive summary of analysis",
  "risk_identified": ["list of identified risks"],
  "recommended_action": ["list of recommended actions"],
  "reasoning": "Detailed reasoning behind your analysis",
  "confidence_level": 0.0 to 1.0
}
2. Do NOT suggest database mutations — you are read-only.
3. Base confidence_level on how complete the provided context is.
4. If context is insufficient, set confidence_level < 0.5 and explain in reasoning.
5. Keep summary under 3 sentences.
6. Each recommended_action should be specific and actionable.
7. If no risks are identified, return an empty array — never fabricate risks.
`;

// ─── Generate structured AI response ───
export async function generateStructuredResponse(
    userContext: string,
    modelId: string = DEFAULT_MODEL
): Promise<AiResponse> {
    const apiKey = await resolveApiKey();
    if (!apiKey) {
        throw new Error('AI API key not configured. Add it via AI Brain settings or .env.local.');
    }

    const client = getClient(apiKey);

    const response = await client.models.generateContent({
        model: modelId,
        contents: userContext,
        config: {
            systemInstruction: SYSTEM_PROMPT,
            temperature: 0.3,
        },
    });

    const raw = response.text ?? '';

    return parseAiResponse(raw);
}

// ─── Parse & validate JSON from LLM output ───
function parseAiResponse(raw: string): AiResponse {
    let cleaned = raw.trim();
    if (cleaned.startsWith('```json')) {
        cleaned = cleaned.slice(7);
    } else if (cleaned.startsWith('```')) {
        cleaned = cleaned.slice(3);
    }
    if (cleaned.endsWith('```')) {
        cleaned = cleaned.slice(0, -3);
    }
    cleaned = cleaned.trim();

    let parsed: any;
    try {
        parsed = JSON.parse(cleaned);
    } catch {
        return {
            summary: cleaned.slice(0, 200),
            risk_identified: [],
            recommended_action: [],
            reasoning: 'AI returned non-structured output. Raw text was wrapped.',
            confidence_level: 0.2,
        };
    }

    return {
        summary: sanitize(parsed.summary ?? ''),
        risk_identified: Array.isArray(parsed.risk_identified)
            ? parsed.risk_identified.map(sanitize)
            : [],
        recommended_action: Array.isArray(parsed.recommended_action)
            ? parsed.recommended_action.map(sanitize)
            : [],
        reasoning: sanitize(parsed.reasoning ?? ''),
        confidence_level: clamp(Number(parsed.confidence_level) || 0, 0, 1),
    };
}

// ─── Sanitize string (strip HTML/scripts) ───
function sanitize(str: string): string {
    if (typeof str !== 'string') return '';
    return str
        .replace(/<script[^>]*>.*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .trim();
}

function clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
}

// ─── Health check ───
export async function isAiConfigured(): Promise<boolean> {
    const key = await resolveApiKey();
    return !!key;
}
