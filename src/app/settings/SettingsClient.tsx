'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { SettingsForm } from '@/features/settings/components/SettingsForm';

export default function SettingsClient() {
    const router = useRouter();
    const supabase = createClient();
    const [profile, setProfile] = useState<any>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/'); return; }
            const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (!prof) { router.replace('/onboarding'); return; }
            setProfile(prof);
            setLoading(false);
        }
        fetch();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="w-10 h-10 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    if (!profile) return null;

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative safe-area-pad">
            <div className="absolute top-[-10%] right-[-10%] w-[400px] h-[400px] bg-[var(--accent-secondary)] rounded-full blur-[180px] opacity-15 pointer-events-none animate-float" />
            <header className="mb-8 animate-slide-up">
                <a href="/dashboard" className="inline-flex items-center gap-2 text-[var(--text-secondary)] hover:text-white transition-colors mb-4">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
                    </svg>
                    Back to Dashboard
                </a>
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Settings</h1>
                <p className="text-[var(--text-secondary)] mt-1">Manage your profile and training program</p>
            </header>
            <SettingsForm profile={profile} />
        </div>
    );
}
