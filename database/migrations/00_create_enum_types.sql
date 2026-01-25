-- Migration: Create enum types if they do not exist
-- This is idempotent and safe to run multiple times.

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_role_enum') THEN
        CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'CENTER_COORD', 'TEACHER');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_status_enum') THEN
        CREATE TYPE period_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'period_phase_enum') THEN
        CREATE TYPE period_phase_enum AS ENUM (
            'SOLICITUDES',
            'ASIGNACION',
            'PUBLICACION',
            'EJECUCION'
        );
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'workshop_term_enum') THEN
        CREATE TYPE workshop_term_enum AS ENUM ('2N_TRIMESTRE', '3R_TRIMESTRE');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'day_of_week_enum') THEN
        CREATE TYPE day_of_week_enum AS ENUM ('TUESDAY', 'THURSDAY');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'request_status_enum') THEN
        CREATE TYPE request_status_enum AS ENUM ('DRAFT', 'SUBMITTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'allocation_status_enum') THEN
        CREATE TYPE allocation_status_enum AS ENUM ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED', 'REJECTED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'student_status_enum') THEN
        CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'DROPPED_OUT');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'attendance_status_enum') THEN
        CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'waiting_list_status_enum') THEN
        CREATE TYPE waiting_list_status_enum AS ENUM ('PENDING', 'NOTIFIED', 'EXPIRED');
    END IF;
END $$;

-- Quick verify: list created enum types (for logs)
SELECT 'enum:' || typname AS info FROM pg_type WHERE typname IN (
  'user_role_enum','period_status_enum','period_phase_enum','workshop_term_enum',
  'day_of_week_enum','request_status_enum','allocation_status_enum','student_status_enum',
  'attendance_status_enum','waiting_list_status_enum'
);
