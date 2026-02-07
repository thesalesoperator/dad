/**
 * Client-side version of generateProgram for mobile (Capacitor) context.
 * Identical logic to the server version but uses browser Supabase client.
 */

import { createClient } from '@/lib/supabase/client';

interface UserData {
    experience: 'beginner' | 'intermediate' | 'advanced';
    days_per_week: number;
    goal: string;
    equipment: string[];
    program_slug?: string;
    gender?: 'male' | 'female' | 'prefer_not_to_say';
}

const GOAL_TO_DEFAULT_PROGRAM: Record<string, string> = {
    'strength': 'starting_strength',
    'hypertrophy': 'modern_bodybuilding',
    'general': 'dad_bod_destroyer',
    'bodybuilding': 'modern_bodybuilding',
    'power': 'plyometric_power',
    'endurance': 'muscular_endurance',
    'flexibility': 'mobility_flow',
    'athletic': 'functional_fitness',
};

export async function generateProgramClient(userId: string, userData: UserData) {
    const supabase = createClient();

    // 0. Clean up old workouts to prevent duplicates
    const { data: existingWorkouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId);

    if (existingWorkouts && existingWorkouts.length > 0) {
        const workoutIds = existingWorkouts.map(w => w.id);
        await supabase.from('workout_exercises').delete().in('workout_id', workoutIds);
        await supabase.from('logs').delete().in('workout_id', workoutIds);
        await supabase.from('workout_logs').delete().in('workout_id', workoutIds);
        await supabase.from('progression_recommendations').delete().eq('user_id', userId);
        await supabase.from('workouts').delete().eq('user_id', userId);
    }

    const programSlug = userData.program_slug || GOAL_TO_DEFAULT_PROGRAM[userData.goal] || 'dad_bod_destroyer';

    const { data: program, error: programError } = await supabase
        .from('training_programs')
        .select('*')
        .eq('slug', programSlug)
        .single();

    if (programError || !program) {
        throw new Error(`Program "${programSlug}" not found. ${programError?.message || ''}`);
    }

    const { data: programWorkouts, error: pwError } = await supabase
        .from('program_workouts')
        .select('*, program_workout_exercises(*)')
        .eq('program_id', program.id)
        .order('day_number', { ascending: true });

    if (pwError || !programWorkouts || programWorkouts.length === 0) {
        throw new Error(`No workouts defined for program "${program.name}". ${pwError?.message || ''}`);
    }

    const availableDayCounts = [...new Set(programWorkouts.map(pw => pw.days_per_week))].sort((a, b) => a - b);
    let targetDayCount = availableDayCounts[0];
    for (const dc of availableDayCounts) {
        if (dc <= userData.days_per_week) targetDayCount = dc;
    }

    let selectedWorkouts = programWorkouts.filter(pw => pw.days_per_week === targetDayCount);
    if (selectedWorkouts.length > userData.days_per_week) {
        selectedWorkouts = selectedWorkouts.slice(0, userData.days_per_week);
    }
    if (selectedWorkouts.length === 0) {
        selectedWorkouts = programWorkouts.slice(0, userData.days_per_week);
    }

    const { data: allExercises } = await supabase.from('exercises').select('*');
    if (!allExercises || allExercises.length === 0) throw new Error('No exercises found in database');

    const userEquipment = new Set([...userData.equipment, 'bodyweight']);
    const availableExercises = allExercises.filter(ex => {
        if (!ex.equipment_type || ex.equipment_type.length === 0) return true;
        return ex.equipment_type.some((req: string) => userEquipment.has(req));
    });

    if (availableExercises.length === 0) throw new Error('No exercises match your equipment profile');

    const genderMultiplier = getGenderAdjustment(userData.gender);

    for (const programWorkout of selectedWorkouts) {
        const exercises = (programWorkout.program_workout_exercises || [])
            .sort((a: any, b: any) => a.order_num - b.order_num);

        const { data: createdWorkout, error: wError } = await supabase.from('workouts').insert({
            user_id: userId,
            name: programWorkout.name,
            program_id: program.id,
            description: `${program.name} | ${program.category} | ${userData.experience} | ${userData.equipment.length > 3 ? 'Full Gym' : 'Limited Equipment'}`
        }).select().single();

        if (wError) throw wError;

        const workoutExercises = [];
        for (const templateEx of exercises) {
            const selectedEx = findBestMatch(templateEx.exercise_name, allExercises, availableExercises);
            const adjustedSets = adjustSetsForExperience(templateEx.default_sets, userData.experience);
            const adjustedReps = genderMultiplier.adjustReps(templateEx.default_reps);

            workoutExercises.push({
                workout_id: createdWorkout.id,
                exercise_id: selectedEx.id,
                sets: adjustedSets,
                reps: adjustedReps,
                rest_seconds: templateEx.default_rest_seconds,
                order: templateEx.order_num,
                rationale: templateEx.rationale + (selectedEx.name !== templateEx.exercise_name
                    ? ` (Substituted: ${selectedEx.name} based on equipment)` : '')
            });
        }

        const { error: weError } = await supabase.from('workout_exercises').insert(workoutExercises);
        if (weError) throw new Error(`Failed to add exercises to ${programWorkout.name}: ${weError.message}`);
    }
}

function findBestMatch(targetName: string, allExercises: any[], availableExercises: any[]) {
    const exact = availableExercises.find(e => e.name.toLowerCase() === targetName.toLowerCase());
    if (exact) return exact;
    const canonical = allExercises.find(e => e.name.toLowerCase() === targetName.toLowerCase());
    if (canonical && canonical.muscle_group) {
        const muscleMatch = availableExercises.filter(e => e.muscle_group === canonical.muscle_group);
        if (muscleMatch.length > 0) {
            const keywords = targetName.toLowerCase().split(' ').filter(w =>
                !['barbell', 'dumbbell', 'cable', 'machine', 'band'].includes(w)
            );
            const nameMatch = muscleMatch.find(e => keywords.some(k => e.name.toLowerCase().includes(k)));
            if (nameMatch) return nameMatch;
            return muscleMatch[0];
        }
    }
    const fallbackMatch = availableExercises.find(e =>
        e.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
    );
    return fallbackMatch || availableExercises[0];
}

function adjustSetsForExperience(baseSets: number, experience: string): number {
    switch (experience) {
        case 'beginner': return Math.max(2, baseSets - 1);
        case 'advanced': return Math.min(6, baseSets + 1);
        default: return baseSets;
    }
}

function getGenderAdjustment(gender?: string) {
    if (gender === 'female') {
        return {
            adjustReps: (reps: string) => {
                const match = reps.match(/^(\d+)-(\d+)$/);
                if (match) {
                    const low = Math.min(parseInt(match[1]) + 2, 25);
                    const high = Math.min(parseInt(match[2]) + 2, 30);
                    return `${low}-${high}`;
                }
                return reps;
            }
        };
    }
    return { adjustReps: (reps: string) => reps };
}
