import { adminDb } from '@/lib/firebase/admin';
import { SystemSettings, DEFAULT_SYSTEM_SETTINGS } from '@/types/settings';

export class SettingsRepository {
    private docRef = adminDb.collection('system_settings').doc('global');

    async get(): Promise<SystemSettings> {
        const doc = await this.docRef.get();
        if (!doc.exists) {
            // Initialize with defaults if missing
            await this.docRef.set(DEFAULT_SYSTEM_SETTINGS);
            return DEFAULT_SYSTEM_SETTINGS;
        }
        return { ...DEFAULT_SYSTEM_SETTINGS, ...doc.data() } as SystemSettings;
    }

    async update(partial: Partial<SystemSettings>): Promise<SystemSettings> {
        await this.docRef.set(partial, { merge: true });
        return this.get();
    }
}
