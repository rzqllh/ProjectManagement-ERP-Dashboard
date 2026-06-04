
import { successResponse, errorResponse } from '@/lib/api-response';
import { NdRepository } from '@/repositories/nd.repository';
import { ProjectRepository } from '@/repositories/project.repository';
import { DecisionRepository } from '@/repositories/decision.repository';
import { AppError } from '@/lib/errors';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const ndRepo = new NdRepository();
        const projectRepo = new ProjectRepository();
        const decisionRepo = new DecisionRepository();

        // 1. ESCALATIONS (Red Zone)
        // Fetch High Risk & Escalated NDs
        const [riskNds, escalatedNds] = await Promise.all([
            ndRepo.findByEscalationStatus('risk'),
            ndRepo.findByEscalationStatus('escalated')
        ]);

        // Combine and dedup (in case status overlap, though unlikely)
        const escalationMap = new Map();
        [...riskNds, ...escalatedNds].forEach(nd => escalationMap.set(nd.id, nd));
        const escalations = Array.from(escalationMap.values());


        // 2. BOTTLENECKS (Red Zone)
        // Definition: 
        // ND: status = 'waiting_external' AND created > 5 days ago (simple heuristic for now)
        // Project: status = 'active' (we'll filter for stuck phases in frontend or advanced query later)

        // For NDs, we use findAll and filter in memory for now as complex date query might need composite index
        const allActiveNds = await ndRepo.findAll({ soft_delete: false });
        const fiveDaysAgo = new Date();
        fiveDaysAgo.setDate(fiveDaysAgo.getDate() - 5);

        const stuckNds = allActiveNds.filter(nd =>
            nd.status === 'waiting_external' &&
            new Date(nd.created_at) < fiveDaysAgo
        ).map(nd => ({
            id: nd.id,
            type: 'ND' as const,
            identifier: nd.nd_number,
            status: 'Waiting External',
            days_stuck: Math.floor((Date.now() - new Date(nd.created_at).getTime()) / (1000 * 60 * 60 * 24))
        }));

        // For Projects, finding "stuck" ones is harder without detailed logs.
        // For now, let's just grab active projects that haven't been updated in 7 days
        // This requires 'updated_at' check.
        const allProjects = await projectRepo.findAll();
        const stuckProjects = allProjects.filter(p => {
            const lastUpdate = new Date(p.updated_at);
            const isStale = (Date.now() - lastUpdate.getTime()) > (7 * 24 * 60 * 60 * 1000);
            return p.status === 'active' && isStale;
        }).map(p => ({
            id: p.id,
            type: 'PROJECT' as const,
            identifier: p.name, // Use name as identifier
            status: 'Stagnant',
            days_stuck: Math.floor((Date.now() - new Date(p.updated_at).getTime()) / (1000 * 60 * 60 * 24))
        }));

        const bottlenecks = [...stuckNds, ...stuckProjects].slice(0, 10); // Limit


        // 3. APPROVALS (Red Zone)
        // Decisions with status = 'pending' (conceptually, or 'draft')
        // Assuming 'pending' is a valid status or we use 'draft'
        const pendingDecisions = (await decisionRepo.findAll())
            .filter(d => d.status === 'draft' || d.status === 'proposed') // Check actual types
            .slice(0, 5);


        // 4. PROJECTS (Performance Zone)
        const activeProjects = allProjects.filter(p => p.status !== 'cancelled' && p.status !== 'completed');


        // 5. VELOCITY (Performance Zone)
        // Decisions created in last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

        const recentDecisions = (await decisionRepo.findAll())
            .filter(d => new Date(d.created_at) >= sevenDaysAgo);

        // Group by day of week
        const velocityMap = new Map<string, number>();
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

        // Init last 7 days keys
        for (let i = 6; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            velocityMap.set(days[d.getDay()], 0);
        }

        recentDecisions.forEach(d => {
            const day = days[new Date(d.created_at).getDay()];
            velocityMap.set(day, (velocityMap.get(day) || 0) + 1);
        });

        const velocity = Array.from(velocityMap.entries()).map(([date, count]) => ({ date, count }));


        return successResponse({
            escalations,
            bottlenecks,
            approvals: pendingDecisions,
            projects: activeProjects,
            velocity
        });

    } catch (error) {
        console.error('[DashboardStats] Error:', error);
        return errorResponse(new AppError('Failed to fetch dashboard stats', 500));
    }
}
