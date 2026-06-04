import { BaseEntity } from './base';

export type ProjectStatus = 'active' | 'hold' | 'completed' | 'cancelled';
export type ProjectCategory = string; // Free-text
export type ProjectPriority = 'low' | 'medium' | 'high' | 'critical';
export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface PicEntry {
    name: string;
    unit: string;
}

export interface Project extends BaseEntity {
    name: string;
    description: string;
    category: ProjectCategory;
    status: ProjectStatus;
    priority: ProjectPriority;
    risk_level: RiskLevel;
    start_date: string | null;  // ISO timestamp
    target_date: string | null; // ISO timestamp
    progress: number;    // 0-100, computed from section statuses
    pic: PicEntry[];     // Array of {name, unit} objects
    tags: string[];
    deleted_at?: string | null;
}

export const SECTION_NAMES = [
    'Business Clearance',
    'Technical Guidance',
    'Order Issuance',
    'SARPEN',
    'Integration',
    'Migration',
    'Escalation',
] as const;

export type SectionName = (typeof SECTION_NAMES)[number];

export type SectionStatus = 'not_started' | 'in_progress' | 'blocked' | 'done';

export interface ProjectSection extends BaseEntity {
    project_id: string;
    section_name: SectionName;
    status: SectionStatus;
    pic: string;
    blocker: string | null;
    notes: string;
    related_nd_ids: string[];
    order: number;       // 0-6, display order
    last_update: string; // ISO timestamp
}

// DTOs
export type CreateProjectInput = Omit<Project, keyof BaseEntity | 'progress' | 'deleted_at'>;
export type UpdateProjectInput = Partial<CreateProjectInput>;

export type UpdateSectionInput = Partial<Pick<ProjectSection, 'status' | 'pic' | 'blocker' | 'notes' | 'related_nd_ids'>>;

// View models
export interface ProjectWithSections extends Project {
    sections: ProjectSection[];
}

export interface ProjectListItem extends Project {
    section_summary: {
        total: number;
        done: number;
        blocked: number;
        in_progress: number;
    };
}
