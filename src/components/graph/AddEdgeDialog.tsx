'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Plus, Loader2 } from 'lucide-react';
import type { EdgeRelationshipType, NodeType } from '@/types/nd';

interface AddEdgeDialogProps {
    onAddEdge: (data: {
        from_id: string;
        from_type: NodeType;
        to_id: string;
        to_type: NodeType;
        relationship_type: EdgeRelationshipType;
    }) => Promise<void>;
}

const RELATIONSHIP_OPTIONS: { value: EdgeRelationshipType; label: string; category: string }[] = [
    // Structural
    { value: 'parent_of', label: 'Parent Of', category: 'Structural' },
    { value: 'belongs_to', label: 'Belongs To', category: 'Structural' },
    // Causal
    { value: 'triggers', label: 'Triggers', category: 'Causal' },
    { value: 'blocks', label: 'Blocks', category: 'Causal' },
    { value: 'escalates_to', label: 'Escalates To', category: 'Causal' },
    // Reference
    { value: 'references', label: 'References', category: 'Reference' },
    { value: 'decides_on', label: 'Decides On', category: 'Reference' },
    // Stakeholder
    { value: 'assigned_to', label: 'Assigned To', category: 'Stakeholder' },
    { value: 'sent_by', label: 'Sent By', category: 'Stakeholder' },
];

const NODE_TYPE_OPTIONS: { value: NodeType; label: string }[] = [
    { value: 'nd', label: 'ND Record' },
    { value: 'decision', label: 'Decision' },
    { value: 'stakeholder', label: 'Stakeholder' },
    { value: 'project', label: 'Project' },
];

export function AddEdgeDialog({ onAddEdge }: AddEdgeDialogProps) {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        from_id: '',
        from_type: 'nd' as NodeType,
        to_id: '',
        to_type: 'nd' as NodeType,
        relationship_type: 'references' as EdgeRelationshipType,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.from_id || !formData.to_id) return;

        setLoading(true);
        try {
            await onAddEdge(formData);
            setOpen(false);
            setFormData({
                from_id: '',
                from_type: 'nd',
                to_id: '',
                to_type: 'nd',
                relationship_type: 'references',
            });
        } catch (err) {
            console.error('Failed to add edge:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs bg-[#1e293b] border-white/10 text-white hover:bg-white/10"
                >
                    <Plus className="w-3 h-3 mr-1.5" /> Add Edge
                </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#0f172a] border-white/10 text-white max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-sm font-semibold">Add Manual Edge</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 pt-2">
                    {/* From Entity */}
                    <div className="space-y-2">
                        <Label className="text-xs text-[#94a3b8]">From Entity</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.from_type}
                                onValueChange={(v) => setFormData(p => ({ ...p, from_type: v as NodeType }))}
                            >
                                <SelectTrigger className="w-[120px] bg-[#0f172a]/50 border-white/10 text-xs h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10">
                                    {NODE_TYPE_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value} className="text-xs text-white">
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Entity ID"
                                value={formData.from_id}
                                onChange={(e) => setFormData(p => ({ ...p, from_id: e.target.value }))}
                                className="flex-1 bg-[#0f172a]/50 border-white/10 text-xs h-9 font-mono"
                                required
                            />
                        </div>
                    </div>

                    {/* Relationship */}
                    <div className="space-y-2">
                        <Label className="text-xs text-[#94a3b8]">Relationship</Label>
                        <Select
                            value={formData.relationship_type}
                            onValueChange={(v) => setFormData(p => ({ ...p, relationship_type: v as EdgeRelationshipType }))}
                        >
                            <SelectTrigger className="bg-[#0f172a]/50 border-white/10 text-xs h-9">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-[#1e293b] border-white/10">
                                {RELATIONSHIP_OPTIONS.map(o => (
                                    <SelectItem key={o.value} value={o.value} className="text-xs text-white">
                                        <span className="text-[#64748b] mr-1">[{o.category}]</span> {o.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* To Entity */}
                    <div className="space-y-2">
                        <Label className="text-xs text-[#94a3b8]">To Entity</Label>
                        <div className="flex gap-2">
                            <Select
                                value={formData.to_type}
                                onValueChange={(v) => setFormData(p => ({ ...p, to_type: v as NodeType }))}
                            >
                                <SelectTrigger className="w-[120px] bg-[#0f172a]/50 border-white/10 text-xs h-9">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-[#1e293b] border-white/10">
                                    {NODE_TYPE_OPTIONS.map(o => (
                                        <SelectItem key={o.value} value={o.value} className="text-xs text-white">
                                            {o.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                            <Input
                                placeholder="Entity ID"
                                value={formData.to_id}
                                onChange={(e) => setFormData(p => ({ ...p, to_id: e.target.value }))}
                                className="flex-1 bg-[#0f172a]/50 border-white/10 text-xs h-9 font-mono"
                                required
                            />
                        </div>
                    </div>

                    <div className="flex justify-end pt-2">
                        <Button
                            type="submit"
                            className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90 text-xs h-8"
                            disabled={loading}
                        >
                            {loading && <Loader2 className="w-3 h-3 mr-1.5 animate-spin" />}
                            Create Edge
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
