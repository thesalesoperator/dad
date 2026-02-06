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
        <div className="min-h-screen bg-[var(--color-dark)] p-6 pb-24">
            <header className="mb-8 flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-[var(--font-display)] text-white">COMMAND CENTER</h1>
                    <p className="text-[var(--color-text-muted)] text-sm font-bold uppercase tracking-widest">
                        {profile.full_name} // {profile.onboarding_data.goal}
                    </p>
                </div>
                <div className="h-10 w-10 bg-[var(--color-primary)] rounded-full animate-pulse shadow-[var(--shadow-glow)]" />
            </header>

            <section className="mb-8">
                <h2 className="text-[var(--color-accent)] font-bold tracking-widest text-xs uppercase mb-4">
                    Active Protocol
                </h2>

                <div className="grid gap-4">
                    {workouts?.map((workout) => (
                        <Link key={workout.id} href={`/workout/${workout.id}`}>
                            <Card className="hover:border-[var(--color-primary)] hover:bg-[#1c1c1e] group relative overflow-hidden transition-all duration-300">
                                <div className="flex justify-between items-center relative z-10">
                                    <div>
                                        <h3 className="text-2xl text-white group-hover:text-[var(--color-primary)] transition-colors">
                                            {workout.name}
                                        </h3>
                                        <p className="text-[var(--color-text-muted)] text-xs font-bold uppercase">
                                            {workout.description}
                                        </p>
                                    </div>
                                    <div className="bg-[#2C2C2E] p-2 rounded-full group-hover:bg-[var(--color-primary)] transition-colors">
                                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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

            <section>
                <h2 className="text-[var(--color-text-muted)] font-bold tracking-widest text-xs uppercase mb-4">
                    Recent Activity
                </h2>
                <Card className="opacity-50">
                    <p className="text-center text-sm font-bold text-[var(--color-text-muted)]">SYSTEM INITIALIZED. NO LOGS FOUND.</p>
                </Card>
            </section>
        </div>
    );
}
