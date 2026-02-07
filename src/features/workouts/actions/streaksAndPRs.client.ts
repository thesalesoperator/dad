/**
 * Client-side version of streaksAndPRs for mobile (Capacitor) context.
 */

import { createClient } from '@/lib/supabase/client';

export interface PRResult {
    exercise_id: string;
    exercise_name: string;
    new_weight: number;
    previous_best: number;
    reps: number;
    improvement: number;
}

export async function detectPRsClient(
    userId: string,
    workoutId: string
): Promise<PRResult[]> {
    const supabase = createClient();
    const prs: PRResult[] = [];

    const { data: todayLogs } = await supabase
        .from('logs')
        .select('*, exercise:exercises(id, name)')
        .eq('user_id', userId)
        .eq('workout_id', workoutId);

    if (!todayLogs || todayLogs.length === 0) return prs;

    const exerciseMaxes = new Map<string, { weight: number; reps: number; name: string }>();
    for (const log of todayLogs) {
        if (!log.exercise) continue;
        const key = (log.exercise as any).id;
        const current = exerciseMaxes.get(key);
        if (!current || (log.weight || 0) > current.weight) {
            exerciseMaxes.set(key, {
                weight: log.weight || 0,
                reps: log.reps_completed || 0,
                name: (log.exercise as any).name
            });
        }
    }

    for (const [exerciseId, todayMax] of exerciseMaxes) {
        if (todayMax.weight <= 0) continue;

        const { data: historicalLogs } = await supabase
            .from('logs')
            .select('weight')
            .eq('user_id', userId)
            .eq('exercise_id', exerciseId)
            .neq('workout_id', workoutId)
            .order('weight', { ascending: false })
            .limit(1);

        const previousBest = historicalLogs?.[0]?.weight || 0;

        if (todayMax.weight > previousBest && previousBest > 0) {
            const pr: PRResult = {
                exercise_id: exerciseId,
                exercise_name: todayMax.name,
                new_weight: todayMax.weight,
                previous_best: previousBest,
                reps: todayMax.reps,
                improvement: todayMax.weight - previousBest
            };
            prs.push(pr);

            await supabase.from('user_achievements').insert({
                user_id: userId,
                achievement_type: 'pr_weight',
                achievement_value: {
                    exercise_id: exerciseId,
                    exercise_name: todayMax.name,
                    weight: todayMax.weight,
                    previous_best: previousBest,
                    reps: todayMax.reps
                },
                achieved_at: new Date().toISOString()
            });
        }
    }

    return prs;
}

export interface StreakData {
    currentStreak: number;
    longestStreak: number;
    totalWorkouts: number;
    thisWeekWorkouts: number;
    lastWorkoutDate: string | null;
}

export async function computeStreakClient(userId: string): Promise<StreakData> {
    const supabase = createClient();

    const { data: logs } = await supabase
        .from('workout_logs')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

    if (!logs || logs.length === 0) {
        return { currentStreak: 0, longestStreak: 0, totalWorkouts: 0, thisWeekWorkouts: 0, lastWorkoutDate: null };
    }

    const totalWorkouts = logs.length;
    const lastWorkoutDate = logs[0].completed_at;

    const weekSet = new Set<string>();
    const thisWeekKey = getISOWeekKey(new Date());
    let thisWeekWorkouts = 0;

    for (const log of logs) {
        const date = new Date(log.completed_at);
        const weekKey = getISOWeekKey(date);
        weekSet.add(weekKey);
        if (weekKey === thisWeekKey) thisWeekWorkouts++;
    }

    const sortedWeeks = Array.from(weekSet).sort().reverse();

    let currentStreak = 0;
    const now = new Date();
    let checkWeek = getISOWeekKey(now);

    if (!weekSet.has(checkWeek)) {
        const lastWeek = new Date(now);
        lastWeek.setDate(lastWeek.getDate() - 7);
        checkWeek = getISOWeekKey(lastWeek);
        if (!weekSet.has(checkWeek)) {
            return {
                currentStreak: 0,
                longestStreak: computeLongestStreak(sortedWeeks),
                totalWorkouts,
                thisWeekWorkouts,
                lastWorkoutDate
            };
        }
    }

    const cursor = new Date(now);
    if (!weekSet.has(getISOWeekKey(now))) {
        cursor.setDate(cursor.getDate() - 7);
    }

    while (weekSet.has(getISOWeekKey(cursor))) {
        currentStreak++;
        cursor.setDate(cursor.getDate() - 7);
    }

    return {
        currentStreak,
        longestStreak: Math.max(currentStreak, computeLongestStreak(sortedWeeks)),
        totalWorkouts,
        thisWeekWorkouts,
        lastWorkoutDate
    };
}

function computeLongestStreak(sortedWeeksDesc: string[]): number {
    if (sortedWeeksDesc.length === 0) return 0;
    let longest = 1;
    let current = 1;
    const asc = [...sortedWeeksDesc].reverse();
    for (let i = 1; i < asc.length; i++) {
        if (areConsecutiveWeeks(asc[i - 1], asc[i])) {
            current++;
            longest = Math.max(longest, current);
        } else {
            current = 1;
        }
    }
    return longest;
}

function getISOWeekKey(date: Date): string {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    d.setDate(diff);
    return d.toISOString().split('T')[0];
}

function areConsecutiveWeeks(weekA: string, weekB: string): boolean {
    const a = new Date(weekA);
    const b = new Date(weekB);
    const diff = Math.abs(b.getTime() - a.getTime());
    return diff >= 6 * 24 * 60 * 60 * 1000 && diff <= 8 * 24 * 60 * 60 * 1000;
}
