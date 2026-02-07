'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { computeStreakClient, type StreakData } from '@/features/workouts/actions/streaksAndPRs.client';

const QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "Discipline is choosing between what you want now and what you want most.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Champions train, losers complain.",
    "Success isn't given. It's earned.",
    "The iron never lies. You always get what you put in.",
];

function getRelativeDate(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 14) return '1 week ago';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function formatVolume(v: number) {
    if (v >= 1000000) return `${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `${(v / 1000).toFixed(0)}K`;
    return String(v);
}

export default function DashboardClient() {
    const router = useRouter();
    const supabase = createClient();
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [workouts, setWorkouts] = useState<any[]>([]);
    const [currentProgram, setCurrentProgram] = useState<any>(null);
    const [userGoals, setUserGoals] = useState<string[]>([]);
    const [streakData, setStreakData] = useState<StreakData>({ currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisWeekWorkouts: 0, lastWorkoutDate: null });
    const [totalVolume, setTotalVolume] = useState(0);
    const [recentPRs, setRecentPRs] = useState<any[]>([]);
    const [recentSessions, setRecentSessions] = useState<any[]>([]);
    const [sessionVolumes, setSessionVolumes] = useState<Record<string, number>>({});

    useEffect(() => {
        async function fetchAll() {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) { router.replace('/'); return; }

            const { data: prof } = await supabase.from('users').select('*').eq('id', user.id).single();
            if (!prof?.onboarding_completed) { router.replace('/onboarding'); return; }
            setProfile(prof);

            const goals: string[] = prof.onboarding_data?.goals || (prof.onboarding_data?.category ? [prof.onboarding_data.category] : []);
            setUserGoals(goals);

            const { data: wk } = await supabase.from('workouts').select('*').eq('user_id', user.id).order('created_at', { ascending: true });
            setWorkouts(wk || []);

            if (prof.onboarding_data?.program_slug) {
                const { data: prog } = await supabase.from('training_programs').select('*').eq('slug', prof.onboarding_data.program_slug).single();
                setCurrentProgram(prog);
            }

            const streak = await computeStreakClient(user.id);
            setStreakData(streak);

            const { data: volData } = await supabase.from('logs').select('weight, reps_completed').eq('user_id', user.id);
            setTotalVolume(volData?.reduce((sum, l) => sum + ((l.weight || 0) * (l.reps_completed || 0)), 0) || 0);

            const sevenDaysAgo = new Date();
            sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
            const { data: prs } = await supabase.from('user_achievements').select('*').eq('user_id', user.id).eq('achievement_type', 'pr_weight').gte('achieved_at', sevenDaysAgo.toISOString()).order('achieved_at', { ascending: false });
            setRecentPRs(prs || []);

            const { data: sessions } = await supabase
                .from('workout_logs')
                .select('id, workout_id, completed_at, duration_seconds, workout:workouts(id, name, description)')
                .eq('user_id', user.id)
                .order('completed_at', { ascending: false })
                .limit(5);
            setRecentSessions(sessions || []);

            const vols: Record<string, number> = {};
            if (sessions && sessions.length > 0) {
                for (const session of sessions) {
                    const { data: sLogs } = await supabase.from('logs').select('weight, reps_completed').eq('user_id', user.id).eq('workout_id', session.workout_id);
                    vols[session.id] = sLogs?.reduce((sum, l) => sum + ((l.weight || 0) * (l.reps_completed || 0)), 0) || 0;
                }
            }
            setSessionVolumes(vols);
            setLoading(false);
        }
        fetchAll();
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="w-12 h-12 border-2 border-[var(--accent-primary)] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
                    <p className="text-[var(--text-secondary)] text-sm font-mono">LOADING PROTOCOL...</p>
                </div>
            </div>
        );
    }

    if (!profile) return null;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
    const workoutIndex = streakData.totalWorkouts % (workouts.length || 1);
    const workoutOfTheDay = workouts[workoutIndex];
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    const getNotificationBanner = () => {
        if (recentPRs.length > 0) return { type: 'pr', message: `🏆 You hit ${recentPRs.length} new PR${recentPRs.length > 1 ? 's' : ''} this week! Keep the momentum.`, color: 'var(--accent-tertiary)' };
        if (streakData.currentStreak >= 4) return { type: 'streak', message: `🔥 ${streakData.currentStreak}-week streak! You're building something unstoppable.`, color: 'var(--accent-warning)' };
        if (streakData.totalWorkouts === 0) return { type: 'start', message: `💪 Your first workout is waiting. Every champion started here.`, color: 'var(--accent-primary)' };
        if (streakData.currentStreak === 0 && streakData.totalWorkouts > 0) return { type: 'comeback', message: `⚡ Time to restart the streak. Your body remembers — get back in there.`, color: 'var(--accent-secondary)' };
        return null;
    };
    const banner = getNotificationBanner();

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative flex flex-col safe-area-pad">
            {/* Animated Background Orbs */}
            <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-[var(--accent-primary)] rounded-full blur-[180px] opacity-20 pointer-events-none animate-float" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[350px] h-[350px] bg-[var(--accent-secondary)] rounded-full blur-[160px] opacity-15 pointer-events-none animate-float" style={{ animationDelay: '2s' }} />
            <div className="absolute top-[40%] right-[20%] w-[200px] h-[200px] bg-[var(--accent-tertiary)] rounded-full blur-[120px] opacity-10 pointer-events-none animate-float" style={{ animationDelay: '4s' }} />

            {/* Header */}
            <header className="mb-8 sm:mb-12 flex justify-between items-start relative z-10 animate-slide-up">
                <div>
                    <div className="flex items-center gap-2 mb-2">
                        <div className="h-2 w-2 rounded-full bg-[var(--accent-tertiary)] animate-pulse shadow-[0_0_10px_var(--accent-tertiary)]" />
                        <p className="text-[var(--accent-primary)] text-[10px] sm:text-xs font-mono font-bold tracking-[0.3em] uppercase">{dayOfWeek}</p>
                    </div>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">Welcome Back,</h1>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight gradient-text-shimmer">
                        {profile.full_name?.split(' ')[0] || 'Athlete'}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-mono mt-2">{dateString}</p>
                </div>
                <div className="flex items-center gap-3">
                    <a href="/settings" className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center text-[var(--text-tertiary)] hover:text-white hover:bg-white/10 hover:border-white/20 transition-all" title="Settings">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.004.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                    </a>
                    <div className="relative group">
                        <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                        <div className="relative h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center text-[var(--bg-darker)] font-bold text-xl sm:text-2xl shadow-[0_0_40px_var(--accent-glow)]">
                            {profile.full_name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                    </div>
                </div>
            </header>

            {/* Smart Notification Banner */}
            {banner && (
                <section className="mb-6 sm:mb-8 relative z-10 animate-slide-up">
                    <div className="px-4 py-3 rounded-xl border backdrop-blur-sm" style={{ backgroundColor: `color-mix(in srgb, ${banner.color} 8%, transparent)`, borderColor: `color-mix(in srgb, ${banner.color} 25%, transparent)` }}>
                        <p className="text-sm font-medium" style={{ color: banner.color }}>{banner.message}</p>
                    </div>
                </section>
            )}

            {/* Current Program Banner */}
            {currentProgram && (
                <section className="mb-6 sm:mb-8 relative z-10 animate-slide-up">
                    <div className="flex items-center gap-2 mb-3">
                        <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                        </svg>
                        <h2 className="text-[var(--text-secondary)] font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase">Active Protocol</h2>
                    </div>
                    <Card variant="glass" className="relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] opacity-50" />
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight truncate">{currentProgram.name}</h3>
                                    <span className={`text-[9px] uppercase tracking-widest px-1.5 py-0.5 rounded-full border flex-shrink-0 ${currentProgram.difficulty === 'beginner' ? 'border-green-500/30 text-green-400 bg-green-500/10' : currentProgram.difficulty === 'intermediate' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' : 'border-red-500/30 text-red-400 bg-red-500/10'}`}>{currentProgram.difficulty}</span>
                                </div>
                                {currentProgram.science_note && <p className="text-[11px] sm:text-xs text-[var(--text-secondary)] italic leading-relaxed">{currentProgram.science_note}</p>}
                                <div className="flex flex-wrap items-center gap-2 mt-2">
                                    {userGoals.length > 0 ? userGoals.map((g: string, i: number) => {
                                        const goalColors: Record<string, string> = { bodybuilding: '#00f0ff', strength: '#f97316', power: '#f59e0b', endurance: '#10b981', flexibility: '#8b5cf6', athletic: '#ef4444', general: '#06d6a0' };
                                        const color = goalColors[g] || 'var(--accent-primary)';
                                        return <span key={g} className="text-[9px] uppercase tracking-wider font-mono px-2 py-0.5 rounded-full border" style={{ color, borderColor: `${color}40`, background: `${color}15` }}>{g} {i === 0 ? '①' : i === 1 ? '②' : '③'}</span>;
                                    }) : (
                                        <span className="text-[9px] uppercase tracking-wider text-[var(--accent-primary)] font-mono bg-[var(--accent-primary)]/10 px-2 py-0.5 rounded-full border border-[var(--accent-primary)]/20">{currentProgram.category}</span>
                                    )}
                                    <span className="text-[9px] text-[var(--text-tertiary)] font-mono">{currentProgram.min_days}-{currentProgram.max_days} days/wk</span>
                                </div>
                            </div>
                        </div>
                    </Card>
                </section>
            )}

            {/* Stats Row */}
            <section className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10 relative z-10">
                <div className="animate-slide-up stagger-1">
                    <Card variant="glass" className="text-center py-4 sm:py-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Workouts</p>
                        <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white font-mono">{streakData.totalWorkouts}</p>
                    </Card>
                </div>
                <div className="animate-slide-up stagger-2">
                    <Card variant="glass" className="text-center py-4 sm:py-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-tertiary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Streak</p>
                        <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[var(--accent-tertiary)] font-mono">{streakData.currentStreak}<span className="text-base sm:text-xl text-[var(--text-secondary)] ml-0.5">w</span></p>
                    </Card>
                </div>
                <div className="animate-slide-up stagger-3">
                    <Card variant="glass" className="text-center py-4 sm:py-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Volume</p>
                        <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[var(--accent-secondary)] font-mono">{formatVolume(totalVolume)}<span className="text-xs sm:text-sm text-[var(--text-secondary)] ml-0.5">lbs</span></p>
                    </Card>
                </div>
            </section>

            {/* Recent PRs */}
            {recentPRs.length > 0 && (
                <section className="mb-6 sm:mb-8 relative z-10 animate-slide-up stagger-3">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="text-lg">🏆</span>
                        <h2 className="text-[var(--text-secondary)] font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase">Recent PRs</h2>
                    </div>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                        {recentPRs.slice(0, 5).map((pr: any) => (
                            <div key={pr.id} className="flex-shrink-0 px-3 py-2 bg-[var(--accent-tertiary)]/10 border border-[var(--accent-tertiary)]/20 rounded-xl">
                                <p className="text-white text-sm font-semibold whitespace-nowrap">{pr.achievement_value?.exercise_name}</p>
                                <p className="text-[var(--accent-tertiary)] text-xs font-mono">{pr.achievement_value?.weight} lbs <span className="text-white/30 mx-1">←</span> <span className="text-white/40 line-through">{pr.achievement_value?.previous_best}</span></p>
                            </div>
                        ))}
                    </div>
                </section>
            )}

            {/* Workout of the Day */}
            <section className="flex-1 relative z-10 mb-6 sm:mb-8 animate-slide-up stagger-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-[var(--text-secondary)] font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase px-3">Today&apos;s Mission</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>
                {workoutOfTheDay ? (
                    <Card variant="glow" className="relative overflow-hidden">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--accent-secondary)]/5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent-primary)] rounded-full blur-[100px] opacity-20 pointer-events-none animate-float" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent-secondary)] rounded-full blur-[80px] opacity-15 pointer-events-none animate-float" style={{ animationDelay: '1s' }} />
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 rounded-full text-[var(--accent-primary)] text-[10px] sm:text-xs font-mono font-bold tracking-wider">PROTOCOL #{workoutIndex + 1}</span>
                            </div>
                            <h3 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-3 tracking-tight">{workoutOfTheDay.name}</h3>
                            <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-6 sm:mb-8 max-w-md">{workoutOfTheDay.description}</p>
                            <Link href={`/workout/${workoutOfTheDay.id}`}>
                                <Button fullWidth size="lg" className="group text-base sm:text-lg">
                                    <span className="flex items-center gap-3">
                                        <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
                                        </svg>
                                        START WORKOUT
                                    </span>
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <Card variant="solid" className="border-dashed border-white/10 text-center py-10">
                        <p className="text-[var(--text-secondary)] font-medium">No workouts scheduled. Complete onboarding to generate your program.</p>
                    </Card>
                )}
            </section>

            {/* Recent Sessions */}
            {recentSessions.length > 0 && (
                <section className="mb-6 sm:mb-8 relative z-10 animate-slide-up stagger-5">
                    <div className="flex items-center gap-2 mb-4">
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                        <h2 className="text-[var(--text-secondary)] font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase px-3">Recent Sessions</h2>
                        <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    </div>
                    <div className="space-y-2">
                        {recentSessions.map((session: any) => {
                            const sessionDate = new Date(session.completed_at);
                            const relativeDate = getRelativeDate(sessionDate);
                            const vol = sessionVolumes[session.id] || 0;
                            const workoutData = session.workout;
                            return (
                                <Link key={session.id} href={`/workout/${session.workout_id}`}>
                                    <Card variant="glass" className="group cursor-pointer hover:border-[var(--accent-primary)]/30 transition-all mb-2">
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-8 h-8 rounded-lg bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 flex items-center justify-center flex-shrink-0">
                                                        <svg className="w-4 h-4 text-[var(--accent-primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                        </svg>
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-white truncate">{workoutData?.name || 'Workout'}</p>
                                                        <p className="text-[10px] text-[var(--text-tertiary)] font-mono">{relativeDate}</p>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-3 ml-3">
                                                {vol > 0 && <span className="text-xs font-mono text-[var(--text-secondary)]">{formatVolume(vol)} lbs</span>}
                                                <svg className="w-4 h-4 text-[var(--text-tertiary)] group-hover:text-[var(--accent-primary)] group-hover:translate-x-0.5 transition-all" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
                                                </svg>
                                            </div>
                                        </div>
                                    </Card>
                                </Link>
                            );
                        })}
                    </div>
                </section>
            )}

            {/* Quick Links */}
            <section className="grid grid-cols-2 gap-3 mb-6 relative z-10 animate-slide-up stagger-6">
                <Link href="/progress" className="block">
                    <Card variant="glass" className="py-4 text-center group cursor-pointer hover:border-[var(--accent-secondary)]/40 transition-all">
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Progress</p>
                        <p className="text-[var(--accent-secondary)] text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
                            VIEW
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </p>
                    </Card>
                </Link>
                <Link href="/settings" className="block">
                    <Card variant="glass" className="py-4 text-center group cursor-pointer hover:border-[var(--accent-primary)]/40 transition-all">
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Settings</p>
                        <p className="text-[var(--accent-primary)] text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
                            EDIT
                            <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                            </svg>
                        </p>
                    </Card>
                </Link>
            </section>

            {/* Inspiration */}
            <section className="relative z-10 mt-auto animate-slide-up stagger-7">
                <Card variant="solid" hover={false} className="bg-transparent border-white/[0.03] text-center py-5 sm:py-6">
                    <div className="flex items-center justify-center gap-3">
                        <div className="h-px w-8 bg-gradient-to-r from-transparent to-white/20" />
                        <svg className="w-4 h-4 text-[var(--text-tertiary)]" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M14.017 21v-7.391c0-5.704 3.731-9.57 8.983-10.609l.995 2.151c-2.432.917-3.995 3.638-3.995 5.849h4v10h-9.983zm-14.017 0v-7.391c0-5.704 3.748-9.57 9-10.609l.996 2.151c-2.433.917-3.996 3.638-3.996 5.849h3.983v10h-9.983z" />
                        </svg>
                        <div className="h-px w-8 bg-gradient-to-l from-transparent to-white/20" />
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base italic mt-3 font-light">{quote}</p>
                </Card>
            </section>
        </div>
    );
}
