'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { generateProgram } from '@/features/workouts/actions/generateProgram';

const STEPS = [
    // ... (rest of constants)
    { id: 'name', title: 'WHO ARE YOU?', subtitle: 'First things first.' },
    { id: 'stats', title: 'VITALS', subtitle: 'Calibration data.' },
    { id: 'experience', title: 'HISTORY', subtitle: 'Honesty required.' },
    { id: 'availability', title: 'COMMITMENT', subtitle: 'Be realistic.' },
    { id: 'goals', title: 'MISSION', subtitle: 'Target acquisition.' },
];

export function OnboardingWizard() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        fullName: '',
        age: '',
        weight: '',
        experience: 'beginner',
        daysPerWeek: 3,
        goal: 'strength'
    });
    const [loading, setLoading] = useState(false);
    const supabase = createClient();

    const handleNext = async () => {
        if (step < STEPS.length - 1) {
            setStep(step + 1);
        } else {
            await finishOnboarding();
        }
    };



    // ... inside component

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Not authenticated');

            // 1. Update Profile
            const { error } = await supabase.from('users').update({
                full_name: data.fullName,
                onboarding_completed: true,
                onboarding_data: {
                    age: parseInt(data.age),
                    weight: parseInt(data.weight),
                    experience: data.experience,
                    days_per_week: data.daysPerWeek,
                    goal: data.goal
                }
            }).eq('id', user.id);

            if (error) throw error;

            // 2. Generate Program
            await generateProgram(user.id, {
                experience: data.experience as any,
                days_per_week: data.daysPerWeek,
                goal: data.goal as any
            });

            window.location.href = '/dashboard';
        } catch (error) {
            console.error(error);
            alert('Failed to save profile');
        } finally {
            setLoading(false);
        }
    };

    const currentStep = STEPS[step];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[var(--color-dark)]">
            {/* Background Ambience */}
            <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-[var(--color-primary)] rounded-full blur-[150px] opacity-10 animate-pulse" />
            </div>

            <div className="w-full max-w-md z-10">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl text-white mb-1">{currentStep.title}</h1>
                        <p className="text-[var(--color-text-muted)] font-bold tracking-widest text-xs uppercase">{currentStep.subtitle}</p>
                    </div>
                    <span className="text-[var(--color-primary)] font-bold text-xl">{step + 1}/{STEPS.length}</span>
                </div>

                <Card className="mb-8">
                    <div className="space-y-6">
                        {step === 0 && (
                            <Input
                                label="Full Name"
                                value={data.fullName}
                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                placeholder="JOHN DOE"
                                autoFocus
                            />
                        )}

                        {step === 1 && (
                            <>
                                <Input
                                    label="Age"
                                    type="number"
                                    value={data.age}
                                    onChange={(e) => setData({ ...data, age: e.target.value })}
                                    placeholder="35"
                                    autoFocus
                                />
                                <Input
                                    label="Weight (lbs)"
                                    type="number"
                                    value={data.weight}
                                    onChange={(e) => setData({ ...data, weight: e.target.value })}
                                    placeholder="185"
                                />
                            </>
                        )}

                        {step === 2 && (
                            <div className="grid grid-cols-1 gap-4">
                                {['beginner', 'intermediate', 'advanced'].map((level) => (
                                    <button
                                        key={level}
                                        onClick={() => setData({ ...data, experience: level })}
                                        className={`p-4 rounded-[var(--radius-md)] border-2 transition-all uppercase tracking-widest font-bold text-left
                      ${data.experience === level
                                                ? 'border-[var(--color-primary)] bg-[var(--color-primary)] text-white'
                                                : 'border-[#2C2C2E] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="space-y-4">
                                <p className="text-white text-center text-6xl font-[var(--font-display)]">{data.daysPerWeek} DAYS</p>
                                <input
                                    type="range"
                                    min="2"
                                    max="6"
                                    value={data.daysPerWeek}
                                    onChange={(e) => setData({ ...data, daysPerWeek: parseInt(e.target.value) })}
                                    className="w-full accent-[var(--color-primary)] h-2 bg-[#2C2C2E] rounded-lg appearance-none cursor-pointer"
                                />
                            </div>
                        )}

                        {step === 4 && (
                            <div className="grid grid-cols-1 gap-4">
                                {['strength', 'hypertrophy', 'general'].map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => setData({ ...data, goal })}
                                        className={`p-4 rounded-[var(--radius-md)] border-2 transition-all uppercase tracking-widest font-bold text-left
                    ${data.goal === goal
                                                ? 'border-[var(--color-accent)] bg-[var(--color-accent)] text-black'
                                                : 'border-[#2C2C2E] bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:border-[var(--color-text-muted)]'
                                            }`}
                                    >
                                        {goal === 'general' ? 'GENERAL FITNESS' : goal}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>

                <Button fullWidth size="lg" onClick={handleNext} disabled={loading}>
                    {step === STEPS.length - 1 ? (loading ? 'INITIALIZING PROTOCOL...' : 'GENERATE PROGRAM') : 'NEXT PHASE'}
                </Button>
            </div>
        </div>
    );
}
