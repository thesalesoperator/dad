'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';

interface WorkoutRecorderProps {
    workout: any;
    exercises: any[];
}

export function WorkoutRecorder({ workout, exercises }: WorkoutRecorderProps) {
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const supabase = createClient();

    // State to track achievements for each set
    // Structure: { [exerciseId]: { [setNumber]: { weight: string, reps: string } } }
    const [logs, setLogs] = useState<Record<string, Record<number, { weight: string, reps: string }>>>({});

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

            // 1. Create Session Log
            const { data: sessionData, error: sessionError } = await supabase.from('workout_logs').insert({
                user_id: user.id,
                workout_id: workout.id,
                completed_at: new Date().toISOString(),
                duration_seconds: 3600
            }).select().single();

            if (sessionError) throw sessionError;

            // 2. Create Individual Set Logs
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
                    // Only log if data was entered
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
        <div className="space-y-6 relative z-10 pb-24">
            {exercises.map((item: any, index: number) => (
                <Card key={item.id} className="relative group">
                    <div className="absolute top-0 right-0 p-4 opacity-5 text-8xl font-bold text-white pointer-events-none select-none">
                        {index + 1}
                    </div>

                    <div className="relative z-10">
                        <h3 className="text-xl font-semibold text-white mb-1">{item.exercise.name}</h3>
                        <p className="text-[var(--text-secondary)] text-xs font-medium uppercase mb-6 tracking-wide">
                            Target: {item.sets} Sets × {item.reps} Reps
                        </p>

                        <div className="space-y-3">
                            {Array.from({ length: item.sets }).map((_, setIndex) => {
                                const setNum = setIndex + 1;
                                return (
                                    <div key={setNum} className="grid grid-cols-[auto,1fr,1fr] gap-3 items-center">
                                        <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs font-bold text-[var(--text-secondary)]">
                                            {setNum}
                                        </div>

                                        <div className="bg-white/5 rounded-[var(--radius-sm)] px-3 py-2 border border-white/10 focus-within:border-[var(--accent-primary)] transition-colors flex items-center">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold mr-2 w-8">LBS</span>
                                            <input
                                                type="number"
                                                placeholder="-"
                                                className="w-full bg-transparent text-right text-lg text-white font-medium outline-none placeholder:text-white/20"
                                                onChange={(e) => handleLogChange(item.id, setNum, 'weight', e.target.value)}
                                            />
                                        </div>

                                        <div className="bg-white/5 rounded-[var(--radius-sm)] px-3 py-2 border border-white/10 focus-within:border-[var(--accent-primary)] transition-colors flex items-center">
                                            <span className="text-[10px] text-[var(--text-secondary)] uppercase font-semibold mr-2 w-8">REPS</span>
                                            <input
                                                type="number"
                                                placeholder={item.reps} // Show target as placeholder
                                                className="w-full bg-transparent text-right text-lg text-white font-medium outline-none placeholder:text-white/20"
                                                onChange={(e) => handleLogChange(item.id, setNum, 'reps', e.target.value)}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </Card>
            ))}

            <div className="fixed bottom-6 left-6 right-6 z-20">
                <Button
                    fullWidth
                    size="lg"
                    className="shadow-[0_0_40px_-10px_var(--accent-glow)]"
                    onClick={handleComplete}
                    disabled={loading}
                >
                    {loading ? 'SAVING MISSION...' : 'COMPLETE SESSION'}
                </Button>
            </div>
        </div>
    );
}
