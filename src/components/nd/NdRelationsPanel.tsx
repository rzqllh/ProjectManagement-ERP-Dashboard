"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Link2, Trash2, ArrowRight, AlertTriangle, ShieldAlert, GitBranch, Share2 } from "lucide-react";
import { NdStatusBadge } from "./NdStatusBadge";

interface RelationItem {
    edge_id: string;
    type: string;
    direction: 'outgoing' | 'incoming';
    nd: {
        id: string;
        nd_number: string;
        title: string;
        status: any;
    };
}

interface RelationsData {
    blocked_by: RelationItem[];
    blocking: RelationItem[];
    parents: RelationItem[];
    children: RelationItem[];
    related: RelationItem[];
}

export function NdRelationsPanel() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [data, setData] = useState<RelationsData | null>(null);
    const [loading, setLoading] = useState(true);
    const [dialogOpen, setDialogOpen] = useState(false);

    // Form
    const [targetNdId, setTargetNdId] = useState("");
    const [relType, setRelType] = useState("references");
    const [submitting, setSubmitting] = useState(false);

    const fetchRelations = async () => {
        try {
            const res = await fetch(`/api/nd/${id}/relations`);
            if (res.ok) {
                const json = await res.json();
                setData(json.data);
            }
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (id) fetchRelations();
    }, [id]);

    const handleAdd = async () => {
        if (!targetNdId) return;
        setSubmitting(true);
        try {
            const res = await fetch(`/api/nd/${id}/relations`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    targetId: targetNdId,
                    type: relType
                })
            });

            if (!res.ok) throw new Error("Failed to add relation");

            setDialogOpen(false);
            setTargetNdId("");
            fetchRelations();
        } catch (e) {
            console.error(e);
            alert("Failed to add link. Check ID.");
        } finally {
            setSubmitting(false);
        }
    };

    const handleRemove = async (edgeId: string) => {
        if (!confirm("Are you sure you want to remove this link?")) return;
        try {
            const res = await fetch(`/api/nd/${id}/relations?edgeId=${edgeId}`, {
                method: 'DELETE'
            });
            if (res.ok) fetchRelations();
        } catch (e) {
            console.error(e);
        }
    };

    if (loading) return <div className="p-4 text-xs text-white/50">Loading connections...</div>;

    const hasRelations = data && (
        data.blocked_by.length > 0 ||
        data.blocking.length > 0 ||
        data.parents.length > 0 ||
        data.children.length > 0 ||
        data.related.length > 0
    );

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white uppercase tracking-wide flex items-center gap-2">
                    <Share2 className="w-4 h-4 text-caneris-cyan" />
                    Connections Graph
                </h3>
                <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="h-7 text-xs gap-1">
                            <Link2 className="w-3 h-3" /> Connect ND
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                        <DialogHeader>
                            <DialogTitle>Connect Another ND</DialogTitle>
                            <DialogDescription>
                                Create a dependency or reference link.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label>Target ND ID</Label>
                                <Input
                                    placeholder="Paste ND ID here..."
                                    value={targetNdId}
                                    onChange={e => setTargetNdId(e.target.value)}
                                />
                                <p className="text-[10px] text-muted-foreground">Tip: Copy ID from url or list.</p>
                            </div>
                            <div className="grid gap-2">
                                <Label>Relationship Type</Label>
                                <Select value={relType} onValueChange={setRelType}>
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="references">References (Related info)</SelectItem>
                                        <SelectItem value="blocks">Blocks (This ND blocks target)</SelectItem>
                                        <SelectItem value="triggers">Triggers (This starts target)</SelectItem>
                                        <SelectItem value="parent_of">Parent Of (This is parent)</SelectItem>
                                        <SelectItem value="escalates_to">Escalates To</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button onClick={handleAdd} disabled={submitting}>
                                {submitting ? "Linking..." : "Add Link"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            {!hasRelations && (
                <div className="text-center p-8 border border-dashed border-white/10 rounded-xl bg-white/[0.02]">
                    <GitBranch className="w-8 h-8 text-white/20 mx-auto mb-2" />
                    <p className="text-xs text-white/50">No linked NDs found.</p>
                </div>
            )}

            {data && (
                <div className="space-y-4">
                    {/* Blocked By - Critical */}
                    {data.blocked_by.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-mono text-red-400 font-bold uppercase tracking-wider flex items-center gap-1">
                                <ShieldAlert className="w-3 h-3" /> Blocked By
                            </p>
                            {data.blocked_by.map(item => (
                                <div key={item.edge_id} className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 flex items-center justify-between group">
                                    <div className="flex items-center gap-3">
                                        <AlertTriangle className="w-4 h-4 text-red-400" />
                                        <div onClick={() => router.push(`/nd/${item.nd.id}`)} className="cursor-pointer hover:underline">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs text-red-200">{item.nd.nd_number}</span>
                                                <NdStatusBadge status={item.nd.status} />
                                            </div>
                                            <p className="text-sm font-medium text-white line-clamp-1">{item.nd.title}</p>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:bg-red-500/20" onClick={() => handleRemove(item.edge_id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Blocking */}
                    {data.blocking.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-mono text-amber-400 font-bold uppercase tracking-wider">
                                🛑 Blocking
                            </p>
                            {data.blocking.map(item => (
                                <div key={item.edge_id} className="glass-card p-3 rounded-lg flex items-center justify-between border-l-2 border-l-amber-500">
                                    <div onClick={() => router.push(`/nd/${item.nd.id}`)} className="cursor-pointer hover:opacity-80">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-white/70">{item.nd.nd_number}</span>
                                            <NdStatusBadge status={item.nd.status} />
                                        </div>
                                        <p className="text-sm text-white">{item.nd.title}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={() => handleRemove(item.edge_id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Children / Sub-NDs */}
                    {data.children.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-mono text-blue-400 font-bold uppercase tracking-wider">
                                ↳ Sub-tasks (Children)
                            </p>
                            {data.children.map(item => (
                                <div key={item.edge_id} className="glass-card p-3 rounded-lg flex items-center justify-between ml-4 border-l border-white/10">
                                    <div onClick={() => router.push(`/nd/${item.nd.id}`)} className="cursor-pointer hover:opacity-80">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-white/70">{item.nd.nd_number}</span>
                                            <NdStatusBadge status={item.nd.status} />
                                        </div>
                                        <p className="text-sm text-white">{item.nd.title}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={() => handleRemove(item.edge_id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Parents */}
                    {data.parents.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-mono text-purple-400 font-bold uppercase tracking-wider">
                                ↑ Parent ND
                            </p>
                            {data.parents.map(item => (
                                <div key={item.edge_id} className="glass-card p-3 rounded-lg flex items-center justify-between border border-purple-500/30">
                                    <div onClick={() => router.push(`/nd/${item.nd.id}`)} className="cursor-pointer hover:opacity-80">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-white/70">{item.nd.nd_number}</span>
                                            <NdStatusBadge status={item.nd.status} />
                                        </div>
                                        <p className="text-sm text-white">{item.nd.title}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={() => handleRemove(item.edge_id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Related / References */}
                    {data.related.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-[10px] font-mono text-[#64748b] font-bold uppercase tracking-wider">
                                🔗 Related
                            </p>
                            {data.related.map(item => (
                                <div key={item.edge_id} className="glass-card p-3 rounded-lg flex items-center justify-between border border-white/5">
                                    <div onClick={() => router.push(`/nd/${item.nd.id}`)} className="cursor-pointer hover:opacity-80">
                                        <div className="flex items-center gap-2 mb-1">
                                            <span className="font-mono text-xs text-white/70">{item.nd.nd_number}</span>
                                            <span className="text-[9px] bg-white/10 px-1 rounded text-white/50">{item.type}</span>
                                        </div>
                                        <p className="text-sm text-white">{item.nd.title}</p>
                                    </div>
                                    <Button variant="ghost" size="icon" className="h-6 w-6 text-white/30 hover:text-red-400" onClick={() => handleRemove(item.edge_id)}>
                                        <Trash2 className="w-3 h-3" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
