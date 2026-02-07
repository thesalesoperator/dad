'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface AuthState {
    user: any | null;
    profile: any | null;
    loading: boolean;
}

/**
 * Client-side auth hook for mobile (static export) context.
 * Handles authentication check, profile fetch, and redirects.
 */
export function useAuth(options?: { requireOnboarding?: boolean }) {
    const [state, setState] = useState<AuthState>({ user: null, profile: null, loading: true });
    const router = useRouter();
    const supabase = createClient();

    useEffect(() => {
        let cancelled = false;
        async function init() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.replace('/');
                return;
            }

            const { data: profile } = await supabase
                .from('users')
                .select('*')
                .eq('id', user.id)
                .single();

            if (!profile && options?.requireOnboarding !== false) {
                router.replace('/onboarding');
                return;
            }

            if (!cancelled) {
                setState({ user, profile, loading: false });
            }
        }
        init();
        return () => { cancelled = true; };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    return state;
}
