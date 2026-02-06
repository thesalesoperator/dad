'use server';

import { createClient } from '@/lib/supabase/server';

interface UserData {
    experience: 'beginner' | 'intermediate' | 'advanced';
    days_per_week: number;
    goal: 'strength' | 'hypertrophy' | 'general';
    equipment: string[];
}

// Exercise templates with scientific rationale
// Using canonical names that map to the "ideal" version (usually Barbell/Gym)
const EXERCISE_TEMPLATES = {
    'upper_push_a': [
        { name: 'Barbell Bench Press', rationale: 'Primary horizontal push. Activates pectorals, anterior delts, and triceps.' },
        { name: 'Overhead Press', rationale: 'Vertical push building shoulder strength and stability.' },
        { name: 'Incline Dumbbell Press', rationale: 'Targets upper chest fibers, addressing common clavicular weakness.' },
        { name: 'Dips', rationale: 'Compound movement for chest/triceps. Excellent muscle activation.' },
        { name: 'Lateral Raise', rationale: 'Isolation for medial deltoid. Creates shoulder width.' },
    ],
    'upper_push_b': [
        { name: 'Incline Barbell Press', rationale: 'Emphasizes upper chest. Complements flat pressing.' },
        { name: 'Dumbbell Shoulder Press', rationale: 'Unilateral shoulder work addresses imbalances.' },
        { name: 'Dumbbell Bench Press', rationale: 'Greater pec stretch and independent arm work.' },
        { name: 'Close-Grip Bench Press', rationale: 'Tricep-focused pressing. Builds lockout strength.' },
        { name: 'Cable Lateral Raise', rationale: 'Constant tension lateral raise for hypertrophy.' },
    ],
    'upper_pull_a': [
        { name: 'Barbell Row', rationale: 'Horizontal pull for lat width and thickness.' },
        { name: 'Pull-ups', rationale: 'Vertical pull developing lat width and functional strength.' },
        { name: 'Face Pull', rationale: 'Rear delt and rotator cuff health. Essential for posture.' },
        { name: 'Hammer Curl', rationale: 'Brachialis focus. Builds arm thickness.' },
        { name: 'Shrugs', rationale: 'Upper trap development.' },
    ],
    'upper_pull_b': [
        { name: 'Cable Row', rationale: 'Constant tension horizontal pull.' },
        { name: 'Lat Pulldown', rationale: 'Controlled vertical pull with adjustable resistance.' },
        { name: 'Reverse Fly', rationale: 'Rear delt isolation for shoulder health.' },
        { name: 'Barbell Curl', rationale: 'Classic bicep builder. Maximizes activation.' },
        { name: 'Dumbbell Row', rationale: 'Unilateral back work allowing greater ROM.' },
    ],
    'lower_a': [
        { name: 'Barbell Back Squat', rationale: 'King of lower body exercises. Maximal loading.' },
        { name: 'Romanian Deadlift', rationale: 'Hip hinge for posterior chain development.' },
        { name: 'Walking Lunges', rationale: 'Unilateral leg work improving balance.' },
        { name: 'Lying Leg Curl', rationale: 'Isolated hamstring development.' },
        { name: 'Standing Calf Raise Machine', rationale: 'Gastrocnemius focus.' },
    ],
    'lower_b': [
        { name: 'Front Squat', rationale: 'Quad-dominant squat variation.' },
        { name: 'Conventional Deadlift', rationale: 'Full posterior chain development.' },
        { name: 'Bulgarian Split Squat', rationale: 'Single-leg strength and stability.' },
        { name: 'Leg Extension', rationale: 'Quad isolation.' },
        { name: 'Seated Calf Raise', rationale: 'Soleus focus.' },
    ],
    'full_body_a': [
        { name: 'Barbell Back Squat', rationale: 'Primary lower body compound movement.' },
        { name: 'Barbell Bench Press', rationale: 'Primary upper body horizontal push.' },
        { name: 'Barbell Row', rationale: 'Primary upper body horizontal pull.' },
        { name: 'Overhead Press', rationale: 'Primary vertical push.' },
        { name: 'Romanian Deadlift', rationale: 'Posterior chain accessory.' },
    ],
    'full_body_b': [
        { name: 'Front Squat', rationale: 'Quad-focused squat variation.' },
        { name: 'Incline Dumbbell Press', rationale: 'Upper chest focus.' },
        { name: 'Pull-ups', rationale: 'Vertical pulling strength.' },
        { name: 'Dumbbell Shoulder Press', rationale: 'Unilateral overhead work.' },
        { name: 'Conventional Deadlift', rationale: 'Full body pulling power.' },
    ],
    'full_body_c': [
        { name: 'Bulgarian Split Squat', rationale: 'Unilateral leg strength.' },
        { name: 'Dumbbell Bench Press', rationale: 'Chest hypertrophy.' },
        { name: 'Cable Row', rationale: 'Back thickness.' },
        { name: 'Lateral Raise', rationale: 'Shoulder isolation.' },
        { name: 'Lying Leg Curl', rationale: 'Hamstring isolation.' },
    ],
};

type TemplateKey = keyof typeof EXERCISE_TEMPLATES;

interface WorkoutPlanItem {
    name: string;
    template: TemplateKey;
}

export async function generateProgram(userId: string, userData: UserData) {
    const supabase = await createClient();

    // 0. Clean up old workouts to prevent duplicates
    // Get existing workout IDs for this user
    const { data: existingWorkouts } = await supabase
        .from('workouts')
        .select('id')
        .eq('user_id', userId);

    if (existingWorkouts && existingWorkouts.length > 0) {
        const workoutIds = existingWorkouts.map(w => w.id);
        // Delete workout_exercises for old workouts
        await supabase.from('workout_exercises').delete().in('workout_id', workoutIds);
        // Clear foreign key references that block workout deletion
        // Nullify workout_id in logs (preserves exercise history)
        await supabase.from('logs').update({ workout_id: null }).in('workout_id', workoutIds);
        // Delete workout_logs (session-level records tied to old plan)
        await supabase.from('workout_logs').delete().in('workout_id', workoutIds);
        // Now safe to delete old workouts
        await supabase.from('workouts').delete().eq('user_id', userId);
    }

    // 1. Fetch all exercises
    const { data: allExercises } = await supabase.from('exercises').select('*');
    if (!allExercises || allExercises.length === 0) throw new Error('No exercises found in database');

    // 2. Filter exercises by user equipment
    // An exercise is valid if it lists ANY equipment the user has (OR logic within exercise, AND logic between exercise and user)
    // Actually, usually an exercise needs specific equipment. 
    // If exercise needs 'barbell', user MUST have 'barbell'.
    // If exercise needs 'barbell' OR 'dumbbell' (rare), match either.
    // Our seed data uses arrays for "Options". e.g. Floor Press: ['barbell', 'dumbbell'].
    // So if user has EITHER, it's valid.

    // Ensure "bodyweight" is always available
    const userEquipment = new Set([...userData.equipment, 'bodyweight']);

    const availableExercises = allExercises.filter(ex => {
        // If exercise has no equipment listed, assume it needs something we don't know? Or bodyweight?
        // Our seed has equipment_type. 
        if (!ex.equipment_type || ex.equipment_type.length === 0) return true; // Fail safe

        // Exercise is valid if there is an intersection between exercise options and user equipment
        return ex.equipment_type.some((req: string) => userEquipment.has(req));
    });

    if (availableExercises.length === 0) throw new Error('No exercises match your equipment profile');

    // 3. Determine split
    let workoutPlan: WorkoutPlanItem[] = [];
    if (userData.days_per_week <= 3) {
        const fullBodyPlan: WorkoutPlanItem[] = [
            { name: 'The Foundation', template: 'full_body_a' },
            { name: 'Power Surge', template: 'full_body_b' },
            { name: 'The Finisher', template: 'full_body_c' },
        ];
        workoutPlan = fullBodyPlan.slice(0, userData.days_per_week);
    } else if (userData.days_per_week === 4) {
        workoutPlan = [
            { name: 'Iron Press', template: 'upper_push_a' },
            { name: 'Squat & Drive', template: 'lower_a' },
            { name: 'Cable & Steel', template: 'upper_push_b' },
            { name: 'Deadlift Day', template: 'lower_b' },
        ];
    } else {
        workoutPlan = [
            { name: 'Press Day', template: 'upper_push_a' },
            { name: 'Row & Grow', template: 'upper_pull_a' },
            { name: 'Squat & Drive', template: 'lower_a' },
            { name: 'Incline & Isolate', template: 'upper_push_b' },
            { name: 'Back & Biceps', template: 'upper_pull_b' },
            { name: 'Deadlift Day', template: 'lower_b' },
        ];
        if (userData.days_per_week < 6) workoutPlan = workoutPlan.slice(0, userData.days_per_week);
    }

    const scheme = getRepScheme(userData.goal);

    // 4. Create Workouts
    for (const workout of workoutPlan) {
        const { data: createdWorkout, error: wError } = await supabase.from('workouts').insert({
            user_id: userId,
            name: workout.name,
            description: `Target: ${userData.goal} | Level: ${userData.experience} | Equipment: ${userData.equipment.length > 3 ? 'Full' : 'Limited'}`
        }).select().single();

        if (wError) throw wError;

        const templateExercises = EXERCISE_TEMPLATES[workout.template];
        const workoutExercises = [];

        for (let i = 0; i < templateExercises.length; i++) {
            const templateEx = templateExercises[i];

            // Find best matching exercise
            const selectedEx = findBestMatch(templateEx.name, allExercises, availableExercises);

            // Calculate individualized RPE/Reps based on difficulty? 
            // For now, stick to scheme.

            workoutExercises.push({
                workout_id: createdWorkout.id,
                exercise_id: selectedEx.id,
                sets: scheme.sets,
                reps: scheme.reps,
                rest_seconds: scheme.rest,
                order: i,
                rationale: templateEx.rationale + (selectedEx.name !== templateEx.name ? ` (Substituted with ${selectedEx.name} based on equipment)` : '')
            });
        }

        const { error: weError } = await supabase.from('workout_exercises').insert(workoutExercises);
        if (weError) throw new Error(`Failed to add exercises to ${workout.name}: ${weError.message}`);
    }
}

function findBestMatch(targetName: string, allExercises: any[], availableExercises: any[]) {
    // 1. Try exact match in available
    const exact = availableExercises.find(e => e.name.toLowerCase() === targetName.toLowerCase());
    if (exact) return exact;

    // 2. Find canonical exercise info (to get muscle group)
    const canonical = allExercises.find(e => e.name.toLowerCase() === targetName.toLowerCase());

    // 3. If canonical found, search for same muscle group in available
    if (canonical && canonical.muscle_group) {
        const muscleMatch = availableExercises.filter(e => e.muscle_group === canonical.muscle_group);

        if (muscleMatch.length > 0) {
            // Prefer compound movements? Or name similarity?
            // Simple keyword matching for better substitution (e.g. "Dumbbell Bench" for "Barbell Bench")
            const keywords = targetName.toLowerCase().split(' ').filter(w => !['barbell', 'dumbbell', 'cable', 'machine', 'band'].includes(w));

            const nameMatch = muscleMatch.find(e =>
                keywords.some(k => e.name.toLowerCase().includes(k))
            );

            if (nameMatch) return nameMatch;

            // Return first muscle match
            return muscleMatch[0];
        }
    }

    // 4. Fallback: Find ANY match by name similarity in available
    const fallbackMatch = availableExercises.find(e =>
        e.name.toLowerCase().includes(targetName.toLowerCase().split(' ')[0])
    );

    return fallbackMatch || availableExercises[0];
}

function getRepScheme(goal: string) {
    switch (goal) {
        case 'strength':
            return { sets: 5, reps: '3-5', rest: 180 };
        case 'hypertrophy':
            return { sets: 4, reps: '8-12', rest: 90 };
        case 'general':
            return { sets: 3, reps: '12-15', rest: 60 };
        default:
            return { sets: 3, reps: '10', rest: 90 };
    }
}

