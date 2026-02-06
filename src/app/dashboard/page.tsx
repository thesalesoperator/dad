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

            <section className="mb-8 relative z-10">
                <h2 className="text-[var(--accent-primary)] font-semibold tracking-wider text-xs uppercase mb-4">
                    Active Protocol
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
                    Recent Activity
                </h2>
                <Card className="opacity-70 bg-transparent border-dashed border-white/10">
                    <p className="text-center text-sm font-medium text-[var(--text-secondary)]">SYSTEM INITIALIZED. NO LOGS FOUND.</p>
                </Card>
            </section>
        </div>
    );
}
