'use client';

import { ProjectSection, UpdateSectionInput } from '@/types/project';
import { SectionCard } from './SectionCard';

interface ProjectBoardProps {
    sections: ProjectSection[];
    projectId: string;
    onSectionUpdate: (sectionId: string, data: UpdateSectionInput) => Promise<void>;
}

export function ProjectBoard({ sections, projectId, onSectionUpdate }: ProjectBoardProps) {
    const completedCount = sections.filter(s => s.status === 'done').length;
    const blockedCount = sections.filter(s => s.status === 'blocked').length;
    const totalCount = sections.length;
    const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

    return (
        <div className="space-y-4">
            {/* Progress Header */}
            <div className="glass-card rounded-xl p-4 border border-white/5">
                <div className="flex items-center justify-between mb-3">
                    <div>
                        <span className="text-xs font-medium text-slate-400">Phase Progress</span>
                        <div className="text-lg font-bold text-white mt-0.5">
                            {completedCount} / {totalCount}
                            <span className="text-xs text-slate-500 ml-2 font-normal">sections complete</span>
                        </div>
                    </div>
                    <div className="text-right">
                        <span className="text-2xl font-bold gradient-text">{progressPercent}%</span>
                        {blockedCount > 0 && (
                            <div className="text-[10px] text-red-400 mt-0.5">{blockedCount} blocked</div>
                        )}
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                        className="h-full rounded-full bg-gradient-to-r from-caneris-cyan to-caneris-blue transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>

                {/* Mini Status Legend */}
                <div className="flex items-center gap-4 mt-2.5">
                    {([
                        { status: 'done', label: 'Done', color: 'bg-caneris-cyan' },
                        { status: 'in_progress', label: 'In Progress', color: 'bg-blue-400' },
                        { status: 'blocked', label: 'Blocked', color: 'bg-red-400' },
                        { status: 'not_started', label: 'Not Started', color: 'bg-slate-500' },
                    ] as const).map(item => {
                        const count = sections.filter(s => s.status === item.status).length;
                        return (
                            <div key={item.status} className="flex items-center gap-1.5">
                                <div className={`w-2 h-2 rounded-full ${item.color}`} />
                                <span className="text-[10px] text-slate-500">{item.label} ({count})</span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Section Cards */}
            <div className="space-y-2">
                {sections.map((section, index) => (
                    <div key={section.id} className="animate-fade-in-up" style={{ animationDelay: `${index * 0.05}s` }}>
                        <SectionCard
                            section={section}
                            onUpdate={onSectionUpdate}
                        />
                    </div>
                ))}
            </div>
        </div>
    );
}
