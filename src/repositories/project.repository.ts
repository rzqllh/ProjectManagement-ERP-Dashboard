import { BaseRepository } from './base.repository';
import { Project } from '@/types/project';

export class ProjectRepository extends BaseRepository<Project> {
    constructor() {
        super('projects');
    }

    async findByStatus(status: string): Promise<Project[]> {
        return this.findAll({ status });
    }

    async findByCategory(category: string): Promise<Project[]> {
        return this.findAll({ category });
    }

    async findByPriority(priority: string): Promise<Project[]> {
        return this.findAll({ priority });
    }
}
