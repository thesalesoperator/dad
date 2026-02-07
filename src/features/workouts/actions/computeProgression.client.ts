/**
 * Client-side version of computeProgression for mobile (Capacitor) context.
 */

import { createClient } from '@/lib/supabase/client';

export interface ProgressionResult {
    exercise_id: string;
    exercise_name: string;
    recommendation_type: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
    recommended_weight: number;
    recommended_reps: string;
    reason: string;
}

export async function computeProgressionClient(
    userId: string,
    workoutId: string
): Promise<ProgressionResult[]> {
    const supabase = createClient();
    const results: ProgressionResult[] = [];

    const { data: workoutExercises } = await supabase
        .from('workout_exercises')
        .select('*, exercise:exercises(id, name, muscle_group)')
        .eq('workout_id', workoutId);

    if (!workoutExercises) return results;

    for (const we of workoutExercises) {
        const exercise = we.exercise as any;
        if (!exercise) continue;

        const { data: logs } = await supabase
            .from('logs')
            .select('weight, reps_completed, rpe, created_at, workout_id')
            .eq('user_id', userId)
            .eq('exercise_id', exercise.id)
            .order('created_at', { ascending: false })
            .limit(30);

        if (!logs || logs.length === 0) continue;

        const sessions = groupBySession(logs);
        if (sessions.length < 1) continue;

        const lastSession = sessions[0];
        const { low: targetLow, high: targetHigh } = parseRepRange(we.reps);
        const lastWeight = Math.max(...lastSession.map((l: any) => parseFloat(l.weight) || 0));

        if (lastWeight <= 0) continue;

        const allHitTarget = lastSession.every((l: any) => (l.reps_completed || 0) >= targetHigh);
        const someHitTarget = lastSession.some((l: any) => (l.reps_completed || 0) >= targetLow);
        const avgRPE = average(lastSession.map((l: any) => l.rpe || 0).filter((r: number) => r > 0));
        const twoSessionsUnder = sessions.length >= 2 &&
            sessions.slice(0, 2).every(s => s.some((l: any) => (l.reps_completed || 0) < targetLow));

        if (allHitTarget) {
            const increment = getWeightIncrement(exercise.name, lastWeight, exercise.muscle_group);
            results.push({
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                recommendation_type: 'increase_weight',
                recommended_weight: roundToNearest(lastWeight + increment, increment),
                recommended_reps: we.reps,
                reason: `All sets hit ${targetHigh} reps → add ${increment} lbs`,
            });
        } else if (twoSessionsUnder && avgRPE >= 9) {
            results.push({
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                recommendation_type: 'deload',
                recommended_weight: roundToNearest(lastWeight * 0.9, 2.5),
                recommended_reps: we.reps,
                reason: 'Missed reps 2+ sessions with high RPE → deload 10%',
            });
        } else if (someHitTarget) {
            results.push({
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                recommendation_type: 'increase_reps',
                recommended_weight: lastWeight,
                recommended_reps: we.reps,
                reason: 'Some sets at target — push for all sets before adding weight',
            });
        } else {
            results.push({
                exercise_id: exercise.id,
                exercise_name: exercise.name,
                recommendation_type: 'maintain',
                recommended_weight: lastWeight,
                recommended_reps: we.reps,
                reason: 'Keep weight the same — focus on hitting target reps',
            });
        }
    }

    // Store recommendations
    if (results.length > 0) {
        await supabase.from('progression_recommendations').upsert(
            results.map(r => ({
                user_id: userId,
                exercise_id: r.exercise_id,
                recommended_weight: r.recommended_weight,
                recommended_reps: r.recommended_reps,
                recommendation_type: r.recommendation_type,
                reason: r.reason,
            })),
            { onConflict: 'user_id,exercise_id' }
        );
    }

    return results;
}

export async function getProgressionRecommendationsClient(
    userId: string,
    exerciseIds: string[]
): Promise<Record<string, { recommended_weight: number; recommended_reps: string; recommendation_type: string; reason: string }>> {
    const supabase = createClient();
    const { data } = await supabase
        .from('progression_recommendations')
        .select('*')
        .eq('user_id', userId)
        .in('exercise_id', exerciseIds);

    const result: Record<string, any> = {};
    data?.forEach(rec => {
        result[rec.exercise_id] = {
            recommended_weight: rec.recommended_weight,
            recommended_reps: rec.recommended_reps,
            recommendation_type: rec.recommendation_type,
            reason: rec.reason,
        };
    });
    return result;
}

// --- Helpers ---
function groupBySession(logs: any[]): any[][] {
    const sessions: any[][] = [];
    let currentSession: any[] = [];
    let lastWorkout = logs[0]?.workout_id;
    for (const log of logs) {
        if (log.workout_id !== lastWorkout) {
            if (currentSession.length > 0) sessions.push(currentSession);
            currentSession = [];
            lastWorkout = log.workout_id;
        }
        currentSession.push(log);
    }
    if (currentSession.length > 0) sessions.push(currentSession);
    return sessions;
}

function parseRepRange(reps: string): { low: number; high: number } {
    const match = reps.match(/^(\d+)-(\d+)$/);
    if (match) return { low: parseInt(match[1]), high: parseInt(match[2]) };
    const single = parseInt(reps);
    return { low: single || 8, high: single || 8 };
}

function average(nums: number[]): number {
    if (nums.length === 0) return 0;
    return nums.reduce((a, b) => a + b, 0) / nums.length;
}

function roundToNearest(value: number, increment: number): number {
    return Math.round(value / increment) * increment;
}

function getWeightIncrement(exerciseName: string, currentWeight: number, muscleGroup?: string): number {
    const name = exerciseName.toLowerCase();
    const isCompound = ['squat', 'deadlift', 'bench', 'press', 'row'].some(k => name.includes(k));
    if (isCompound) {
        if (currentWeight < 100) return 5;
        if (currentWeight < 200) return 5;
        return 10;
    }
    const isSmall = ['curl', 'extension', 'raise', 'fly', 'lateral'].some(k => name.includes(k));
    if (isSmall || muscleGroup === 'arms') return 2.5;
    return 5;
}
