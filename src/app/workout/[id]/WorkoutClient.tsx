'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';
import { WorkoutRecorder } from '@/features/workouts/components/WorkoutRecorder';
import { getProgressionRecommendationsClient } from '@/features/workouts/actions/computeProgression.client';

export default function WorkoutClient() {
    const router = useRouter();
    const params = useParams();
    const id = params.id as string;
    const supabase = createClient();
    const [workout, setWorkout] = useState<any>(null);
    const [exercises, setExercises] = useState<any[]>([]);
    const [progressionData, setProgressionData] = useState<Record<string, any>>({});
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetch() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/'); return; }

            const { data: wk } = await supabase
                .from('workouts')
                .select(`*, workout_exercises (*, exercise:exercises (*))`)
                .eq('id', id)
                .single();

            if (!wk) { setLoading(false); return; }

            const sorted = wk.workout_exercises.sort((a: any, b: any) => a.order - b.order);
            setWorkout(wk);
            setExercises(sorted);

            const exerciseIds = sorted.map((e: any) => e.exercise?.id).filter(Boolean);
            if (exerciseIds.length > 0) {
                const prog = await getProgressionRecommendationsClient(user.id, exerciseIds);
                setProgressionData(prog);
            }
            setLoading(false);
        }
        fetch();
    }, [id]); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] text-sm font-mono">LOADING WORKOUT...</p>
                </div>
            </div>
        );
    }

    if (!workout) {
        return <div className="min-h-screen flex items-center justify-center text-white">Workout not found</div>;
    }

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative safe-area-pad">
            <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[var(--accent-primary)] rounded-full blur-[100px] sm:blur-[120px] opacity-10 pointer-events-none" />
            <Link href="/dashboard" className="text-[var(--text-secondary)] font-medium text-xs uppercase mb-4 sm:mb-6 block hover:text-white transition-colors tracking-wide">
                ← Back to Dashboard
            </Link>
            <header className="mb-6 sm:mb-8 relative z-10">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2 sm:mb-3 tracking-tight">{workout.name}</h1>
                <div className="flex flex-wrap gap-2">
                    <span className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-[10px] sm:text-xs font-semibold text-[var(--accent-primary)] uppercase border border-white/10 backdrop-blur-sm">
                        {exercises.length} Exercises
                    </span>
                    <span className="px-2 sm:px-3 py-1 bg-white/5 rounded-full text-[10px] sm:text-xs font-semibold text-[var(--accent-secondary)] uppercase border border-white/10 backdrop-blur-sm">
                        ~{Math.round(exercises.length * 5)} Min
                    </span>
                    {Object.keys(progressionData).length > 0 && (
                        <span className="px-2 sm:px-3 py-1 bg-[var(--accent-tertiary)]/10 rounded-full text-[10px] sm:text-xs font-semibold text-[var(--accent-tertiary)] uppercase border border-[var(--accent-tertiary)]/20 backdrop-blur-sm">
                            AI Loaded
                        </span>
                    )}
                </div>
            </header>
            <WorkoutRecorder workout={workout} exercises={exercises} progressionData={progressionData} />
        </div>
    );
}
