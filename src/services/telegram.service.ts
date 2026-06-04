
import { telegramClient } from '@/lib/telegram-client';
import { NdRepository } from '@/repositories/nd.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { AiService } from '@/services/ai.service';
import { NdStatus } from '@/types/nd';

export class TelegramService {
    private ndRepo = new NdRepository();
    private projectRepo = new ProjectRepository();
    private aiService = new AiService();

    /**
     * Process incoming Telegram update
     */
    async processUpdate(update: any) {
        const message = update.message;
        if (!message || !message.text) return;

        const chatId = message.chat.id;
        const text = message.text.trim();
        const userId = message.from?.id;

        // Security check (redundant but safe)
        const isAllowed = await telegramClient.isWhitelisted(userId);
        if (!userId || !isAllowed) {
            console.warn(`Unauthorized Telegram access attempt from ${userId}`);
            return;
        }

        // Command routing
        if (text.startsWith('/')) {
            const [command, ...args] = text.split(' ');
            const argText = args.join(' ');

            try {
                switch (command) {
                    case '/start':
                        await this.handleStart(chatId);
                        break;
                    case '/morning':
                        await this.handleMorning(chatId);
                        break;
                    case '/nd_summary':
                        await this.handleNdSummary(chatId, argText);
                        break;
                    case '/project_status':
                        await this.handleProjectStatus(chatId);
                        break;
                    case '/decision_help':
                        await this.handleDecisionHelp(chatId, argText);
                        break;
                    case '/generate_report':
                        await this.handleReport(chatId);
                        break;
                    default:
                        await telegramClient.sendMessage(chatId, "Unknown command. Try /start for help.");
                }
            } catch (error) {
                console.error('Telegram Command Error:', error);
                await telegramClient.sendMessage(chatId, "⚠️ Error processing command.");
            }
        }
    }

    // ─── Handlers ───

    private async handleStart(chatId: number) {
        await telegramClient.sendMessage(chatId,
            `*CANERIS ERP Bot* 🤖\n\n` +
            `/morning - Daily briefing\n` +
            `/nd_summary <query> - Search ND\n` +
            `/project_status - Project health\n` +
            `/decision_help <context> - AI advise\n` +
            `/generate_report - Text report`
        );
    }

    private async handleMorning(chatId: number) {
        // Fetch high risk NDs (waiting_external + aging > 5 days) or just by escalation level
        // Simplified: Fetch all active NDs and filter in memory for now, or use repository method if exists
        const nds = await this.ndRepo.findAll();

        const escalated = nds.filter(n => n.escalation_level === 'escalated' && n.status !== 'clear');
        const atRisk = nds.filter(n => n.escalation_level === 'risk' && n.status !== 'clear');

        let msg = `🌅 *Morning Briefing*\n\n`;

        if (escalated.length > 0) {
            msg += `🚨 *ESCALATED (${escalated.length})*\n`;
            escalated.forEach(n => msg += `- [${n.nd_number}] ${n.title}\n`);
            msg += `\n`;
        }

        if (atRisk.length > 0) {
            msg += `⚠️ *AT RISK (${atRisk.length})*\n`;
            atRisk.forEach(n => msg += `- [${n.nd_number}] ${n.title}\n`);
            msg += `\n`;
        }

        if (escalated.length === 0 && atRisk.length === 0) {
            msg += `✅ All clear. No immediate risks detected.`;
        }

        await telegramClient.sendMessage(chatId, msg);
    }

    private async handleNdSummary(chatId: number, query: string) {
        if (!query) {
            await telegramClient.sendMessage(chatId, "Usage: /nd_summary <ND Number or Title>");
            return;
        }

        const nds = await this.ndRepo.findAll(); // Optimization: Create search method in Repo later
        const matches = nds.filter(n =>
            n.nd_number.toLowerCase().includes(query.toLowerCase()) ||
            n.title.toLowerCase().includes(query.toLowerCase())
        ).slice(0, 5);

        if (matches.length === 0) {
            await telegramClient.sendMessage(chatId, "No NDs found matching your query.");
            return;
        }

        for (const nd of matches) {
            await telegramClient.sendMessage(chatId,
                `📄 *${nd.nd_number}*\n` +
                `*Title:* ${nd.title}\n` +
                `*Status:* ${nd.status}\n` +
                `*Escalation:* ${nd.escalation_level || 'None'}\n` +
                `*Created:* ${new Date(nd.created_at).toLocaleDateString()}`
            );
        }
    }

    private async handleProjectStatus(chatId: number) {
        const projects = await this.projectRepo.findAll();
        // Since Schema 3B/4 didn't heavily modify project structure, we assume basic fields
        // Create simple summary

        const total = projects.length;
        // Mock status distribution if status field isn't standarized yet, otherwise use real data
        // Checking project type...
        // Assuming Project has 'status' field.

        // For now, list projects
        let msg = `📊 *Project Status*\n\nTotal Projects: ${total}\n\n`;
        projects.slice(0, 10).forEach(p => {
            msg += `🔹 ${p.name} \n`;
        });

        if (total > 10) msg += `\n...and ${total - 10} more.`;

        await telegramClient.sendMessage(chatId, msg);
    }

    private async handleDecisionHelp(chatId: number, context: string) {
        if (!context) {
            await telegramClient.sendMessage(chatId, "Usage: /decision_help <Problem Context>\nExample: /decision_help ND-123 is delayed due to vendor");
            return;
        }

        await telegramClient.sendMessage(chatId, "🤔 *AI is thinking...* analyzing impact & recommendations.");

        // Call AI Service
        const result = await this.aiService.query({
            query: `Analyze this situation and provide recommendation: ${context}`,
            scope_entity_type: 'decision' // Hint intent
        });

        if (!result.success || !result.data) {
            await telegramClient.sendMessage(chatId, "❌ AI failed to generate response.");
            return;
        }

        const ai = result.data;

        let msg = `🧠 *AI Analysis*\n\n`;
        msg += `*Summary:* ${ai.summary}\n\n`;

        if (ai.risk_identified && ai.risk_identified.length > 0) {
            msg += `⚠️ *Risks:*\n`;
            ai.risk_identified.forEach(r => msg += `- ${r}\n`);
            msg += `\n`;
        }

        if (ai.recommended_action && ai.recommended_action.length > 0) {
            msg += `✅ *Recommendations:*\n`;
            ai.recommended_action.forEach(a => msg += `- ${a}\n`);
        }

        msg += `\n_Confidence: ${Math.round(ai.confidence_level * 100)}%_`;

        await telegramClient.sendMessage(chatId, msg);
    }

    private async handleReport(chatId: number) {
        // Consolidated report
        await telegramClient.sendMessage(chatId, "📊 Generating report...");

        // Parallel fetch
        const [nds, projects] = await Promise.all([
            this.ndRepo.findAll(),
            this.projectRepo.findAll()
        ]);

        const activeNds = nds.filter(n => n.status !== 'clear');
        const escalated = nds.filter(n => n.escalation_level === 'escalated');

        const msg = `📑 *Daily Executive Report*\n` +
            `📅 ${new Date().toLocaleDateString()}\n\n` +
            `*ND Metrics*\n` +
            `• Active: ${activeNds.length}\n` +
            `• Escalated: ${escalated.length}\n` +
            `• Total: ${nds.length}\n\n` +
            `*Project Metrics*\n` +
            `• Active Projects: ${projects.length}\n\n` +
            `_System online & monitoring._`;

        await telegramClient.sendMessage(chatId, msg);
    }
}

export const telegramService = new TelegramService();
