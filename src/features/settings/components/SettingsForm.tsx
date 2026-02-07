'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { createClient } from '@/lib/supabase/client';
import { generateProgram } from '@/features/workouts/actions/generateProgram';

interface SettingsFormProps {
    profile: {
        id: string;
        full_name: string;
        gender?: string;
        onboarding_data?: {
            age?: number;
            weight?: number;
            experience?: string;
            days_per_week?: number;
            goal?: string;
            category?: string;
            program_slug?: string;
            equipment?: string;
            equipment_available?: string[];
        };
        age?: number;
        weight?: number;
        experience?: string;
        days_per_week?: number;
        goal?: string;
        equipment?: string;
        equipment_available?: string[];
    };
}

const EQUIPMENT_OPTIONS = [
    { id: 'full_gym', label: 'FULL GYM', description: 'Barbells, machines, cables' },
    { id: 'dumbbells', label: 'DUMBBELLS', description: 'Home gym setup' },
    { id: 'bodyweight', label: 'BODYWEIGHT', description: 'No equipment' },
    { id: 'bands', label: 'BANDS', description: 'Portable training' },
];

const CATEGORY_OPTIONS = [
    { id: 'bodybuilding', label: '🏋️ BODYBUILDING' },
    { id: 'strength', label: '💪 STRENGTH' },
    { id: 'power', label: '⚡ POWER' },
    { id: 'endurance', label: '🏃 ENDURANCE' },
    { id: 'flexibility', label: '🧘 FLEXIBILITY' },
    { id: 'athletic', label: '🏈 ATHLETIC' },
    { id: 'general', label: '🌱 GENERAL' },
];

interface TrainingProgram {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    difficulty: string;
    min_days: number;
    max_days: number;
    gender_default: string | null;
}

export function SettingsForm({ profile }: SettingsFormProps) {
    const onboardingData = profile.onboarding_data || {};

    // Map legacy goal values to categories for old users
    const legacyGoalToCategory = (goal?: string): string => {
        if (!goal) return 'general';
        const map: Record<string, string> = {
            'strength': 'strength',
            'hypertrophy': 'bodybuilding',
            'general': 'general',
        };
        return map[goal] || 'general';
    };

    const notifPrefs = (profile as any).notification_preferences || { training_days: [], preferred_time: '07:00', email_reminders: false };

    const [data, setData] = useState({
        fullName: profile.full_name || '',
        age: String(onboardingData.age || ''),
        weight: String(onboardingData.weight || ''),
        gender: profile.gender || (onboardingData as any).gender || 'prefer_not_to_say',
        experience: onboardingData.experience || 'beginner',
        daysPerWeek: onboardingData.days_per_week || 3,
        category: onboardingData.category || legacyGoalToCategory(onboardingData.goal),
        programSlug: onboardingData.program_slug || '',
        equipment: onboardingData.equipment || 'full_gym'
    });

    const [notificationSettings, setNotificationSettings] = useState({
        training_days: notifPrefs.training_days as string[],
        preferred_time: notifPrefs.preferred_time as string,
        email_reminders: notifPrefs.email_reminders as boolean,
    });

    const toggleTrainingDay = (day: string) => {
        setNotificationSettings(prev => ({
            ...prev,
            training_days: prev.training_days.includes(day)
                ? prev.training_days.filter(d => d !== day)
                : [...prev.training_days, day]
        }));
    };
    const [saving, setSaving] = useState(false);
    const [regenerating, setRegenerating] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);

    const supabase = createClient();

    // Fetch available programs
    useEffect(() => {
        async function fetchPrograms() {
            const { data: progs } = await supabase
                .from('training_programs')
                .select('*')
                .order('category', { ascending: true });
            if (progs) setPrograms(progs);
        }
        fetchPrograms();
    }, []);

    // Filter programs by category and days
    const filteredPrograms = useMemo(() => {
        return programs.filter(p => {
            if (p.category !== data.category) return false;
            if (data.daysPerWeek < p.min_days) return false;
            return true;
        });
    }, [programs, data.category, data.daysPerWeek]);

    // Auto-select first program when category changes
    useEffect(() => {
        if (filteredPrograms.length > 0 && !filteredPrograms.find(p => p.slug === data.programSlug)) {
            setData(prev => ({ ...prev, programSlug: filteredPrograms[0].slug }));
        }
    }, [filteredPrograms]);

    const getEquipmentList = (key: string) => {
        const map: Record<string, string[]> = {
            'full_gym': ['barbell', 'dumbbell', 'cable', 'machine'],
            'dumbbells': ['dumbbell'],
            'bodyweight': ['bodyweight'],
            'bands': ['band', 'bodyweight']
        };
        return map[key] || ['barbell', 'dumbbell'];
    };

    const handleSaveProfile = async () => {
        setSaving(true);
        setMessage(null);
        try {
            const { error } = await supabase.from('users').update({
                full_name: data.fullName,
                gender: data.gender === 'prefer_not_to_say' ? null : data.gender,
                notification_preferences: notificationSettings,
                onboarding_data: {
                    age: parseInt(data.age) || undefined,
                    weight: parseInt(data.weight) || undefined,
                    gender: data.gender,
                    experience: data.experience,
                    days_per_week: data.daysPerWeek,
                    category: data.category,
                    program_slug: data.programSlug,
                    equipment: data.equipment,
                    equipment_available: getEquipmentList(data.equipment)
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
            await handleSaveProfile();

            await generateProgram(profile.id, {
                experience: data.experience as any,
                days_per_week: data.daysPerWeek,
                goal: data.category,
                program_slug: data.programSlug,
                equipment: getEquipmentList(data.equipment),
                gender: data.gender as any,
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

    const selectedProgram = programs.find(p => p.slug === data.programSlug);

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

                {/* Equipment */}
                <div className="mb-6">
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Equipment Access</label>
                    <div className="grid grid-cols-2 gap-2">
                        {EQUIPMENT_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                onClick={() => setData({ ...data, equipment: opt.id })}
                                className={`p-3 rounded-xl border transition-all text-left
                                    ${data.equipment === opt.id
                                        ? 'border-[var(--accent-tertiary)] bg-[var(--accent-tertiary)]/10 text-[var(--accent-tertiary)]'
                                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                                    }`}
                            >
                                <div className="font-bold text-xs uppercase tracking-wide">{opt.label}</div>
                                <div className="text-[10px] opacity-70 truncate">{opt.description}</div>
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

                {/* Training Category */}
                <div className="mb-6">
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Training Category</label>
                    <div className="grid grid-cols-2 gap-2">
                        {CATEGORY_OPTIONS.map((cat) => (
                            <button
                                key={cat.id}
                                onClick={() => setData({ ...data, category: cat.id, programSlug: '' })}
                                className={`p-3 rounded-xl border transition-all text-left font-bold text-xs uppercase tracking-wide
                                    ${data.category === cat.id
                                        ? 'border-[var(--accent-secondary)] bg-[var(--accent-secondary)]/10 text-[var(--accent-secondary)]'
                                        : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                                    }`}
                            >
                                {cat.label}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Program */}
                <div>
                    <label className="text-[var(--text-secondary)] text-xs uppercase tracking-wider font-bold mb-3 block">Program</label>
                    {filteredPrograms.length === 0 ? (
                        <p className="text-[var(--text-tertiary)] text-xs p-3 border border-white/10 rounded-xl bg-white/5">
                            No programs available for {data.daysPerWeek} days/week. Try increasing your training days.
                        </p>
                    ) : (
                        <div className="space-y-2">
                            {filteredPrograms.map((prog) => (
                                <button
                                    key={prog.slug}
                                    onClick={() => setData({ ...data, programSlug: prog.slug })}
                                    className={`w-full p-3 rounded-xl border transition-all text-left
                                        ${data.programSlug === prog.slug
                                            ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white shadow-[0_0_15px_-5px_var(--accent-glow)]'
                                            : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20'
                                        }`}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-bold text-xs uppercase tracking-wide">{prog.name}</span>
                                        <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border
                                            ${prog.difficulty === 'beginner' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                                prog.difficulty === 'intermediate' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                                    'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                            {prog.difficulty}
                                        </span>
                                    </div>
                                    <p className="text-[10px] text-[var(--text-tertiary)] line-clamp-1">{prog.description}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </Card>

            {/* Selected Program Info */}
            {selectedProgram && (
                <Card variant="glass">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 rounded-xl bg-[var(--accent-tertiary)]/20 flex items-center justify-center">
                            <svg className="w-5 h-5 text-[var(--accent-tertiary)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
                            </svg>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-white">{selectedProgram.name}</h2>
                            <p className="text-[var(--text-tertiary)] text-sm">{selectedProgram.category} • {selectedProgram.min_days}-{selectedProgram.max_days} days/wk</p>
                        </div>
                    </div>
                    <p className="text-[var(--text-secondary)] text-sm">{selectedProgram.description}</p>
                </Card>
            )}

            {/* Notifications Section */}
            <Card variant="glass">
                <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-[var(--accent-warning)]/10 flex items-center justify-center">
                        <svg className="w-5 h-5 text-[var(--accent-warning)]" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" />
                        </svg>
                    </div>
                    <div>
                        <h2 className="text-lg font-bold text-white">Notifications</h2>
                        <p className="text-[var(--text-tertiary)] text-xs">Set your training schedule for smart reminders</p>
                    </div>
                </div>

                {/* Training Days */}
                <label className="block text-sm font-semibold text-white mb-2">Training Days</label>
                <div className="flex gap-2 mb-5">
                    {['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'].map(day => (
                        <button
                            key={day}
                            type="button"
                            onClick={() => toggleTrainingDay(day)}
                            className={`flex-1 py-2 rounded-lg text-[10px] sm:text-xs font-bold uppercase transition-all ${notificationSettings.training_days.includes(day)
                                    ? 'bg-[var(--accent-primary)]/20 border border-[var(--accent-primary)]/40 text-[var(--accent-primary)] shadow-[0_0_15px_-5px_var(--accent-primary)]'
                                    : 'bg-white/5 border border-white/10 text-[var(--text-tertiary)] hover:bg-white/8'
                                }`}
                        >
                            {day}
                        </button>
                    ))}
                </div>

                {/* Preferred Time */}
                <label className="block text-sm font-semibold text-white mb-2">Preferred Training Time</label>
                <input
                    type="time"
                    value={notificationSettings.preferred_time}
                    onChange={(e) => setNotificationSettings(prev => ({ ...prev, preferred_time: e.target.value }))}
                    className="w-full px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white font-mono text-sm focus:border-[var(--accent-primary)] focus:outline-none transition-all mb-5"
                />

                {/* Email Toggle */}
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-semibold text-white">Email Reminders</p>
                        <p className="text-[10px] text-[var(--text-tertiary)]">Receive training reminders and weekly recaps</p>
                    </div>
                    <button
                        type="button"
                        onClick={() => setNotificationSettings(prev => ({ ...prev, email_reminders: !prev.email_reminders }))}
                        className={`relative w-11 h-6 rounded-full transition-all ${notificationSettings.email_reminders
                                ? 'bg-[var(--accent-primary)]'
                                : 'bg-white/10'
                            }`}
                    >
                        <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white transition-transform ${notificationSettings.email_reminders ? 'translate-x-5' : ''
                            }`} />
                    </button>
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
