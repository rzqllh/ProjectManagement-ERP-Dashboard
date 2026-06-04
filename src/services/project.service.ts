import {
    Project,
    ProjectSection,
    ProjectWithSections,
    ProjectListItem,
    CreateProjectInput,
    UpdateProjectInput,
    UpdateSectionInput,
    SECTION_NAMES,
    SectionStatus,
} from '@/types/project';
import { ProjectRepository } from '@/repositories/project.repository';
import { ProjectSectionRepository } from '@/repositories/project-section.repository';
import { TimelineRepository } from '@/repositories/timeline.repository';
import { ServiceResult, NotFoundError, ValidationError } from '@/lib/service-result';
import { TimelineEventType, TimelineRelatedType } from '@/types/timeline';

export class ProjectService {
    private projectRepo = new ProjectRepository();
    private sectionRepo = new ProjectSectionRepository();
    private timelineRepo = new TimelineRepository();

    private success<T>(data: T): ServiceResult<T> {
        return { success: true, data };
    }

    private error(error: any): ServiceResult<any> {
        return { success: false, error };
    }

    // ─── Compute Progress ────────────────────────────────────────────

    private computeProgress(sections: ProjectSection[]): number {
        if (sections.length === 0) return 0;
        const doneCount = sections.filter(s => s.status === 'done').length;
        return Math.round((doneCount / sections.length) * 100);
    }

    // ─── Create Project ──────────────────────────────────────────────

    async createProject(input: CreateProjectInput, userId: string = 'system'): Promise<ServiceResult<ProjectWithSections>> {
        try {
            // Create project record
            const project = await this.projectRepo.create({
                ...input,
                progress: 0,
            } as any);

            // Auto-create all 7 sections
            const sectionInputs = SECTION_NAMES.map((name, index) => ({
                project_id: project.id,
                section_name: name,
                status: 'not_started' as SectionStatus,
                pic: '',
                blocker: null,
                notes: '',
                related_nd_ids: [],
                order: index,
                last_update: new Date().toISOString(),
            }));

            const sections = await this.sectionRepo.createBatch(sectionInputs);

            // Log timeline event
            await this.timelineRepo.create({
                entity_id: project.id,
                entity_type: 'project' as TimelineRelatedType,
                related_type: 'project' as TimelineRelatedType,
                related_id: project.id,
                event_date: new Date().toISOString(),
                event_type: 'status_change' as TimelineEventType,
                description: `Project "${project.name}" created`,
                actor_id: userId,
                actor_type: 'user',
                severity: 'info',
                metadata: { category: project.category, priority: project.priority },
            });

            return this.success({ ...project, sections });
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Get Project with Sections ───────────────────────────────────

    async getProject(id: string): Promise<ServiceResult<ProjectWithSections>> {
        try {
            const project = await this.projectRepo.findById(id);
            if (!project) throw new NotFoundError(`Project with ID ${id}`);

            const sections = await this.sectionRepo.findByProjectId(id);

            return this.success({ ...project, sections });
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── List Projects ───────────────────────────────────────────────

    async listProjects(filters?: Record<string, any>): Promise<ServiceResult<ProjectListItem[]>> {
        try {
            const projects = await this.projectRepo.findAll(filters);

            // Fetch section summaries for each project
            const items: ProjectListItem[] = await Promise.all(
                projects.map(async (proj) => {
                    const sections = await this.sectionRepo.findByProjectId(proj.id);
                    const summary = {
                        total: sections.length,
                        done: sections.filter(s => s.status === 'done').length,
                        blocked: sections.filter(s => s.status === 'blocked').length,
                        in_progress: sections.filter(s => s.status === 'in_progress').length,
                    };

                    return {
                        ...proj,
                        progress: this.computeProgress(sections),
                        section_summary: summary,
                    };
                })
            );

            // Sort: active first, then by priority
            const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
            items.sort((a, b) => {
                if (a.status === 'active' && b.status !== 'active') return -1;
                if (a.status !== 'active' && b.status === 'active') return 1;
                return (priorityOrder[a.priority] ?? 2) - (priorityOrder[b.priority] ?? 2);
            });

            return this.success(items);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Update Project ──────────────────────────────────────────────

    async updateProject(id: string, input: UpdateProjectInput, userId: string = 'system'): Promise<ServiceResult<Project>> {
        try {
            const existing = await this.projectRepo.findById(id);
            if (!existing) throw new NotFoundError(`Project with ID ${id}`);

            const updated = await this.projectRepo.update(id, input as any);

            // Log status change if applicable
            if (input.status && input.status !== existing.status) {
                await this.timelineRepo.create({
                    entity_id: id,
                    entity_type: 'project' as TimelineRelatedType,
                    related_type: 'project' as TimelineRelatedType,
                    related_id: id,
                    event_date: new Date().toISOString(),
                    event_type: 'status_change' as TimelineEventType,
                    description: `Project status changed from "${existing.status}" to "${input.status}"`,
                    actor_id: userId,
                    actor_type: 'user',
                    severity: input.status === 'cancelled' ? 'warning' : 'info',
                    metadata: { old_status: existing.status, new_status: input.status },
                });
            }

            return this.success(updated);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Delete Project ──────────────────────────────────────────────

    async deleteProject(id: string, userId: string = 'system'): Promise<ServiceResult<void>> {
        try {
            const existing = await this.projectRepo.findById(id);
            if (!existing) throw new NotFoundError(`Project with ID ${id}`);

            // Soft delete project and all sections
            await this.projectRepo.softDelete(id);
            await this.sectionRepo.softDeleteByProjectId(id);

            await this.timelineRepo.create({
                entity_id: id,
                entity_type: 'project' as TimelineRelatedType,
                related_type: 'project' as TimelineRelatedType,
                related_id: id,
                event_date: new Date().toISOString(),
                event_type: 'note_added' as TimelineEventType,
                description: `Project "${existing.name}" deleted`,
                actor_id: userId,
                actor_type: 'user',
                severity: 'warning',
                metadata: {},
            });

            return this.success(undefined);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Update Section ──────────────────────────────────────────────

    async updateSection(
        projectId: string,
        sectionId: string,
        input: UpdateSectionInput,
        userId: string = 'system'
    ): Promise<ServiceResult<ProjectSection>> {
        try {
            const project = await this.projectRepo.findById(projectId);
            if (!project) throw new NotFoundError(`Project with ID ${projectId}`);

            const section = await this.sectionRepo.findById(sectionId);
            if (!section || section.project_id !== projectId) {
                throw new NotFoundError(`Section with ID ${sectionId} in project ${projectId}`);
            }

            const updateData: any = {
                ...input,
                last_update: new Date().toISOString(),
            };

            const updated = await this.sectionRepo.update(sectionId, updateData);

            // Log section status changes
            if (input.status && input.status !== section.status) {
                await this.timelineRepo.create({
                    entity_id: projectId,
                    entity_type: 'project' as TimelineRelatedType,
                    related_type: 'project' as TimelineRelatedType,
                    related_id: project.id,
                    event_date: new Date().toISOString(),
                    event_type: 'status_change' as TimelineEventType,
                    description: `Section "${section.section_name}" status changed from "${section.status}" to "${input.status}"`,
                    actor_id: userId,
                    actor_type: 'user',
                    severity: input.status === 'blocked' ? 'warning' : 'info',
                    metadata: {
                        section_name: section.section_name,
                        old_status: section.status,
                        new_status: input.status,
                    },
                });
            }

            // Recompute project progress
            const allSections = await this.sectionRepo.findByProjectId(projectId);
            const progress = this.computeProgress(allSections);
            await this.projectRepo.update(projectId, { progress } as any);

            return this.success(updated);
        } catch (err) {
            return this.error(err);
        }
    }

    // ─── Get Project Stats (for Dashboard) ───────────────────────────

    async getStats(): Promise<ServiceResult<any>> {
        try {
            const projects = await this.projectRepo.findAll();
            const stats = {
                total: projects.length,
                active: projects.filter(p => p.status === 'active').length,
                hold: projects.filter(p => p.status === 'hold').length,
                completed: projects.filter(p => p.status === 'completed').length,
                by_category: {} as Record<string, number>,
                by_priority: {} as Record<string, number>,
            };

            for (const p of projects) {
                stats.by_category[p.category] = (stats.by_category[p.category] || 0) + 1;
                stats.by_priority[p.priority] = (stats.by_priority[p.priority] || 0) + 1;
            }

            return this.success(stats);
        } catch (err) {
            return this.error(err);
        }
    }
}
