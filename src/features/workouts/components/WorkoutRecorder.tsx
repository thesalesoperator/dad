'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceInput } from '@/components/ui/VoiceInput';
import { VoiceNoteInput } from '@/components/ui/VoiceNoteInput';
import { ExerciseSwap } from '@/components/ui/ExerciseSwap';
import { ExerciseInfo } from '@/components/ui/ExerciseInfo';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WorkoutRecorderProps {
    workout: any;
    exercises: any[];
}

interface AlternativeExercise {
    id: string;
    name: string;
    muscle_group: string;
}

export function WorkoutRecorder({ workout, exercises: initialExercises }: WorkoutRecorderProps) {
    const [loading, setLoading] = useState(false);
    const [exercises, setExercises] = useState(initialExercises);
    const [alternatives, setAlternatives] = useState<Record<string, AlternativeExercise[]>>({});
    const router = useRouter();
    const supabase = createClient();

    const [logs, setLogs] = useState<Record<string, Record<number, { weight: string, reps: string }>>>({});
    const [notes, setNotes] = useState<Record<string, string>>({});

    const handleNoteChange = (exerciseId: string, note: string) => {
        setNotes(prev => ({ ...prev, [exerciseId]: note }));
    };

    // Fetch alternatives for all exercises
    useEffect(() => {
        const fetchAlternatives = async () => {
            const exerciseIds = exercises.map(e => e.exercise.id);

            // Get exercises with their alternatives
            const { data: exercisesWithAlts } = await supabase
                .from('exercises')
                .select('id, alternatives')
                .in('id', exerciseIds);

            if (!exercisesWithAlts) return;

            // Get all alternative IDs
            const allAltIds = new Set<string>();
            exercisesWithAlts.forEach(e => {
                (e.alternatives || []).forEach((id: string) => allAltIds.add(id));
            });

            // Fetch alternative exercise details
            const { data: altExercises } = await supabase
                .from('exercises')
                .select('id, name, muscle_group')
                .in('id', Array.from(allAltIds));

            // Map alternatives by exercise ID
            const altMap: Record<string, AlternativeExercise[]> = {};
            exercisesWithAlts.forEach(e => {
                altMap[e.id] = (e.alternatives || [])
                    .map((altId: string) => altExercises?.find(a => a.id === altId))
                    .filter(Boolean) as AlternativeExercise[];
            });

            setAlternatives(altMap);
        };

        fetchAlternatives();
    }, [exercises, supabase]);

    const handleSwap = async (workoutExerciseId: string, originalExerciseId: string, newExerciseId: string) => {
        // Fetch new exercise details
        const { data: newExercise } = await supabase
            .from('exercises')
            .select('*')
            .eq('id', newExerciseId)
            .single();

        if (!newExercise) return;

        // Update local state - swap the exercise
        setExercises(prev => prev.map(item => {
            if (item.id === workoutExerciseId) {
                return {
                    ...item,
                    exercise: newExercise
                };
            }
            return item;
        }));

        // Also fetch alternatives for the new exercise
        const { data: newExWithAlts } = await supabase
            .from('exercises')
            .select('id, alternatives')
            .eq('id', newExerciseId)
            .single();

        if (newExWithAlts?.alternatives?.length) {
            const { data: altExercises } = await supabase
                .from('exercises')
                .select('id, name, muscle_group')
                .in('id', newExWithAlts.alternatives);

            setAlternatives(prev => ({
                ...prev,
                [newExerciseId]: altExercises as AlternativeExercise[]
            }));
        }
    };

    const handleLogChange = (exerciseId: string, setNumber: number, field: 'weight' | 'reps', value: string) => {
        setLogs(prev => ({
            ...prev,
            [exerciseId]: {
                ...prev[exerciseId],
                [setNumber]: {
                    ...prev[exerciseId]?.[setNumber],
                    [field]: value
                }
            }
        }));
    };

    const handleComplete = async () => {
        setLoading(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Not authenticated');

            const { error: sessionError } = await supabase.from('workout_logs').insert({
                user_id: user.id,
                workout_id: workout.id,
                completed_at: new Date().toISOString(),
                duration_seconds: 3600
            });

            if (sessionError) throw sessionError;

            interface SetLog {
                user_id: string;
                workout_id: string;
                exercise_id: string;
                set_number: number;
                weight: number;
                reps_completed: number;
            }
            const setLogsToInsert: SetLog[] = [];

            exercises.forEach(exercise => {
                const exerciseLogs = logs[exercise.id];
                const targetSets = exercise.sets || 3;

                for (let i = 1; i <= targetSets; i++) {
                    const setLog = exerciseLogs?.[i];
                    if (setLog?.weight || setLog?.reps) {
                        setLogsToInsert.push({
                            user_id: user.id,
                            workout_id: workout.id,
                            exercise_id: exercise.exercise.id,
                            set_number: i,
                            weight: parseFloat(setLog.weight || '0'),
                            reps_completed: parseInt(setLog.reps || '0')
                        });
                    }
                }
            });

            if (setLogsToInsert.length > 0) {
                const { error: logsError } = await supabase.from('logs').insert(setLogsToInsert);
                if (logsError) throw logsError;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (error) {
            console.error('Failed to save session:', error);
            alert('Failed to save session. Check console.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-5 sm:space-y-8 relative z-10 pb-32 sm:pb-28">
            {exercises.map((item: any, index: number) => (
                <div
                    key={item.id}
                    className="animate-slide-up"
                    style={{ animationDelay: `${index * 0.1}s` }}
                >
                    <Card variant="glass" className="relative group">
                        {/* Exercise Number Watermark */}
                        <div className="absolute top-3 right-3 sm:top-4 sm:right-4 w-10 h-10 sm:w-14 sm:h-14 rounded-xl bg-white/[0.03] flex items-center justify-center">
                            <span className="text-2xl sm:text-3xl font-bold text-white/10 font-mono">{index + 1}</span>
                        </div>

                        <div className="relative z-10">
                            {/* Exercise Header */}
                            <div className="flex justify-between items-start mb-2 pr-12 sm:pr-16">
                                <div className="flex items-start gap-2">
                                    <div>
                                        <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">{item.exercise.name}</h3>
                                        <div className="flex items-center gap-2 mt-1">
                                            <span className="px-2 py-0.5 bg-[var(--accent-primary)]/10 border border-[var(--accent-primary)]/20 rounded-full text-[var(--accent-primary)] text-[10px] sm:text-xs font-mono font-medium tracking-wide">
                                                {item.sets} × {item.reps}
                                            </span>
                                            <span className="text-[var(--text-tertiary)] text-[10px] sm:text-xs uppercase tracking-wider">
                                                {item.exercise.muscle_group}
                                            </span>
                                        </div>
                                    </div>
                                    <ExerciseInfo
                                        name={item.exercise.name}
                                        muscleGroup={item.exercise.muscle_group}
                                        rationale={item.rationale}
                                    />
                                </div>
                                <ExerciseSwap
                                    currentExercise={item.exercise}
                                    alternatives={alternatives[item.exercise.id] || []}
                                    onSwap={(newId) => handleSwap(item.id, item.exercise.id, newId)}
                                />
                            </div>

                            {/* Notes Input */}
                            <div className="mb-5 sm:mb-6">
                                <VoiceNoteInput
                                    value={notes[item.id] || ''}
                                    onChange={(val) => handleNoteChange(item.id, val)}
                                    placeholder="Notes: equipment, tempo, form cues..."
                                />
                            </div>

                            {/* Sets Grid */}
                            <div className="space-y-3 sm:space-y-4">
                                {Array.from({ length: item.sets }).map((_, setIndex) => {
                                    const setNum = setIndex + 1;
                                    const currentLog = logs[item.id]?.[setNum];
                                    const isComplete = currentLog?.weight && currentLog?.reps;
                                    return (
                                        <div
                                            key={setNum}
                                            className={`grid grid-cols-[auto,1fr,1fr] gap-3 sm:gap-4 items-center p-2 sm:p-3 rounded-xl transition-all ${isComplete
                                                ? 'bg-[var(--accent-tertiary)]/5 border border-[var(--accent-tertiary)]/20'
                                                : 'bg-white/[0.02] border border-transparent'
                                                }`}
                                        >
                                            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg flex items-center justify-center text-xs sm:text-sm font-bold font-mono transition-all ${isComplete
                                                ? 'bg-[var(--accent-tertiary)]/20 text-[var(--accent-tertiary)] shadow-[0_0_15px_-5px_var(--accent-tertiary)]'
                                                : 'bg-white/5 text-[var(--text-tertiary)]'
                                                }`}>
                                                {isComplete ? (
                                                    <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                                                    </svg>
                                                ) : setNum}
                                            </div>

                                            <VoiceInput
                                                label="LBS"
                                                value={currentLog?.weight || ''}
                                                onChange={(val) => handleLogChange(item.id, setNum, 'weight', val)}
                                                placeholder="—"
                                            />

                                            <VoiceInput
                                                label="REPS"
                                                value={currentLog?.reps || ''}
                                                onChange={(val) => handleLogChange(item.id, setNum, 'reps', val)}
                                                placeholder={item.reps}
                                            />
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </Card>
                </div>
            ))}

            {/* Complete Session Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 z-20">
                <div className="absolute inset-0 bg-gradient-to-t from-[var(--bg-darker)] via-[var(--bg-darker)]/95 to-transparent pointer-events-none" />
                <div className="relative max-w-lg mx-auto">
                    <Button
                        fullWidth
                        size="lg"
                        className="group"
                        onClick={handleComplete}
                        disabled={loading}
                    >
                        <span className="flex items-center justify-center gap-3">
                            {loading ? (
                                <>
                                    <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
                                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
                                    </svg>
                                    SAVING...
                                </>
                            ) : (
                                <>
                                    <svg className="w-5 h-5 sm:w-6 sm:h-6" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                    COMPLETE SESSION
                                </>
                            )}
                        </span>
                    </Button>
                </div>
            </div>
        </div>
    );
}

