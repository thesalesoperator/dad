'use client';

import { useState, useEffect, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card } from '@/components/ui/Card';
import { generateProgram } from '@/features/workouts/actions/generateProgram';

const STEPS = [
    { id: 'name', title: 'WHO ARE YOU?', subtitle: 'First things first.' },
    { id: 'stats', title: 'VITALS', subtitle: 'Calibration data.' },
    { id: 'gender', title: 'BIOLOGY', subtitle: 'Optimize your defaults.' },
    { id: 'experience', title: 'HISTORY', subtitle: 'Honesty required.' },
    { id: 'equipment', title: 'YOUR GYM', subtitle: 'What do you have access to?' },
    { id: 'availability', title: 'COMMITMENT', subtitle: 'Be realistic.' },
    { id: 'goals', title: 'YOUR MISSION', subtitle: 'Select up to 3 goals in priority order.' },
    { id: 'program', title: 'YOUR RECOMMENDATION', subtitle: 'Matched to your goals.' },
];

const EQUIPMENT_OPTIONS = [
    { id: 'full_gym', label: 'FULL GYM', description: 'Barbells, machines, cables', icon: '🏋️' },
    { id: 'dumbbells', label: 'DUMBBELLS ONLY', description: 'Home gym with dumbbells', icon: '💪' },
    { id: 'bodyweight', label: 'BODYWEIGHT', description: 'No equipment needed', icon: '🤸' },
    { id: 'bands', label: 'RESISTANCE BANDS', description: 'Portable training', icon: '🎯' },
];

const GENDER_OPTIONS = [
    { id: 'male', label: 'MALE', icon: '♂', description: 'Standard rep ranges & volume' },
    { id: 'female', label: 'FEMALE', icon: '♀', description: 'Optimized rep ranges & recovery' },
    { id: 'prefer_not_to_say', label: 'SKIP', icon: '—', description: 'Use default programming' },
];

const GOAL_OPTIONS = [
    { id: 'bodybuilding', label: 'BUILD MUSCLE', icon: '🏋️', description: 'Maximum hypertrophy & aesthetics', color: '#00f0ff' },
    { id: 'strength', label: 'GET STRONG', icon: '💪', description: 'Raw strength & heavy compound lifts', color: '#f97316' },
    { id: 'power', label: 'EXPLOSIVE POWER', icon: '⚡', description: 'Speed, plyometrics & force production', color: '#f59e0b' },
    { id: 'endurance', label: 'ENDURANCE', icon: '🏃', description: 'Work capacity & conditioning', color: '#10b981' },
    { id: 'flexibility', label: 'MOBILITY', icon: '🧘', description: 'Flexibility, recovery & joint health', color: '#8b5cf6' },
    { id: 'athletic', label: 'ATHLETIC', icon: '🏈', description: 'Sport performance & agility', color: '#ef4444' },
    { id: 'general', label: 'GENERAL FITNESS', icon: '🌱', description: 'Balanced, sustainable & time-efficient', color: '#06d6a0' },
];

// Cross-category tag relevance — which tags align with each goal
const GOAL_TAG_AFFINITY: Record<string, string[]> = {
    strength: ['compound_only', 'compound_focus', 'linear_progression', 'strength_hypertrophy', 'submaximal', 'amrap', 'periodized', 'barbell'],
    bodybuilding: ['high_volume', 'aesthetic', 'pump', 'periodized', 'rpe_based', 'evidence_based', 'superset', 'golden_era', 'isolation_heavy', 'v_taper', 'x_frame', 'upper_focused', 'glute_focused'],
    endurance: ['circuits', 'conditioning', 'intervals', 'fat_loss', 'high_rep', 'time_based'],
    athletic: ['functional', 'compound', 'plyometric', 'agility', 'varied', 'conditioning', 'explosive'],
    power: ['explosive', 'barbell', 'jumps', 'bodyweight', 'technical', 'plyometric'],
    flexibility: ['recovery', 'joint_health', 'stretching', 'dynamic', 'yoga_inspired', 'low_impact'],
    general: ['full_body', 'sustainable', 'time_efficient', 'health', 'well_rounded', 'fat_loss'],
};

// Priority weights: first goal = 60%, second = 30%, third = 10%
const PRIORITY_WEIGHTS = [0.60, 0.30, 0.10];

interface TrainingProgram {
    id: string;
    name: string;
    slug: string;
    category: string;
    description: string;
    science_note: string;
    difficulty: string;
    min_days: number;
    max_days: number;
    gender_default: string | null;
    tags: string[];
}

interface ScoredProgram extends TrainingProgram {
    matchScore: number;
    matchReasons: string[];
}

function scoreProgram(
    program: TrainingProgram,
    goals: string[],
    experience: string,
    daysPerWeek: number
): ScoredProgram {
    let score = 0;
    const reasons: string[] = [];

    // 1. Category match (core scoring)
    goals.forEach((goal, index) => {
        const weight = PRIORITY_WEIGHTS[index] || 0.05;
        if (program.category === goal) {
            score += 50 * weight;
            const priority = index === 0 ? 'primary' : index === 1 ? 'secondary' : 'tertiary';
            reasons.push(`Direct ${priority} goal match`);
        }
    });

    // 2. Tag overlap scoring — gives cross-category relevance
    const programTags = new Set(program.tags || []);
    goals.forEach((goal, index) => {
        const weight = PRIORITY_WEIGHTS[index] || 0.05;
        const affinityTags = GOAL_TAG_AFFINITY[goal] || [];
        let tagHits = 0;
        affinityTags.forEach(tag => {
            if (programTags.has(tag)) tagHits++;
        });
        if (tagHits > 0) {
            score += (tagHits * 5) * weight;
            if (tagHits >= 2) reasons.push(`${tagHits} tags match "${GOAL_OPTIONS.find(g => g.id === goal)?.label || goal}"`);
        }
    });

    // 3. Difficulty-experience alignment bonus
    const difficultyMap: Record<string, number> = { beginner: 0, intermediate: 1, advanced: 2 };
    const expLevel = difficultyMap[experience] ?? 1;
    const progLevel = difficultyMap[program.difficulty] ?? 1;
    if (expLevel === progLevel) {
        score += 10;
        reasons.push('Matches your experience');
    } else if (Math.abs(expLevel - progLevel) === 1) {
        score += 5;
    }

    // 4. Days-per-week fit
    if (daysPerWeek >= program.min_days && daysPerWeek <= program.max_days) {
        score += 8;
        reasons.push('Fits your schedule');
    } else if (daysPerWeek >= program.min_days - 1 && daysPerWeek <= program.max_days + 1) {
        score += 3;
    }

    // Normalize to 0-100
    const maxPossible = 50 + 25 + 10 + 8; // category + tags + difficulty + days
    const normalized = Math.min(99, Math.round((score / maxPossible) * 100));

    return { ...program, matchScore: normalized, matchReasons: reasons };
}

export function OnboardingWizard() {
    const [step, setStep] = useState(0);
    const [data, setData] = useState({
        fullName: '',
        age: '',
        weight: '',
        gender: 'prefer_not_to_say',
        experience: 'beginner',
        equipment: 'full_gym',
        daysPerWeek: 3,
        goals: [] as string[],
        programSlug: '',
    });
    const [loading, setLoading] = useState(false);
    const [programs, setPrograms] = useState<TrainingProgram[]>([]);
    const supabase = createClient();

    // Fetch available programs from DB
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

    // Toggle a goal on/off. Selection order = priority rank.
    const toggleGoal = (goalId: string) => {
        setData(prev => {
            const current = [...prev.goals];
            const idx = current.indexOf(goalId);
            if (idx >= 0) {
                // Remove
                current.splice(idx, 1);
            } else if (current.length < 3) {
                // Add as next priority
                current.push(goalId);
            }
            return { ...prev, goals: current, programSlug: '' };
        });
    };

    // Score and rank ALL programs based on multi-goal selection
    const scoredPrograms = useMemo((): ScoredProgram[] => {
        if (data.goals.length === 0) return [];

        return programs
            .filter(p => data.daysPerWeek >= p.min_days - 1) // loose filter — show programs that almost fit
            .map(p => scoreProgram(p, data.goals, data.experience, data.daysPerWeek))
            .sort((a, b) => b.matchScore - a.matchScore);
    }, [programs, data.goals, data.experience, data.daysPerWeek]);

    // Auto-select top recommendation when goals change
    useEffect(() => {
        if (scoredPrograms.length > 0 && !scoredPrograms.find(p => p.slug === data.programSlug)) {
            setData(prev => ({ ...prev, programSlug: scoredPrograms[0].slug }));
        }
    }, [scoredPrograms]);

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

            const equipmentMap: Record<string, string[]> = {
                'full_gym': ['barbell', 'dumbbell', 'cable', 'machine'],
                'dumbbells': ['dumbbell'],
                'bodyweight': ['bodyweight'],
                'bands': ['band', 'bodyweight']
            };

            // 1. Update Profile
            const { error: profileError } = await supabase.from('users').update({
                full_name: data.fullName,
                gender: data.gender === 'prefer_not_to_say' ? null : data.gender,
                onboarding_completed: true,
                onboarding_data: {
                    age: parseInt(data.age),
                    weight: parseInt(data.weight),
                    gender: data.gender,
                    experience: data.experience,
                    equipment: data.equipment,
                    equipment_available: equipmentMap[data.equipment] || ['barbell', 'dumbbell'],
                    days_per_week: data.daysPerWeek,
                    goals: data.goals,
                    // Keep category as primary goal for backward compat
                    category: data.goals[0] || 'general',
                    program_slug: data.programSlug,
                }
            }).eq('id', user.id);

            if (profileError) {
                throw new Error(`Profile Update Failed: ${profileError.message}`);
            }

            // 2. Generate Program
            await generateProgram(user.id, {
                experience: data.experience as 'beginner' | 'intermediate' | 'advanced',
                days_per_week: data.daysPerWeek,
                goal: data.goals[0] || 'general',
                program_slug: data.programSlug,
                equipment: equipmentMap[data.equipment] || ['barbell', 'dumbbell'],
                gender: data.gender as 'male' | 'female' | 'prefer_not_to_say',
            });

            window.location.href = '/dashboard';
        } catch (error: any) {
            console.error('Onboarding error:', error);
            alert(`Error: ${error.message || 'Unknown error'}`);
        } finally {
            setLoading(false);
        }
    };

    const currentStep = STEPS[step];
    const canProceedGoals = data.goals.length >= 1;

    // Split scored programs: top picks vs other options
    const topPicks = scoredPrograms.filter(p => p.matchScore >= 40);
    const otherOptions = scoredPrograms.filter(p => p.matchScore < 40 && p.matchScore > 0);

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
                        {/* Step 0: Name */}
                        {step === 0 && (
                            <Input
                                label="Full Name"
                                value={data.fullName}
                                onChange={(e) => setData({ ...data, fullName: e.target.value })}
                                placeholder="JOHN DOE"
                                autoFocus
                            />
                        )}

                        {/* Step 1: Stats */}
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

                        {/* Step 2: Gender */}
                        {step === 2 && (
                            <div className="grid grid-cols-1 gap-4">
                                {GENDER_OPTIONS.map((option) => (
                                    <button
                                        key={option.id}
                                        onClick={() => setData({ ...data, gender: option.id })}
                                        className={`p-4 rounded-[var(--radius-md)] border transition-all text-left flex items-center gap-4
                                            ${data.gender === option.id
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white shadow-[0_0_15px_-5px_var(--accent-glow)]'
                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <span className="text-2xl w-8 text-center">{option.icon}</span>
                                        <div>
                                            <p className="font-bold uppercase tracking-wide">{option.label}</p>
                                            <p className="text-xs text-[var(--text-tertiary)]">{option.description}</p>
                                        </div>
                                    </button>
                                ))}
                                <p className="text-xs text-[var(--text-tertiary)] text-center mt-2">
                                    Used for default rep range optimization only. All programs available to everyone.
                                </p>
                            </div>
                        )}

                        {/* Step 3: Experience */}
                        {step === 3 && (
                            <div className="grid grid-cols-1 gap-4">
                                {[
                                    { id: 'beginner', label: 'BEGINNER', icon: '🌱', desc: 'Less than 1 year of training. Lower volume with focus on learning movement patterns.', detail: 'Sets reduced by 1 • Foundational compound lifts' },
                                    { id: 'intermediate', label: 'INTERMEDIATE', icon: '⚡', desc: '1-3 years of consistent training. Ready for strategic periodization.', detail: 'Standard prescription • Progressive overload tracking' },
                                    { id: 'advanced', label: 'ADVANCED', icon: '🔥', desc: '3+ years. Higher volume and intensity to push past plateaus.', detail: 'Sets increased by 1 • RPE-driven autoregulation' },
                                ].map((level) => (
                                    <button
                                        key={level.id}
                                        onClick={() => setData({ ...data, experience: level.id })}
                                        className={`p-4 rounded-[var(--radius-md)] border transition-all text-left
                                            ${data.experience === level.id
                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white shadow-[0_0_15px_-5px_var(--accent-glow)]'
                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="text-2xl w-8 text-center">{level.icon}</span>
                                            <div className="flex-1">
                                                <p className="font-bold uppercase tracking-wide text-sm">{level.label}</p>
                                                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{level.desc}</p>
                                                <p className="text-[10px] text-[var(--accent-primary)]/70 font-mono mt-1">{level.detail}</p>
                                            </div>
                                        </div>
                                    </button>
                                ))}
                                <p className="text-xs text-[var(--text-tertiary)] text-center mt-1">
                                    Your experience level adjusts set volume and training intensity.
                                </p>
                            </div>
                        )}

                        {/* Step 4: Equipment */}
                        {step === 4 && (
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

                        {/* Step 5: Days Per Week */}
                        {step === 5 && (
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

                        {/* Step 6: Multi-Goal Selection */}
                        {step === 6 && (
                            <div className="space-y-4">
                                <div className="grid grid-cols-1 gap-3">
                                    {GOAL_OPTIONS.map((goal) => {
                                        const priorityIndex = data.goals.indexOf(goal.id);
                                        const isSelected = priorityIndex >= 0;
                                        const priorityNum = priorityIndex + 1;
                                        const isMaxed = data.goals.length >= 3 && !isSelected;

                                        return (
                                            <button
                                                key={goal.id}
                                                onClick={() => !isMaxed && toggleGoal(goal.id)}
                                                disabled={isMaxed}
                                                className={`relative p-4 rounded-[var(--radius-md)] border transition-all text-left flex items-center gap-4
                                                    ${isSelected
                                                        ? 'border-white/30 bg-white/10 text-white'
                                                        : isMaxed
                                                            ? 'border-white/5 bg-white/[0.02] text-[var(--text-tertiary)] opacity-40 cursor-not-allowed'
                                                            : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10 cursor-pointer'
                                                    }`}
                                                style={isSelected ? {
                                                    borderColor: goal.color,
                                                    boxShadow: `0 0 25px -8px ${goal.color}`,
                                                    background: `linear-gradient(135deg, ${goal.color}15, transparent)`
                                                } : {}}
                                            >
                                                {/* Priority badge */}
                                                {isSelected && (
                                                    <div
                                                        className="absolute -top-2 -right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-black shadow-lg z-10"
                                                        style={{ backgroundColor: goal.color, boxShadow: `0 0 12px ${goal.color}` }}
                                                    >
                                                        {priorityNum}
                                                    </div>
                                                )}
                                                <span className="text-2xl w-8 text-center flex-shrink-0">{goal.icon}</span>
                                                <div className="flex-1 min-w-0">
                                                    <p className="font-bold uppercase tracking-wide text-sm">{goal.label}</p>
                                                    <p className="text-xs text-[var(--text-tertiary)] mt-0.5">{goal.description}</p>
                                                </div>
                                                {isSelected && (
                                                    <span className="text-[10px] uppercase tracking-widest font-bold flex-shrink-0"
                                                        style={{ color: goal.color }}>
                                                        {priorityIndex === 0 ? 'PRIMARY' : priorityIndex === 1 ? 'SECONDARY' : 'TERTIARY'}
                                                    </span>
                                                )}
                                            </button>
                                        );
                                    })}
                                </div>
                                <div className="text-center space-y-1">
                                    <p className="text-xs text-[var(--text-tertiary)]">
                                        {data.goals.length === 0
                                            ? 'Tap to select goals — order determines priority'
                                            : data.goals.length < 3
                                                ? `${data.goals.length}/3 selected — tap more to refine, or continue`
                                                : '3/3 selected — tap a goal to remove it'
                                        }
                                    </p>
                                    {data.goals.length > 0 && (
                                        <p className="text-[10px] text-[var(--accent-primary)]/60 font-mono">
                                            First pick = 60% weight • Second = 30% • Third = 10%
                                        </p>
                                    )}
                                </div>
                            </div>
                        )}

                        {/* Step 7: Program Recommendations */}
                        {step === 7 && (
                            <div className="space-y-4">
                                {/* Goal summary */}
                                <div className="flex flex-wrap gap-2 mb-2">
                                    {data.goals.map((goalId, i) => {
                                        const goal = GOAL_OPTIONS.find(g => g.id === goalId);
                                        if (!goal) return null;
                                        return (
                                            <span key={goalId} className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border"
                                                style={{
                                                    borderColor: `${goal.color}40`,
                                                    color: goal.color,
                                                    background: `${goal.color}15`
                                                }}>
                                                <span className="text-sm">{goal.icon}</span>
                                                {goal.label}
                                                <span className="opacity-50 text-[9px]">#{i + 1}</span>
                                            </span>
                                        );
                                    })}
                                </div>

                                {scoredPrograms.length === 0 ? (
                                    <div className="text-center py-8">
                                        <p className="text-[var(--text-secondary)] text-sm">No programs match your criteria.</p>
                                        <p className="text-[var(--text-tertiary)] text-xs mt-2">Try adjusting your goals or training days.</p>
                                    </div>
                                ) : (
                                    <>
                                        {/* Top Picks */}
                                        {topPicks.length > 0 && (
                                            <div className="space-y-3">
                                                {topPicks.map((prog, idx) => (
                                                    <button
                                                        key={prog.slug}
                                                        onClick={() => setData({ ...data, programSlug: prog.slug })}
                                                        className={`w-full p-4 rounded-[var(--radius-md)] border transition-all text-left relative overflow-hidden
                                                            ${data.programSlug === prog.slug
                                                                ? 'border-[var(--accent-primary)] bg-[var(--accent-primary)]/10 text-white shadow-[0_0_20px_-5px_var(--accent-glow)]'
                                                                : 'border-white/10 bg-white/5 text-[var(--text-secondary)] hover:border-white/20 hover:bg-white/10'
                                                            }`}
                                                    >
                                                        {/* Top Pick Badge */}
                                                        {idx === 0 && (
                                                            <div className="absolute top-0 right-0 bg-gradient-to-l from-[var(--accent-primary)] to-[var(--accent-primary)]/60 text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-bl-lg">
                                                                ⭐ TOP PICK
                                                            </div>
                                                        )}

                                                        <div className="flex justify-between items-start mb-2">
                                                            <div className="flex-1 pr-20">
                                                                <p className="font-bold uppercase tracking-wide text-sm">{prog.name}</p>
                                                            </div>
                                                            {/* Match Score */}
                                                            <div className="flex items-center gap-2 flex-shrink-0">
                                                                <span className={`text-[10px] uppercase tracking-widest px-2 py-0.5 rounded-full border
                                                                    ${prog.difficulty === 'beginner' ? 'border-green-500/30 text-green-400 bg-green-500/10' :
                                                                        prog.difficulty === 'intermediate' ? 'border-yellow-500/30 text-yellow-400 bg-yellow-500/10' :
                                                                            'border-red-500/30 text-red-400 bg-red-500/10'}`}>
                                                                    {prog.difficulty}
                                                                </span>
                                                            </div>
                                                        </div>

                                                        <p className="text-xs text-[var(--text-tertiary)] mb-3">{prog.description}</p>

                                                        {/* Match Bar */}
                                                        <div className="mb-3">
                                                            <div className="flex items-center justify-between mb-1">
                                                                <span className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold">Match</span>
                                                                <span className={`text-xs font-black ${prog.matchScore >= 70 ? 'text-[var(--accent-tertiary)]' : prog.matchScore >= 40 ? 'text-[var(--accent-primary)]' : 'text-[var(--text-tertiary)]'}`}>
                                                                    {prog.matchScore}%
                                                                </span>
                                                            </div>
                                                            <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                                                                <div
                                                                    className="h-full rounded-full transition-all duration-500"
                                                                    style={{
                                                                        width: `${prog.matchScore}%`,
                                                                        background: prog.matchScore >= 70
                                                                            ? 'var(--accent-tertiary)'
                                                                            : prog.matchScore >= 40
                                                                                ? 'var(--accent-primary)'
                                                                                : 'rgba(255,255,255,0.3)'
                                                                    }}
                                                                />
                                                            </div>
                                                            {prog.matchReasons.length > 0 && (
                                                                <p className="text-[10px] text-[var(--text-tertiary)] mt-1 font-mono">
                                                                    {prog.matchReasons.slice(0, 3).join(' • ')}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Science Note */}
                                                        {prog.science_note && (
                                                            <div className={`p-2.5 rounded-lg transition-all ${data.programSlug === prog.slug
                                                                ? 'bg-[var(--accent-primary)]/5 border border-[var(--accent-primary)]/15'
                                                                : 'bg-white/[0.02] border border-white/5'
                                                                }`}>
                                                                <div className="flex items-start gap-2">
                                                                    <svg className="w-3.5 h-3.5 text-[var(--accent-primary)] mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 014.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0112 15a9.065 9.065 0 00-6.23.693L5 14.5m14.8.8l1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0112 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
                                                                    </svg>
                                                                    <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed italic">
                                                                        {prog.science_note}
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        )}

                                                        <div className="flex gap-3 text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider mt-2">
                                                            <span>{prog.min_days}-{prog.max_days} days/wk</span>
                                                            <span>• {prog.category}</span>
                                                            {prog.tags && prog.tags.length > 0 && (
                                                                <span>• {prog.tags.slice(0, 2).join(', ')}</span>
                                                            )}
                                                        </div>
                                                    </button>
                                                ))}
                                            </div>
                                        )}

                                        {/* Other Options */}
                                        {otherOptions.length > 0 && (
                                            <div className="space-y-2 mt-4">
                                                <p className="text-[10px] uppercase tracking-widest text-[var(--text-tertiary)] font-bold mb-2">Other Options</p>
                                                {otherOptions.slice(0, 4).map((prog) => (
                                                    <button
                                                        key={prog.slug}
                                                        onClick={() => setData({ ...data, programSlug: prog.slug })}
                                                        className={`w-full p-3 rounded-[var(--radius-md)] border transition-all text-left flex items-center justify-between
                                                            ${data.programSlug === prog.slug
                                                                ? 'border-[var(--accent-primary)]/50 bg-[var(--accent-primary)]/5 text-white'
                                                                : 'border-white/5 bg-white/[0.02] text-[var(--text-tertiary)] hover:border-white/10 hover:bg-white/5'
                                                            }`}
                                                    >
                                                        <div>
                                                            <p className="text-xs font-bold uppercase tracking-wide">{prog.name}</p>
                                                            <p className="text-[10px] text-[var(--text-tertiary)] mt-0.5">{prog.category} • {prog.difficulty}</p>
                                                        </div>
                                                        <span className="text-[11px] font-mono text-[var(--text-tertiary)]">{prog.matchScore}%</span>
                                                    </button>
                                                ))}
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        )}
                    </div>
                </Card>

                <div className="flex gap-3">
                    {step > 0 && (
                        <Button
                            fullWidth
                            size="lg"
                            onClick={() => setStep(step - 1)}
                            className="!bg-white/5 !border-white/10 hover:!bg-white/10"
                        >
                            BACK
                        </Button>
                    )}
                    <Button
                        fullWidth
                        size="lg"
                        onClick={handleNext}
                        disabled={loading || (step === 6 && !canProceedGoals) || (step === 7 && scoredPrograms.length === 0)}
                    >
                        {step === STEPS.length - 1
                            ? (loading ? 'INITIALIZING PROTOCOL...' : 'GENERATE PROGRAM')
                            : 'NEXT PHASE'
                        }
                    </Button>
                </div>
            </div>
        </div>
    );
}
