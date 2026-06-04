'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { NdForm } from '@/components/nd/NdForm';

export default function CreateNdPage() {
    const router = useRouter();

    const handleSubmit = async (data: any) => {
        const payload = {
            ...data,
            deadline: data.deadline || null,
        };

        const res = await fetch('/api/nd', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
        });

        const json = await res.json();

        if (!res.ok) {
            throw new Error(json.error?.message || 'Failed to create ND');
        }

        // Success -> redirect to detail
        router.push(`/nd/${json.data.id}`);
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 animate-fade-in-up">
            {/* Header */}
            <div className="flex items-center gap-4">
                <Link href="/nd">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-[#94a3b8] hover:text-white hover:bg-white/10">
                        <ArrowLeft className="w-4 h-4" />
                    </Button>
                </Link>
                <div>
                    <h1 className="text-xl font-bold tracking-tight text-white">
                        New ND Record
                    </h1>
                    <p className="text-xs text-[#94a3b8] font-mono">
                        Register a new Nota Dinas into the system.
                    </p>
                </div>
            </div>

            <div className="glass-card p-6 rounded-xl">
                <NdForm onSubmit={handleSubmit} onCancel={() => router.push('/nd')} />
            </div>
        </div>
    );
}
