import { z } from 'zod';

export const createProjectSchema = z.object({
    name: z.string().min(3, 'Project name must be at least 3 characters'),
    description: z.string().min(1, 'Description is required'),
    category: z.enum(['migration', 'access', 'integration', 'infrastructure', 'expansion', 'other']),
    status: z.enum(['active', 'hold', 'completed', 'cancelled']).default('active'),
    priority: z.enum(['low', 'medium', 'high', 'critical']).default('medium'),
    risk_level: z.enum(['low', 'medium', 'high', 'critical']).default('low'),
    start_date: z.string().min(1, 'Start date is required'),
    target_date: z.string().min(1, 'Target date is required'),
    pic: z.string().min(1, 'PIC is required'),
    tags: z.array(z.string()).default([]),
});

export const updateProjectSchema = createProjectSchema.partial();

export const updateSectionSchema = z.object({
    status: z.enum(['not_started', 'in_progress', 'blocked', 'done']).optional(),
    pic: z.string().optional(),
    blocker: z.string().nullable().optional(),
    notes: z.string().optional(),
    related_nd_ids: z.array(z.string()).optional(),
});

export const projectFilterSchema = z.object({
    status: z.enum(['active', 'hold', 'completed', 'cancelled']).optional(),
    category: z.enum(['migration', 'access', 'integration', 'infrastructure', 'expansion', 'other']).optional(),
    priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
});
