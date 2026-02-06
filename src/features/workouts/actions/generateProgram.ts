'use server';

import { createClient } from '@/lib/supabase/server';

interface UserData {
    experience: 'beginner' | 'intermediate' | 'advanced';
    days_per_week: number;
    goal: 'strength' | 'hypertrophy' | 'general';
}

// Exercise templates with scientific rationale
const EXERCISE_TEMPLATES = {
    // Upper body exercises - VARIATION A
    'upper_push_a': [
        { name: 'Barbell Bench Press', rationale: 'Primary horizontal push. Activates pectorals, anterior delts, and triceps with maximal load capacity (Schoenfeld, 2010).' },
        { name: 'Overhead Press', rationale: 'Vertical push building shoulder strength and stability. Essential for balanced upper body development.' },
        { name: 'Incline Dumbbell Press', rationale: 'Targets upper chest fibers at 30-45° angle, addressing common weakness in clavicular pec head.' },
        { name: 'Dips', rationale: 'Compound movement for chest/triceps with bodyweight loading. Excellent muscle activation pattern.' },
        { name: 'Lateral Raise', rationale: 'Isolation for medial deltoid. Creates shoulder width and V-taper aesthetics.' },
    ],
    // Upper body exercises - VARIATION B (different movements, same patterns)
    'upper_push_b': [
        { name: 'Incline Barbell Press', rationale: 'Emphasizes upper chest with barbell loading. Complements flat bench from Day A.' },
        { name: 'Dumbbell Shoulder Press', rationale: 'Unilateral shoulder work addresses imbalances. Greater ROM than barbell variation.' },
        { name: 'Dumbbell Bench Press', rationale: 'Greater pec stretch and independent arm work. Builds stability and addresses weaknesses.' },
        { name: 'Close-Grip Bench Press', rationale: 'Tricep-focused pressing. Builds lockout strength and arm mass.' },
        { name: 'Cable Lateral Raise', rationale: 'Constant tension through full ROM. Different resistance curve than dumbbell variation.' },
    ],
    // Pull exercises - VARIATION A
    'upper_pull_a': [
        { name: 'Barbell Row', rationale: 'Horizontal pull for lat width and thickness. High load capacity builds back mass.' },
        { name: 'Pull-ups', rationale: 'Vertical pull developing lat width. Bodyweight mastery indicates functional strength.' },
        { name: 'Face Pull', rationale: 'Rear delt and rotator cuff health. Essential for shoulder balance and posture.' },
        { name: 'Hammer Curl', rationale: 'Brachialis and brachioradialis focus. Builds arm thickness and grip strength.' },
        { name: 'Shrugs', rationale: 'Upper trap development for yoke size and deadlift support.' },
    ],
    // Pull exercises - VARIATION B
    'upper_pull_b': [
        { name: 'Cable Row', rationale: 'Constant tension horizontal pull. Different strength curve than barbell row.' },
        { name: 'Lat Pulldown', rationale: 'Controlled vertical pull with adjustable resistance. Builds lat width.' },
        { name: 'Reverse Fly', rationale: 'Rear delt isolation. Complements face pulls for shoulder health.' },
        { name: 'Barbell Curl', rationale: 'Classic bicep builder. Supinated grip maximizes bicep activation.' },
        { name: 'Dumbbell Row', rationale: 'Unilateral back work. Addresses imbalances and allows greater ROM.' },
    ],
    // Lower body - VARIATION A
    'lower_a': [
        { name: 'Barbell Squat', rationale: 'King of lower body exercises. Quad, glute, and core development with maximal loading.' },
        { name: 'Romanian Deadlift', rationale: 'Hip hinge for hamstring and glute development. Essential for posterior chain.' },
        { name: 'Walking Lunges', rationale: 'Unilateral leg work improving balance and addressing asymmetries.' },
        { name: 'Leg Curl', rationale: 'Isolated knee flexion for hamstring development. Complements hip-dominant movements.' },
        { name: 'Standing Calf Raise', rationale: 'Gastrocnemius focus with straight knee position. Essential for complete leg development.' },
    ],
    // Lower body - VARIATION B
    'lower_b': [
        { name: 'Front Squat', rationale: 'Quad-dominant with upright torso. Builds core strength and addresses back squat weaknesses.' },
        { name: 'Conventional Deadlift', rationale: 'Full posterior chain development. Maximal total body loading capacity.' },
        { name: 'Bulgarian Split Squat', rationale: 'Single-leg strength and stability. High muscle activation with lower spinal load.' },
        { name: 'Leg Extension', rationale: 'Quad isolation for VMO and rectus femoris. Builds knee stability.' },
        { name: 'Seated Calf Raise', rationale: 'Soleus focus with bent knee position. Complements standing raises.' },
    ],
    // Full body exercises
    'full_body_a': [
        { name: 'Barbell Squat', rationale: 'Primary lower movement. Quad and glute development with full body engagement.' },
        { name: 'Barbell Bench Press', rationale: 'Primary horizontal push for chest and triceps development.' },
        { name: 'Barbell Row', rationale: 'Horizontal pull for back thickness and posture.' },
        { name: 'Overhead Press', rationale: 'Vertical push for shoulder strength and stability.' },
        { name: 'Romanian Deadlift', rationale: 'Hip hinge for posterior chain. Balances quad-dominant squats.' },
    ],
    'full_body_b': [
        { name: 'Front Squat', rationale: 'Quad emphasis with core engagement. Different stimulus than back squat.' },
        { name: 'Incline Dumbbell Press', rationale: 'Upper chest focus with unilateral loading.' },
        { name: 'Pull-ups', rationale: 'Vertical pull for lat development and bodyweight mastery.' },
        { name: 'Dumbbell Shoulder Press', rationale: 'Unilateral shoulder work for balance and ROM.' },
        { name: 'Conventional Deadlift', rationale: 'Full posterior chain and grip strength development.' },
    ],
    'full_body_c': [
        { name: 'Bulgarian Split Squat', rationale: 'Unilateral leg strength addressing imbalances.' },
        { name: 'Dumbbell Bench Press', rationale: 'Chest development with independent arm movement.' },
        { name: 'Cable Row', rationale: 'Constant tension back work for muscle growth.' },
        { name: 'Lateral Raise', rationale: 'Shoulder width and aesthetics.' },
        { name: 'Leg Curl', rationale: 'Direct hamstring work completing the session.' },
    ],
};

type TemplateKey = keyof typeof EXERCISE_TEMPLATES;

interface WorkoutPlanItem {
    name: string;
    template: TemplateKey;
}

export async function generateProgram(userId: string, userData: UserData) {
    const supabase = await createClient();

    // Fetch all exercises from database
    const { data: dbExercises } = await supabase.from('exercises').select('*');
    if (!dbExercises) throw new Error('No exercises found');

    // Determine split based on training frequency
    let workoutPlan: WorkoutPlanItem[] = [];

    if (userData.days_per_week <= 3) {
        // Full Body Split - 3 unique days
        const fullBodyPlan: WorkoutPlanItem[] = [
            { name: 'Full Body A', template: 'full_body_a' },
            { name: 'Full Body B', template: 'full_body_b' },
            { name: 'Full Body C', template: 'full_body_c' },
        ];
        workoutPlan = fullBodyPlan.slice(0, userData.days_per_week);
    } else if (userData.days_per_week === 4) {
        // Upper/Lower Split - A/B variations
        workoutPlan = [
            { name: 'Upper A', template: 'upper_push_a' },
            { name: 'Lower A', template: 'lower_a' },
            { name: 'Upper B', template: 'upper_push_b' },
            { name: 'Lower B', template: 'lower_b' },
        ];
    } else {
        // Push/Pull/Legs - 5-6 days
        const pplPlan: WorkoutPlanItem[] = [
            { name: 'Push A', template: 'upper_push_a' },
            { name: 'Pull A', template: 'upper_pull_a' },
            { name: 'Legs A', template: 'lower_a' },
            { name: 'Push B', template: 'upper_push_b' },
            { name: 'Pull B', template: 'upper_pull_b' },
            { name: 'Legs B', template: 'lower_b' },
        ];
        workoutPlan = pplPlan.slice(0, userData.days_per_week);
    }

    // Get rep/set scheme based on goal
    const scheme = getRepScheme(userData.goal);

    // Create each workout
    for (const workout of workoutPlan) {
        const { data: createdWorkout, error: wError } = await supabase.from('workouts').insert({
            user_id: userId,
            name: workout.name,
            description: `Target: ${userData.goal} | Level: ${userData.experience}`
        }).select().single();

        if (wError) throw wError;

        // Get template exercises
        const templateExercises = EXERCISE_TEMPLATES[workout.template];

        // Match template exercises to database exercises
        const workoutExercises = templateExercises.map((templateEx, index) => {
            const dbEx = dbExercises.find(e =>
                e.name.toLowerCase().includes(templateEx.name.toLowerCase().split(' ')[0]) ||
                templateEx.name.toLowerCase().includes(e.name.toLowerCase())
            ) || dbExercises[index % dbExercises.length]; // Fallback to any exercise

            return {
                workout_id: createdWorkout.id,
                exercise_id: dbEx.id,
                sets: scheme.sets,
                reps: scheme.reps,
                rest_seconds: scheme.rest,
                order: index,
                rationale: templateEx.rationale
            };
        });

        await supabase.from('workout_exercises').insert(workoutExercises);
    }
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

