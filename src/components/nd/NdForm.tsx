'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Save, AlertCircle } from 'lucide-react';
import { NdCategory, NdStatus, NdeRecord } from '@/types/nd';
import { StakeholderCombobox } from '@/components/stakeholder/StakeholderCombobox';

interface NdFormProps {
    initialData?: Partial<NdeRecord>;
    onSubmit: (data: any) => Promise<void>;
    onCancel?: () => void;
    isEditing?: boolean;
}

export function NdForm({ initialData, onSubmit, onCancel, isEditing = false }: NdFormProps) {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        nd_number: '',
        title: '',
        sender: '',
        sender_id: undefined as string | undefined,
        receiver: '',
        receiver_id: undefined as string | undefined,
        category: 'business' as NdCategory,
        status: 'drafting' as NdStatus,
        pic: '',
        deadline: '',
        next_action: '',
        blocker_description: '',
        ...initialData,
    });

    useEffect(() => {
        if (initialData) {
            setFormData(prev => ({ ...prev, ...initialData }));
        }
    }, [initialData]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-lg flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
                    <div className="text-sm">{error}</div>
                </div>
            )}

            {/* Section: Identification */}
            <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#64748b] border-b border-white/5 pb-2">
                    Identification
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="nd_number">ND Number <span className="text-red-400">*</span></Label>
                        <Input
                            id="nd_number" name="nd_number"
                            placeholder="e.g. ND-123/IT/2026"
                            value={formData.nd_number} onChange={handleChange}
                            required
                            disabled={isEditing}
                            className="font-mono bg-[#0f172a]/50"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="category">Category <span className="text-red-400">*</span></Label>
                        <select
                            id="category" name="category"
                            value={formData.category} onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-[#0f172a]/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-white/10 text-white"
                        >
                            <option value="business">Business</option>
                            <option value="technical">Technical</option>
                            <option value="guidance">Guidance</option>
                            <option value="order">Order/Instruction</option>
                            <option value="access">Access</option>
                            <option value="other">Other</option>
                        </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="title">Subject / Title <span className="text-red-400">*</span></Label>
                        <Input
                            id="title" name="title"
                            placeholder="Brief description of the ND content"
                            value={formData.title} onChange={handleChange}
                            required
                            className="bg-[#0f172a]/50"
                        />
                    </div>
                </div>
            </div>

            {/* Section: Details */}
            <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#64748b] border-b border-white/5 pb-2">
                    Details
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="sender">Sender (From) <span className="text-red-400">*</span></Label>
                        <StakeholderCombobox
                            id="sender"
                            value={formData.sender}
                            onValueChange={(name, stakeholderId) => {
                                setFormData(prev => ({ ...prev, sender: name, sender_id: stakeholderId }));
                            }}
                            placeholder="Search stakeholder or type name..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="receiver">Receiver (To) <span className="text-red-400">*</span></Label>
                        <StakeholderCombobox
                            id="receiver"
                            value={formData.receiver}
                            onValueChange={(name, stakeholderId) => {
                                setFormData(prev => ({ ...prev, receiver: name, receiver_id: stakeholderId }));
                            }}
                            placeholder="Search stakeholder or type name..."
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="pic">Person In Charge (PIC) <span className="text-red-400">*</span></Label>
                        <Textarea
                            id="pic" name="pic"
                            placeholder="Names of PIC (separate with new lines)"
                            value={formData.pic} onChange={handleChange}
                            required
                            className="bg-[#0f172a]/50 min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="deadline">Deadline</Label>
                        <Input
                            id="deadline" name="deadline"
                            type="date"
                            value={formData.deadline ? new Date(formData.deadline).toISOString().split('T')[0] : ''}
                            onChange={handleChange}
                            className="bg-[#0f172a]/50 [color-scheme:dark]"
                        />
                    </div>
                </div>
            </div>

            {/* Section: Status */}
            <div className="space-y-4">
                <h3 className="text-xs font-mono uppercase tracking-wider text-[#64748b] border-b border-white/5 pb-2">
                    Status & Action
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="status">Status <span className="text-red-400">*</span></Label>
                        <select
                            id="status" name="status"
                            value={formData.status} onChange={handleChange}
                            className="flex h-10 w-full rounded-md border border-input bg-[#0f172a]/50 px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 border-white/10 text-white"
                        >
                            <option value="drafting">Drafting</option>
                            <option value="waiting_internal">Waiting Internal</option>
                            <option value="waiting_external">Waiting External</option>
                            <option value="issued">Issued</option>
                            <option value="escalated">Escalated</option>
                            <option value="clear">Clear</option>
                        </select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="next_action">Next Action <span className="text-red-400">*</span></Label>
                        <Textarea
                            id="next_action" name="next_action"
                            placeholder="What needs to be done next? (separate actions with new lines)"
                            value={formData.next_action} onChange={handleChange}
                            required
                            className="bg-[#0f172a]/50 min-h-[80px]"
                        />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                        <Label htmlFor="blocker_description">Blocker / Issues (Optional)</Label>
                        <Textarea
                            id="blocker_description" name="blocker_description"
                            placeholder="Describe any blockers if applicable"
                            value={formData.blocker_description || ''} onChange={handleChange}
                            className="bg-[#0f172a]/50 min-h-[80px]"
                        />
                    </div>
                </div>
            </div>

            <div className="pt-4 flex items-center justify-end gap-3">
                {onCancel && (
                    <Button type="button" variant="ghost" onClick={onCancel} className="text-[#94a3b8] hover:text-white">
                        Cancel
                    </Button>
                )}
                <Button type="submit" disabled={loading} className="bg-caneris-cyan text-black hover:bg-caneris-cyan/90 font-bold min-w-[120px]">
                    {loading ? 'Saving...' : (isEditing ? 'Update ND' : 'Create ND')}
                    {!loading && <Save className="w-4 h-4 ml-2" />}
                </Button>
            </div>

        </form>
    );
}
