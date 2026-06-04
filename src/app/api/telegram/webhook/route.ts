
import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { telegramService } from '@/services/telegram.service';
import { ValidationError } from '@/lib/errors';

export async function POST(req: NextRequest) {
    try {
        // Optional: Verify secret token if configured (x-telegram-bot-api-secret-token)
        // For now, relying on Whitelist ID check inside service/client which is robust enough for this scope

        const update = await req.json();

        // Process asynchronously to return 200 OK quickly to Telegram
        // In serverless/Edge, we might need `waitUntil` or similar, but for standard Next.js API route:
        // Await here to ensure processing completes before lambda freezes/terminates
        await telegramService.processUpdate(update);

        return successResponse({ received: true });
    } catch (error) {
        console.error('Webhook Error:', error);
        // Always return 200 to Telegram to prevent retry loops on bad payloads
        return successResponse({ received: true, error: 'Processing failed' });
    }
}
