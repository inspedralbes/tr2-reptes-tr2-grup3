-- Migración: Añadir tabla teacher_student_notes
-- Permite a los profesores guardar notas personales sobre sus alumnos
-- Ejecutar: docker exec -i enginy_postgres psql -U admin -d enginy_db < database/migrations/add_teacher_student_notes.sql

CREATE TABLE IF NOT EXISTS teacher_student_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES teachers(id),
  student_id UUID NOT NULL REFERENCES students(id),
  workshop_edition_id UUID NOT NULL REFERENCES workshop_editions(id),
  note TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(teacher_id, student_id, workshop_edition_id)
);

-- Verificar
SELECT table_name FROM information_schema.tables WHERE table_name = 'teacher_student_notes';
