import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { TimelineRepository } from '@/repositories/timeline.repository';

const timelineRepo = new TimelineRepository();

// GET /api/timeline/recent
export async function GET(request: NextRequest) {
    try {
        // We need to fetch all events and sort, or use a composite index if available.
        // For now, let's fetch all (assuming volume is manageable for MVP) or limit if possible.
        // Ideally: timelineRepo.findAll({ limit: 10, orderBy: 'event_date desc' })
        // BaseRepo findAll doesn't support generic sort yet, implemented simply here.

        const allEvents = await timelineRepo.findAll();

        // Manual sort desc
        const sorted = allEvents.sort((a, b) =>
            new Date(b.event_date).getTime() - new Date(a.event_date).getTime()
        );

        return successResponse(sorted.slice(0, 10));
    } catch (error) {
        return errorResponse(error);
    }
}
