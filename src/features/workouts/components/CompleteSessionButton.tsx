'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

export function CompleteSessionButton({ workoutId }: { workoutId: string }) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error } = await supabase.from('workout_logs').insert({
                user_id: user.id,
                workout_id: workoutId,
                completed_at: new Date().toISOString(),
                duration_seconds: 3600 // Mock duration for now
            });

            if (error) throw error;

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Failed to complete session:', error);
            alert('Failed to save session. Check console for details.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Button
            fullWidth
            size="lg"
            className="shadow-[0_0_40px_-10px_var(--accent-glow)]"
            onClick={handleComplete}
            disabled={loading}
        >
            {loading ? 'SAVING...' : 'COMPLETE SESSION'}
        </Button>
    );
}
