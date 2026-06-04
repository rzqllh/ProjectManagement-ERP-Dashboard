'use client';

import { useAuth } from '@/components/providers/auth-provider';
import { Button } from '@/components/ui/button';
import { Navbar } from '@/components/layout/Navbar';

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, signOut } = useAuth();

    return (
        <div className="min-h-screen caneris-grid-bg">
            {/* Command Bar */}
            <header className="sticky top-0 z-50 glass-card border-b border-white/5 backdrop-blur-lg">
                <div className="flex items-center justify-between h-18 px-6 ">
                    <div className="flex items-center gap-4">
                        {/* Brand */}
                        <div className="flex items-center gap-2.5">
                            <div className="relative">
                                <div className="w-2 h-2 rounded-full bg-caneris-cyan" />
                                <div className="absolute inset-0 w-2 h-2 rounded-full bg-caneris-cyan pulse-dot" />
                            </div>
                            <h1 className="text-sm font-bold tracking-tight">
                                <span className="gradient-text">CANERIS</span>
                                <span className="text-[#4b5563] ml-1.5 text-xs font-normal">ERP</span>
                            </h1>
                        </div>

                        {/* Separator */}
                        <div className="w-px h-6 bg-white/10 mx-2" />

                        <Navbar />
                    </div>

                    <div className="flex items-center gap-3">
                        {/* User chip */}
                        <div className="hidden sm:flex items-center gap-2 bg-white/5 px-3 py-1.5 rounded-lg">
                            <div className="w-1.5 h-1.5 rounded-full bg-caneris-cyan" />
                            <span className="text-xs text-[#94a3b8] font-mono">
                                {user?.email?.split('@')[0] ?? 'operator'}
                            </span>
                        </div>
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={signOut}
                            className="text-[#64748b] hover:text-red-400 hover:bg-red-500/10 text-xs h-8 px-3"
                        >
                            Disconnect
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="p-4 md:p-6 lg:p-8 max-w-[1600px] mx-auto">
                {children}
            </main>
        </div >
    );
}
