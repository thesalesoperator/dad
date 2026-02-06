import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { WorkoutRecorder } from '@/features/workouts/components/WorkoutRecorder';

export default async function WorkoutPage({ params }: { params: { id: string } }) {
    const supabase = await createClient();
    const { id } = await params;

    // Fetch Workout Details including Exercises
    const { data: workout } = await supabase
        .from('workouts')
        .select(`
      *,
      workout_exercises (
        *,
        exercise:exercises (*)
      )
    `)
        .eq('id', id)
        .single();

    if (!workout) return <div>Workout not found</div>;

    // Sort exercises by order
    const exercises = workout.workout_exercises.sort((a: any, b: any) => a.order - b.order);

    return (
        <div className="min-h-screen p-6 pb-32 relative">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-primary)] rounded-full blur-[120px] opacity-10 pointer-events-none" />

            <Link href="/dashboard" className="text-[var(--text-secondary)] font-medium text-xs uppercase mb-6 block hover:text-white transition-colors tracking-wide">
                ← Return to Command
            </Link>

            <header className="mb-8 relative z-10">
                <h1 className="text-4xl font-bold text-white mb-3 tracking-tight">{workout.name}</h1>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-[var(--accent-primary)] uppercase border border-white/10 backdrop-blur-sm">
                        {exercises.length} Exercises
                    </span>
                    <span className="px-3 py-1 bg-white/5 rounded-full text-xs font-semibold text-[var(--accent-secondary)] uppercase border border-white/10 backdrop-blur-sm">
                        {Math.round(exercises.length * 5)} Min Est.
                    </span>
                </div>
            </header>

            <WorkoutRecorder workout={workout} exercises={exercises} />
        </div>
    );
}
