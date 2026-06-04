'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectSection, SectionStatus, UpdateSectionInput } from '@/types/project';
import {
    CheckCircle2, Clock, AlertTriangle, CircleDot,
    User, FileText, Edit3, Save, X, ChevronDown, ChevronUp, Loader2,
} from 'lucide-react';

const STATUS_CONFIG: Record<SectionStatus, { label: string; color: string; bg: string; icon: React.ElementType }> = {
    not_started: { label: 'Not Started', color: 'text-slate-400', bg: 'bg-slate-500/10', icon: CircleDot },
    in_progress: { label: 'In Progress', color: 'text-blue-400', bg: 'bg-blue-500/10', icon: Clock },
    blocked: { label: 'Blocked', color: 'text-red-400', bg: 'bg-red-500/10', icon: AlertTriangle },
    done: { label: 'Done', color: 'text-caneris-cyan', bg: 'bg-caneris-cyan/10', icon: CheckCircle2 },
};

interface SectionCardProps {
    section: ProjectSection;
    ndNames?: Record<string, string>; // Map of ND ID -> ND number/title for display
    onUpdate: (sectionId: string, data: UpdateSectionInput) => Promise<void>;
}

export function SectionCard({ section, ndNames = {}, onUpdate }: SectionCardProps) {
    const [expanded, setExpanded] = useState(false);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        status: section.status,
        pic: section.pic,
        blocker: section.blocker || '',
        notes: section.notes,
    });

    const config = STATUS_CONFIG[section.status];
    const StatusIcon = config.icon;

    const handleSave = async () => {
        setSaving(true);
        try {
            await onUpdate(section.id, {
                status: formData.status,
                pic: formData.pic,
                blocker: formData.blocker || null,
                notes: formData.notes,
            });
            setEditing(false);
        } finally {
            setSaving(false);
        }
    };

    const handleCancel = () => {
        setFormData({
            status: section.status,
            pic: section.pic,
            blocker: section.blocker || '',
            notes: section.notes,
        });
        setEditing(false);
    };

    return (
        <div className={`rounded-xl border transition-all duration-200 ${section.status === 'blocked'
                ? 'border-red-500/20 bg-red-500/5'
                : section.status === 'done'
                    ? 'border-caneris-cyan/20 bg-caneris-cyan/5'
                    : 'border-white/5 bg-white/[0.02]'
            } hover:border-white/10`}>
            {/* Header — Always visible */}
            <div
                className="flex items-center justify-between px-4 py-3 cursor-pointer select-none"
                onClick={() => !editing && setExpanded(prev => !prev)}
            >
                <div className="flex items-center gap-3 min-w-0">
                    <div className={`flex items-center justify-center w-7 h-7 rounded-lg ${config.bg}`}>
                        <StatusIcon className={`w-3.5 h-3.5 ${config.color}`} />
                    </div>
                    <div className="min-w-0">
                        <div className="text-sm font-medium text-white truncate">{section.section_name}</div>
                        <div className="flex items-center gap-2 mt-0.5">
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${config.bg} ${config.color}`}>
                                {config.label}
                            </span>
                            {section.pic && (
                                <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                    <User className="w-2.5 h-2.5" /> {section.pic}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {section.related_nd_ids.length > 0 && (
                        <span className="text-[10px] text-slate-500 bg-white/5 px-1.5 py-0.5 rounded">
                            {section.related_nd_ids.length} ND
                        </span>
                    )}
                    {!editing && (
                        expanded
                            ? <ChevronUp className="w-4 h-4 text-slate-500" />
                            : <ChevronDown className="w-4 h-4 text-slate-500" />
                    )}
                </div>
            </div>

            {/* Expanded Content */}
            {(expanded || editing) && (
                <div className="px-4 pb-4 space-y-3 border-t border-white/5 pt-3">
                    {editing ? (
                        /* Edit Mode */
                        <div className="space-y-3">
                            {/* Status Select */}
                            <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Status</label>
                                <select
                                    value={formData.status}
                                    onChange={e => setFormData(prev => ({ ...prev, status: e.target.value as SectionStatus }))}
                                    className="w-full mt-1 rounded-md bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 outline-none"
                                >
                                    <option value="not_started" className="bg-[#111827]">Not Started</option>
                                    <option value="in_progress" className="bg-[#111827]">In Progress</option>
                                    <option value="blocked" className="bg-[#111827]">Blocked</option>
                                    <option value="done" className="bg-[#111827]">Done</option>
                                </select>
                            </div>

                            {/* PIC */}
                            <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">PIC</label>
                                <Input
                                    value={formData.pic}
                                    onChange={e => setFormData(prev => ({ ...prev, pic: e.target.value }))}
                                    placeholder="Person in charge..."
                                    className="mt-1 h-7 text-xs bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            {/* Blocker */}
                            <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Blocker</label>
                                <Input
                                    value={formData.blocker}
                                    onChange={e => setFormData(prev => ({ ...prev, blocker: e.target.value }))}
                                    placeholder="What's blocking this section..."
                                    className="mt-1 h-7 text-xs bg-white/5 border-white/10 text-white"
                                />
                            </div>

                            {/* Notes */}
                            <div>
                                <label className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Notes</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={e => setFormData(prev => ({ ...prev, notes: e.target.value }))}
                                    placeholder="Progress notes, context, decisions..."
                                    rows={4}
                                    className="w-full mt-1 rounded-md bg-white/5 border border-white/10 text-white text-xs px-2.5 py-1.5 outline-none resize-none focus:border-caneris-cyan/50"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="xs" onClick={handleCancel} className="text-slate-400">
                                    <X className="w-3 h-3" /> Cancel
                                </Button>
                                <Button size="xs" onClick={handleSave} disabled={saving} className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90">
                                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                                    Save
                                </Button>
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <div className="space-y-2">
                            {section.blocker && (
                                <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2">
                                    <span className="text-[10px] font-medium text-red-400 uppercase tracking-wider flex items-center gap-1">
                                        <AlertTriangle className="w-3 h-3" /> Blocker
                                    </span>
                                    <p className="text-xs text-red-300 mt-1">{section.blocker}</p>
                                </div>
                            )}

                            {section.notes && (
                                <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider flex items-center gap-1">
                                        <FileText className="w-3 h-3" /> Notes
                                    </span>
                                    <p className="text-xs text-slate-300 mt-1 whitespace-pre-wrap leading-relaxed">{section.notes}</p>
                                </div>
                            )}

                            {section.related_nd_ids.length > 0 && (
                                <div>
                                    <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">Related NDs</span>
                                    <div className="flex flex-wrap gap-1 mt-1">
                                        {section.related_nd_ids.map(ndId => (
                                            <a
                                                key={ndId}
                                                href={`/nd/${ndId}`}
                                                className="text-[10px] px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-400 hover:bg-violet-500/20 transition-colors"
                                            >
                                                {ndNames[ndId] || ndId.slice(0, 8)}
                                            </a>
                                        ))}
                                    </div>
                                </div>
                            )}

                            {!section.notes && !section.blocker && section.related_nd_ids.length === 0 && (
                                <p className="text-xs text-slate-600 italic">No details yet. Click edit to add notes.</p>
                            )}

                            <div className="flex justify-end">
                                <Button variant="ghost" size="xs" onClick={() => setEditing(true)} className="text-slate-400 hover:text-white">
                                    <Edit3 className="w-3 h-3" /> Edit
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
