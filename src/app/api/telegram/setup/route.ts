
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { TelegramClient } from '@/lib/telegram-client';
import { ValidationError } from '@/lib/errors';

/**
 * Configure Telegram Webhook
 * POST body: { url: string, secret_token?: string }
 * Auth: relies on dashboard-level auth (user must be logged in)
 */
export async function POST(req: NextRequest) {
    try {
        const body = await req.json();
        const { url, secret_token } = body;

        if (!url) {
            throw new ValidationError('Webhook URL is required');
        }

        const client = new TelegramClient();
        const success = await client.setWebhook(url, secret_token);

        return successResponse({ success, url });
    } catch (error) {
        return errorResponse(error);
    }
}

/**
 * Get Webhook Info
 */
export async function GET() {
    try {
        const client = new TelegramClient();
        const info = await client.getWebhookInfo();
        return successResponse(info);
    } catch (error) {
        return errorResponse(error);
    }
}
