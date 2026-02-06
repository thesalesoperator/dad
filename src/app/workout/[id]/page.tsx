import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CompleteSessionButton } from '@/features/workouts/components/CompleteSessionButton';

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

            <div className="space-y-6 relative z-10">
                {exercises.map((item: any, index: number) => (
                    <Card key={item.id} className="relative group">
                        <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-bold text-white pointer-events-none select-none">
                            {index + 1}
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-xl font-semibold text-white mb-1">{item.exercise.name}</h3>
                            <div className="flex gap-4 text-xs font-medium text-[var(--text-secondary)] uppercase mb-4 tracking-wide">
                                <span>{item.sets} Sets</span>
                                <span>{item.reps} Reps</span>
                                <span>{item.rest_seconds}s Rest</span>
                            </div>

                            <div className="grid grid-cols-[1fr,1fr,auto] gap-3 items-center">
                                <div className="bg-white/5 rounded-[var(--radius-sm)] p-3 text-center border border-white/10 focus-within:border-[var(--accent-primary)] transition-colors">
                                    <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">LBS</span>
                                    <input type="number" placeholder="-" className="w-full bg-transparent text-center text-lg text-white font-medium outline-none placeholder:text-white/20" />
                                </div>
                                <div className="bg-white/5 rounded-[var(--radius-sm)] p-3 text-center border border-white/10 focus-within:border-[var(--accent-primary)] transition-colors">
                                    <span className="block text-[10px] text-[var(--text-secondary)] uppercase font-semibold mb-1">REPS</span>
                                    <input type="number" placeholder="-" className="w-full bg-transparent text-center text-lg text-white font-medium outline-none placeholder:text-white/20" />
                                </div>
                                <button className="h-full aspect-square bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-[var(--radius-sm)] text-[var(--accent-primary)] hover:bg-[var(--accent-primary)] hover:text-white transition-all flex items-center justify-center">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-6 left-6 right-6 z-20">
                <CompleteSessionButton workoutId={id} />
            </div>
        </div>
    );
}
