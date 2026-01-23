-- Migración: Añadir campos de tutor a la tabla students
-- Ejecutar: docker exec -i enginy_postgres psql -U admin -d enginy_db < database/migrations/add_tutor_fields.sql

ALTER TABLE students 
ADD COLUMN IF NOT EXISTS tutor_nombre VARCHAR(255),
ADD COLUMN IF NOT EXISTS tutor_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS tutor_telefono VARCHAR(50);

-- Verificar
SELECT column_name, data_type FROM information_schema.columns 
WHERE table_name = 'students' AND column_name LIKE 'tutor%';
