'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { generateProgram } from '@/features/workouts/actions/generateProgram';

const STEPS = [
    { id: 'name', title: 'WHO ARE YOU?', subtitle: 'First things first.' },
    { id: 'stats', title: 'VITALS', subtitle: 'Calibration data.' },
    { id: 'experience', title: 'HISTORY', subtitle: 'Honesty required.' },
    { id: 'equipment', title: 'YOUR GYM', subtitle: 'What do you have access to?' },
    { id: 'availability', title: 'COMMITMENT', subtitle: 'Be realistic.' },
    { id: 'goals', title: 'MISSION', subtitle: 'Target acquisition.' },
];

const EQUIPMENT_OPTIONS = [
    { id: 'full_gym', label: 'FULL GYM', description: 'Barbells, machines, cables', icon: '🏋️' },
    { id: 'dumbbells', label: 'DUMBBELLS ONLY', description: 'Home gym with dumbbells', icon: '💪' },
    { id: 'bodyweight', label: 'BODYWEIGHT', description: 'No equipment needed', icon: '🤸' },
    { id: 'bands', label: 'RESISTANCE BANDS', description: 'Portable training', icon: '🎯' },
];

export function OnboardingWizard() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        fullName: '',
        age: '',
        weight: '',
        experience: 'beginner',
        equipment: 'full_gym',
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

    const finishOnboarding = async () => {
        setLoading(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Not authenticated');

            console.log('Updating profile for user:', user.id);

            // Map equipment selection to array
            const equipmentMap: Record<string, string[]> = {
                'full_gym': ['barbell', 'dumbbell', 'cable', 'machine'],
                'dumbbells': ['dumbbell'],
                'bodyweight': ['bodyweight'],
                'bands': ['band', 'bodyweight']
            };

            // 1. Update Profile
            const { error: profileError } = await supabase.from('users').update({
                full_name: data.fullName,
                onboarding_completed: true,
                onboarding_data: {
                    age: parseInt(data.age),
                    weight: parseInt(data.weight),
                    experience: data.experience,
                    equipment: data.equipment,
                    equipment_available: equipmentMap[data.equipment] || ['barbell', 'dumbbell'],
                    days_per_week: data.daysPerWeek,
                    goal: data.goal
                }
            }).eq('id', user.id);

            if (profileError) {
                console.error('Profile update error:', profileError);
                throw new Error(`Profile Update Failed: ${profileError.message}`);
            }

            console.log('Profile updated. Generating program...');

            // 2. Generate Program
            await generateProgram(user.id, {
                experience: data.experience as 'beginner' | 'intermediate' | 'advanced',
                days_per_week: data.daysPerWeek,
                goal: data.goal as 'strength' | 'hypertrophy' | 'general',
                equipment: equipmentMap[data.equipment] || ['barbell', 'dumbbell']
            });

            console.log('Program generated. Redirecting...');
            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error('Onboarding error:', error);
            alert(`Error: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const currentStep = STEPS[step];

    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* Background Ambience */}
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-[var(--accent-primary)] rounded-full blur-[150px] opacity-10 animate-pulse pointer-events-none" />

            <div className="w-full max-w-md z-10">
                <div className="mb-8 flex justify-between items-end">
                    <div>
                        <h1 className="text-3xl font-bold text-white mb-1 tracking-tight">{currentStep.title}</h1>
                        <p className="text-[var(--text-secondary)] font-medium tracking-wide text-xs uppercase">{currentStep.subtitle}</p>
                    </div>
                    <span className="text-[var(--accent-primary)] font-bold text-lg">{step + 1}/{STEPS.length}</span>
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
                                        className={`p-4 rounded-[var(--radius-md)] border transition-all uppercase tracking-wide font-bold text-left
                                            ${data.experience === level
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_15px_-5px_var(--accent-glow)]'
                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        {level}
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 3 && (
                            <div className="grid grid-cols-1 gap-4">
                                {EQUIPMENT_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setData({ ...data, equipment: option.id })}
                                        className={`p-4 rounded-[var(--radius-md)] border transition-all text-left flex items-center gap-4
                                            ${data.equipment === option.id
                                                ? 'border-[var(--accent-tertiary)] bg-[var(--accent-tertiary)]/10 text-white shadow-[0_0_15px_-5px_var(--accent-tertiary)]'
                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-2xl">{option.icon}</span>
                                        <div>
                                            <p className="font-bold uppercase tracking-wide">{option.label}</p>
                                            <p className="text-xs text-[var(--text-tertiary)]">{option.description}</p>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        )}

                        {step === 4 && (
                            <div className="space-y-6">
                                <p className="text-white text-center text-5xl font-bold">{data.daysPerWeek} DAYS</p>
                                <input
                                    type="range"
                                    min="2"
                                    max="6"
                                    value={data.daysPerWeek}
                                    onChange={(e) => setData({ ...data, daysPerWeek: parseInt(e.target.value) })}
                                    className="w-full accent-[var(--accent-primary)] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer hover:bg-white/20 transition-colors"
                                />
                            </div>
                        )}

                        {step === 5 && (
                            <div className="grid grid-cols-1 gap-4">
                                {['strength', 'hypertrophy', 'general'].map((goal) => (
                                    <button
                                        key={goal}
                                        onClick={() => setData({ ...data, goal })}
                                        className={`p-4 rounded-[var(--radius-md)] border transition-all uppercase tracking-wide font-bold text-left
                                            ${data.goal === goal
                                                ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)] shadow-[0_0_15px_-5px_rgba(129,140,248,0.5)]'
                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
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
