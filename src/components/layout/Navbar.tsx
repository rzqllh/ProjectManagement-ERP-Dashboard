
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
    LayoutDashboard,
    FileText,
    Scale,
    Users,
    Share2,
    Brain,
    Settings,
    Briefcase
} from 'lucide-react';

const routes = [
    {
        label: 'Dashboard',
        href: '/dashboard',
        icon: LayoutDashboard,
        color: 'text-sky-500',
    },
    {
        label: 'ND Records',
        href: '/nd',
        icon: FileText,
        color: 'text-violet-500',
    },
    {
        label: 'Projects',
        href: '/projects',
        icon: Briefcase,
        color: 'text-blue-500',
    },
    {
        label: 'Decisions',
        href: '/decisions',
        icon: Scale,
        color: 'text-pink-700',
    },
    {
        label: 'Stakeholders',
        href: '/stakeholders',
        icon: Users,
        color: 'text-orange-700',
    },
    {
        label: 'Graph',
        href: '/graph',
        icon: Share2,
        color: 'text-emerald-500',
    },
    {
        label: 'AI Brain',
        href: '/ai',
        icon: Brain,
        color: 'text-amber-500',
    },
    {
        label: 'Settings',
        href: '/settings',
        icon: Settings,
        color: 'text-gray-500',
    },
];

export function Navbar() {
    const pathname = usePathname();

    return (
        <nav className="hidden md:flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
            {routes.map((route) => {
                const isActive = pathname === route.href || pathname?.startsWith(`${route.href}/`);

                return (
                    <Link
                        key={route.href}
                        href={route.href}
                        className={cn(
                            "group flex items-center gap-x-2 px-3 py-2 text-xs font-medium rounded-lg transition-all duration-200 hover:bg-white/5 active:scale-95",
                            isActive
                                ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)]"
                                : "text-slate-400 hover:text-white"
                        )}
                    >
                        <route.icon className={cn("w-4 h-4 transition-colors", isActive ? route.color : "text-slate-500 group-hover:text-white")} />
                        <span>{route.label}</span>
                    </Link>
                );
            })}
        </nav>
    );
}
