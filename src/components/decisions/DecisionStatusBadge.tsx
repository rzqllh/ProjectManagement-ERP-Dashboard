import { Badge } from "@/components/ui/badge";
import { DecisionStatus } from "@/types/decision";

interface DecisionStatusBadgeProps {
    status: DecisionStatus;
    className?: string;
}

export function DecisionStatusBadge({ status, className }: DecisionStatusBadgeProps) {
    const variants: Record<DecisionStatus, "default" | "secondary" | "destructive" | "outline" | "success" | "warning"> = {
        draft: "secondary",
        proposed: "outline",
        approved: "success",
        rejected: "destructive",
        implemented: "default",
    };

    const variant = variants[status] || "secondary";

    // Shadcn Badge doesn't have 'success' or 'warning' by default, so we map them to custom classes if needed or use existing variants
    // Assuming we have custom variants or we style them manually. 
    // For now, let's map to existing shadcn variants and add color classes.

    const colorClasses: Record<DecisionStatus, string> = {
        draft: "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200",
        proposed: "bg-blue-50 text-blue-600 hover:bg-blue-100 border-blue-200",
        approved: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border-emerald-200",
        rejected: "bg-red-50 text-red-600 hover:bg-red-100 border-red-200",
        implemented: "bg-violet-50 text-violet-600 hover:bg-violet-100 border-violet-200",
    };

    const labels: Record<DecisionStatus, string> = {
        draft: "Draft",
        proposed: "Proposed",
        approved: "Approved",
        rejected: "Rejected",
        implemented: "Implemented",
    };

    return (
        <Badge
            variant="outline"
            className={`${colorClasses[status]} ${className}`}
        >
            {labels[status]}
        </Badge>
    );
}
