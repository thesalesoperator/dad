-- Migration: Add equipment support to exercises and user profiles
-- Run this BEFORE the seed file

-- Add new columns to exercises table
ALTER TABLE exercises 
ADD COLUMN IF NOT EXISTS equipment_type TEXT[] DEFAULT ARRAY['barbell'],
ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'intermediate',
ADD COLUMN IF NOT EXISTS rationale TEXT;

-- Add equipment preference to user_profiles
ALTER TABLE user_profiles
ADD COLUMN IF NOT EXISTS equipment_available TEXT[] DEFAULT ARRAY['barbell', 'dumbbell', 'cable', 'machine'];

-- Create index for equipment queries
CREATE INDEX IF NOT EXISTS idx_exercises_equipment_type ON exercises USING GIN(equipment_type);
CREATE INDEX IF NOT EXISTS idx_exercises_difficulty ON exercises(difficulty);
CREATE INDEX IF NOT EXISTS idx_exercises_muscle_group ON exercises(muscle_group);
