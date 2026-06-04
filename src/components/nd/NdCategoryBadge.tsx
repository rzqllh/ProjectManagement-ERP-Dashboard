import { NdCategory } from '@/types/nd';
import { cn } from '@/lib/utils';

const CATEGORY_CONFIG: Record<NdCategory, { label: string; color: string }> = {
    'business': { label: 'Business', color: 'text-blue-400' },
    'technical': { label: 'Technical', color: 'text-cyan-400' },
    'guidance': { label: 'Guidance', color: 'text-purple-400' },
    'order': { label: 'Order/Instruction', color: 'text-emerald-400' },
    'access': { label: 'Access', color: 'text-amber-400' },
    'other': { label: 'Other', color: 'text-slate-400' }
};

export function NdCategoryBadge({ category, className }: { category: NdCategory | string; className?: string }) {
    const config = CATEGORY_CONFIG[category as NdCategory] || { label: category, color: 'text-gray-400' };

    return (
        <div className={cn("flex items-center gap-1.5", className)}>
            <div className={cn("w-1.5 h-1.5 rounded-full", config.color.replace('text-', 'bg-'))} />
            <span className={cn("text-xs font-medium", config.color)}>
                {config.label}
            </span>
        </div>
    );
}
