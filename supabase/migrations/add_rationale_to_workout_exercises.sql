-- Add rationale column to workout_exercises for tracking exercise substitution reasoning
ALTER TABLE workout_exercises 
ADD COLUMN IF NOT EXISTS rationale TEXT;
