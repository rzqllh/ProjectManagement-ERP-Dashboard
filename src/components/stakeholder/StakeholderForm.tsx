'use client';

import { useState } from 'react';
import { CreateStakeholderInput, StakeholderCategory, InfluenceLevel } from '@/types/stakeholder';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Loader2 } from 'lucide-react';

interface StakeholderFormProps {
    initialData?: Partial<CreateStakeholderInput>;
    onSubmit: (data: CreateStakeholderInput) => Promise<void>;
    isEditing?: boolean;
}

export function StakeholderForm({ initialData, onSubmit, isEditing = false }: StakeholderFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [formData, setFormData] = useState<CreateStakeholderInput>({
        name: '',
        organization: '',
        role: '',
        email: '',
        phone: '',
        category: 'external',
        ...initialData,
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            await onSubmit(formData);
        } catch (err: any) {
            setError(err.message || 'Failed to save stakeholder');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4 py-2">
            {error && (
                <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs">
                    {error}
                </div>
            )}
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Full Name</label>
                    <Input
                        name="name"
                        placeholder="e.g. John Doe"
                        className="bg-black/20 border-white/10"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Organization</label>
                    <Input
                        name="organization"
                        placeholder="e.g. PT Telkom"
                        className="bg-black/20 border-white/10"
                        value={formData.organization}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Role / Position</label>
                    <Input
                        name="role"
                        placeholder="e.g. VP Engineering"
                        className="bg-black/20 border-white/10"
                        value={formData.role}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Category</label>
                    <Select
                        value={formData.category}
                        onValueChange={(v: any) => setFormData(prev => ({ ...prev, category: v }))}
                    >
                        <SelectTrigger className="bg-black/20 border-white/10">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                            <SelectItem value="internal">Internal</SelectItem>
                            <SelectItem value="external">External</SelectItem>
                            <SelectItem value="regulator">Regulator</SelectItem>
                            <SelectItem value="vendor">Vendor</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Email</label>
                    <Input
                        name="email"
                        type="email"
                        placeholder="john@company.com"
                        className="bg-black/20 border-white/10"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-mono text-[#94a3b8]">Phone</label>
                    <Input
                        name="phone"
                        placeholder="+62 812 xxxx xxxx"
                        className="bg-black/20 border-white/10"
                        value={formData.phone}
                        onChange={handleChange}
                        required
                    />
                </div>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-mono text-[#94a3b8]">Influence Level (Optional)</label>
                <Select
                    value={formData.influence_level || ''}
                    onValueChange={(v: any) => setFormData(prev => ({ ...prev, influence_level: v || undefined }))}
                >
                    <SelectTrigger className="bg-black/20 border-white/10">
                        <SelectValue placeholder="Select level..." />
                    </SelectTrigger>
                    <SelectContent className="bg-[#1e293b] border-white/10 text-white">
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="executive">Executive</SelectItem>
                    </SelectContent>
                </Select>
            </div>
            <div className="space-y-2">
                <label className="text-xs font-mono text-[#94a3b8]">Notes (Optional)</label>
                <Textarea
                    name="notes"
                    placeholder="Any relevant context about this stakeholder..."
                    className="bg-black/20 border-white/10 min-h-[80px]"
                    value={formData.notes || ''}
                    onChange={handleChange}
                />
            </div>
            <div className="flex justify-end gap-2 pt-2">
                <Button
                    type="submit"
                    className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90"
                    disabled={loading}
                >
                    {loading && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                    {isEditing ? 'Update Stakeholder' : 'Register Stakeholder'}
                </Button>
            </div>
        </form>
    );
}
