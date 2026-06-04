'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CreateProjectInput, ProjectCategory, ProjectPriority, RiskLevel, PicEntry } from '@/types/project';
import { X, FolderPlus, Plus, Trash2, Bold, Italic, Code } from 'lucide-react';

const CATEGORIES: { value: ProjectCategory; label: string }[] = [
    { value: 'migration', label: 'Migration' },
    { value: 'access', label: 'Access' },
    { value: 'integration', label: 'Integration' },
    { value: 'infrastructure', label: 'Infrastructure' },
    { value: 'expansion', label: 'Expansion' },
    { value: 'other', label: 'Other' },
];

const PRIORITIES: { value: ProjectPriority; label: string; color: string }[] = [
    { value: 'critical', label: 'Critical', color: 'text-red-400' },
    { value: 'high', label: 'High', color: 'text-orange-400' },
    { value: 'medium', label: 'Medium', color: 'text-yellow-400' },
    { value: 'low', label: 'Low', color: 'text-slate-400' },
];

const RISK_LEVELS: { value: RiskLevel; label: string }[] = [
    { value: 'critical', label: 'Critical' },
    { value: 'high', label: 'High' },
    { value: 'medium', label: 'Medium' },
    { value: 'low', label: 'Low' },
];

interface ProjectFormProps {
    onSubmit: (data: CreateProjectInput) => Promise<void>;
    onCancel: () => void;
    loading?: boolean;
}

export function ProjectForm({ onSubmit, onCancel, loading }: ProjectFormProps) {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        category: 'migration' as ProjectCategory,
        priority: 'medium' as ProjectPriority,
        risk_level: 'low' as RiskLevel,
        start_date: new Date().toISOString().split('T')[0],
        target_date: '',
        pic: [] as PicEntry[],
        tags: [] as string[],
    });

    // UI States
    const [tagInput, setTagInput] = useState('');
    const [isOngoing, setIsOngoing] = useState(false);

    const handleSubmit = async () => {
        await onSubmit({
            ...formData,
            status: 'active',
            start_date: formData.start_date ? new Date(formData.start_date).toISOString() : null,
            target_date: isOngoing ? null : (formData.target_date ? new Date(formData.target_date).toISOString() : null),
        });
    };

    // ─── Formatting Helpers ───
    const insertFormat = (format: string) => {
        const textarea = document.getElementById('desc-textarea') as HTMLTextAreaElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = formData.description;
        const selectedText = text.substring(start, end);

        let newText = text;
        if (format === 'bold') newText = text.substring(0, start) + `**${selectedText}**` + text.substring(end);
        if (format === 'italic') newText = text.substring(0, start) + `*${selectedText}*` + text.substring(end);
        if (format === 'code') newText = text.substring(0, start) + `\`${selectedText}\`` + text.substring(end);

        setFormData(prev => ({ ...prev, description: newText }));
        textarea.focus();
    };

    // ─── PIC Helpers ───
    const addPic = () => {
        setFormData(prev => ({ ...prev, pic: [...prev.pic, { name: '', unit: '' }] }));
    };
    const updatePic = (index: number, field: keyof PicEntry, value: string) => {
        const newPic = [...formData.pic];
        newPic[index][field] = value;
        setFormData(prev => ({ ...prev, pic: newPic }));
    };
    const removePic = (index: number) => {
        setFormData(prev => ({ ...prev, pic: prev.pic.filter((_, i) => i !== index) }));
    };

    // ─── Tag Helpers ───
    const addTag = () => {
        const tag = tagInput.trim();
        if (tag && !formData.tags.includes(tag)) {
            setFormData(prev => ({ ...prev, tags: [...prev.tags, tag] }));
            setTagInput('');
        }
    };
    const removeTag = (tag: string) => {
        setFormData(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
    };

    const isValid = formData.name.length >= 3 && formData.description.length > 0 && formData.pic.length > 0;

    return (
        <div className="space-y-6">
            {/* Name */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Project Name *</label>
                <Input
                    value={formData.name}
                    onChange={e => setFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g. AAA Migrasi ke BNG Telkomsel"
                    className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                />
            </div>

            {/* Description with Toolbar */}
            <div>
                <div className="flex justify-between items-end mb-1.5">
                    <label className="block text-xs font-medium text-slate-400">Description *</label>
                    <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('bold')}><Bold className="w-3 h-3 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('italic')}><Italic className="w-3 h-3 text-slate-400" /></Button>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => insertFormat('code')}><Code className="w-3 h-3 text-slate-400" /></Button>
                    </div>
                </div>
                <div className="relative">
                    <textarea
                        id="desc-textarea"
                        value={formData.description}
                        onChange={e => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Project scope, objectives, and key milestones (Markdown supported)..."
                        rows={6}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2 placeholder:text-slate-600 focus:border-caneris-cyan/50 focus:ring-1 focus:ring-caneris-cyan/20 outline-none resize-none font-mono"
                    />
                    <div className="absolute bottom-2 right-2 text-[10px] text-slate-600">Markdown Supported</div>
                </div>
            </div>

            {/* Category + Priority row */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Category</label>
                    <select
                        value={formData.category}
                        onChange={e => setFormData(prev => ({ ...prev, category: e.target.value as ProjectCategory }))}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-caneris-cyan/50"
                    >
                        {CATEGORIES.map(c => (
                            <option key={c.value} value={c.value} className="bg-[#111827]">{c.label}</option>
                        ))}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Priority</label>
                    <select
                        value={formData.priority}
                        onChange={e => setFormData(prev => ({ ...prev, priority: e.target.value as ProjectPriority }))}
                        className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-caneris-cyan/50"
                    >
                        {PRIORITIES.map(p => (
                            <option key={p.value} value={p.value} className="bg-[#111827]">{p.label}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Risk Level */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Risk Level</label>
                <select
                    value={formData.risk_level}
                    onChange={e => setFormData(prev => ({ ...prev, risk_level: e.target.value as RiskLevel }))}
                    className="w-full rounded-md bg-white/5 border border-white/10 text-white text-sm px-3 py-2 outline-none focus:border-caneris-cyan/50"
                >
                    {RISK_LEVELS.map(r => (
                        <option key={r.value} value={r.value} className="bg-[#111827]">{r.label}</option>
                    ))}
                </select>
            </div>

            {/* PIC List */}
            <div>
                <div className="flex justify-between items-center mb-2">
                    <label className="block text-xs font-medium text-slate-400">PIC *</label>
                    <Button variant="ghost" size="sm" onClick={addPic} className="text-caneris-cyan text-xs h-6 px-2 hover:bg-caneris-cyan/10">
                        <Plus className="w-3 h-3 mr-1" /> Add PIC
                    </Button>
                </div>
                <div className="space-y-2">
                    {formData.pic.map((p, i) => (
                        <div key={i} className="flex gap-2">
                            <Input
                                value={p.name}
                                onChange={e => updatePic(i, 'name', e.target.value)}
                                placeholder="Name (e.g. Mas Baim)"
                                className="bg-white/5 border-white/10 text-white flex-1"
                            />
                            <Input
                                value={p.unit}
                                onChange={e => updatePic(i, 'unit', e.target.value)}
                                placeholder="Unit (e.g. NITS)"
                                className="bg-white/5 border-white/10 text-white w-24"
                            />
                            <Button variant="ghost" size="icon" onClick={() => removePic(i)} className="text-slate-500 hover:text-red-400">
                                <Trash2 className="w-4 h-4" />
                            </Button>
                        </div>
                    ))}
                    {formData.pic.length === 0 && (
                        <div className="text-center py-4 border border-dashed border-white/10 rounded-lg text-slate-600 text-xs">
                            No PIC assigned. Click "Add PIC" to add entries.
                        </div>
                    )}
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">Start Date</label>
                    <Input
                        type="date"
                        value={formData.start_date}
                        onChange={e => setFormData(prev => ({ ...prev, start_date: e.target.value }))}
                        className="bg-white/5 border-white/10 text-white"
                    />
                </div>
                <div>
                    <div className="flex justify-between items-center mb-1.5">
                        <label className="block text-xs font-medium text-slate-400">Target Date</label>
                        <label className="flex items-center gap-1.5 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={isOngoing}
                                onChange={e => setIsOngoing(e.target.checked)}
                                className="w-3 h-3 rounded border-white/20 bg-white/5 text-caneris-cyan focus:ring-0"
                            />
                            <span className="text-[10px] text-slate-500">Ongoing / Present</span>
                        </label>
                    </div>
                    <Input
                        type="date"
                        value={formData.target_date}
                        onChange={e => setFormData(prev => ({ ...prev, target_date: e.target.value }))}
                        disabled={isOngoing}
                        className={`bg-white/5 border-white/10 text-white ${isOngoing ? 'opacity-30 cursor-not-allowed' : ''}`}
                    />
                </div>
            </div>

            {/* Tags */}
            <div>
                <label className="block text-xs font-medium text-slate-400 mb-1.5">Tags</label>
                <div className="flex gap-2">
                    <Input
                        value={tagInput}
                        onChange={e => setTagInput(e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); addTag(); } }}
                        placeholder="Add tag..."
                        className="bg-white/5 border-white/10 text-white placeholder:text-slate-600"
                    />
                    <Button variant="outline" size="sm" onClick={addTag} className="border-white/10 text-white">Add</Button>
                </div>
                {formData.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-2">
                        {formData.tags.map(tag => (
                            <span key={tag} className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/5 text-xs text-slate-300 border border-white/10">
                                {tag}
                                <button onClick={() => removeTag(tag)} className="hover:text-red-400 transition-colors">
                                    <X className="w-3 h-3" />
                                </button>
                            </span>
                        ))}
                    </div>
                )}
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-2 pt-2 border-t border-white/5">
                <Button variant="ghost" size="sm" onClick={onCancel} className="text-slate-400">Cancel</Button>
                <Button
                    size="sm"
                    onClick={handleSubmit}
                    disabled={!isValid || loading}
                    className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90"
                >
                    <FolderPlus className="w-3.5 h-3.5" />
                    {loading ? 'Creating...' : 'Create Project'}
                </Button>
            </div>
        </div>
    );
}
