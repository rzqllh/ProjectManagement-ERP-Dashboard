'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { updateProfile } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { BentoGrid, BentoCard } from '@/components/ui/bento-grid';
import {
    Settings, User, Brain, Send, Globe, Eye, EyeOff,
    Loader2, CheckCircle2, AlertTriangle, ExternalLink,
    Save, Cloud, Palette, LayoutDashboard, FileText, Bell, Database
} from 'lucide-react';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';

const inputClass = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-caneris-cyan/50 focus:ring-1 focus:ring-caneris-cyan/20 transition-all font-mono";
const labelClass = "text-[10px] uppercase tracking-wider text-slate-500 mb-1.5 block font-semibold";
const selectClass = "w-full bg-black/20 border border-white/5 rounded-lg px-3 py-2 text-xs text-slate-300 focus:outline-none focus:border-caneris-cyan/50 focus:ring-1 focus:ring-caneris-cyan/20 transition-all font-mono appearance-none cursor-pointer";

function StatusBadge({ active, text }: { active: boolean; text: string }) {
    return (
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded text-[10px] font-medium border ${active
            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400'
            : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
            }`}>
            <div className={`w-1.5 h-1.5 rounded-full ${active ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            {text}
        </div>
    );
}

export default function SettingsPage() {
    // ═══ Profile State ═══
    const { user } = useAuth();
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [profileLoading, setProfileLoading] = useState(false);

    // ═══ System Settings State ═══
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SYSTEM_SETTINGS);
    const [settingsLoading, setSettingsLoading] = useState(true);
    const [settingsSaving, setSettingsSaving] = useState(false);

    // ═══ AI State ═══
    const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
    const [aiKeyInput, setAiKeyInput] = useState('');
    const [aiShowKey, setAiShowKey] = useState(false);
    const [aiSaving, setAiSaving] = useState(false);

    // ═══ Telegram State ═══
    const [tgToken, setTgToken] = useState('');
    const [tgWhitelist, setTgWhitelist] = useState('');
    const [tgShowToken, setTgShowToken] = useState(false);
    const [tgWebhookInfo, setTgWebhookInfo] = useState<any>(null);
    const [tgSaving, setTgSaving] = useState(false);
    const [tgSettingWebhook, setTgSettingWebhook] = useState(false);
    const [tgLoading, setTgLoading] = useState(true);

    // ═══ Load Data ═══
    useEffect(() => {
        if (user?.displayName) {
            const parts = user.displayName.split(' ');
            setFirstName(parts[0] || '');
            setLastName(parts.slice(1).join(' ') || '');
        }
        loadAiSettings();
        loadTelegramSettings();
        loadSystemSettings();
    }, [user]);

    const loadSystemSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await fetch('/api/settings');
            const json = await res.json();
            if (json.success && json.data) {
                setSettings(prev => ({ ...prev, ...json.data }));
            }
        } catch (error) {
            console.error('Failed to load settings:', error);
        } finally {
            setSettingsLoading(false);
        }
    };

    const loadAiSettings = async () => {
        try {
            const res = await fetch('/api/ai/settings');
            const json = await res.json();
            if (json.success) {
                setAiConfigured(json.data.configured);
            }
        } catch { setAiConfigured(false); }
    };

    const loadTelegramSettings = async () => {
        setTgLoading(true);
        try {
            const res = await fetch('/api/telegram/settings');
            const json = await res.json();
            if (json.success) {
                setTgToken(json.data.bot_token || '');
                setTgWhitelist(json.data.whitelist_ids ? json.data.whitelist_ids.join(', ') : '');
                setTgWebhookInfo(json.data.webhook_info?.result || json.data.webhook_info);
            }
        } catch { } finally { setTgLoading(false); }
    };

    // ═══ Handlers ═══
    const handleSaveProfile = async () => {
        if (!user) return;
        setProfileLoading(true);
        try {
            const displayName = `${firstName.trim()} ${lastName.trim()}`.trim();
            await updateProfile(user, { displayName });
        } catch (err) {
            console.error(err);
        } finally { setProfileLoading(false); }
    };

    const handleSaveSettings = async (partial: Partial<SystemSettings>) => {
        setSettingsSaving(true);
        try {
            const res = await fetch('/api/settings', {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(partial),
            });
            const json = await res.json();
            if (json.success) {
                setSettings(prev => ({ ...prev, ...json.data }));
            }
        } catch (error) {
            console.error('Failed to save settings:', error);
        } finally {
            setSettingsSaving(false);
        }
    };

    const handleSaveAiKey = async () => {
        if (!aiKeyInput.trim()) return;
        setAiSaving(true);
        try {
            await fetch('/api/ai/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ api_key: aiKeyInput.trim() }),
            });
            setAiKeyInput('');
            await loadAiSettings();
        } catch (err) { console.error(err); } finally { setAiSaving(false); }
    };

    const handleSaveTelegram = async () => {
        setTgSaving(true);
        try {
            const ids = tgWhitelist.split(',').map(s => s.trim()).filter(Boolean).map(Number);
            await fetch('/api/telegram/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ bot_token: tgToken.trim(), whitelist_ids: ids }),
            });
            await loadTelegramSettings();
        } catch (err) { console.error(err); } finally { setTgSaving(false); }
    };

    const handleSetWebhook = async () => {
        setTgSettingWebhook(true);
        try {
            const url = `${window.location.origin}/api/telegram/webhook`;
            await fetch('/api/telegram/setup', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url }),
            });
            await loadTelegramSettings();
        } catch (err) { console.error(err); } finally { setTgSettingWebhook(false); }
    };

    return (
        <div className="space-y-8 animate-fade-in-up pb-10 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-white/5 pb-6">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                        <div className="p-2 rounded-xl bg-caneris-cyan/10 border border-caneris-cyan/20">
                            <Settings className="w-5 h-5 text-caneris-cyan" />
                        </div>
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-400">
                            System Configuration
                        </span>
                    </h2>
                    <p className="text-sm text-slate-500 mt-2 ml-1">
                        Manage global parameters, integrations, and branding.
                    </p>
                </div>
                {settingsSaving && (
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-caneris-cyan/10 border border-caneris-cyan/20 text-xs text-caneris-cyan animate-pulse font-mono">
                        <Loader2 className="w-3 h-3 animate-spin" />
                        SAVING...
                    </div>
                )}
            </div>

            <BentoGrid>
                {/* ─── Row 1: Profile (2) + Health (1) ─── */}
                <BentoCard
                    className="md:col-span-2"
                    title={<span className="text-white">User Profile</span>}
                    description="Your digital identity and access credentials."
                    icon={<User className="w-4 h-4" />}
                >
                    <div className="flex items-start gap-6">
                        <div className="flex-shrink-0">
                            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-caneris-cyan/20 to-blue-600/20 border border-white/10 flex items-center justify-center text-caneris-cyan text-2xl font-bold shadow-2xl relative overflow-hidden group">
                                <span className="relative z-10">{firstName[0]}{lastName[0]}</span>
                                <div className="absolute inset-0 bg-caneris-cyan/10 blur-xl group-hover:bg-caneris-cyan/20 transition-colors" />
                            </div>
                        </div>
                        <div className="flex-grow space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className={labelClass}>First Name</label>
                                    <input
                                        value={firstName}
                                        onChange={e => setFirstName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className={labelClass}>Last Name</label>
                                    <input
                                        value={lastName}
                                        onChange={e => setLastName(e.target.value)}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                    {user?.email}
                                </div>
                                <Button
                                    onClick={handleSaveProfile}
                                    disabled={profileLoading}
                                    size="sm"
                                    className="bg-white/5 hover:bg-white/10 text-slate-200 border border-white/10 h-8 text-xs transition-all hover:border-caneris-cyan/30"
                                >
                                    {profileLoading ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Save className="w-3 h-3 mr-2" />}
                                    Save Profile
                                </Button>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-emerald-400">System Health</span>}
                    description="Real-time operational telemetry."
                    icon={<Cloud className="w-4 h-4 text-emerald-400" />}
                >
                    <div className="space-y-3 pt-2">
                        <div className="flex justify-between items-center p-2 rounded-lg bg-white/5 border border-white/5">
                            <span className="text-xs text-slate-400 font-mono">STATUS</span>
                            <div className="flex items-center gap-1.5 text-xs text-emerald-400 font-bold font-mono">
                                <CheckCircle2 className="w-3 h-3" />
                                OPERATIONAL
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                <div className="text-[10px] text-slate-500 mb-1">VERSION</div>
                                <div className="text-xs text-slate-200 font-mono">v1.2.0</div>
                            </div>
                            <div className="p-2 rounded-lg bg-black/20 border border-white/5">
                                <div className="text-[10px] text-slate-500 mb-1">REGION</div>
                                <div className="text-xs text-slate-200 font-mono">asia-se1</div>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* ─── Row 2: Appearance, Escalation, Dashboard ─── */}
                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-pink-400">Appearance</span>}
                    description="Visual branding & theming."
                    icon={<Palette className="w-4 h-4 text-pink-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="space-y-1">
                            <label className={labelClass}>Application Name</label>
                            <input
                                value={settings.app_name}
                                onChange={e => handleSaveSettings({ app_name: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Accent Color</label>
                            <div className="flex gap-2 items-center">
                                <div className="relative">
                                    <input
                                        type="color"
                                        value={settings.primary_color}
                                        onChange={e => handleSaveSettings({ primary_color: e.target.value })}
                                        className="h-9 w-12 rounded-lg bg-transparent border border-white/10 cursor-pointer overflow-hidden opacity-0 absolute inset-0 z-10"
                                    />
                                    <div className="h-9 w-12 rounded-lg border border-white/10 flex items-center justify-center" style={{ backgroundColor: settings.primary_color }} />
                                </div>
                                <input
                                    value={settings.primary_color}
                                    onChange={e => handleSaveSettings({ primary_color: e.target.value })}
                                    className={`${inputClass} flex-1 font-mono uppercase`}
                                />
                            </div>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-amber-400">Escalation Rules</span>}
                    description="Risk thresholds & triggers."
                    icon={<AlertTriangle className="w-4 h-4 text-amber-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className={labelClass}>Risk (Days)</label>
                                <input
                                    type="number"
                                    value={settings.escalation_risk_days}
                                    onChange={e => handleSaveSettings({ escalation_risk_days: parseInt(e.target.value) })}
                                    className={inputClass}
                                />
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Critical (Days)</label>
                                <input
                                    type="number"
                                    value={settings.escalation_critical_days}
                                    onChange={e => handleSaveSettings({ escalation_critical_days: parseInt(e.target.value) })}
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 cursor-pointer hover:border-amber-400/30 transition-colors"
                            onClick={() => handleSaveSettings({ escalation_auto_enabled: !settings.escalation_auto_enabled })}
                        >
                            <span className="text-xs text-slate-300 font-medium">Auto-Escalate</span>
                            <div className={`w-8 h-4 rounded-full transition-all relative ${settings.escalation_auto_enabled ? 'bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)]' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all transform ${settings.escalation_auto_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-purple-400">Dashboard</span>}
                    description="View preferences & telemetry."
                    icon={<LayoutDashboard className="w-4 h-4 text-purple-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="space-y-1">
                            <label className={labelClass}>Refresh Rate (Sec)</label>
                            <input
                                type="number"
                                value={settings.dashboard_refresh_interval}
                                onChange={e => handleSaveSettings({ dashboard_refresh_interval: parseInt(e.target.value) })}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Default View</label>
                            <div className="relative">
                                <select
                                    value={settings.dashboard_default_view}
                                    onChange={e => handleSaveSettings({ dashboard_default_view: e.target.value as any })}
                                    className={selectClass}
                                >
                                    <option value="overview">Overview</option>
                                    <option value="analytics">Analytics</option>
                                </select>
                            </div>
                        </div>
                    </div>
                </BentoCard>

                {/* ─── Row 3: ND, Notifications, Data ─── */}
                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-blue-400">ND Management</span>}
                    description="Document numbering configurations."
                    icon={<FileText className="w-4 h-4 text-blue-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="space-y-1">
                            <label className={labelClass}>Auto-Number Prefix</label>
                            <input
                                value={settings.nd_auto_number_prefix}
                                onChange={e => handleSaveSettings({ nd_auto_number_prefix: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Default Status</label>
                            <input
                                value={settings.nd_default_status}
                                onChange={e => handleSaveSettings({ nd_default_status: e.target.value })}
                                className={inputClass}
                            />
                        </div>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-indigo-400">Notifications</span>}
                    description="Alert channels & frequencies."
                    icon={<Bell className="w-4 h-4 text-indigo-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="flex items-center justify-between p-3 rounded-lg bg-black/20 border border-white/5 cursor-pointer hover:border-indigo-400/30 transition-colors"
                            onClick={() => handleSaveSettings({ notification_email_enabled: !settings.notification_email_enabled })}
                        >
                            <span className="text-xs text-slate-300 font-medium">Email Alerts</span>
                            <div className={`w-8 h-4 rounded-full transition-all relative ${settings.notification_email_enabled ? 'bg-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.5)]' : 'bg-slate-700'}`}>
                                <div className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all transform ${settings.notification_email_enabled ? 'translate-x-[18px]' : 'translate-x-0.5'}`} />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Digest Frequency</label>
                            <select
                                value={settings.notification_digest_frequency}
                                onChange={e => handleSaveSettings({ notification_digest_frequency: e.target.value as any })}
                                className={selectClass}
                            >
                                <option value="off">Off</option>
                                <option value="daily">Daily</option>
                                <option value="weekly">Weekly</option>
                            </select>
                        </div>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-orange-400">Data Lifecycle</span>}
                    description="Retention & export policies."
                    icon={<Database className="w-4 h-4 text-orange-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="space-y-1">
                            <label className={labelClass}>Retention (Days)</label>
                            <input
                                type="number"
                                value={settings.data_retention_days}
                                onChange={e => handleSaveSettings({ data_retention_days: parseInt(e.target.value) })}
                                className={inputClass}
                            />
                        </div>
                        <div className="space-y-1">
                            <label className={labelClass}>Export Format</label>
                            <select
                                value={settings.export_format}
                                onChange={e => handleSaveSettings({ export_format: e.target.value as any })}
                                className={selectClass}
                            >
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                            </select>
                        </div>
                    </div>
                </BentoCard>

                {/* ─── Row 4: AI (1) + Telegram (2) ─── */}
                <BentoCard
                    className="md:col-span-1"
                    title={<span className="text-violet-400">AI Brain</span>}
                    description="Gemini RAG configuration."
                    icon={<Brain className="w-4 h-4 text-violet-400" />}
                >
                    <div className="space-y-4 pt-1">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">API STATUS</span>
                            <StatusBadge active={!!aiConfigured} text={aiConfigured ? "ACTIVE" : "MISSING"} />
                        </div>
                        <div className="relative group">
                            <input
                                type={aiShowKey ? "text" : "password"}
                                placeholder="sk-..."
                                value={aiKeyInput}
                                onChange={e => setAiKeyInput(e.target.value)}
                                className={`${inputClass} pr-8`}
                            />
                            <button
                                onClick={() => setAiShowKey(!aiShowKey)}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                            >
                                {aiShowKey ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                            </button>
                        </div>
                        <Button
                            onClick={handleSaveAiKey}
                            disabled={aiSaving || !aiKeyInput}
                            className="w-full h-8 text-xs bg-violet-600/20 hover:bg-violet-600/40 text-violet-300 border border-violet-500/30 transition-all"
                        >
                            {aiSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Update Key"}
                        </Button>
                        <a href="https://aistudio.google.com/apikey" target="_blank" className="flex items-center justify-center gap-1.5 text-[10px] text-slate-500 hover:text-violet-400 transition-colors">
                            <ExternalLink className="w-3 h-3" /> Get Gemini API Key
                        </a>
                    </div>
                </BentoCard>

                <BentoCard
                    className="md:col-span-2"
                    title={<span className="text-sky-400">Telegram Bot</span>}
                    description="Mobile command & control center."
                    icon={<Send className="w-4 h-4 text-sky-400" />}
                >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-1">
                        <div className="space-y-4">
                            <div className="space-y-1">
                                <label className={labelClass}>Bot Token</label>
                                <div className="relative">
                                    <input
                                        type={tgShowToken ? "text" : "password"}
                                        placeholder="123456:ABC-..."
                                        value={tgToken}
                                        onChange={e => setTgToken(e.target.value)}
                                        className={`${inputClass} pr-8`}
                                    />
                                    <button
                                        onClick={() => setTgShowToken(!tgShowToken)}
                                        className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors"
                                    >
                                        {tgShowToken ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1">
                                <label className={labelClass}>Whitelist IDs</label>
                                <input
                                    placeholder="1234567, 8901234..."
                                    value={tgWhitelist}
                                    onChange={e => setTgWhitelist(e.target.value)}
                                    className={inputClass}
                                />
                                <p className="text-[10px] text-slate-600">Comma separated user IDs allowed to interact.</p>
                            </div>
                        </div>

                        <div className="flex flex-col justify-between space-y-4">
                            <div className="p-3 rounded-xl bg-black/30 border border-white/5 space-y-2">
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] text-slate-500 font-mono uppercase">WEBHOOK STATUS</span>
                                    <div className={`w-2 h-2 rounded-full ${tgWebhookInfo?.url ? 'bg-sky-400 shadow-[0_0_8px_rgba(56,189,248,0.5)]' : 'bg-red-500'}`} />
                                </div>
                                <div className="text-[10px] font-mono text-slate-300 truncate">
                                    {tgWebhookInfo?.url || 'No webhook set'}
                                </div>
                                <div className="text-[10px] text-slate-500 flex justify-between">
                                    <span>Pending: {tgWebhookInfo?.pending_update_count ?? 0}</span>
                                </div>
                            </div>
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleSetWebhook}
                                    disabled={tgSettingWebhook || !tgToken}
                                    variant="outline"
                                    className="flex-1 h-9 text-xs border-white/10 text-slate-300 hover:text-white hover:bg-white/5 hover:border-sky-500/30 transition-all font-mono"
                                >
                                    {tgSettingWebhook ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : <Globe className="w-3 h-3 mr-2" />}
                                    SET HOOK
                                </Button>
                                <Button
                                    onClick={handleSaveTelegram}
                                    disabled={tgSaving}
                                    className="flex-1 h-9 text-xs bg-sky-600 hover:bg-sky-500 text-white shadow-lg shadow-sky-900/20 font-mono tracking-wide"
                                >
                                    {tgSaving ? <Loader2 className="w-3 h-3 animate-spin mr-2" /> : "SAVE"}
                                </Button>
                            </div>
                        </div>
                    </div>
                </BentoCard>
            </BentoGrid>
        </div>
    );
}
