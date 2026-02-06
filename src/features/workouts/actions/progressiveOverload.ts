'use server';

import { createClient } from '@/lib/supabase/server';

interface ProgressionSuggestion {
    exerciseId: string;
    exerciseName: string;
    lastWeight: number;
    lastReps: string;
    suggestedWeight: number;
    reason: string;
    confidence: 'high' | 'medium' | 'low';
}

/**
 * Analyzes past workout performance and suggests progressive overload
 * Based on evidence: If all target reps hit across all sets, increase weight by 2.5-5lbs
 */
export async function getProgressionSuggestions(
    userId: string,
    workoutId: string
): Promise<ProgressionSuggestion[]> {
    const supabase = await createClient();

    // Get the workout exercises
    const { data: workoutExercises } = await supabase
        .from('workout_exercises')
        .select(`
            id,
            exercise_id,
            sets,
            reps,
            exercise:exercises(id, name, muscle_group)
        `)
        .eq('workout_id', workoutId);

    if (!workoutExercises) return [];

    const suggestions: ProgressionSuggestion[] = [];

    for (const we of workoutExercises) {
        // Get last 3 sessions for this exercise by this user
        const { data: history } = await supabase
            .from('session_logs')
            .select(`
                weight,
                reps,
                created_at,
                sessions!inner(user_id, workout_id)
            `)
            .eq('sessions.user_id', userId)
            .eq('exercise_id', we.exercise_id)
            .order('created_at', { ascending: false })
            .limit(15); // ~3 sessions worth

        if (!history || history.length === 0) {
            // No history - suggest starting weight
            suggestions.push({
                exerciseId: we.exercise_id,
                exerciseName: (we.exercise as any)?.name || 'Unknown',
                lastWeight: 0,
                lastReps: we.reps,
                suggestedWeight: 0, // User needs to establish baseline
                reason: 'First time - establish your baseline weight',
                confidence: 'low'
            });
            continue;
        }

        // Analyze last session
        const lastSessionLogs = history.slice(0, we.sets);
        const lastWeight = Math.max(...lastSessionLogs.map(l => parseFloat(l.weight) || 0));
        const allRepsHit = lastSessionLogs.every(log => {
            const targetReps = parseInt(we.reps.split('-')[0]) || 8;
            const actualReps = parseInt(log.reps) || 0;
            return actualReps >= targetReps;
        });

        if (allRepsHit && lastWeight > 0) {
            // Progress! Suggest increase
            const increase = lastWeight < 50 ? 2.5 : 5; // Smaller increments for lighter weights
            suggestions.push({
                exerciseId: we.exercise_id,
                exerciseName: (we.exercise as any)?.name || 'Unknown',
                lastWeight,
                lastReps: we.reps,
                suggestedWeight: lastWeight + increase,
                reason: `You hit all reps last time → add ${increase} lbs`,
                confidence: 'high'
            });
        } else if (lastWeight > 0) {
            // Missed reps - maintain weight
            suggestions.push({
                exerciseId: we.exercise_id,
                exerciseName: (we.exercise as any)?.name || 'Unknown',
                lastWeight,
                lastReps: we.reps,
                suggestedWeight: lastWeight,
                reason: 'Focus on hitting all reps before increasing',
                confidence: 'medium'
            });
        }
    }

    return suggestions;
}

/**
 * Calculates weekly volume (sets per muscle group)
 * Science: 10-20 sets/muscle/week is optimal for hypertrophy
 */
export async function getWeeklyVolume(userId: string): Promise<Record<string, number>> {
    const supabase = await createClient();

    // Get sessions from past 7 days
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);

    const { data: sessions } = await supabase
        .from('sessions')
        .select(`
            id,
            session_logs(
                id,
                exercise:exercises(muscle_group)
            )
        `)
        .eq('user_id', userId)
        .gte('created_at', weekAgo.toISOString());

    if (!sessions) return {};

    // Count sets per muscle group
    const volume: Record<string, number> = {};

    for (const session of sessions) {
        for (const log of (session.session_logs || [])) {
            const muscleGroup = (log.exercise as any)?.muscle_group;
            if (muscleGroup) {
                volume[muscleGroup] = (volume[muscleGroup] || 0) + 1;
            }
        }
    }

    return volume;
}

/**
 * Gets volume targets based on goal
 */
export function getVolumeTargets(goal: 'strength' | 'hypertrophy' | 'general'): number {
    switch (goal) {
        case 'strength':
            return 10; // Lower volume, higher intensity
        case 'hypertrophy':
            return 15; // Optimal for muscle growth
        case 'general':
            return 12; // Moderate
        default:
            return 12;
    }
}
