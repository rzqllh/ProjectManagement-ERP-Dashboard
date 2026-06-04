'use client';

import { useState, useEffect, useCallback } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ProjectWithSections, UpdateSectionInput, ProjectStatus, ProjectCategory, ProjectPriority, RiskLevel, PicEntry } from '@/types/project';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { ProjectBoard } from '@/components/projects/ProjectBoard';
import {
    Loader2, ArrowLeft, FolderKanban, Calendar, User,
    Edit3, Trash2, Save, X, AlertTriangle, CheckCircle2,
    PauseCircle, XCircle
} from 'lucide-react';
import Link from 'next/link';

const STATUS_STYLES: Record<ProjectStatus, { label: string; className: string; icon: React.ElementType }> = {
    active: { label: 'Active', className: 'bg-caneris-cyan/10 text-caneris-cyan border-caneris-cyan/20', icon: CheckCircle2 },
    hold: { label: 'On Hold', className: 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20', icon: PauseCircle },
    completed: { label: 'Completed', className: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20', icon: CheckCircle2 },
    cancelled: { label: 'Cancelled', className: 'bg-red-500/10 text-red-400 border-red-500/20', icon: XCircle },
};

const CATEGORY_LABELS: Record<string, string> = {
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

export default function ProjectDetailPage() {
    const routeParams = useParams();
    const router = useRouter();
    const projectId = routeParams.id as string;

    const [project, setProject] = useState<ProjectWithSections | null>(null);
    const [loading, setLoading] = useState(true);
    const [editingMeta, setEditingMeta] = useState(false);
    const [savingMeta, setSavingMeta] = useState(false);
    const [showDelete, setShowDelete] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [metaForm, setMetaForm] = useState({
        name: '',
        description: '',
        category: 'migration' as ProjectCategory,
        status: 'active' as ProjectStatus,
        priority: 'medium' as ProjectPriority,
        risk_level: 'low' as RiskLevel,
        pic: [] as PicEntry[],
        target_date: '',
    });

    const fetchProject = useCallback(async () => {
        setLoading(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`);
            const json = await res.json();
            if (json.success) {
                setProject(json.data);
                setMetaForm({
                    name: json.data.name,
                    description: json.data.description,
                    category: json.data.category,
                    status: json.data.status,
                    priority: json.data.priority,
                    risk_level: json.data.risk_level,
                    pic: json.data.pic,
                    target_date: json.data.target_date ? json.data.target_date.split('T')[0] : '',
                });
            }
        } finally {
            setLoading(false);
        }
    }, [projectId]);

    useEffect(() => { fetchProject(); }, [fetchProject]);

    const handleSaveMeta = async () => {
        setSavingMeta(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...metaForm,
                    target_date: metaForm.target_date ? new Date(metaForm.target_date).toISOString() : null,
                }),
            });
            const json = await res.json();
            if (json.success) {
                setEditingMeta(false);
                fetchProject();
            }
        } finally {
            setSavingMeta(false);
        }
    };

    const handleDelete = async () => {
        setDeleting(true);
        try {
            const res = await fetch(`/api/projects/${projectId}`, { method: 'DELETE' });
            const json = await res.json();
            if (json.success) {
                router.push('/projects');
            }
        } finally {
            setDeleting(false);
        }
    };

    const handleSectionUpdate = async (sectionId: string, data: UpdateSectionInput) => {
        const res = await fetch(`/api/projects/${projectId}/sections/${sectionId}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
        const json = await res.json();
        if (json.success) {
            fetchProject(); // Refresh to get updated progress
        }
    };

    // Quick PIC editor helper
    const updateFirstPicName = (name: string) => {
        setMetaForm(prev => {
            const newPic = [...prev.pic];
            if (newPic.length > 0) newPic[0].name = name;
            else newPic.push({ name, unit: 'N/A' });
            return { ...prev, pic: newPic };
        });
    };

    // ... loading / not found ...

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <Loader2 className="w-6 h-6 animate-spin text-slate-500" />
            </div>
        );
    }

    if (!project) {
        return (
            <div className="text-center py-20">
                <AlertTriangle className="w-10 h-10 text-red-400 mx-auto mb-3" />
                <p className="text-sm text-slate-400">Project not found</p>
                <Link href="/projects" className="text-xs text-caneris-cyan hover:underline mt-2 inline-block">
                    ← Back to Projects
                </Link>
            </div>
        );
    }

    const statusConfig = STATUS_STYLES[project.status];
    const StatusIcon = statusConfig.icon;
    const startFormatted = project.start_date ? new Date(project.start_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '-';
    const targetFormatted = project.target_date ? new Date(project.target_date).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Ongoing';
    const categoryLabel = CATEGORY_LABELS[project.category] || project.category;

    return (
        <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
            {/* Back */}
            <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-white transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back to Projects
            </Link>

            {/* Project Header */}
            <div className="glass-card rounded-xl p-5 border border-white/5 space-y-4">
                <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                        {editingMeta ? (
                            <Input
                                value={metaForm.name}
                                onChange={e => setMetaForm(prev => ({ ...prev, name: e.target.value }))}
                                className="text-lg font-bold bg-white/5 border-white/10 text-white mb-2"
                            />
                        ) : (
                            <h1 className="text-lg font-bold text-white flex items-center gap-2">
                                <FolderKanban className="w-5 h-5 text-caneris-blue" />
                                {project.name}
                            </h1>
                        )}

                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                            {editingMeta ? (
                                <>
                                    <select
                                        value={metaForm.status}
                                        onChange={e => setMetaForm(prev => ({ ...prev, status: e.target.value as ProjectStatus }))}
                                        className="rounded-md bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none"
                                    >
                                        <option value="active" className="bg-[#111827]">Active</option>
                                        <option value="hold" className="bg-[#111827]">On Hold</option>
                                        <option value="completed" className="bg-[#111827]">Completed</option>
                                        <option value="cancelled" className="bg-[#111827]">Cancelled</option>
                                    </select>
                                    <select
                                        value={metaForm.category}
                                        onChange={e => setMetaForm(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
                                        className="rounded-md bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none"
                                    >
                                        <option value="migration" className="bg-[#111827]">Migration</option>
                                        <option value="access" className="bg-[#111827]">Access</option>
                                        <option value="integration" className="bg-[#111827]">Integration</option>
                                        <option value="infrastructure" className="bg-[#111827]">Infrastructure</option>
                                        <option value="expansion" className="bg-[#111827]">Expansion</option>
                                        <option value="other" className="bg-[#111827]">Other</option>
                                    </select>
                                    <select
                                        value={metaForm.priority}
                                        onChange={e => setMetaForm(prev => ({ ...prev, priority: e.target.value as ProjectPriority }))}
                                        className="rounded-md bg-white/5 border border-white/10 text-white text-xs px-2 py-1 outline-none"
                                    >
                                        <option value="critical" className="bg-[#111827]">Critical</option>
                                        <option value="high" className="bg-[#111827]">High</option>
                                        <option value="medium" className="bg-[#111827]">Medium</option>
                                        <option value="low" className="bg-[#111827]">Low</option>
                                    </select>
                                </>
                            ) : (
                                <>
                                    <Badge variant="outline" className={`${statusConfig.className} text-[10px]`}>
                                        <StatusIcon className="w-3 h-3 mr-1" />
                                        {statusConfig.label}
                                    </Badge>
                                    <span className="text-[10px] text-slate-500">{CATEGORY_LABELS[project.category] || project.category}</span>
                                    <Badge variant="outline" className={`${PRIORITY_STYLES[project.priority].className} text-[10px]`}>
                                        {PRIORITY_STYLES[project.priority].label}
                                    </Badge>
                                </>
                            )}
                        </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        {editingMeta ? (
                            <>
                                <Button variant="ghost" size="icon-xs" onClick={() => setEditingMeta(false)}>
                                    <X className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                                <Button size="xs" onClick={handleSaveMeta} disabled={savingMeta} className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                                    {savingMeta ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </Button>
                            </>
                        ) : (
                            <>
                                <Button variant="ghost" size="icon-xs" onClick={() => setEditingMeta(true)}>
                                    <Edit3 className="w-3.5 h-3.5 text-slate-400" />
                                </Button>
                                <Button variant="ghost" size="icon-xs" onClick={() => setShowDelete(true)}>
                                    <Trash2 className="w-3.5 h-3.5 text-red-400" />
                                </Button>
                            </>
                        )}
                    </div>
                </div>

                {/* Description */}
                {editingMeta ? (
                    <textarea
                        value={metaForm.description}
                        onChange={e => setMetaForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={2}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-xs px-3 py-2 outline-none resize-none font-mono"
                    />
                ) : (
                    <p className="text-xs text-slate-400 leading-relaxed font-mono whitespace-pre-wrap">{project.description}</p>
                )}

                {/* Meta Row */}
                <div className="flex items-center gap-4 text-[10px] text-slate-500 pt-2 border-t border-white/5">
                    <span className="flex items-center gap-1">
                        <User className="w-3 h-3" /> PIC: {editingMeta ? (
                            <Input
                                value={metaForm.pic[0]?.name || ''}
                                onChange={e => updateFirstPicName(e.target.value)}
                                className="h-5 text-[10px] w-24 bg-white/5 border-white/10 text-white px-1"
                                placeholder="Main PIC"
                            />
                        ) : project.pic.map(p => p.name).join(', ') || '-'}
                    </span>
                    <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" /> {startFormatted} → {editingMeta ? (
                            <Input
                                type="date"
                                value={metaForm.target_date}
                                onChange={e => setMetaForm(prev => ({ ...prev, target_date: e.target.value }))}
                                className="h-5 text-[10px] bg-white/5 border-white/10 text-white px-1"
                            />
                        ) : targetFormatted}
                    </span>
                    {project.tags && project.tags.length > 0 && (
                        <div className="flex items-center gap-1">
                            {project.tags.map(tag => (
                                <span key={tag} className="px-1.5 py-0.5 rounded-full bg-white/5 text-[9px]">{tag}</span>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* Board */}
            <ProjectBoard
                sections={project.sections}
                projectId={project.id}
                onSectionUpdate={handleSectionUpdate}
            />

            {/* Delete Confirmation */}
            <Dialog open={showDelete} onOpenChange={setShowDelete}>
                <DialogContent className="bg-[#0f1629] border-white/10 text-white max-w-sm">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Trash2 className="w-4 h-4 text-red-400" />
                            Delete Project
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        <p className="text-xs text-slate-400">
                            Are you sure you want to delete <strong className="text-white">{project.name}</strong>?
                            This will also soft-delete all sections.
                        </p>
                        <div className="flex justify-end gap-2">
                            <Button variant="ghost" size="sm" onClick={() => setShowDelete(false)}>Cancel</Button>
                            <Button
                                variant="destructive"
                                size="sm"
                                onClick={handleDelete}
                                disabled={deleting}
                            >
                                {deleting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Trash2 className="w-3 h-3" />}
                                Delete
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
