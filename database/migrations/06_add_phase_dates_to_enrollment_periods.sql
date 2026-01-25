-- Migration: add phase date columns to enrollment_periods if missing
-- Adds: phase_solicitudes_start, phase_solicitudes_end,
--       phase_publicacion_start, phase_publicacion_end,
--       phase_ejecucion_start, phase_ejecucion_end

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'enrollment_periods' AND column_name = 'phase_solicitudes_start'
    ) THEN
        ALTER TABLE enrollment_periods
        ADD COLUMN phase_solicitudes_start TIMESTAMP WITH TIME ZONE,
        ADD COLUMN phase_solicitudes_end TIMESTAMP WITH TIME ZONE,
        ADD COLUMN phase_publicacion_start TIMESTAMP WITH TIME ZONE,
        ADD COLUMN phase_publicacion_end TIMESTAMP WITH TIME ZONE,
        ADD COLUMN phase_ejecucion_start TIMESTAMP WITH TIME ZONE,
        ADD COLUMN phase_ejecucion_end TIMESTAMP WITH TIME ZONE;
    END IF;
END $$;

-- Verify
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'enrollment_periods' AND column_name LIKE 'phase_%' ORDER BY column_name;
