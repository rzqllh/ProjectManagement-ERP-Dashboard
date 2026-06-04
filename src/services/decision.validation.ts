import { z } from 'zod';

export const createDecisionSchema = z.object({
    title: z.string().min(3, 'Title is required'),
    decision_type: z.enum(['technical', 'commercial', 'governance', 'risk', 'strategic']).default('technical'),
    context: z.string().min(1, 'Context is required'),
    proposed_solution: z.string().optional(),
    status: z.enum(['draft', 'proposed', 'approved', 'rejected', 'implemented']).default('draft'),
    priority: z.enum(['critical', 'high', 'medium', 'low']).default('medium'),
    pic: z.string().min(1, 'PIC is required'),
    related_project_id: z.string().optional(),
    related_nd_id: z.string().optional(),
    tags: z.array(z.string()).default([]),
    attachment_links: z.array(z.string()).default([]),
});

export const updateDecisionSchema = z.object({
    title: z.string().optional(),
    decision_type: z.enum(['technical', 'commercial', 'governance', 'risk', 'strategic']).optional(),
    context: z.string().optional(),
    proposed_solution: z.string().optional(),
    decision_outcome: z.string().optional(),
    status: z.enum(['draft', 'proposed', 'approved', 'rejected', 'implemented']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    pic: z.string().optional(),
    approver: z.string().optional(),
    approval_date: z.string().optional(),
    related_project_id: z.string().optional(),
    related_nd_id: z.string().optional(),
    tags: z.array(z.string()).optional(),
    attachment_links: z.array(z.string()).optional(),
});

export const decisionFilterSchema = z.object({
    status: z.enum(['draft', 'proposed', 'approved', 'rejected', 'implemented']).optional(),
    priority: z.enum(['critical', 'high', 'medium', 'low']).optional(),
    project_id: z.string().optional(),
    nd_id: z.string().optional(),
});
