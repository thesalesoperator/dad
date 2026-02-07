import { Card } from '@/components/ui/Card';
import Link from 'next/link';
import ProgressClient from './ProgressClient';

const isMobile = process.env.NEXT_PUBLIC_MOBILE === 'true';

export default async function ProgressPage() {
    if (isMobile) {
        return <ProgressClient />;
    }

    const { createClient } = await import('@/lib/supabase/server');
    const { redirect } = await import('next/navigation');
    const { computeStreak } = await import('@/features/workouts/actions/streaksAndPRs');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) { redirect('/'); return; }

    // Fetch all workout logs for heatmap
    const { data: workoutLogs } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false });

    // Fetch exercise logs for performance tracking
    const { data: exerciseLogs } = await supabase
        .from('logs')
        .select('*, exercise:exercises(id, name, muscle_group)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(200);

    // Fetch PRs
    const { data: prAchievements } = await supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', user.id)
        .eq('achievement_type', 'pr_weight')
        .order('achieved_at', { ascending: false })
        .limit(20);

    // Fetch progression recommendations
    const { data: progressionRecs } = await supabase
        .from('progression_recommendations')
        .select('*, exercise:exercises(id, name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

    const streakData = await computeStreak(user.id);

    // --- Build Heatmap Data (last 52 weeks) ---
    const heatmapData = buildHeatmapData(workoutLogs || []);

    // --- Group exercises by name for performance trends ---
    const exerciseMap = new Map<string, {
        name: string;
        muscle_group: string;
        sessions: { date: string; maxWeight: number; totalVolume: number; avgReps: number }[];
    }>();

    exerciseLogs?.forEach(log => {
        if (!log.exercise) return;
        const key = log.exercise.id;
        if (!exerciseMap.has(key)) {
            exerciseMap.set(key, {
                name: log.exercise.name,
                muscle_group: log.exercise.muscle_group,
                sessions: []
            });
        }
        const dateStr = new Date(log.created_at).toISOString().split('T')[0];
        const entry = exerciseMap.get(key)!;
        const existingSession = entry.sessions.find(s => s.date === dateStr);
        if (existingSession) {
            existingSession.maxWeight = Math.max(existingSession.maxWeight, log.weight || 0);
            existingSession.totalVolume += (log.weight || 0) * (log.reps_completed || 0);
            existingSession.avgReps = (existingSession.avgReps + (log.reps_completed || 0)) / 2;
        } else {
            entry.sessions.push({
                date: dateStr,
                maxWeight: log.weight || 0,
                totalVolume: (log.weight || 0) * (log.reps_completed || 0),
                avgReps: log.reps_completed || 0
            });
        }
    });

    // Sort sessions by date
    exerciseMap.forEach(entry => entry.sessions.sort((a, b) => a.date.localeCompare(b.date)));

    // Get top exercises by frequency
    const topExercises = Array.from(exerciseMap.entries())
        .sort(([, a], [, b]) => b.sessions.length - a.sessions.length)
        .slice(0, 8);

    // PR set for badge marking
    const prExerciseIds = new Set(prAchievements?.map(pr => pr.achievement_value?.exercise_id) || []);

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative">
            {/* Background */}
            <div className="absolute top-[-20%] right-[-10%] w-[400px] h-[400px] bg-[var(--accent-secondary)] rounded-full blur-[180px] opacity-15 pointer-events-none animate-float" />

            <Link href="/dashboard" className="text-[var(--text-secondary)] font-medium text-xs uppercase mb-4 sm:mb-6 block hover:text-white transition-colors tracking-wide">
                ← Back to Dashboard
            </Link>

            <header className="mb-8 animate-slide-up">
                <h1 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">Progress</h1>
                <p className="text-[var(--text-secondary)] text-sm mt-1">Your training history and performance trends</p>
            </header>

            {/* Streak + Stats Summary */}
            <section className="grid grid-cols-4 gap-2 sm:gap-3 mb-8 animate-slide-up stagger-1">
                <Card variant="glass" className="text-center py-3">
                    <p className="text-[var(--text-tertiary)] text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Streak</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-tertiary)] font-mono">{streakData.currentStreak}w</p>
                </Card>
                <Card variant="glass" className="text-center py-3">
                    <p className="text-[var(--text-tertiary)] text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Best</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-warning)] font-mono">{streakData.longestStreak}w</p>
                </Card>
                <Card variant="glass" className="text-center py-3">
                    <p className="text-[var(--text-tertiary)] text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">Total</p>
                    <p className="text-2xl sm:text-3xl font-bold text-white font-mono">{streakData.totalWorkouts}</p>
                </Card>
                <Card variant="glass" className="text-center py-3">
                    <p className="text-[var(--text-tertiary)] text-[8px] sm:text-[10px] uppercase font-bold tracking-wider mb-0.5">PRs</p>
                    <p className="text-2xl sm:text-3xl font-bold text-[var(--accent-primary)] font-mono">{prAchievements?.length || 0}</p>
                </Card>
            </section>

            {/* Activity Heatmap */}
            <section className="mb-8 animate-slide-up stagger-2">
                <Card variant="glass" className="overflow-hidden">
                    <h2 className="text-sm sm:text-base font-bold text-white mb-4 tracking-tight">Activity</h2>
                    <div className="overflow-x-auto pb-2">
                        <div className="flex gap-[3px] min-w-[650px]">
                            {heatmapData.map((week, weekIdx) => (
                                <div key={weekIdx} className="flex flex-col gap-[3px]">
                                    {week.map((day, dayIdx) => (
                                        <div
                                            key={dayIdx}
                                            className="heatmap-cell rounded-[2px]"
                                            style={{
                                                width: '12px',
                                                height: '12px',
                                                backgroundColor: day.count === 0
                                                    ? 'rgba(255,255,255,0.03)'
                                                    : day.count === 1
                                                        ? 'rgba(48, 209, 88, 0.25)'
                                                        : day.count === 2
                                                            ? 'rgba(48, 209, 88, 0.5)'
                                                            : 'rgba(48, 209, 88, 0.85)',
                                            }}
                                            title={`${day.date}: ${day.count} workout${day.count !== 1 ? 's' : ''}`}
                                        />
                                    ))}
                                </div>
                            ))}
                        </div>
                        <div className="flex items-center gap-2 mt-3 text-[10px] text-[var(--text-tertiary)]">
                            <span>Less</span>
                            {[0, 1, 2, 3].map(level => (
                                <div
                                    key={level}
                                    className="rounded-[2px]"
                                    style={{
                                        width: '10px',
                                        height: '10px',
                                        backgroundColor: level === 0
                                            ? 'rgba(255,255,255,0.03)'
                                            : level === 1
                                                ? 'rgba(48, 209, 88, 0.25)'
                                                : level === 2
                                                    ? 'rgba(48, 209, 88, 0.5)'
                                                    : 'rgba(48, 209, 88, 0.85)',
                                    }}
                                />
                            ))}
                            <span>More</span>
                        </div>
                    </div>
                </Card>
            </section>

            {/* Progression Recommendations */}
            {progressionRecs && progressionRecs.length > 0 && (
                <section className="mb-8 animate-slide-up stagger-3">
                    <h2 className="text-sm sm:text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                        <span className="text-[var(--accent-primary)]">⚡</span> Next Session Targets
                    </h2>
                    <div className="space-y-2">
                        {progressionRecs.map((rec: any) => (
                            <Card key={rec.id} variant="glass" className="flex items-center justify-between py-3">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <p className="text-sm font-semibold text-white truncate">{rec.exercise?.name}</p>
                                        {prExerciseIds.has(rec.exercise_id) && (
                                            <span className="text-xs" title="Personal Record set">🏆</span>
                                        )}
                                    </div>
                                    <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5 truncate">{rec.reason}</p>
                                </div>
                                <div className="flex items-center gap-2 ml-3 flex-shrink-0">
                                    <span className={`text-xs font-mono font-bold px-2 py-0.5 rounded-lg ${rec.recommendation_type === 'increase_weight'
                                        ? 'bg-[var(--accent-tertiary)]/15 text-[var(--accent-tertiary)]'
                                        : rec.recommendation_type === 'deload'
                                            ? 'bg-[var(--accent-warning)]/15 text-[var(--accent-warning)]'
                                            : rec.recommendation_type === 'maintain'
                                                ? 'bg-white/5 text-[var(--text-secondary)]'
                                                : 'bg-[var(--accent-primary)]/15 text-[var(--accent-primary)]'
                                        }`}>
                                        {rec.recommendation_type === 'increase_weight' ? '↑' :
                                            rec.recommendation_type === 'deload' ? '↓' :
                                                rec.recommendation_type === 'maintain' ? '→' : '↗'}
                                        {' '}{rec.recommended_weight} lbs
                                    </span>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}

            {/* Exercise Performance History */}
            <section className="mb-8 animate-slide-up stagger-4">
                <h2 className="text-sm sm:text-base font-bold text-white mb-4 tracking-tight">Exercise History</h2>
                <div className="space-y-3">
                    {topExercises.length === 0 ? (
                        <Card variant="solid" className="text-center py-8">
                            <p className="text-[var(--text-secondary)] text-sm">Complete your first workout to see progress here</p>
                        </Card>
                    ) : (
                        topExercises.map(([id, data]) => {
                            const latest = data.sessions[data.sessions.length - 1];
                            const first = data.sessions[0];
                            const weightChange = latest && first && first.maxWeight > 0
                                ? ((latest.maxWeight - first.maxWeight) / first.maxWeight * 100)
                                : 0;
                            const hasPR = prExerciseIds.has(id);

                            return (
                                <Card key={id} variant="glass" className="relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2">
                                                <p className="text-sm font-semibold text-white truncate">{data.name}</p>
                                                {hasPR && <span className="text-xs" title="PR set!">🏆</span>}
                                            </div>
                                            <div className="flex items-center gap-3 mt-1">
                                                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider">{data.muscle_group}</span>
                                                <span className="text-[10px] text-[var(--text-tertiary)] font-mono">{data.sessions.length} sessions</span>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-white font-mono">{latest?.maxWeight || 0}<span className="text-xs text-[var(--text-tertiary)] ml-0.5">lbs</span></p>
                                            {weightChange !== 0 && (
                                                <p className={`text-[10px] font-mono font-bold ${weightChange > 0 ? 'text-[var(--accent-tertiary)]' : 'text-[var(--accent-warning)]'}`}>
                                                    {weightChange > 0 ? '+' : ''}{weightChange.toFixed(0)}%
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    {/* Mini sparkline showing weight progression */}
                                    {data.sessions.length > 1 && (
                                        <div className="mt-3 flex items-end gap-[2px] h-6">
                                            {data.sessions.slice(-20).map((session, i) => {
                                                const maxW = Math.max(...data.sessions.map(s => s.maxWeight));
                                                const minW = Math.min(...data.sessions.map(s => s.maxWeight));
                                                const range = maxW - minW || 1;
                                                const pct = ((session.maxWeight - minW) / range) * 100;
                                                return (
                                                    <div
                                                        key={i}
                                                        className="flex-1 rounded-t-sm"
                                                        style={{
                                                            height: `${Math.max(pct, 10)}%`,
                                                            backgroundColor: i === data.sessions.slice(-20).length - 1
                                                                ? 'var(--accent-primary)'
                                                                : 'rgba(0, 240, 255, 0.2)',
                                                            minHeight: '2px'
                                                        }}
                                                    />
                                                );
                                            })}
                                        </div>
                                    )}
                                </Card>
                            );
                        })
                    )}
                </div>
            </section>

            {/* All PRs */}
            {prAchievements && prAchievements.length > 0 && (
                <section className="mb-8 animate-slide-up stagger-5">
                    <h2 className="text-sm sm:text-base font-bold text-white mb-4 tracking-tight flex items-center gap-2">
                        🏆 Personal Records
                    </h2>
                    <div className="space-y-2">
                        {prAchievements.map((pr: any) => (
                            <Card key={pr.id} variant="glass" className="flex items-center justify-between py-3">
                                <div>
                                    <p className="text-sm font-semibold text-white">{pr.achievement_value?.exercise_name}</p>
                                    <p className="text-[10px] text-[var(--text-tertiary)] font-mono">
                                        {new Date(pr.achieved_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-bold text-[var(--accent-tertiary)] font-mono">
                                        {pr.achievement_value?.weight} lbs
                                    </p>
                                    <p className="text-[10px] text-[var(--text-tertiary)]">
                                        from {pr.achievement_value?.previous_best} lbs
                                    </p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </section>
            )}
        </div>
    );
}

// --- Heatmap Builder ---
function buildHeatmapData(logs: { completed_at: string }[]) {
    const today = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - (52 * 7)); // 52 weeks back
    // Align to Monday
    const day = startDate.getDay();
    startDate.setDate(startDate.getDate() - ((day + 6) % 7));

    // Count workouts per date
    const countMap = new Map<string, number>();
    logs.forEach(log => {
        const dateStr = new Date(log.completed_at).toISOString().split('T')[0];
        countMap.set(dateStr, (countMap.get(dateStr) || 0) + 1);
    });

    const weeks: { date: string; count: number }[][] = [];
    const cursor = new Date(startDate);

    while (cursor <= today) {
        const week: { date: string; count: number }[] = [];
        for (let d = 0; d < 7; d++) {
            const dateStr = cursor.toISOString().split('T')[0];
            week.push({ date: dateStr, count: countMap.get(dateStr) || 0 });
            cursor.setDate(cursor.getDate() + 1);
        }
        weeks.push(week);
    }

    return weeks;
}
