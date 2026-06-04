import { Skeleton } from "@/components/ui/skeleton";

export default function DashboardLoading() {
    return (
        <div className="space-y-6 p-6 animate-pulse">
            {/* Header Skeleton */}
            <div className="flex justify-between items-center mb-8">
                <div className="space-y-2">
                    <Skeleton className="h-8 w-64 bg-slate-800" />
                    <Skeleton className="h-4 w-48 bg-slate-800/50" />
                </div>
                <Skeleton className="h-10 w-32 bg-slate-800" />
            </div>

            {/* Red Zone Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Skeleton className="h-48 w-full bg-slate-800/20 border border-slate-800 rounded-xl" />
                <Skeleton className="h-48 w-full bg-slate-800/20 border border-slate-800 rounded-xl" />
                <Skeleton className="h-48 w-full bg-slate-800/20 border border-slate-800 rounded-xl" />
            </div>

            {/* Performance Zone Skeleton */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Skeleton className="h-64 w-full bg-slate-800/30 rounded-xl" />
                <Skeleton className="h-64 w-full bg-slate-800/30 rounded-xl" />
            </div>

            {/* Log Zone Skeleton */}
            <Skeleton className="h-80 w-full bg-slate-800/30 rounded-xl" />
        </div>
    );
}
