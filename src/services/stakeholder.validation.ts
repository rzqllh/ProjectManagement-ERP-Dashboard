import { z } from 'zod';

export const createStakeholderSchema = z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    organization: z.string().min(2, 'Organization is required'),
    role: z.string().min(2, 'Role is required'),
    email: z.string().email('Valid email required'),
    phone: z.string().min(5, 'Phone number is required'),
    category: z.enum(['internal', 'external', 'regulator', 'vendor']),
    influence_level: z.enum(['low', 'medium', 'high', 'executive']).optional(),
    notes: z.string().optional(),
});

export const updateStakeholderSchema = z.object({
    name: z.string().min(2).optional(),
    organization: z.string().min(2).optional(),
    role: z.string().min(2).optional(),
    email: z.string().email().optional(),
    phone: z.string().min(5).optional(),
    category: z.enum(['internal', 'external', 'regulator', 'vendor']).optional(),
    influence_level: z.enum(['low', 'medium', 'high', 'executive']).optional(),
    notes: z.string().optional(),
});

export const createInteractionSchema = z.object({
    stakeholder_id: z.string().min(1, 'Stakeholder ID is required'),
    nd_id: z.string().optional(),
    type: z.enum(['email', 'meeting', 'call', 'escalation', 'decision']),
    note: z.string().min(3, 'Note is required'),
    created_by: z.string().default('system'),
});
