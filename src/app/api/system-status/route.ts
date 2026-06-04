import { successResponse, errorResponse } from '@/lib/api-response';
import { AppError } from '@/lib/errors';
import { adminDb } from '@/lib/firebase/admin';

export async function GET() {
    const status: Record<string, { status: string; latency?: number; message?: string }> = {};

    // Check Firestore connectivity
    try {
        const start = Date.now();
        // Dynamic import to avoid initializing admin SDK at module level
        const { adminDb } = await import('@/lib/firebase/admin');
        // Attempt a lightweight read to verify connectivity
        await adminDb.collection('sys_health').doc('ping').get();
        status['firestore'] = { status: 'online', latency: Date.now() - start };
    } catch (err: any) {
        console.error('[SystemStatus] Firestore Error:', err);
        status['firestore'] = {
            status: 'error',
            message: err.message || 'Unknown Firestore error'
        };
    }

    // Check Auth connectivity
    try {
        const start = Date.now();
        const { adminAuth } = await import('@/lib/firebase/admin');
        // Lightweight auth check — list 1 user
        await adminAuth.listUsers(1);
        status['auth'] = { status: 'online', latency: Date.now() - start };
    } catch (err: any) {
        console.error('[SystemStatus] Auth Error:', err);
        status['auth'] = {
            status: 'error',
            message: err.message || 'Unknown Auth error'
        };
    }

    // AI Brain
    try {
        const startAI = Date.now();
        const { AiService } = await import('@/services/ai.service');
        const aiService = new AiService();
        const health = await aiService.healthCheck();
        status['ai_brain'] = {
            status: health.configured ? 'online' : 'not_connected',
            latency: Date.now() - startAI
        };
    } catch (err: any) {
        console.error('[SystemStatus] AI Error:', err);
        status['ai_brain'] = { status: 'error', message: err.message };
    }

    // Telegram
    try {
        const startTg = Date.now();
        const doc = await adminDb.collection('app_settings').doc('telegram').get();
        const data = doc.data();
        if (data?.bot_token) {
            const { TelegramClient } = await import('@/lib/telegram-client');
            const client = new TelegramClient();
            await client.getMe();
            status['telegram'] = { status: 'online', latency: Date.now() - startTg };
        } else {
            status['telegram'] = { status: 'not_connected' };
        }
    } catch (err: any) {
        console.error('[SystemStatus] Telegram Error:', err);
        status['telegram'] = { status: 'error', message: err.message };
    }

    // Escalation Engine — no scheduled job yet
    status['escalation'] = { status: 'not_connected' };

    try {
        return successResponse({
            timestamp: new Date().toISOString(),
            services: status,
        });
    } catch (err) {
        return errorResponse(new AppError('Health check failed', 500));
    }
}
