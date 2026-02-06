import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const QUOTES = [
    "The only bad workout is the one that didn't happen.",
    "Your body can stand almost anything. It's your mind you have to convince.",
    "Discipline is choosing between what you want now and what you want most.",
    "The pain you feel today will be the strength you feel tomorrow.",
    "Champions train, losers complain.",
    "Success isn't given. It's earned.",
    "The iron never lies. You always get what you put in.",
];

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/');

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile?.onboarding_completed) redirect('/onboarding');

    const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id);

    const totalWorkoutsCompleted = logs?.length || 0;

    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    const workoutIndex = totalWorkoutsCompleted % (workouts?.length || 1);
    const workoutOfTheDay = workouts?.[workoutIndex];

    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative flex flex-col">
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
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                        Welcome Back,
                    </h1>
                    <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight bg-gradient-to-r from-[var(--accent-primary)] via-[var(--accent-secondary)] to-[var(--accent-primary)] bg-clip-text text-transparent bg-[length:200%_auto] animate-shimmer">
                        {profile.full_name?.split(' ')[0] || 'Athlete'}
                    </h1>
                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-mono mt-2">{dateString}</p>
                </div>
                <div className="relative group">
                    <div className="absolute inset-0 bg-gradient-to-r from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full blur-lg opacity-50 group-hover:opacity-80 transition-opacity" />
                    <div className="relative h-12 w-12 sm:h-14 sm:w-14 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center text-[var(--bg-darker)] font-bold text-xl sm:text-2xl shadow-[0_0_40px_var(--accent-glow)]">
                        {profile.full_name?.charAt(0).toUpperCase() || 'A'}
                    </div>
                </div>
            </header>

            {/* Stats Row */}
            <section className="grid grid-cols-3 gap-3 sm:gap-4 mb-8 sm:mb-10 relative z-10">
                <div className="animate-slide-up stagger-1">
                    <Card variant="glass" className="text-center py-4 sm:py-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Workouts</p>
                        <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white font-mono">{totalWorkoutsCompleted}</p>
                    </Card>
                </div>
                <div className="animate-slide-up stagger-2">
                    <Card variant="glass" className="text-center py-4 sm:py-6 group">
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-tertiary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                        <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Streak</p>
                        <p className="text-3xl sm:text-5xl lg:text-6xl font-bold text-[var(--accent-tertiary)] font-mono">
                            {Math.min(totalWorkoutsCompleted, 7)}
                            <span className="text-base sm:text-xl text-[var(--text-secondary)] ml-0.5">d</span>
                        </p>
                    </Card>
                </div>
                <div className="animate-slide-up stagger-3">
                    <Link href="/progress" className="block h-full">
                        <Card variant="glass" className="text-center py-4 sm:py-6 group h-full flex flex-col justify-center cursor-pointer hover:border-[var(--accent-secondary)]/40">
                            <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-secondary)]/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <p className="text-[var(--text-tertiary)] text-[9px] sm:text-xs uppercase font-bold tracking-[0.15em] mb-1">Progress</p>
                            <p className="text-[var(--accent-secondary)] text-xl sm:text-2xl font-bold flex items-center justify-center gap-1">
                                VIEW
                                <svg className="w-4 h-4 sm:w-5 sm:h-5 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
                                </svg>
                            </p>
                        </Card>
                    </Link>
                </div>
            </section>

            {/* Workout of the Day */}
            <section className="flex-1 relative z-10 mb-6 sm:mb-8 animate-slide-up stagger-4">
                <div className="flex items-center gap-2 mb-4">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h2 className="text-[var(--text-secondary)] font-semibold tracking-[0.2em] text-[10px] sm:text-xs uppercase px-3">
                        Today's Mission
                    </h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                </div>

                {workoutOfTheDay ? (
                    <Card variant="glow" className="relative overflow-hidden">
                        {/* Animated gradient overlay */}
                        <div className="absolute inset-0 bg-gradient-to-br from-[var(--accent-primary)]/10 via-transparent to-[var(--accent-secondary)]/5 pointer-events-none" />
                        <div className="absolute top-0 right-0 w-40 h-40 bg-[var(--accent-primary)] rounded-full blur-[100px] opacity-20 pointer-events-none animate-float" />
                        <div className="absolute bottom-0 left-0 w-32 h-32 bg-[var(--accent-secondary)] rounded-full blur-[80px] opacity-15 pointer-events-none animate-float" style={{ animationDelay: '1s' }} />

                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-3">
                                <span className="px-2.5 py-1 bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/30 rounded-full text-[var(--accent-primary)] text-[10px] sm:text-xs font-mono font-bold tracking-wider">
                                    PROTOCOL #{workoutIndex + 1}
                                </span>
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

            {/* Inspiration */}
            <section className="relative z-10 mt-auto animate-slide-up stagger-5">
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
