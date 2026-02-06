import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { redirect } from 'next/navigation';
import Link from 'next/link';

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
        <div className="min-h-screen bg-[var(--color-dark)] p-6 pb-32">
            <Link href="/dashboard" className="text-[var(--color-text-muted)] font-bold text-xs uppercase mb-6 block hover:text-white transition-colors">
                ← Abort Mission
            </Link>

            <header className="mb-8">
                <h1 className="text-5xl text-white mb-2 leading-[0.85]">{workout.name}</h1>
                <div className="flex gap-2">
                    <span className="px-3 py-1 bg-[var(--color-surface)] rounded-full text-xs font-bold text-[var(--color-primary)] uppercase border border-[var(--color-primary)]">
                        {exercises.length} Exercises
                    </span>
                    <span className="px-3 py-1 bg-[var(--color-surface)] rounded-full text-xs font-bold text-[var(--color-accent)] uppercase border border-[var(--color-accent)]">
                        {Math.round(exercises.length * 5)} Min Est.
                    </span>
                </div>
            </header>

            <div className="space-y-6">
                {exercises.map((item: any, index: number) => (
                    <Card key={item.id} className="relative group overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10 text-6xl font-[var(--font-display)] text-[var(--color-primary)] pointer-events-none">
                            {index + 1}
                        </div>

                        <div className="relative z-10">
                            <h3 className="text-2xl text-white mb-1">{item.exercise.name}</h3>
                            <div className="flex gap-4 text-sm font-bold text-[var(--color-text-muted)] uppercase mb-4">
                                <span>{item.sets} Sets</span>
                                <span>{item.reps} Reps</span>
                                <span>{item.rest_seconds}s Rest</span>
                            </div>

                            <div className="grid grid-cols-[1fr,1fr,auto] gap-2 items-center">
                                <div className="bg-[#1C1C1E] rounded-[var(--radius-sm)] p-3 text-center border border-[#3A3A3C]">
                                    <span className="block text-[10px] text-[var(--color-text-muted)] uppercase font-bold">LBS</span>
                                    <span className="text-xl text-white font-[var(--font-display)]">-</span>
                                </div>
                                <div className="bg-[#1C1C1E] rounded-[var(--radius-sm)] p-3 text-center border border-[#3A3A3C]">
                                    <span className="block text-[10px] text-[var(--color-text-muted)] uppercase font-bold">REPS</span>
                                    <span className="text-xl text-white font-[var(--font-display)]">-</span>
                                </div>
                                <button className="h-full px-4 bg-[var(--color-surface)] border border-[#3A3A3C] rounded-[var(--radius-sm)] text-[var(--color-accent)] hover:bg-[var(--color-accent)] hover:text-black transition-colors">
                                    ✓
                                </button>
                            </div>
                        </div>
                    </Card>
                ))}
            </div>

            <div className="fixed bottom-6 left-6 right-6">
                <Button fullWidth size="lg" className="shadow-[0_0_40px_rgba(255,59,48,0.5)] border-2 border-[var(--color-primary)]">
                    COMPLETE SESSION
                </Button>
            </div>
        </div>
    );
}
