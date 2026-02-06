'use server';

import { createClient } from '@/lib/supabase/server';

interface UserData {
    experience: 'beginner' | 'intermediate' | 'advanced';
    days_per_week: number;
    goal: 'strength' | 'hypertrophy' | 'general';
}

export async function generateProgram(userId: string, userData: UserData) {
    const supabase = await createClient();

    // 1. Determine Split
    let split = [];
    if (userData.days_per_week <= 3) {
        split = ['Full Body A', 'Full Body B', 'Full Body C'];
    } else if (userData.days_per_week === 4) {
        split = ['Upper A', 'Lower A', 'Upper B', 'Lower B'];
    } else {
        split = ['Push', 'Pull', 'Legs', 'Push', 'Pull', 'Legs']; // PPL
    }

    // 2. Fetch Exercises
    const { data: exercises } = await supabase.from('exercises').select('*');
    if (!exercises) throw new Error('No exercises found');

    // Helper to find exercise by name or group
    const findEx = (name: string, group?: string) => {
        return exercises.find(e => e.name === name) || exercises.find(e => e.muscle_group === group);
    };

    // 3. Create Workouts
    for (const dayName of split) {
        const { data: workout, error: wError } = await supabase.from('workouts').insert({
            user_id: userId,
            name: dayName,
            description: `Target: ${userData.goal} | Level: ${userData.experience}`
        }).select().single();

        if (wError) throw wError;

        // 4. Assign Exercises based on Template (Simplified for MVP)
        const exerciseList = getTemplateForDay(dayName, userData.experience, exercises);

        // Map reps/sets based on goal
        const scheme = getRepScheme(userData.goal);

        const workoutExercises = exerciseList.map((ex, index) => ({
            workout_id: workout.id,
            exercise_id: ex.id,
            sets: scheme.sets,
            reps: scheme.reps,
            rest_seconds: scheme.rest,
            order: index
        }));

        await supabase.from('workout_exercises').insert(workoutExercises);
    }
}

function getRepScheme(goal: string) {
    switch (goal) {
        case 'strength': return { sets: 5, reps: '3-5', rest: 180 };
        case 'hypertrophy': return { sets: 4, reps: '8-12', rest: 90 };
        case 'general': return { sets: 3, reps: '12-15', rest: 60 };
        default: return { sets: 3, reps: '10', rest: 90 };
    }
}

function getTemplateForDay(dayName: string, experience: string, allExercises: any[]) {
    // Simple heuristic filtering
    const byName = (n: string) => allExercises.find(e => e.name.includes(n)) || allExercises[0];
    const byGroup = (g: string) => allExercises.find(e => e.muscle_group === g) || allExercises[0];

    if (dayName.includes('Full Body')) {
        return [
            byName('Squat'),
            byName('Bench'),
            byName('Row'),
            byName('Overhead Press'),
            byGroup('Legs') // Accessory
        ];
    } else if (dayName.includes('Upper') || dayName.includes('Push')) {
        return [
            byName('Bench'),
            byName('Overhead Press'),
            byName('Dip'),
            byName('Lateral Raise'),
            byName('Tricep')
        ];
    } else if (dayName.includes('Lower') || dayName.includes('Legs')) {
        return [
            byName('Squat'),
            byName('Deadlift'),
            byName('Lunge'),
            byName('Calf'),
            byName('Leg Curl')
        ];
    } else if (dayName.includes('Pull')) {
        return [
            byName('Deadlift'),
            byName('Pull Up'),
            byName('Row'),
            byName('Face Pull'),
            byName('Bicep')
        ];
    }

    return [byName('Push Up')]; // Fallback
}
