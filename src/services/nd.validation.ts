import { z } from 'zod';

export const createNdSchema = z.object({
    nd_number: z.string().min(1, 'ND Number is required'),
    title: z.string().min(3, 'Title must be at least 3 characters'),
    sender: z.string().min(1, 'Sender is required'),
    receiver: z.string().min(1, 'Receiver is required'),
    category: z.enum(['business', 'technical', 'guidance', 'order', 'access', 'other']),
    related_project_id: z.string().nullable().optional().transform(v => v ?? null),
    parent_nd_id: z.string().nullable().optional().transform(v => v ?? null),
    status: z.enum(['waiting_external', 'waiting_internal', 'drafting', 'issued', 'clear', 'escalated']),
    next_action: z.string().min(1, 'Next action is required'),
    pic: z.string().min(1, 'PIC is required'),
    deadline: z.string().nullable().optional().transform(v => v ?? null), // ISO date string validation can be added if needed
    blocker_description: z.string().nullable().optional().transform(v => v ?? null),
    attachment_links: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
});

export const updateNdSchema = createNdSchema.partial();

export const ndFilterSchema = z.object({
    status: z.enum(['waiting_external', 'waiting_internal', 'drafting', 'issued', 'clear', 'escalated']).optional(),
    escalation_status: z.enum(['risk', 'escalated', 'none']).optional(),
    category: z.string().optional(),
    project_id: z.string().optional(),
    pic: z.string().optional(),
});
