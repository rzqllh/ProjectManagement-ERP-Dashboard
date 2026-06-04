import { BaseRepository } from './base.repository';
import { ProjectSection } from '@/types/project';

export class ProjectSectionRepository extends BaseRepository<ProjectSection> {
    constructor() {
        super('project_sections');
    }

    async findByProjectId(projectId: string): Promise<ProjectSection[]> {
        const sections = await this.findAll({ project_id: projectId });
        return sections.sort((a, b) => a.order - b.order);
    }

    async findByProjectAndSection(projectId: string, sectionName: string): Promise<ProjectSection | null> {
        const sections = await this.findAll({ project_id: projectId, section_name: sectionName });
        return sections[0] || null;
    }

    /**
     * Bulk create sections for a new project.
     * Uses batched writes for Firestore efficiency.
     */
    async createBatch(sections: Omit<ProjectSection, keyof import('@/types/base').BaseEntity>[]): Promise<ProjectSection[]> {
        const batch = this.db.batch();
        const now = new Date().toISOString();
        const created: ProjectSection[] = [];

        for (const section of sections) {
            const docRef = this.collection.doc();
            const record = {
                ...section,
                id: docRef.id,
                created_at: now,
                updated_at: now,
                soft_delete: false,
            } as ProjectSection;

            batch.set(docRef, record);
            created.push(record);
        }

        await batch.commit();
        return created;
    }

    /**
     * Delete all sections for a project (soft delete).
     */
    async softDeleteByProjectId(projectId: string): Promise<void> {
        const sections = await this.findByProjectId(projectId);
        const batch = this.db.batch();
        const now = new Date().toISOString();

        for (const section of sections) {
            const docRef = this.collection.doc(section.id);
            batch.update(docRef, {
                soft_delete: true,
                updated_at: now,
            } as any);
        }

        await batch.commit();
    }
}
