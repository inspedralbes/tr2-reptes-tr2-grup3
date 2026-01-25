-- Migration: insert a default ACTIVE enrollment_period if none exists
-- This is idempotent: it will not duplicate if a period with the same id or any ACTIVE period exists.

DO $$
BEGIN
    -- If there is already any enrollment_period with status = 'ACTIVE', skip
    IF EXISTS (SELECT 1 FROM enrollment_periods WHERE status = 'ACTIVE') THEN
        RAISE NOTICE 'Active enrollment_period already exists, skipping insert.';
    ELSE
        -- Insert a default active enrollment period used by seed/tests
        IF NOT EXISTS (SELECT 1 FROM enrollment_periods WHERE id = 'e0000001-0001-0001-0001-000000000001') THEN
            INSERT INTO enrollment_periods (
                id, name, status, current_phase,
                phase_solicitudes_start, phase_solicitudes_end,
                phase_publicacion_start, phase_publicacion_end,
                phase_ejecucion_start, phase_ejecucion_end
            ) VALUES (
                'e0000001-0001-0001-0001-000000000001',
                'ENGINY 2025-2026 - 2n Trimestre',
                'ACTIVE',
                'SOLICITUDES',
                '2026-01-10 00:00:00+01', '2026-02-15 23:59:59+01',
                '2026-02-16 00:00:00+01', '2026-02-28 23:59:59+01',
                '2026-03-01 00:00:00+01', '2026-06-15 23:59:59+01'
            );
        ELSE
            -- If the specific id exists but may miss current_phase, update it
            UPDATE enrollment_periods
            SET status = 'ACTIVE', current_phase = COALESCE(current_phase, 'SOLICITUDES')
            WHERE id = 'e0000001-0001-0001-0001-000000000001';
        END IF;
        RAISE NOTICE 'Inserted default active enrollment_period.';
    END IF;
END $$;

-- Verify
SELECT id, name, status, current_phase FROM enrollment_periods WHERE id = 'e0000001-0001-0001-0001-000000000001' LIMIT 1;
