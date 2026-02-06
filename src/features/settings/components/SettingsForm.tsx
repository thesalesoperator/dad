'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { generateProgram } from '@/features/workouts/actions/generateProgram';

interface SettingsFormProps {
    profile: {
        id: string;
        full_name: string;
        onboarding_data?: {
            age?: number;
            weight?: number;
            experience?: string;
            days_per_week?: number;
            goal?: string;
        };
    };
}

export function SettingsForm({ profile }: SettingsFormProps) {
    const onboardingData = profile.onboarding_data || {};

    const [data, setData] = useState({
        fullName: profile.full_name || '',
        age: String(onboardingData.age || ''),
        weight: String(onboardingData.weight || ''),
        experience: onboardingData.experience || 'beginner',
        daysPerWeek: onboardingData.days_per_week || 3,
        goal: onboardingData.goal || 'strength'
    });
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const supabase = createClient();

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase.from('users').update({
                full_name: data.fullName,
                onboarding_data: {
                    age: parseInt(data.age) || undefined,
                    weight: parseInt(data.weight) || undefined,
                    experience: data.experience,
                    days_per_week: data.daysPerWeek,
                    goal: data.goal
                }
            }).eq('id', profile.id);

            if (error) throw error;
            setMessage({ type: 'success', text: 'Profile saved successfully!' });
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to save' });
        } finally {
            setSaving(false);
        }
    };

    const handleRegenerateProgram = async () => {
        if (!confirm('This will create a new training cycle with your updated settings. Your workout history will be preserved. Continue?')) {
            return;
        }

        setRegenerating(true);
        setMessage(null);
        try {
            // Save profile first
            await handleSaveProfile();

            // Generate new program
            await generateProgram(profile.id, {
                experience: data.experience as any,
                days_per_week: data.daysPerWeek,
                goal: data.goal as any
            });

            setMessage({ type: 'success', text: 'New training cycle created! Redirecting...' });
            setTimeout(() => {
                window.location.href = '/dashboard';
            }, 1500);
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message || 'Failed to regenerate' });
        } finally {
            setRegenerating(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto space-y-6 animate-slide-up" style={{ animationDelay: '0.1s' }}>
            {/* Profile Section */}
            <Card variant="glass">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-primary)]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--accent-primary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Profile</h2>
                        <p className="text-[var(--text-tertiary)] text-sm">Your personal information</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <Input
                        label="Full Name"
                        value={data.fullName}
                        onChange={(e) => setData({ ...data, fullName: e.target.value })}
                    />
                    <div className="grid grid-cols-2 gap-4">
                        <Input
                            label="Age"
                            type="number"
                            value={data.age}
                            onChange={(e) => setData({ ...data, age: e.target.value })}
                        />
                        <Input
                            label="Weight (lbs)"
                            type="number"
                            value={data.weight}
                            onChange={(e) => setData({ ...data, weight: e.target.value })}
                        />
                    </div>
                </div>
            </Card>

            {/* Training Settings */}
            <Card variant="glass">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-secondary)]/20 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--accent-secondary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Training</h2>
                        <p className="text-[var(--text-tertiary)] text-sm">Adjust your program settings</p>
                    </div>
                </div>

                {/* Experience Level */}
                <div className="mb-6">
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Experience Level</label>
                    <div className="grid grid-cols-3 gap-2">
                        {['beginner', 'intermediate', 'advanced'].map((level) => (
                            <button
                                key={level}
                                onClick={() => setData({ ...data, experience: level })}
                                className={`p-3 rounded-xl border transition-all uppercase tracking-wide font-bold text-xs
                                    ${data.experience === level
                                        ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-[var(--accent-primary)] shadow-[0_0_15px_-5px_var(--accent-glow)]'
                                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                                    }`}
                            >
                                {level}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Days Per Week */}
                <div className="mb-6">
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Days Per Week</label>
                    <div className="flex items-center gap-4">
                        <span className="text-3xl font-bold text-white w-16">{data.daysPerWeek}</span>
                        <input
                            type="range"
                            min="2"
                            max="6"
                            value={data.daysPerWeek}
                            onChange={(e) => setData({ ...data, daysPerWeek: parseInt(e.target.value) })}
                            className="flex-1 accent-[var(--accent-primary)] h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                    </div>
                </div>

                {/* Goal */}
                <div>
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Training Goal</label>
                    <div className="grid grid-cols-3 gap-2">
                        {[
                            { id: 'strength', label: 'STRENGTH' },
                            { id: 'hypertrophy', label: 'HYPERTROPHY' },
                            { id: 'general', label: 'GENERAL' }
                        ].map(({ id, label }) => (
                            <button
                                key={id}
                                onClick={() => setData({ ...data, goal: id })}
                                className={`p-3 rounded-xl border transition-all uppercase tracking-wide font-bold text-xs
                                    ${data.goal === id
                                        ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                                    }`}
                            >
                                {label}
                            </button>
                        ))}
                    </div>
                </div>
            </Card>

            {/* Message */}
            {message && (
                <div className={`p-4 rounded-xl border ${message.type === 'success'
                        ? 'bg-[var(--accent-tertiary)]/10 border-[var(--accent-tertiary)]/30 text-[var(--accent-tertiary)]'
                        : 'bg-red-500/10 border-red-500/30 text-red-400'
                    }`}>
                    {message.text}
                </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
                <Button
                    fullWidth
                    onClick={handleSaveProfile}
                    disabled={saving}
                    className="sm:flex-1"
                >
                    {saving ? 'SAVING...' : 'SAVE CHANGES'}
                </Button>
                <Button
                    fullWidth
                    variant="secondary"
                    onClick={handleRegenerateProgram}
                    disabled={regenerating}
                    className="sm:flex-1"
                >
                    {regenerating ? 'GENERATING...' : 'NEW TRAINING CYCLE'}
                </Button>
            </div>

            <p className="text-center text-[var(--text-tertiary)] text-xs">
                Creating a new cycle will generate fresh workouts with your updated settings. Your workout history is preserved.
            </p>
        </div>
    );
}
