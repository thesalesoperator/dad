'use server';

import { createClient } from '@/lib/supabase/server';

interface ProgressionResult {
    exercise_id: string;
    exercise_name: string;
    recommendation_type: 'increase_weight' | 'increase_reps' | 'maintain' | 'deload';
    recommended_weight: number;
    recommended_reps: string;
    reason: string;
}

/**
 * Double Progression Engine
 * 
 * Called after each workout completion. Analyzes the last 2 sessions of each
 * exercise and computes weight/rep recommendations for the next session.
 * 
 * Decision matrix:
 * - All sets hit target reps + RPE ≤ 8  → INCREASE WEIGHT
 * - All sets hit target reps + RPE 9-10 → MAINTAIN (good effort, hold)
 * - Some sets hit target reps           → INCREASE REPS (keep weight)
 * - Under target for 2+ sessions + RPE high → DELOAD (-10%)
 */
export async function computeProgression(
    userId: string,
    workoutId: string
): Promise<ProgressionResult[]> {
    const supabase = await createClient();
    const results: ProgressionResult[] = [];

    // 1. Get the exercises in this workout
    const { data: workoutExercises } = await supabase
        .from('workout_exercises')
        .select('*, exercise:exercises(id, name, muscle_group)')
        .eq('workout_id', workoutId);

    if (!workoutExercises || workoutExercises.length === 0) return results;

    for (const we of workoutExercises) {
        const exerciseId = we.exercise?.id;
        if (!exerciseId) continue;

        // 2. Fetch the last 2 sessions of logs for this exercise
        const { data: recentLogs } = await supabase
            .from('logs')
            .select('*')
            .eq('user_id', userId)
            .eq('exercise_id', exerciseId)
            .order('created_at', { ascending: false })
            .limit(20); // Enough for 2 sessions × ~5 sets

        if (!recentLogs || recentLogs.length === 0) continue;

        // Group logs by session (by date)
        const sessions = groupBySession(recentLogs);
        const latestSession = sessions[0];
        if (!latestSession || latestSession.length === 0) continue;

        // 3. Parse target reps from workout_exercises
        const targetReps = parseRepRange(we.reps || '8-12');

        // 4. Analyze the latest session
        const avgWeight = average(latestSession.map(l => l.weight || 0));
        const maxWeight = Math.max(...latestSession.map(l => l.weight || 0));
        const avgReps = average(latestSession.map(l => l.reps_completed || 0));
        const avgRpe = average(latestSession.filter(l => l.rpe != null).map(l => l.rpe));
        const allSetsHitTarget = latestSession.every(l => (l.reps_completed || 0) >= targetReps.low);
        const allSetsHitHigh = latestSession.every(l => (l.reps_completed || 0) >= targetReps.high);

        // 5. Check previous session for plateau detection
        const previousSession = sessions[1];
        const isPlateau = previousSession && previousSession.length > 0 &&
            Math.abs(average(previousSession.map(l => l.weight || 0)) - avgWeight) < 1 &&
            Math.abs(average(previousSession.map(l => l.reps_completed || 0)) - avgReps) < 1;

        // 6. Compute recommendation
        let recommendation: ProgressionResult;
        const exerciseName = we.exercise?.name || 'Unknown';
        const weightIncrement = getWeightIncrement(exerciseName, maxWeight, we.exercise?.muscle_group);

        if (allSetsHitHigh && avgRpe <= 8) {
            // SUCCESS: All sets at top of range, effort manageable → increase weight
            recommendation = {
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                recommendation_type: 'increase_weight',
                recommended_weight: roundToNearest(maxWeight + weightIncrement, 2.5),
                recommended_reps: we.reps || '8-12',
                reason: `Crushed it! All sets hit ${targetReps.high} reps at RPE ${avgRpe.toFixed(0)}. Time to go heavier.`
            };
        } else if (allSetsHitTarget && avgRpe >= 9) {
            // HIT TARGET but HIGH EFFORT → maintain, don't push yet
            recommendation = {
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                recommendation_type: 'maintain',
                recommended_weight: maxWeight,
                recommended_reps: we.reps || '8-12',
                reason: `Hit your reps but RPE was ${avgRpe.toFixed(0)}. Repeat this weight — own it before adding more.`
            };
        } else if (!allSetsHitTarget && isPlateau && avgRpe >= 9) {
            // STALLED for 2 sessions at high effort → deload
            const deloadWeight = roundToNearest(maxWeight * 0.9, 2.5);
            recommendation = {
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                recommendation_type: 'deload',
                recommended_weight: deloadWeight,
                recommended_reps: we.reps || '8-12',
                reason: `Plateaued for 2 sessions at high RPE. Drop to ${deloadWeight}lbs and build back up.`
            };
        } else {
            // PARTIAL: Some sets missed target → keep weight, push for more reps
            recommendation = {
                exercise_id: exerciseId,
                exercise_name: exerciseName,
                recommendation_type: 'increase_reps',
                recommended_weight: maxWeight,
                recommended_reps: we.reps || '8-12',
                reason: `Averaging ${avgReps.toFixed(0)} reps — keep pushing to hit ${targetReps.high} across all sets.`
            };
        }

        results.push(recommendation);

        // 7. Upsert into progression_recommendations
        await supabase
            .from('progression_recommendations')
            .upsert({
                user_id: userId,
                exercise_id: exerciseId,
                recommended_weight: recommendation.recommended_weight,
                recommended_reps: recommendation.recommended_reps,
                recommendation_type: recommendation.recommendation_type,
                reason: recommendation.reason,
                based_on_sessions: sessions.length,
                created_at: new Date().toISOString()
            }, { onConflict: 'user_id,exercise_id' });
    }

    return results;
}

/**
 * Fetch stored progression recommendations for a workout's exercises
 */
export async function getProgressionRecommendations(
    userId: string,
    exerciseIds: string[]
): Promise<Record<string, {
    recommended_weight: number;
    recommended_reps: string;
    recommendation_type: string;
    reason: string;
}>> {
    const supabase = await createClient();

    const { data } = await supabase
        .from('progression_recommendations')
        .select('*')
        .eq('user_id', userId)
        .in('exercise_id', exerciseIds);

    const map: Record<string, any> = {};
    data?.forEach(rec => {
        map[rec.exercise_id] = {
            recommended_weight: rec.recommended_weight,
            recommended_reps: rec.recommended_reps,
            recommendation_type: rec.recommendation_type,
            reason: rec.reason
        };
    });

    return map;
}

// --- Helpers ---

function groupBySession(logs: any[]): any[][] {
    const groups: Map<string, any[]> = new Map();
    for (const log of logs) {
        const dateKey = new Date(log.created_at).toISOString().split('T')[0];
        if (!groups.has(dateKey)) groups.set(dateKey, []);
        groups.get(dateKey)!.push(log);
    }
    // Return sorted by date descending (most recent first)
    return Array.from(groups.entries())
        .sort(([a], [b]) => b.localeCompare(a))
        .map(([, logs]) => logs);
}

function parseRepRange(reps: string): { low: number; high: number } {
    const match = reps.match(/^(\d+)-(\d+)$/);
    if (match) return { low: parseInt(match[1]), high: parseInt(match[2]) };
    const single = parseInt(reps);
    if (!isNaN(single)) return { low: single, high: single };
    return { low: 8, high: 12 }; // safe default
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

    // Compound lower body lifts: +10lb
    if (name.includes('squat') || name.includes('deadlift') || name.includes('leg press')) {
        return 10;
    }

    // Compound upper body lifts: +5lb
    if (name.includes('bench') || name.includes('row') || name.includes('press') || name.includes('pull')) {
        return 5;
    }

    // Light weight / isolation: +2.5lb
    if (currentWeight < 50) return 2.5;

    // Default based on muscle group
    const lowerBody = ['legs', 'glutes', 'hamstrings', 'quadriceps'];
    if (muscleGroup && lowerBody.includes(muscleGroup.toLowerCase())) return 10;

    return 5;
}
