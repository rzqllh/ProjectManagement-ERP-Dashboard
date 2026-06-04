export interface BaseEntity {
    id: string;
    created_at: string; // ISO 8601 string
    updated_at: string; // ISO 8601 string
    soft_delete: boolean;
}
