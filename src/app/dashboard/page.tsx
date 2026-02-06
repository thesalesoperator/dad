import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';
import { redirect } from 'next/navigation';

export default async function DashboardPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) redirect('/');

    // Fetch Workouts
    const { data: workouts } = await supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    const { data: profile } = await supabase.from('users').select('*').eq('id', user.id).single();
    if (!profile?.onboarding_completed) redirect('/onboarding');

    // Fetch Workout Logs (History)
    const { data: logs } = await supabase
        .from('workout_logs')
        .select(`
            *,
            workout:workouts (name)
        `)
        .eq('user_id', user.id)
        .order('completed_at', { ascending: false })
        .limit(5);

    // Calculate Stats
    const totalSessions = logs?.length || 0;
    const lastSession = logs?.[0] ? new Date(logs[0].completed_at).toLocaleDateString() : 'N/A';

    return (
        <div className="min-h-screen p-6 pb-24 relative">
            {/* Background Ambience */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-[var(--accent-secondary)] rounded-full blur-[120px] opacity-10 pointer-events-none" />

            <header className="mb-8 flex justify-between items-center relative z-10">
                <div>
                    <h1 className="text-3xl font-bold text-white tracking-tight">COMMAND CENTER</h1>
                    <p className="text-[var(--text-secondary)] text-sm font-medium tracking-wide uppercase">
                        {profile.full_name} // {profile.onboarding_data.goal}
                    </p>
                </div>
                <div className="h-10 w-10 bg-[var(--accent-primary)] rounded-full animate-pulse shadow-[0_0_20px_var(--accent-glow)]" />
            </header>

            {/* Stats Overview */}
            <section className="grid grid-cols-2 gap-4 mb-8 relative z-10">
                <Card className="bg-white/5 border-white/10">
                    <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">Total Sessions</p>
                    <p className="text-2xl font-bold text-white mt-1">{totalSessions}</p>
                </Card>
                <Card className="bg-white/5 border-white/10">
                    <p className="text-[var(--text-secondary)] text-[10px] uppercase font-bold tracking-wider">Last Active</p>
                    <p className="text-2xl font-bold text-white mt-1">{lastSession}</p>
                </Card>
            </section>

            <section className="mb-8 relative z-10">
                <h2 className="text-[var(--accent-primary)] font-semibold tracking-wider text-xs uppercase mb-4">
                    Active Protocol (Select to Start)
                </h2>

                <div className="grid gap-4">
                    {workouts?.map((workout) => (
                        <Link key={workout.id} href={`/workout/${workout.id}`}>
                            <Card className="group hover:border-[var(--accent-primary)] hover:bg-white/5 transition-all duration-300">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <h3 className="text-xl font-semibold text-white group-hover:text-[var(--accent-primary)] transition-colors">
                                            {workout.name}
                                        </h3>
                                        <p className="text-[var(--text-secondary)] text-xs font-medium uppercase mt-1">
                                            {workout.description}
                                        </p>
                                    </div>
                                    <div className="bg-white/5 p-2 rounded-full group-hover:bg-[var(--accent-primary)] group-hover:text-black transition-colors">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </Card>
                        </Link>
                    ))}
                </div>
            </section>

            <section className="relative z-10">
                <h2 className="text-[var(--text-secondary)] font-semibold tracking-wider text-xs uppercase mb-4">
                    Mission History
                </h2>
                {logs && logs.length > 0 ? (
                    <div className="space-y-4">
                        {logs.map((log) => (
                            <Card key={log.id} className="bg-transparent border-white/10 opacity-80 hover:opacity-100 transition-opacity">
                                <div className="flex justify-between items-center">
                                    <div>
                                        <p className="text-white font-medium">{log.workout?.name || 'Unknown Protocol'}</p>
                                        <p className="text-[var(--text-secondary)] text-xs">
                                            {new Date(log.completed_at).toLocaleDateString()} at {new Date(log.completed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                    <span className="text-[var(--accent-secondary)] text-xs font-bold uppercase">COMPLETED</span>
                                </div>
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="opacity-70 bg-transparent border-dashed border-white/10">
                        <p className="text-center text-sm font-medium text-[var(--text-secondary)]">SYSTEM INITIALIZED. NO LOGS FOUND.</p>
                    </Card>
                )}
            </section>
        </div>
    );
}
