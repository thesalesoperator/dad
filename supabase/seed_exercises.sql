-- Comprehensive Exercise Database Seed
-- 141 exercises covering all equipment types, difficulty levels, and muscle groups
-- RevPilot Gym - Inclusive Fitness for Everyone

-- First, clear existing exercises to avoid duplicates
DELETE FROM exercises;

-- Reset sequence
ALTER SEQUENCE exercises_id_seq RESTART WITH 1;

-- ============================================================================
-- CHEST EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Bench Press', 'Chest', ARRAY['barbell'], 'intermediate', 'Primary horizontal push. Activates pectorals, anterior delts, and triceps with maximal load capacity. Gold standard for chest development (Schoenfeld, 2010).'),
('Incline Barbell Press', 'Chest', ARRAY['barbell'], 'intermediate', 'Upper chest emphasis at 30-45° angle. Addresses common weakness in clavicular pec head.'),
('Close-Grip Bench Press', 'Chest', ARRAY['barbell'], 'intermediate', 'Tricep-focused pressing movement. Builds lockout strength and inner chest development.'),
('Floor Press', 'Chest', ARRAY['barbell', 'dumbbell'], 'beginner', 'Limited ROM pressing. Shoulder-friendly option that eliminates stretch at bottom.'),

-- Dumbbell
('Dumbbell Bench Press', 'Chest', ARRAY['dumbbell'], 'beginner', 'Independent arm work addresses imbalances. Greater ROM and pec stretch than barbell.'),
('Incline Dumbbell Press', 'Chest', ARRAY['dumbbell'], 'beginner', 'Upper chest focus with unilateral loading. Great for beginners learning pressing mechanics.'),
('Dumbbell Fly', 'Chest', ARRAY['dumbbell'], 'intermediate', 'Chest isolation through horizontal adduction. Maximum pec stretch under load.'),
('Decline Dumbbell Press', 'Chest', ARRAY['dumbbell'], 'intermediate', 'Lower chest emphasis. Often feels stronger due to favorable pressing angle.'),

-- Bodyweight
('Push-ups', 'Chest', ARRAY['bodyweight'], 'beginner', 'Fundamental pushing pattern. Builds chest, shoulders, and triceps with zero equipment.'),
('Incline Push-ups', 'Chest', ARRAY['bodyweight'], 'beginner', 'Hands elevated, easier than floor push-ups. Great starting point for beginners.'),
('Decline Push-ups', 'Chest', ARRAY['bodyweight'], 'intermediate', 'Feet elevated for upper chest emphasis and increased difficulty.'),
('Diamond Push-ups', 'Chest', ARRAY['bodyweight'], 'intermediate', 'Hands close together. Emphasizes triceps and inner chest.'),
('Dips', 'Chest', ARRAY['bodyweight'], 'intermediate', 'Compound movement for lower chest and triceps. Excellent muscle activation.'),

-- Cable/Machine
('Cable Fly', 'Chest', ARRAY['cable'], 'intermediate', 'Constant tension through full ROM. Superior to dumbbells for continuous resistance.'),
('Machine Chest Press', 'Chest', ARRAY['machine'], 'beginner', 'Guided pressing path. Perfect for beginners or high-rep burnouts.'),

-- Resistance Band
('Banded Push-up', 'Chest', ARRAY['band', 'bodyweight'], 'intermediate', 'Band across back adds resistance at lockout. Progressive overload for push-ups.'),
('Banded Chest Press', 'Chest', ARRAY['band'], 'beginner', 'Horizontal push with bands. Portable chest training anywhere.');

-- ============================================================================
-- BACK EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Row', 'Back', ARRAY['barbell'], 'intermediate', 'Horizontal pull for lat width and thickness. High load capacity builds serious back mass.'),
('Pendlay Row', 'Back', ARRAY['barbell'], 'intermediate', 'Dead-stop rows from floor. Eliminates momentum for strict form and explosive strength.'),
('T-Bar Row', 'Back', ARRAY['barbell'], 'intermediate', 'Mid-back thickness builder. Neutral grip reduces bicep involvement.'),
('Meadows Row', 'Back', ARRAY['barbell'], 'advanced', 'Single-arm landmine row. Unique angle hits lats differently than standard rows.'),

-- Dumbbell
('Dumbbell Row', 'Back', ARRAY['dumbbell'], 'beginner', 'Unilateral back work. Addresses imbalances and allows greater ROM than barbell.'),
('Chest-Supported Row', 'Back', ARRAY['dumbbell'], 'beginner', 'Eliminates lower back fatigue. Pure lat isolation.'),
('Reverse Fly', 'Back', ARRAY['dumbbell'], 'beginner', 'Rear delt isolation. Essential for shoulder balance and posture.'),
('Kroc Row', 'Back', ARRAY['dumbbell'], 'advanced', 'High-rep, heavy dumbbell rows. Builds grip and back thickness.'),

-- Bodyweight
('Pull-ups', 'Back', ARRAY['bodyweight'], 'advanced', 'Vertical pull developing lat width. Bodyweight mastery indicates functional strength.'),
('Chin-ups', 'Back', ARRAY['bodyweight'], 'intermediate', 'Supinated grip vertical pull. More bicep involvement, often easier than pull-ups.'),
('Inverted Row', 'Back', ARRAY['bodyweight'], 'beginner', 'Horizontal bodyweight pull. Scalable difficulty by adjusting body angle.'),
('Scapular Pull-ups', 'Back', ARRAY['bodyweight'], 'beginner', 'Scapular retraction at bottom of pull-up. Builds foundation for full pull-ups.'),

-- Cable/Machine
('Lat Pulldown', 'Back', ARRAY['cable', 'machine'], 'beginner', 'Controlled vertical pull with adjustable resistance. Builds lat width.'),
('Cable Row', 'Back', ARRAY['cable'], 'beginner', 'Constant tension horizontal pull. Different strength curve than barbell row.'),
('Face Pull', 'Back', ARRAY['cable'], 'beginner', 'Rear delt and rotator cuff health. Essential for shoulder balance and posture.'),
('Straight-Arm Pulldown', 'Back', ARRAY['cable'], 'intermediate', 'Lat isolation without bicep involvement. Great mind-muscle connection exercise.'),
('Assisted Pull-ups', 'Back', ARRAY['machine'], 'beginner', 'Machine assistance to build towards full pull-ups. Adjustable difficulty.'),

-- Resistance Band
('Band Row', 'Back', ARRAY['band'], 'beginner', 'Portable horizontal pull. Anchor to door or step on band.'),
('Band Pull-Apart', 'Back', ARRAY['band'], 'beginner', 'Rear delt and rhomboid activation. Great for posture and warm-ups.'),
('Band Lat Pulldown', 'Back', ARRAY['band'], 'beginner', 'Vertical pull with bands anchored overhead. Home-friendly lat training.');

-- ============================================================================
-- SHOULDER EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Overhead Press', 'Shoulders', ARRAY['barbell'], 'intermediate', 'Primary vertical push. Builds shoulder strength, stability, and core bracing.'),
('Push Press', 'Shoulders', ARRAY['barbell'], 'intermediate', 'Leg drive assists overhead press. Allows heavier loads for overload.'),
('Behind-the-Neck Press', 'Shoulders', ARRAY['barbell'], 'advanced', 'Full delt activation. Requires good shoulder mobility. Not for everyone.'),

-- Dumbbell
('Dumbbell Shoulder Press', 'Shoulders', ARRAY['dumbbell'], 'beginner', 'Unilateral shoulder work for balance. Greater ROM than barbell variation.'),
('Arnold Press', 'Shoulders', ARRAY['dumbbell'], 'intermediate', 'Rotation through press hits all three delt heads. Named after Schwarzenegger.'),
('Lateral Raise', 'Shoulders', ARRAY['dumbbell'], 'beginner', 'Medial deltoid isolation. Creates shoulder width and V-taper aesthetics.'),
('Front Raise', 'Shoulders', ARRAY['dumbbell'], 'beginner', 'Anterior deltoid isolation. Often gets enough work from pressing.'),
('Rear Delt Fly', 'Shoulders', ARRAY['dumbbell'], 'beginner', 'Rear deltoid isolation. Critical for shoulder health and balance.'),
('Upright Row', 'Shoulders', ARRAY['dumbbell', 'barbell'], 'intermediate', 'Traps and side delts. Wide grip reduces impingement risk.'),
('Shrugs', 'Shoulders', ARRAY['dumbbell', 'barbell'], 'beginner', 'Upper trap development for yoke size.'),

-- Bodyweight
('Pike Push-ups', 'Shoulders', ARRAY['bodyweight'], 'intermediate', 'Bodyweight vertical push. Progression towards handstand push-ups.'),
('Handstand Push-ups', 'Shoulders', ARRAY['bodyweight'], 'advanced', 'Full bodyweight overhead pressing. Advanced skill and strength.'),
('Wall Handstand Hold', 'Shoulders', ARRAY['bodyweight'], 'intermediate', 'Isometric shoulder strength. Builds towards handstand push-ups.'),

-- Cable
('Cable Lateral Raise', 'Shoulders', ARRAY['cable'], 'beginner', 'Constant tension through full ROM. Different resistance curve than dumbbells.'),
('Cable Face Pull', 'Shoulders', ARRAY['cable'], 'beginner', 'Rear delt and external rotation. Critical for shoulder health.'),
('Cable Front Raise', 'Shoulders', ARRAY['cable'], 'beginner', 'Constant tension front delt work.'),

-- Machine
('Machine Shoulder Press', 'Shoulders', ARRAY['machine'], 'beginner', 'Guided pressing path. Safe for beginners or finishing sets.'),

-- Resistance Band
('Band Lateral Raise', 'Shoulders', ARRAY['band'], 'beginner', 'Portable lateral raise. Increasing resistance at top of movement.'),
('Band Overhead Press', 'Shoulders', ARRAY['band'], 'beginner', 'Vertical push with bands. Stand on band for resistance.'),
('Band Pull-Apart', 'Shoulders', ARRAY['band'], 'beginner', 'Rear delt and posture. Also great for warm-ups.');

-- ============================================================================
-- BICEPS EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Curl', 'Biceps', ARRAY['barbell'], 'beginner', 'Classic bicep builder. Supinated grip maximizes bicep short head activation.'),
('EZ Bar Curl', 'Biceps', ARRAY['barbell'], 'beginner', 'Wrist-friendly curling. Angled grip reduces wrist strain.'),
('Preacher Curl', 'Biceps', ARRAY['barbell'], 'intermediate', 'Arm braced eliminates momentum. Strict bicep isolation.'),
('Drag Curl', 'Biceps', ARRAY['barbell'], 'intermediate', 'Elbows back, bar drags up body. Emphasizes bicep long head.'),

-- Dumbbell
('Dumbbell Curl', 'Biceps', ARRAY['dumbbell'], 'beginner', 'Supinated dumbbell curl. Allows full supination for peak contraction.'),
('Hammer Curl', 'Biceps', ARRAY['dumbbell'], 'beginner', 'Neutral grip targets brachialis and brachioradialis. Builds arm thickness.'),
('Incline Dumbbell Curl', 'Biceps', ARRAY['dumbbell'], 'intermediate', 'Stretched position curl. Greater bicep stretch than standing.'),
('Concentration Curl', 'Biceps', ARRAY['dumbbell'], 'beginner', 'Isolated peak contraction. Arm braced against leg.'),
('Zottman Curl', 'Biceps', ARRAY['dumbbell'], 'intermediate', 'Curl up supinated, lower pronated. Trains biceps and forearms.'),
('Spider Curl', 'Biceps', ARRAY['dumbbell'], 'intermediate', 'Chest on incline bench, arms hang. Maximum contraction focus.'),

-- Bodyweight
('Chin-ups', 'Biceps', ARRAY['bodyweight'], 'intermediate', 'Supinated pull-up variation. Compound bicep builder with lat involvement.'),
('Bodyweight Curls', 'Biceps', ARRAY['bodyweight'], 'beginner', 'Using rings or TRX. Adjustable difficulty based on body angle.'),

-- Cable
('Cable Curl', 'Biceps', ARRAY['cable'], 'beginner', 'Constant tension throughout curl. Great for mind-muscle connection.'),
('Cable Hammer Curl', 'Biceps', ARRAY['cable'], 'beginner', 'Rope attachment for neutral grip. Constant tension hammer curls.'),
('High Cable Curl', 'Biceps', ARRAY['cable'], 'intermediate', 'Arms out to sides, curl to head. Unique angle and peak contraction.'),

-- Resistance Band
('Band Curl', 'Biceps', ARRAY['band'], 'beginner', 'Portable bicep training. Increasing resistance at contraction.'),
('Band Hammer Curl', 'Biceps', ARRAY['band'], 'beginner', 'Neutral grip band curl. Hits brachialis and forearms.');

-- ============================================================================
-- TRICEPS EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Close-Grip Bench Press', 'Triceps', ARRAY['barbell'], 'intermediate', 'Heavy compound tricep movement. Builds pressing strength and arm mass.'),
('Skull Crushers', 'Triceps', ARRAY['barbell'], 'intermediate', 'Lying tricep extension. All three heads activated.'),
('JM Press', 'Triceps', ARRAY['barbell'], 'advanced', 'Hybrid between close-grip bench and skull crusher. Advanced tricep builder.'),

-- Dumbbell
('Overhead Tricep Extension', 'Triceps', ARRAY['dumbbell'], 'beginner', 'Long head emphasis through stretch. Single or double arm.'),
('Tricep Kickback', 'Triceps', ARRAY['dumbbell'], 'beginner', 'Isolation at peak contraction. Light weight, strict form.'),
('Dumbbell Skull Crusher', 'Triceps', ARRAY['dumbbell'], 'intermediate', 'Lying tricep extension with dumbbells. Independent arm work.'),
('Tate Press', 'Triceps', ARRAY['dumbbell'], 'intermediate', 'Elbows out, lower to chest. Unique tricep angle.'),

-- Bodyweight
('Dips', 'Triceps', ARRAY['bodyweight'], 'intermediate', 'Compound tricep and chest builder. Bodyweight loading.'),
('Bench Dips', 'Triceps', ARRAY['bodyweight'], 'beginner', 'Hands on bench behind body. Easier than parallel bar dips.'),
('Diamond Push-ups', 'Triceps', ARRAY['bodyweight'], 'intermediate', 'Hands close together forming diamond. Tricep-focused push-up.'),
('Close-Grip Push-ups', 'Triceps', ARRAY['bodyweight'], 'beginner', 'Hands shoulder-width. More tricep focus than standard push-ups.'),

-- Cable
('Tricep Pushdown', 'Triceps', ARRAY['cable'], 'beginner', 'Cable isolation for triceps. Constant tension, beginner-friendly.'),
('Rope Pushdown', 'Triceps', ARRAY['cable'], 'beginner', 'Rope attachment allows wrist rotation. Better lateral head activation.'),
('Cable Overhead Extension', 'Triceps', ARRAY['cable'], 'intermediate', 'Face away from cable, extend overhead. Long head emphasis.'),

-- Resistance Band
('Band Pushdown', 'Triceps', ARRAY['band'], 'beginner', 'Anchor band overhead, push down. Portable tricep isolation.'),
('Band Overhead Extension', 'Triceps', ARRAY['band'], 'beginner', 'Step on band, extend overhead. Long head with bands.'),
('Band Kickback', 'Triceps', ARRAY['band'], 'beginner', 'Anchor band low, kick back. Constant tension kickbacks.');

-- ============================================================================
-- QUADRICEPS EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Back Squat', 'Quadriceps', ARRAY['barbell'], 'intermediate', 'King of lower body. Quad, glute, and core development with maximal loading.'),
('Front Squat', 'Quadriceps', ARRAY['barbell'], 'intermediate', 'Quad-dominant with upright torso. Easier on lower back than back squat.'),
('Zercher Squat', 'Quadriceps', ARRAY['barbell'], 'advanced', 'Bar in elbow crease. Unique core and quad challenge.'),

-- Dumbbell
('Goblet Squat', 'Quadriceps', ARRAY['dumbbell'], 'beginner', 'Front-loaded squat pattern. Perfect for learning squat mechanics.'),
('Dumbbell Lunges', 'Quadriceps', ARRAY['dumbbell'], 'beginner', 'Unilateral leg development. Improves balance and addresses asymmetries.'),
('Walking Lunges', 'Quadriceps', ARRAY['dumbbell'], 'intermediate', 'Dynamic lunge variation. Continuous movement challenges balance.'),
('Bulgarian Split Squat', 'Quadriceps', ARRAY['dumbbell'], 'intermediate', 'Rear foot elevated. High muscle activation with lower spinal load.'),
('Dumbbell Step-ups', 'Quadriceps', ARRAY['dumbbell'], 'beginner', 'Functional unilateral movement. Adjustable difficulty based on box height.'),

-- Bodyweight
('Bodyweight Squat', 'Quadriceps', ARRAY['bodyweight'], 'beginner', 'Fundamental movement pattern. Foundation for all squat variations.'),
('Lunges', 'Quadriceps', ARRAY['bodyweight'], 'beginner', 'Bodyweight unilateral leg work. No equipment needed.'),
('Split Squat', 'Quadriceps', ARRAY['bodyweight'], 'beginner', 'Stationary lunge position. Builds single-leg strength.'),
('Jump Squat', 'Quadriceps', ARRAY['bodyweight'], 'intermediate', 'Explosive leg power. Builds fast-twitch muscle fibers.'),
('Pistol Squat', 'Quadriceps', ARRAY['bodyweight'], 'advanced', 'Single-leg squat mastery. Ultimate bodyweight leg exercise.'),
('Sissy Squat', 'Quadriceps', ARRAY['bodyweight'], 'advanced', 'Intense quad isolation. Lean back with heels raised.'),
('Wall Sit', 'Quadriceps', ARRAY['bodyweight'], 'beginner', 'Isometric quad endurance. Back against wall, thighs parallel.'),

-- Machine
('Leg Press', 'Quadriceps', ARRAY['machine'], 'beginner', 'High load with low skill requirement. Safe for pushing limits.'),
('Leg Extension', 'Quadriceps', ARRAY['machine'], 'beginner', 'Quad isolation. Builds VMO and rectus femoris.'),
('Hack Squat', 'Quadriceps', ARRAY['machine'], 'intermediate', 'Quad-focused machine squat. Guided path for safety.'),

-- Resistance Band
('Band Squat', 'Quadriceps', ARRAY['band'], 'beginner', 'Added resistance to squat pattern. Band around thighs or stood on.'),
('Band Lunge', 'Quadriceps', ARRAY['band'], 'beginner', 'Resistance band step lunges. Portable leg training.');

-- ============================================================================
-- HAMSTRINGS EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Romanian Deadlift', 'Hamstrings', ARRAY['barbell'], 'intermediate', 'Hip hinge for hamstring stretch and glute development. Essential posterior chain.'),
('Stiff-Leg Deadlift', 'Hamstrings', ARRAY['barbell'], 'intermediate', 'Minimal knee bend for increased hamstring stretch.'),
('Conventional Deadlift', 'Hamstrings', ARRAY['barbell'], 'intermediate', 'Full posterior chain development. Maximal total body loading.'),
('Good Mornings', 'Hamstrings', ARRAY['barbell'], 'intermediate', 'Hip hinge with bar on back. Builds hamstring and lower back.'),

-- Dumbbell
('Dumbbell Romanian Deadlift', 'Hamstrings', ARRAY['dumbbell'], 'beginner', 'Learning hip hinge pattern. Lighter load for technique focus.'),
('Single-Leg Romanian Deadlift', 'Hamstrings', ARRAY['dumbbell'], 'intermediate', 'Unilateral hip hinge. Balance and hamstring stretch.'),

-- Bodyweight
('Hip Hinge', 'Hamstrings', ARRAY['bodyweight'], 'beginner', 'Learning the movement pattern. Hands on hips, push hips back.'),
('Nordic Curl', 'Hamstrings', ARRAY['bodyweight'], 'advanced', 'Eccentric hamstring strength. Partner holds ankles or anchor feet.'),
('Glute Bridge March', 'Hamstrings', ARRAY['bodyweight'], 'beginner', 'Bridge position, alternate lifting knees. Hamstring activation.'),
('Single-Leg Glute Bridge', 'Hamstrings', ARRAY['bodyweight'], 'intermediate', 'Unilateral bridge for hamstrings and glutes.'),

-- Machine
('Lying Leg Curl', 'Hamstrings', ARRAY['machine'], 'beginner', 'Knee flexion isolation. Direct hamstring work.'),
('Seated Leg Curl', 'Hamstrings', ARRAY['machine'], 'beginner', 'Seated knee flexion. Different angle than lying curl.'),
('Glute-Ham Raise', 'Hamstrings', ARRAY['machine'], 'advanced', 'Full hamstring engagement through hip and knee extension.'),

-- Cable
('Cable Pull-Through', 'Hamstrings', ARRAY['cable'], 'beginner', 'Hip hinge with cable resistance. Glute and hamstring focus.'),

-- Resistance Band
('Band Leg Curl', 'Hamstrings', ARRAY['band'], 'beginner', 'Anchor band to fixed point. Prone leg curls with band.'),
('Band Good Morning', 'Hamstrings', ARRAY['band'], 'beginner', 'Hip hinge with band resistance. Portable hamstring training.');

-- ============================================================================
-- GLUTES EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Hip Thrust', 'Glutes', ARRAY['barbell'], 'intermediate', 'Primary glute builder. Superior glute activation compared to squats.'),
('Sumo Deadlift', 'Glutes', ARRAY['barbell'], 'intermediate', 'Wide stance deadlift. Hip-dominant with more glute involvement.'),

-- Dumbbell
('Dumbbell Hip Thrust', 'Glutes', ARRAY['dumbbell'], 'beginner', 'Hip thrust with dumbbell on hips. Beginner-friendly loading.'),
('Sumo Squat', 'Glutes', ARRAY['dumbbell'], 'beginner', 'Wide stance squat. More glute and inner thigh activation.'),
('Dumbbell Romanian Deadlift', 'Glutes', ARRAY['dumbbell'], 'beginner', 'Hip hinge with glute focus. Stretch and squeeze pattern.'),
('Reverse Lunge', 'Glutes', ARRAY['dumbbell'], 'beginner', 'Step back lunge. More glute-dominant than forward lunge.'),

-- Bodyweight
('Glute Bridge', 'Glutes', ARRAY['bodyweight'], 'beginner', 'Learning hip extension pattern. Foundation for hip thrusts.'),
('Single-Leg Glute Bridge', 'Glutes', ARRAY['bodyweight'], 'intermediate', 'Unilateral glute work. Addresses imbalances.'),
('Frog Pump', 'Glutes', ARRAY['bodyweight'], 'beginner', 'Feet together, knees out. Glute activation exercise.'),
('Donkey Kick', 'Glutes', ARRAY['bodyweight'], 'beginner', 'Quadruped position, kick leg back. Glute isolation.'),
('Fire Hydrant', 'Glutes', ARRAY['bodyweight'], 'beginner', 'Quadruped hip abduction. Glute medius activation.'),
('Curtsy Lunge', 'Glutes', ARRAY['bodyweight'], 'intermediate', 'Cross-behind lunge. Hits glutes from different angle.'),

-- Cable
('Cable Kickback', 'Glutes', ARRAY['cable'], 'beginner', 'Isolated glute extension with cable. Constant tension.'),
('Cable Pull-Through', 'Glutes', ARRAY['cable'], 'beginner', 'Hip hinge with cable. Glute and hamstring focus.'),

-- Resistance Band
('Band Kickback', 'Glutes', ARRAY['band'], 'beginner', 'Portable glute isolation. Band around ankles.'),
('Clamshell', 'Glutes', ARRAY['band'], 'beginner', 'Side-lying hip abduction. Glute medius activation.'),
('Lateral Band Walk', 'Glutes', ARRAY['band'], 'beginner', 'Band around thighs, walk sideways. Glute med and min.'),
('Banded Hip Thrust', 'Glutes', ARRAY['band'], 'intermediate', 'Hip thrust with band resistance. Added challenge to bodyweight.');

-- ============================================================================
-- CALVES EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Barbell
('Barbell Calf Raise', 'Calves', ARRAY['barbell'], 'intermediate', 'Bar on back, raise onto toes. Heavy calf loading.'),

-- Dumbbell
('Dumbbell Calf Raise', 'Calves', ARRAY['dumbbell'], 'beginner', 'Dumbbells at sides, raise onto toes. Simple loading option.'),
('Single-Leg Dumbbell Calf Raise', 'Calves', ARRAY['dumbbell'], 'intermediate', 'Unilateral calf work. Addresses imbalances.'),

-- Bodyweight
('Bodyweight Calf Raise', 'Calves', ARRAY['bodyweight'], 'beginner', 'Basic calf training. Can do on stairs for extra ROM.'),
('Single-Leg Calf Raise', 'Calves', ARRAY['bodyweight'], 'beginner', 'Unilateral bodyweight calf raise. Higher intensity per leg.'),
('Stair Calf Raise', 'Calves', ARRAY['bodyweight'], 'beginner', 'Use stairs for extended ROM. Heels drop below level.'),

-- Machine
('Standing Calf Raise Machine', 'Calves', ARRAY['machine'], 'beginner', 'Gastrocnemius focus with straight legs. Heavy loading possible.'),
('Seated Calf Raise', 'Calves', ARRAY['machine'], 'beginner', 'Soleus focus with bent knees. Complements standing raises.'),
('Leg Press Calf Raise', 'Calves', ARRAY['machine'], 'beginner', 'Calf raises on leg press platform. Safe and effective.'),
('Donkey Calf Raise', 'Calves', ARRAY['machine'], 'intermediate', 'Bent-over position for deep stretch. Classic bodybuilding exercise.');

-- ============================================================================
-- CORE EXERCISES
-- ============================================================================

INSERT INTO exercises (name, muscle_group, equipment_type, difficulty, rationale) VALUES
-- Bodyweight
('Plank', 'Core', ARRAY['bodyweight'], 'beginner', 'Isometric core stability. Foundation for all core training.'),
('Side Plank', 'Core', ARRAY['bodyweight'], 'beginner', 'Oblique and lateral stability. Essential for balanced core.'),
('Dead Bug', 'Core', ARRAY['bodyweight'], 'beginner', 'Anti-extension core stability. Safe for all fitness levels.'),
('Bird Dog', 'Core', ARRAY['bodyweight'], 'beginner', 'Opposite arm/leg extension. Core control and balance.'),
('Mountain Climbers', 'Core', ARRAY['bodyweight'], 'beginner', 'Dynamic core with cardio element. Plank position, alternate knees.'),
('Bicycle Crunch', 'Core', ARRAY['bodyweight'], 'beginner', 'Obliques and rectus abdominis. Rotation with crunch.'),
('Reverse Crunch', 'Core', ARRAY['bodyweight'], 'beginner', 'Lower abs emphasis. Lift hips off ground.'),
('Hollow Body Hold', 'Core', ARRAY['bodyweight'], 'intermediate', 'Gymnastic core exercise. Arms and legs extended.'),
('V-Up', 'Core', ARRAY['bodyweight'], 'intermediate', 'Full ab contraction. Touch hands to feet.'),
('Hanging Leg Raise', 'Core', ARRAY['bodyweight'], 'intermediate', 'Lower abs and hip flexors. Requires pull-up bar.'),
('Toes to Bar', 'Core', ARRAY['bodyweight'], 'advanced', 'Full hanging leg raise. Touch toes to bar.'),
('L-Sit', 'Core', ARRAY['bodyweight'], 'advanced', 'Isometric hip flexor and core. Advanced gymnastics skill.'),

-- Dumbbell
('Russian Twist', 'Core', ARRAY['dumbbell'], 'intermediate', 'Rotational core with weight. V-sit position, twist side to side.'),
('Weighted Plank', 'Core', ARRAY['dumbbell'], 'intermediate', 'Weight on back during plank. Increased difficulty.'),
('Dumbbell Side Bend', 'Core', ARRAY['dumbbell'], 'beginner', 'Oblique work with weight. Lean to one side.'),
('Farmer Carry', 'Core', ARRAY['dumbbell'], 'beginner', 'Walk with heavy dumbbells. Core stability and grip strength.'),

-- Cable
('Cable Crunch', 'Core', ARRAY['cable'], 'beginner', 'Kneeling crunch with cable. Loaded ab flexion.'),
('Pallof Press', 'Core', ARRAY['cable'], 'beginner', 'Anti-rotation core stability. Press cable away from body.'),
('Wood Chop', 'Core', ARRAY['cable'], 'intermediate', 'Rotational power from high to low or low to high.'),
('Cable Twist', 'Core', ARRAY['cable'], 'intermediate', 'Standing rotation with cable. Oblique power.'),

-- Equipment
('Ab Wheel Rollout', 'Core', ARRAY['equipment'], 'intermediate', 'Anti-extension with ab wheel. Demands core strength.'),
('Medicine Ball Slam', 'Core', ARRAY['equipment'], 'intermediate', 'Explosive core power. Full body slam motion.'),

-- Resistance Band
('Band Pallof Press', 'Core', ARRAY['band'], 'beginner', 'Portable anti-rotation. Anchor band to side.'),
('Band Wood Chop', 'Core', ARRAY['band'], 'intermediate', 'Rotational movement with band. Chop across body.'),
('Band Dead Bug', 'Core', ARRAY['band'], 'beginner', 'Dead bug with band resistance. Increased challenge.');

-- ============================================================================
-- Add indexes for common queries
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_type ON exercises USING GIN(equipment_type);
