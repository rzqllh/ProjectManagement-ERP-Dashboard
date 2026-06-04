import { NextRequest } from 'next/server';
import { successResponse, errorResponse } from '@/lib/api-response';
import { SettingsRepository } from '@/repositories/settings.repository';
import { SystemSettings } from '@/types/settings';

const settingsRepo = new SettingsRepository();

// GET /api/settings
export async function GET() {
    try {
        const settings = await settingsRepo.get();
        return successResponse(settings);
    } catch (error: any) {
        return errorResponse(error);
    }
}

// PATCH /api/settings
export async function PATCH(request: NextRequest) {
    try {
        const body = await request.json();
        const updated = await settingsRepo.update(body as Partial<SystemSettings>);
        return successResponse(updated);
    } catch (error: any) {
        return errorResponse(error);
    }
}
