import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen caneris-grid-bg text-center p-4">
            {/* Ambient glow */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-caneris-purple/5 rounded-full blur-[150px]" />
            </div>

            <div className="relative z-10 animate-fade-in-up">
                <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-caneris-purple mb-4">
                    Signal Lost
                </p>
                <h1 className="text-8xl font-black gradient-text-accent mb-4">
                    404
                </h1>
                <h2 className="text-xl font-semibold text-white mb-2">
                    Route Not Found
                </h2>
                <p className="text-sm text-[#4b5563] mb-8 max-w-sm mx-auto">
                    The requested endpoint does not exist or has been decommissioned.
                </p>
                <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 bg-caneris-cyan hover:bg-caneris-cyan/90 text-[#0a0e1a] font-semibold text-sm px-6 py-2.5 rounded-lg transition-all duration-200 hover:shadow-[0_0_20px_rgba(6,214,160,0.3)]"
                >
                    Return to Command Center
                </Link>
            </div>
        </div>
    );
}
