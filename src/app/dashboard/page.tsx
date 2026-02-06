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

    // Fetch Profile
    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile?.onboarding_completed) redirect('/onboarding');

    // Fetch Workouts
    const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    // Fetch Workout Logs (History)
    const { data: logs } = await supabase
        .from('workout_logs')
        .select('*')
        .eq('user_id', user.id);

    // Stats
    const totalWorkoutsCompleted = logs?.length || 0;

    // Day of the Week
    const days = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
    const today = new Date();
    const dayOfWeek = days[today.getDay()];
    const dateString = today.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

    // Workout of the Day Logic (cyclical based on days completed)
    const workoutIndex = totalWorkoutsCompleted % (workouts?.length || 1);
    const workoutOfTheDay = workouts?.[workoutIndex];

    // Random Quote
    const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];

    return (
        <div className="min-h-screen p-4 sm:p-6 lg:p-8 relative flex flex-col">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[300px] sm:w-[500px] h-[300px] sm:h-[500px] bg-[var(--accent-secondary)] rounded-full blur-[100px] sm:blur-[120px] opacity-10 pointer-events-none" />

            {/* Header */}
            <header className="mb-6 sm:mb-8 flex justify-between items-center relative z-10">
                <div>
                    <p className="text-[var(--accent-primary)] text-xs sm:text-sm font-bold tracking-widest uppercase">{dayOfWeek}</p>
                    <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white tracking-tight mt-1">
                        Welcome Back, <span className="text-[var(--accent-primary)]">{profile.full_name?.split(' ')[0] || 'Athlete'}</span>
                    </h1>
                    <p className="text-[var(--text-secondary)] text-xs sm:text-sm font-medium mt-1">{dateString}</p>
                </div>
                <div className="h-10 w-10 sm:h-12 sm:w-12 bg-gradient-to-br from-[var(--accent-primary)] to-[var(--accent-secondary)] rounded-full flex items-center justify-center text-white font-bold text-lg sm:text-xl shadow-[0_0_30px_var(--accent-glow)]">
                    {profile.full_name?.charAt(0).toUpperCase() || 'A'}
                </div>
            </header>

            {/* Stats Row */}
            <section className="grid grid-cols-2 gap-3 sm:gap-4 mb-6 sm:mb-8 relative z-10">
                <Card className="bg-white/5 border-white/10 text-center py-4 sm:py-6">
                    <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs uppercase font-bold tracking-wider">Workouts Completed</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mt-1 sm:mt-2">{totalWorkoutsCompleted}</p>
                </Card>
                <Card className="bg-white/5 border-white/10 text-center py-4 sm:py-6">
                    <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs uppercase font-bold tracking-wider">Current Streak</p>
                    <p className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[var(--accent-primary)] mt-1 sm:mt-2">{Math.min(totalWorkoutsCompleted, 7)}<span className="text-lg sm:text-xl text-[var(--text-secondary)]"> days</span></p>
                </Card>
            </section>

            {/* Workout of the Day */}
            <section className="flex-1 relative z-10 mb-6 sm:mb-8">
                <h2 className="text-[var(--text-secondary)] font-semibold tracking-wider text-xs uppercase mb-3 sm:mb-4">
                    Today's Mission
                </h2>
                {workoutOfTheDay ? (
                    <Card className="bg-gradient-to-br from-white/5 to-white/[0.02] border-[var(--accent-primary)]/30 relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--accent-primary)] rounded-full blur-[80px] opacity-20 pointer-events-none" />
                        <div className="relative z-10">
                            <p className="text-[var(--accent-primary)] text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-2">Protocol #{workoutIndex + 1}</p>
                            <h3 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-2">{workoutOfTheDay.name}</h3>
                            <p className="text-[var(--text-secondary)] text-sm sm:text-base mb-4 sm:mb-6">{workoutOfTheDay.description}</p>

                            <Link href={`/workout/${workoutOfTheDay.id}`}>
                                <Button fullWidth size="lg" className="shadow-[0_0_40px_-10px_var(--accent-glow)] text-base sm:text-lg py-4 sm:py-5">
                                    START WORKOUT
                                </Button>
                            </Link>
                        </div>
                    </Card>
                ) : (
                    <Card className="opacity-70 bg-transparent border-dashed border-white/10 text-center py-8">
                        <p className="text-[var(--text-secondary)] font-medium">No workouts scheduled. Complete onboarding to generate your program.</p>
                    </Card>
                )}
            </section>

            {/* Inspiration */}
            <section className="relative z-10 mt-auto">
                <Card className="bg-transparent border-white/5 text-center py-4 sm:py-6">
                    <p className="text-[var(--text-secondary)] text-sm sm:text-base italic">"{quote}"</p>
                </Card>
            </section>
        </div>
    );
}
