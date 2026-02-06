import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function ProgressPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/');

    // Fetch Profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile?.onboarding_completed) redirect('/onboarding');

    // Fetch all set logs with exercise info
    const { data: logs } = await supabase
        .from('logs')
        .select(`
            *,
            exercise:exercises (id, name, muscle_group)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    // Group logs by exercise
    const exerciseMap = new Map<string, {
        exercise: { id: string; name: string; muscle_group: string };
        entries: { date: string; weight: number; reps: number; set_number: number }[];
        maxWeight: number;
        totalSets: number;
    }>();

    logs?.forEach(log => {
        if (!log.exercise) return;

        const key = log.exercise.id;
        if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
                exercise: log.exercise,
                entries: [],
                maxWeight: 0,
                totalSets: 0,
            });
        }

        const entry = exerciseMap.get(key)!;
        entry.entries.push({
            date: new Date(log.created_at).toLocaleDateString(),
            weight: log.weight,
            reps: log.reps_completed,
            set_number: log.set_number,
        });
        entry.maxWeight = Math.max(entry.maxWeight, log.weight);
        entry.totalSets++;
    });

    const exerciseData = Array.from(exerciseMap.values()).sort((a, b) =>
        b.totalSets - a.totalSets
    );

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
            {/* Background Ambience */}
            <div className="absolute top-0 left-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[var(--accent-secondary)] rounded-full blur-[100px] sm:blur-[120px] opacity-10 pointer-events-none" />

            <Link href="/dashboard" className="text-[var(--text-secondary)] font-medium text-xs uppercase mb-4 sm:mb-6 block hover:text-white transition-colors tracking-wide">
                ← Back to Dashboard
            </Link>

            <header className="mb-6 sm:mb-8 relative z-10">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight">Progress Tracker</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Your lifting history by exercise</p>
            </header>

            {exerciseData.length > 0 ? (
                <div className="space-y-4 sm:space-y-6 relative z-10">
                    {exerciseData.map(({ exercise, entries, maxWeight, totalSets }) => (
                        <Card key={exercise.id} className="relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--accent-primary)] rounded-full blur-[60px] opacity-10 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="text-lg sm:text-xl font-semibold text-white">{exercise.name}</h3>
                                        <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs uppercase tracking-wider">{exercise.muscle_group}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)]">{maxWeight}</p>
                                        <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs uppercase">Max LBS</p>
                                    </div>
                                </div>

                                {/* Progress Bar */}
                                <div className="mb-4">
                                    <div className="flex justify-between text-[10px] sm:text-xs text-[var(--text-secondary)] mb-1">
                                        <span>{totalSets} sets logged</span>
                                        <span>PR: {maxWeight} lbs</span>
                                    </div>
                                    <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full transition-all duration-500"
                                            style={{ width: `${Math.min((maxWeight / 315) * 100, 100)}%` }}
                                        />
                                    </div>
                                </div>

                                {/* Recent History */}
                                <div className="space-y-2">
                                    <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs uppercase font-semibold tracking-wider">Recent Sets</p>
                                    <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-6 gap-2">
                                        {entries.slice(0, 6).map((entry, i) => (
                                            <div key={i} className="bg-white/5 rounded-lg p-2 text-center border border-white/5">
                                                <p className="text-white font-bold text-sm sm:text-base">{entry.weight}</p>
                                                <p className="text-[var(--text-secondary)] text-[10px]">{entry.reps} reps</p>
                                                <p className="text-[var(--text-secondary)] text-[8px] sm:text-[9px] opacity-60">{entry.date}</p>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="opacity-70 bg-transparent border-dashed border-white/10 text-center py-12 relative z-10">
                    <p className="text-[var(--text-secondary)] font-medium mb-2">No lift data yet</p>
                    <p className="text-[var(--text-secondary)] text-sm opacity-70">Complete a workout and log your sets to see your progress here.</p>
                </Card>
            )}
        </div>
    );
}
