-- Migración: Añadir campo photo_url a la tabla students
-- Para almacenar la foto de perfil del alumno

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS photo_url VARCHAR(500);

-- Verificar que se ha creado
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'students' AND column_name = 'photo_url';
