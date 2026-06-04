
/**
 * Telegram Client Wrapper
 * Handles secure communication with Telegram Bot API
 * Supports configuration via Firestore (primary) or Env (fallback)
 */

export interface TelegramUser {
    id: number;
    is_bot: boolean;
    first_name: string;
    username?: string;
}

export interface TelegramChat {
    id: number;
    type: 'private' | 'group' | 'supergroup' | 'channel';
}

export interface TelegramMessage {
    message_id: number;
    from?: TelegramUser;
    chat: TelegramChat;
    date: number;
    text?: string;
}

export interface TelegramUpdate {
    update_id: number;
    message?: TelegramMessage;
}

export class TelegramClient {
    private cachedConfig: { token: string; whitelist: number[] } | null = null;

    constructor() { }

    /**
     * Resolve configuration from Firestore first, then Env
     */
    private async getConfig() {
        if (this.cachedConfig) return this.cachedConfig;

        let token = process.env.TELEGRAM_BOT_TOKEN || '';
        let whitelist: number[] = [];

        // 1. Try Firestore
        try {
            // Dynamic import to avoid build-time issues if admin not init
            const { adminDb } = await import('@/lib/firebase/admin');
            const doc = await adminDb.collection('app_settings').doc('telegram').get();
            if (doc.exists) {
                const data = doc.data();
                if (data?.bot_token) token = data.bot_token;
                if (data?.whitelist_ids && Array.isArray(data.whitelist_ids)) {
                    whitelist = data.whitelist_ids;
                }
            }
        } catch (e) {
            console.error('Telegram Config: Firestore read failed', e);
        }

        // 2. Fallback to Env if not in Firestore (or merge?)
        // Strategy: If Firestore has token, use Firestore whitelist. 
        // If Firestore missing token, use Env token and Env whitelist.
        // But above logic overwrites token/whitelist if found, defaults to env vars if initialized differently? 
        // Let's stick to: Env is default, Firestore overrides if present.

        if (!token) {
            // Fallback to env default if Firestore didn't provide
            token = process.env.TELEGRAM_BOT_TOKEN || '';
        }

        if (whitelist.length === 0) {
            const raw = process.env.TELEGRAM_WHITELIST_IDS;
            if (raw) {
                try {
                    whitelist = JSON.parse(raw);
                } catch { }
            }
        }

        this.cachedConfig = { token, whitelist };
        return this.cachedConfig;
    }

    /**
     * Force reload config (e.g. after settings update)
     */
    invalidateConfig() {
        this.cachedConfig = null;
    }

    /**
     * Get Bot Info (Test Token)
     */
    async getMe(): Promise<any> {
        const { token } = await this.getConfig();
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

        const res = await fetch(`https://api.telegram.org/bot${token}/getMe`);
        if (!res.ok) throw new Error(`Telegram API Error: ${res.statusText}`);
        return res.json();
    }

    /**
     * Check if user is allowed to interact with the bot
     */
    async isWhitelisted(userId: number): Promise<boolean> {
        const { whitelist } = await this.getConfig();
        if (whitelist.length === 0) return false;
        return whitelist.includes(userId);
    }

    /**
     * Send message to a chat
     */
    async sendMessage(chatId: number, text: string, parseMode: 'Markdown' | 'HTML' = 'Markdown'): Promise<void> {
        const { token } = await this.getConfig();
        if (!token) return;

        try {
            const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    chat_id: chatId,
                    text: text,
                    parse_mode: parseMode,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                console.error('Telegram Send Error:', err);
            }
        } catch (error) {
            console.error('Telegram Network Error:', error);
        }
    }

    /**
     * Set Webhook URL
     */
    async setWebhook(url: string, secretToken?: string): Promise<boolean> {
        const { token } = await this.getConfig();
        if (!token) throw new Error('TELEGRAM_BOT_TOKEN not configured');

        const params: any = { url };
        if (secretToken) params.secret_token = secretToken;

        const res = await fetch(`https://api.telegram.org/bot${token}/setWebhook`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params),
        });

        const json = await res.json();
        return json.ok;
    }

    /**
     * Get Webhook Info
     */
    async getWebhookInfo(): Promise<any> {
        const { token } = await this.getConfig();
        if (!token) return null;

        const res = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
        return res.json();
    }
}

export const telegramClient = new TelegramClient();
