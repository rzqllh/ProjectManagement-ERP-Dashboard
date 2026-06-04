
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { TelegramClient } from '@/lib/telegram-client';
import { AppError } from '@/lib/errors';
import { adminDb } from '@/lib/firebase/admin';

/**
 * GET Telegram Settings
 */
export async function GET() {
    try {
        // Only admin should see settings (if auth is enforced)
        // const admin = await isAdmin(); if (!admin) throw new AppError('Unauthorized', 403);

        const doc = await adminDb.collection('app_settings').doc('telegram').get();
        const data = doc.data() || {};

        // Return config but mask token partially for security? 
        // For editing, user needs to see current state. 
        // Let's return full token if admin, or masked. 
        // For simplicity in this internal tool, return value so it can be edited.

        return successResponse({
            bot_token: data.bot_token || '',
            whitelist_ids: data.whitelist_ids || [],
            // Also return current webhook info
            webhook_info: await (async () => {
                try {
                    return await new TelegramClient().getWebhookInfo();
                } catch {
                    return null;
                }
            })()
        });
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * SAVE or UPDATE Telegram Settings
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { bot_token, whitelist_ids } = body; // whitelist_ids should be array of numbers

        // Validate
        if (bot_token && typeof bot_token !== 'string') {
            throw new AppError('Invalid token format', 400);
        }
        if (whitelist_ids && (!Array.isArray(whitelist_ids) || whitelist_ids.some((id: any) => typeof id !== 'number'))) {
            throw new AppError('Whitelist IDs must be an array of numbers', 400);
        }

        // Save to Firestore
        await adminDb.collection('app_settings').doc('telegram').set({
            bot_token,
            whitelist_ids,
            updated_at: new Date().toISOString()
        }, { merge: true });

        // Invalidate client cache
        const client = new TelegramClient();
        client.invalidateConfig();

        return successResponse({ success: true });
    } catch (error) {
        return errorResponse(error);
    }
}
