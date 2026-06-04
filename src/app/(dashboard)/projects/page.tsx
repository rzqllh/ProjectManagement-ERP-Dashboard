'use client';

import { useState, useEffect, useCallback } from 'react';
import { ProjectListItem, ProjectCategory, ProjectStatus, ProjectPriority } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import {
    Loader2, Plus, FolderKanban, Search, ArrowRight,
    AlertTriangle, CheckCircle2, PauseCircle, XCircle,
    Filter,
} from 'lucide-react';
import Link from 'next/link';
import { ProjectForm } from '@/components/projects/ProjectForm';

// ─── Badges ─────────────────────────────────────────────────────────

const STATUS_STYLES: Record<ProjectStatus, { label: string; className: string; icon: React.ElementType }> = {
    active: { label: 'Active', className: 'bg-caneris-cyan/10 text-caneris-cyan border-caneris-cyan/20', icon: CheckCircle2 },
    hold: { label: 'On Hold', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: PauseCircle },
    completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
};

const CATEGORY_LABELS: Record<ProjectCategory, string> = {
    migration: '🔄 Migration',
    access: '🔑 Access',
    integration: '🔗 Integration',
    infrastructure: '🏗️ Infrastructure',
    expansion: '📈 Expansion',
    other: '📌 Other',
};

const PRIORITY_STYLES: Record<ProjectPriority, { label: string; className: string }> = {
    critical: { label: 'Critical', className: 'bg-red-500/10 text-red-400 border-red-500/20' },
    high: { label: 'High', className: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
    medium: { label: 'Medium', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20' },
    low: { label: 'Low', className: 'bg-slate-500/10 text-slate-400 border-slate-500/20' },
};

// ─── Page ───────────────────────────────────────────────────────────

export default function ProjectsPage() {
    const [projects, setProjects] = useState<ProjectListItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [showCreate, setShowCreate] = useState(false);
    const [creating, setCreating] = useState(false);
    const [search, setSearch] = useState('');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');

    const fetchProjects = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (filterStatus !== 'all') params.set('status', filterStatus);
            if (filterCategory !== 'all') params.set('category', filterCategory);

            const res = await fetch(`/api/projects?${params}`);
            const json = await res.json();
            if (json.success) setProjects(json.data);
        } finally {
            setLoading(false);
        }
    }, [filterStatus, filterCategory]);

    useEffect(() => { fetchProjects(); }, [fetchProjects]);

    const handleCreate = async (data: any) => {
        setCreating(true);
        try {
            const res = await fetch('/api/projects', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });
            const json = await res.json();
            if (json.success) {
                setShowCreate(false);
                fetchProjects();
            }
        } finally {
            setCreating(false);
        }
    };

    // Filter by search term
    const filtered = projects.filter(p =>
        !search || p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.description.toLowerCase().includes(search.toLowerCase()) ||
        p.pic.some(pic => pic.name.toLowerCase().includes(search.toLowerCase()))
    );

    return (
        <div className="max-w-9xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
                        <FolderKanban className="w-5 h-5 text-caneris-blue" />
                        Projects
                    </h2>
                    <p className="text-xs text-slate-500 mt-1">
                        Track project lifecycles across standardized phases
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setShowCreate(true)}
                    className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90"
                >
                    <Plus className="w-3.5 h-3.5" /> New Project
                </Button>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                    { label: 'Total', value: projects.length, color: 'text-white' },
                    { label: 'Active', value: projects.filter(p => p.status === 'active').length, color: 'text-caneris-cyan' },
                    { label: 'On Hold', value: projects.filter(p => p.status === 'hold').length, color: 'text-yellow-400' },
                    { label: 'Blocked Sections', value: projects.reduce((acc, p) => acc + p.section_summary.blocked, 0), color: 'text-red-400' },
                ].map(stat => (
                    <div key={stat.label} className="glass-card rounded-xl p-3 border border-white/5">
                        <span className="text-[10px] text-slate-500 uppercase tracking-wider">{stat.label}</span>
                        <div className={`text-lg font-bold ${stat.color} mt-0.5`}>{stat.value}</div>
                    </div>
                ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap items-center gap-3">
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                    <Input
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                        placeholder="Search projects..."
                        className="pl-8 h-8 text-xs bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                    />
                </div>
                <div className="flex items-center gap-2">
                    <Filter className="w-3.5 h-3.5 text-slate-500" />
                    <select
                        value={filterStatus}
                        onChange={e => setFilterStatus(e.target.value)}
                        className="rounded-md bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 outline-none"
                    >
                        <option value="all" className="bg-[#111827]">All Status</option>
                        <option value="active" className="bg-[#111827]">Active</option>
                        <option value="hold" className="bg-[#111827]">On Hold</option>
                        <option value="completed" className="bg-[#111827]">Completed</option>
                        <option value="cancelled" className="bg-[#111827]">Cancelled</option>
                    </select>
                    <select
                        value={filterCategory}
                        onChange={e => setFilterCategory(e.target.value)}
                        className="rounded-md bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 outline-none"
                    >
                        <option value="all" className="bg-[#111827]">All Categories</option>
                        {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                            <option key={key} value={key} className="bg-[#111827]">{label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Project Cards */}
            {loading ? (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
                </div>
            ) : filtered.length === 0 ? (
                <div className="text-center py-20">
                    <FolderKanban className="w-10 h-10 text-slate-700 mx-auto mb-3" />
                    <p className="text-sm text-slate-500">No projects found</p>
                    <p className="text-xs text-slate-600 mt-1">Create a new project to get started</p>
                </div>
            ) : (
                <div className="grid gap-3">
                    {filtered.map((project, i) => {
                        const statusConfig = STATUS_STYLES[project.status];
                        const StatusIcon = statusConfig.icon;
                        const categoryLabel = CATEGORY_LABELS[project.category] || project.category;

                        return (
                            <Link
                                key={project.id}
                                href={`/projects/${project.id}`}
                                className="group glass-card glass-card-hover rounded-xl p-4 border border-white/5 block animate-fade-in-up"
                                style={{ animationDelay: `${i * 0.04}s` }}
                            >
                                <div className="flex items-start justify-between gap-4">
                                    <div className="min-w-0 flex-1">
                                        {/* Title Row */}
                                        <div className="flex items-center gap-2 mb-1.5">
                                            <h3 className="text-sm font-semibold text-white truncate group-hover:text-caneris-cyan transition-colors">
                                                {project.name}
                                            </h3>
                                            <Badge variant="outline" className={`${statusConfig.className} text-[10px] h-5 shrink-0`}>
                                                <StatusIcon className="w-3 h-3 mr-1" />
                                                {statusConfig.label}
                                            </Badge>
                                        </div>

                                        {/* Meta Row */}
                                        <div className="flex items-center gap-3 text-[10px] text-slate-500">
                                            <span>{categoryLabel}</span>
                                            <span>•</span>
                                            <Badge variant="outline" className={`${PRIORITY_STYLES[project.priority].className} text-[9px] h-4`}>
                                                {PRIORITY_STYLES[project.priority].label}
                                            </Badge>
                                            <span>•</span>
                                            <span>PIC: {project.pic.map(p => p.name).join(', ') || '-'}</span>
                                        </div>

                                        {/* Description */}
                                        <p className="text-xs text-slate-400 mt-1.5 line-clamp-1">{project.description}</p>

                                        {/* Section Progress */}
                                        <div className="flex items-center gap-3 mt-3">
                                            <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden max-w-[200px]">
                                                <div
                                                    className="h-full rounded-full bg-gradient-to-r from-caneris-cyan to-caneris-blue transition-all"
                                                    style={{ width: `${project.progress}%` }}
                                                />
                                            </div>
                                            <span className="text-[10px] text-slate-500 font-mono whitespace-nowrap">
                                                {project.section_summary.done}/{project.section_summary.total} done
                                            </span>
                                            {project.section_summary.blocked > 0 && (
                                                <span className="flex items-center gap-0.5 text-[10px] text-red-400">
                                                    <AlertTriangle className="w-3 h-3" />
                                                    {project.section_summary.blocked} blocked
                                                </span>
                                            )}
                                        </div>
                                    </div>

                                    <ArrowRight className="w-4 h-4 text-slate-600 group-hover:text-caneris-cyan transition-colors shrink-0 mt-1" />
                                </div>
                            </Link>
                        );
                    })}
                </div>
            )}

            {/* Create Dialog */}
            <Dialog open={showCreate} onOpenChange={setShowCreate}>
                <DialogContent className="bg-[#0f1629] border-white/10 text-white max-w-lg">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <FolderKanban className="w-4 h-4 text-caneris-cyan" />
                            Create New Project
                        </DialogTitle>
                    </DialogHeader>
                    <ProjectForm
                        onSubmit={handleCreate}
                        onCancel={() => setShowCreate(false)}
                        loading={creating}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
