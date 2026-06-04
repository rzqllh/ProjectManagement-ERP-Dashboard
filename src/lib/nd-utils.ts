import { NdeRecord } from "@/types/nd";

export function getAge(created_at: string): { label: string; days: number } {
    const diff = Date.now() - new Date(created_at).getTime();
    const days = Math.floor(diff / 86400000);
    return { label: `${days}d`, days };
}

export function getEscalationStatus(nd: NdeRecord): { level: 'none' | 'risk' | 'escalated'; label?: string } {
    if (nd.status === 'escalated') return { level: 'escalated', label: 'ESCALATED' };

    // Check waiting duration
    // Note: In real app, we should check status_changed_at date. 
    // Fallback to updated_at if specifically in waiting state, or just based on age for now if simple.
    // Let's use Updated At as proxy for "last status change" for now, or created_at for age.
    // User requested "waiting external > 5 days". 
    // Since we don't track `status_changed_at` on root yet (it is in timeline), 
    // let's loosely use `updated_at` if status is waiting_external.

    if (nd.status === 'waiting_external') {
        const diff = Date.now() - new Date(nd.updated_at).getTime();
        const days = Math.floor(diff / 86400000);

        if (days > 10) return { level: 'escalated', label: `Stuck ${days}d` };
        if (days > 5) return { level: 'risk', label: `Slow ${days}d` };
    }

    // Also check generic age for drafting
    if (nd.status === 'drafting') {
        const age = getAge(nd.created_at).days;
        if (age > 7) return { level: 'risk', label: `Stagnant ${age}d` };
    }

    return { level: 'none' };
}

export function getDeadlineInfo(deadline: string | null): { label: string; urgent: boolean } {
    if (!deadline) return { label: 'No deadline', urgent: false };
    const diff = new Date(deadline).getTime() - Date.now();
    const days = Math.ceil(diff / 86400000);
    if (days < 0) return { label: `${Math.abs(days)}d overdue`, urgent: true };
    if (days === 0) return { label: 'Due today', urgent: true };
    if (days <= 3) return { label: `${days}d left`, urgent: true };
    return { label: new Date(deadline).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }), urgent: false };
}

export function getActionProgress(nextAction: string): { done: number; total: number } {
    const lines = nextAction.split('\n').filter(l => l.trim());
    const done = lines.filter(l => l.trim().startsWith('[x]')).length;
    return { done, total: lines.length };
}

export function getRelativeTime(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    return `${days}d ago`;
}
