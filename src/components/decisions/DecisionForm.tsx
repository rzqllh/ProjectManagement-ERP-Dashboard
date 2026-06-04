"use client";

import { useForm, ControllerRenderProps } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod"; // Ensure this is installed
import { createDecisionSchema } from "@/services/decision.validation";
import { CreateDecisionInput, UpdateDecisionInput, Decision } from "@/types/decision";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Loader2 } from "lucide-react";

interface DecisionFormProps {
    initialData?: Decision;
    projects?: { id: string; name: string }[];
    nds?: { id: string; nd_number: string; title: string }[];
    onSubmit: (data: CreateDecisionInput | UpdateDecisionInput) => Promise<void>;
    onCancel: () => void;
}

export function DecisionForm({ initialData, projects = [], nds = [], onSubmit, onCancel }: DecisionFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);

    const form = useForm<CreateDecisionInput>({
        resolver: zodResolver(createDecisionSchema),
        defaultValues: {
            title: initialData?.title || "",
            context: initialData?.context || "",
            proposed_solution: initialData?.proposed_solution || "",
            status: initialData?.status || "draft",
            priority: initialData?.priority || "medium",
            decision_type: initialData?.decision_type || "technical",
            pic: initialData?.pic || "",
            related_project_id: initialData?.related_project_id || undefined,
            related_nd_id: initialData?.related_nd_id || undefined,
            tags: initialData?.tags || [],
            attachment_links: initialData?.attachment_links || [],
        },
    });

    const handleSubmit = async (data: CreateDecisionInput) => {
        setIsSubmitting(true);
        try {
            await onSubmit(data);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                    control={form.control}
                    name="title"
                    render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "title"> }) => (
                        <FormItem>
                            <FormLabel>Title</FormLabel>
                            <FormControl>
                                <Input placeholder="Decision title..." {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="priority"
                        render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "priority"> }) => (
                            <FormItem>
                                <FormLabel>Priority</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select priority" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="critical">Critical</SelectItem>
                                        <SelectItem value="high">High</SelectItem>
                                        <SelectItem value="medium">Medium</SelectItem>
                                        <SelectItem value="low">Low</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="status"
                        render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "status"> }) => (
                            <FormItem>
                                <FormLabel>Status</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select status" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="draft">Draft</SelectItem>
                                        <SelectItem value="proposed">Proposed</SelectItem>
                                        <SelectItem value="approved">Approved</SelectItem>
                                        <SelectItem value="rejected">Rejected</SelectItem>
                                        <SelectItem value="implemented">Implemented</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <FormField
                    control={form.control}
                    name="decision_type"
                    render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "decision_type"> }) => (
                        <FormItem>
                            <FormLabel>Type</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select type" />
                                    </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                    <SelectItem value="technical">Technical</SelectItem>
                                    <SelectItem value="commercial">Commercial</SelectItem>
                                    <SelectItem value="governance">Governance</SelectItem>
                                    <SelectItem value="risk">Risk</SelectItem>
                                    <SelectItem value="strategic">Strategic</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="context"
                    render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "context"> }) => (
                        <FormItem>
                            <FormLabel>Context / Problem Statement</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Describe the context..." className="h-24" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="proposed_solution"
                    render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "proposed_solution"> }) => (
                        <FormItem>
                            <FormLabel>Proposed Solution</FormLabel>
                            <FormControl>
                                <Textarea placeholder="Proposed solution..." className="h-24" {...field} value={field.value || ''} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="pic"
                        render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "pic"> }) => (
                            <FormItem>
                                <FormLabel>PIC</FormLabel>
                                <FormControl>
                                    <Input placeholder="Person in charge" {...field} value={field.value || ''} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="grid grid-cols-2 gap-4">
                    <FormField
                        control={form.control}
                        name="related_project_id"
                        render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "related_project_id"> }) => (
                            <FormItem>
                                <FormLabel>Related Project</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "undefined"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select project" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="undefined">None</SelectItem>
                                        {projects.map((p) => (
                                            <SelectItem key={p.id} value={p.id}>
                                                {p.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />

                    <FormField
                        control={form.control}
                        name="related_nd_id"
                        render={({ field }: { field: ControllerRenderProps<CreateDecisionInput, "related_nd_id"> }) => (
                            <FormItem>
                                <FormLabel>Related ND</FormLabel>
                                <Select onValueChange={field.onChange} defaultValue={field.value || "undefined"}>
                                    <FormControl>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select ND" />
                                        </SelectTrigger>
                                    </FormControl>
                                    <SelectContent>
                                        <SelectItem value="undefined">None</SelectItem>
                                        {nds.map((n) => (
                                            <SelectItem key={n.id} value={n.id}>
                                                {n.nd_number}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                <FormMessage />
                            </FormItem>
                        )}
                    />
                </div>

                <div className="flex justify-end gap-3 pt-4">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={isSubmitting}>
                        Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                        {initialData ? "Update" : "Create"} Decision
                    </Button>
                </div>
            </form>
        </Form>
    );
}
