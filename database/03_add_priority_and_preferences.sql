-- 03_add_priority_and_preferences.sql

-- 1. Añadir columna 'priority' a 'request_items' si no existe
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_items' AND column_name = 'priority') THEN
        ALTER TABLE request_items ADD COLUMN priority INT;
    END IF;
END $$;

-- 2. Asegurar que existe la tabla 'request_teacher_preferences'
CREATE TABLE IF NOT EXISTS request_teacher_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    workshop_edition_id UUID REFERENCES workshop_editions(id),
    teacher_id UUID REFERENCES teachers(id),
    preference_order INT
);

-- 3. Añadir columna 'teacher_id' si la tabla ya existía pero le faltaba (por versiones previas)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'request_teacher_preferences' AND column_name = 'teacher_id') THEN
         ALTER TABLE request_teacher_preferences ADD COLUMN teacher_id UUID REFERENCES teachers(id);
    END IF;
END $$;
