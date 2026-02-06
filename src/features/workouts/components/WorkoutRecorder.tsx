'use client';

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { VoiceInput } from '@/components/ui/VoiceInput';
import { ExerciseSwap } from '@/components/ui/ExerciseSwap';
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
        <div className="space-y-4 sm:space-y-6 relative z-10 pb-28 sm:pb-24">
            {exercises.map((item: any, index: number) => (
                <Card key={item.id} className="relative group">
                    <div className="absolute top-2 right-2 sm:top-0 sm:right-0 sm:p-4 opacity-10 text-5xl sm:text-8xl font-bold text-white pointer-events-none select-none">
                        {index + 1}
                    </div>

                    <div className="relative z-10">
                        <div className="flex justify-between items-start mb-1">
                            <h3 className="text-lg sm:text-xl font-semibold text-white">{item.exercise.name}</h3>
                            <ExerciseSwap
                                currentExercise={item.exercise}
                                alternatives={alternatives[item.exercise.id] || []}
                                onSwap={(newId) => handleSwap(item.id, item.exercise.id, newId)}
                            />
                        </div>
                        <p className="text-[var(--text-secondary)] text-[10px] sm:text-xs font-medium uppercase mb-2 tracking-wide">
                            Target: {item.sets} Sets × {item.reps} Reps
                        </p>

                        {/* Notes Input */}
                        <div className="mb-4 sm:mb-6">
                            <input
                                type="text"
                                placeholder="Add notes... (e.g., safety bar, tempo 3-1-2)"
                                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-[var(--accent-primary)] transition-colors"
                                onChange={(e) => handleNoteChange(item.id, e.target.value)}
                            />
                        </div>

                        <div className="space-y-2 sm:space-y-3">
                            {Array.from({ length: item.sets }).map((_, setIndex) => {
                                const setNum = setIndex + 1;
                                const currentLog = logs[item.id]?.[setNum];
                                return (
                                    <div key={setNum} className="grid grid-cols-[auto,1fr,1fr] gap-2 sm:gap-3 items-center">
                                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/5 flex items-center justify-center text-[10px] sm:text-xs font-bold text-[var(--text-secondary)]">
                                            {setNum}
                                        </div>

                                        <VoiceInput
                                            label="LBS"
                                            value={currentLog?.weight || ''}
                                            onChange={(val) => handleLogChange(item.id, setNum, 'weight', val)}
                                            placeholder="-"
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
            ))}

            <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-[var(--bg-darker)] via-[var(--bg-darker)] to-transparent z-20">
                <Button
                    fullWidth
                    size="lg"
                    className="shadow-[0_0_40px_-10px_var(--accent-glow)] text-sm sm:text-base py-4"
                    onClick={handleComplete}
                    disabled={loading}
                >
                    {loading ? 'SAVING...' : 'COMPLETE SESSION'}
                </Button>
            </div>
        </div>
    );
}

