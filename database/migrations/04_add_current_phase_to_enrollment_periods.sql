-- Migration: add current_phase column to enrollment_periods if missing
-- This makes the schema compatible with seed/logic that expects current_phase

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'enrollment_periods' AND column_name = 'current_phase'
    ) THEN
        ALTER TABLE enrollment_periods
        ADD COLUMN current_phase period_phase_enum DEFAULT 'SOLICITUDES';
    END IF;
END $$;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'enrollment_periods' AND column_name = 'current_phase';
