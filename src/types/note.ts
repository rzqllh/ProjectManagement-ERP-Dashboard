import { BaseEntity } from './base';

export interface Note extends BaseEntity {
    title: string;
    content_json: Record<string, any>; // Rich text content (e.g. TipTap JSON)
    tags: string[];
}

export interface NoteNdMap extends BaseEntity {
    note_id: string;
    nd_id: string;
}

export interface NoteProjectMap extends BaseEntity {
    note_id: string;
    project_id: string;
}
