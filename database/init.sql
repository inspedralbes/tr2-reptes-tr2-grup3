-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS (Tipos de datos fijos)
-- ==========================================
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'CENTER_COORD');
CREATE TYPE period_status_enum AS ENUM ('OPEN', 'PROCESSING', 'PUBLISHED', 'CLOSED');
CREATE TYPE workshop_term_enum AS ENUM ('2N_TRIMESTRE', '3R_TRIMESTRE');
CREATE TYPE day_of_week_enum AS ENUM ('TUESDAY', 'THURSDAY');
CREATE TYPE request_status_enum AS ENUM ('DRAFT', 'SUBMITTED');
CREATE TYPE allocation_status_enum AS ENUM ('PROVISIONAL', 'PUBLISHED', 'ACCEPTED', 'REJECTED');
CREATE TYPE student_status_enum AS ENUM ('ACTIVE', 'DROPPED_OUT');
CREATE TYPE attendance_status_enum AS ENUM ('PRESENT', 'ABSENT', 'LATE', 'EXCUSED');
CREATE TYPE waiting_list_status_enum AS ENUM ('PENDING', 'NOTIFIED', 'EXPIRED');

-- ==========================================
-- ZONA 0: CONFIGURACIÓN
-- ==========================================
CREATE TABLE enrollment_periods (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    start_date_requests TIMESTAMP WITH TIME ZONE NOT NULL,
    end_date_requests TIMESTAMP WITH TIME ZONE NOT NULL,
    publication_date TIMESTAMP WITH TIME ZONE,
    status period_status_enum DEFAULT 'OPEN',
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ZONA 1: USUARIOS Y CENTROS
-- ==========================================
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL,
    password_hash VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
    -- school_id Eliminado de users, ya no es necesario aquí para usuarios logueables
);

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Codi Centre
    name VARCHAR(255) NOT NULL,
    coordinator_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    -- US #New: Detalles completos del centro
    address TEXT,
    postal_code VARCHAR(10),
    municipality VARCHAR(100),
    email VARCHAR(255),
    phone VARCHAR(50),
    ownership_type VARCHAR(100)
);

-- Nueva tabla para Profesores (Sin login)
CREATE TABLE teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    full_name VARCHAR(255) NOT NULL,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idalu VARCHAR(50), -- Nullable al principio, se llena al confirmar
    full_name VARCHAR(255) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
    dni_front_url VARCHAR(500), -- Foto DNI Frontal
    dni_back_url VARCHAR(500),  -- Foto DNI Trasero
    created_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ZONA 2: CATÁLOGO (OFERTA)
-- ==========================================
CREATE TABLE providers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL, -- Ej: Biciclot
    address TEXT,
    contact_email VARCHAR(255)
);

CREATE TABLE workshops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    ambit VARCHAR(100), -- Ej: "Indústria 4.0", "Artístic"
    is_new BOOLEAN DEFAULT FALSE, -- Para marcar los "NOU!!!" del PDF
    provider_id UUID REFERENCES providers(id)
);

CREATE TABLE workshop_editions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_id UUID REFERENCES workshops(id),
    enrollment_period_id UUID REFERENCES enrollment_periods(id),
    term workshop_term_enum NOT NULL,
    day_of_week day_of_week_enum NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    capacity_total INT DEFAULT 16,
    max_per_school INT DEFAULT 4
);

-- ==========================================
-- ZONA 3: SOLICITUDES (DEMANDA)
-- ==========================================
CREATE TABLE requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    enrollment_period_id UUID REFERENCES enrollment_periods(id),
    school_id UUID REFERENCES schools(id),
    
    -- Campos nuevos detectados en el Google Form
    is_first_time_participation BOOLEAN DEFAULT FALSE, -- ¿Es 1a vez?
    available_for_tuesdays BOOLEAN DEFAULT FALSE,      -- ¿Disponible Martes?
    teacher_comments TEXT,                             -- Comentarios libres
    
    submitted_at TIMESTAMP,
    status request_status_enum DEFAULT 'DRAFT'
);

CREATE TABLE request_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    workshop_edition_id UUID REFERENCES workshop_editions(id),
    priority INT NOT NULL, 
    requested_students INT NOT NULL CHECK (requested_students <= 4)
);

CREATE TABLE request_item_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_item_id UUID REFERENCES request_items(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id)
);

-- Nueva tabla para "Voldríem ser referents del projecte"
CREATE TABLE request_teacher_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    workshop_edition_id UUID REFERENCES workshop_editions(id), -- Taller que el profe quiere vigilar
    teacher_id UUID REFERENCES teachers(id), -- Profesores de la tabla teachers
    preference_order INT -- 1, 2, 3
);

-- ==========================================
-- ZONA 4: ASIGNACIÓN Y ASISTENCIA
-- ==========================================
CREATE TABLE allocations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_edition_id UUID REFERENCES workshop_editions(id),
    school_id UUID REFERENCES schools(id),
    assigned_seats INT NOT NULL,
    status allocation_status_enum DEFAULT 'PROVISIONAL'
);

CREATE TABLE allocation_students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    allocation_id UUID REFERENCES allocations(id) ON DELETE CASCADE,
    student_id UUID REFERENCES students(id), -- Se vincula al confirmar nombre
    status student_status_enum DEFAULT 'ACTIVE'
);

CREATE TABLE workshop_sessions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_edition_id UUID REFERENCES workshop_editions(id),
    session_number INT NOT NULL,
    date DATE NOT NULL,
    is_cancelled BOOLEAN DEFAULT FALSE
);

CREATE TABLE attendance_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    session_id UUID REFERENCES workshop_sessions(id),
    student_id UUID REFERENCES students(id),
    status attendance_status_enum DEFAULT 'PRESENT',
    observation TEXT,
    recorded_at TIMESTAMP DEFAULT NOW()
);

-- ==========================================
-- ZONA 5: GESTIÓ DOCUMENTAL (CHECKLIST)
-- ==========================================
-- Taula per guardar els fitxers pujats (Autoritzacions, DNI, etc.)
CREATE TYPE doc_type_enum AS ENUM ('AUTORITZACIO_IMATGE', 'AUTORITZACIO_SORTIDA', 'ALTRES', 'DNI_FRONT', 'DNI_BACK');

CREATE TABLE student_documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    document_type doc_type_enum NOT NULL,
    file_url VARCHAR(500) NOT NULL, -- URL o Path on s'ha guardat el PDF
    uploaded_at TIMESTAMP DEFAULT NOW(),
    is_verified BOOLEAN DEFAULT FALSE -- L'admin pot verificar si el document és correcte
);

-- ==========================================
-- ZONA 6: REFERENTS ASSIGNATS (PROFES)
-- ==========================================
-- Aquesta taula guarda QUI són els 2 profes que realment vigilaran el taller
-- (Creua User-Professor amb WorkshopEdition)
CREATE TABLE workshop_assigned_teachers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    workshop_edition_id UUID REFERENCES workshop_editions(id) ON DELETE CASCADE,
    teacher_id UUID REFERENCES teachers(id), -- El professor assignat (de taula teachers)
    is_main_referent BOOLEAN DEFAULT TRUE, -- Si és el principal o suport
    assigned_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: Un profe no pot estar 2 cops al mateix taller
    UNIQUE(workshop_edition_id, teacher_id) 
);

-- ==========================================
-- ZONA 7: AVALUACIÓ DE COMPETÈNCIES (US #19)
-- ==========================================
-- Taula per guardar les puntuacions de competències dels alumnes
CREATE TABLE student_grades (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE,
    workshop_edition_id UUID REFERENCES workshop_editions(id) ON DELETE CASCADE,
    
    -- Competències Tècniques (puntuació 1-5)
    tech_knowledge INT CHECK (tech_knowledge >= 1 AND tech_knowledge <= 5),
    tech_skills INT CHECK (tech_skills >= 1 AND tech_skills <= 5),
    tech_problem_solving INT CHECK (tech_problem_solving >= 1 AND tech_problem_solving <= 5),
    
    -- Competències Transversals (puntuació 1-5)
    teamwork INT CHECK (teamwork >= 1 AND teamwork <= 5),
    communication INT CHECK (communication >= 1 AND communication <= 5),
    responsibility INT CHECK (responsibility >= 1 AND responsibility <= 5),
    creativity INT CHECK (creativity >= 1 AND creativity <= 5),
    
    -- Comentaris del professor
    comments TEXT,
    
    -- Metadades
    evaluated_by UUID REFERENCES users(id), -- Professor que ha avaluat
    evaluated_at TIMESTAMP DEFAULT NOW(),
    
    -- Constraint: Un alumne només pot tenir una avaluació per edició de taller
    UNIQUE(student_id, workshop_edition_id)
);

-- ==========================================
-- ZONA 8: ENQUESTES DE SATISFACCIÓ (US #20)
-- ==========================================
-- Definició d'enquestes
CREATE TYPE survey_type_enum AS ENUM ('STUDENT', 'TEACHER', 'CENTER');
CREATE TYPE survey_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'CLOSED');
CREATE TYPE question_type_enum AS ENUM ('RATING', 'TEXT', 'MULTIPLE_CHOICE', 'YES_NO');

CREATE TABLE surveys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    survey_type survey_type_enum NOT NULL,     -- A qui va dirigida
    enrollment_period_id UUID REFERENCES enrollment_periods(id),
    status survey_status_enum DEFAULT 'DRAFT',
    send_date DATE,                            -- Quan s'ha d'enviar automàticament
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE survey_questions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type question_type_enum NOT NULL,
    options JSONB,                             -- Per múltiple choice: ["Opció 1", "Opció 2"]
    is_required BOOLEAN DEFAULT TRUE,
    order_index INT NOT NULL,                  -- Ordre de les preguntes
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE survey_responses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    survey_id UUID REFERENCES surveys(id) ON DELETE CASCADE,
    question_id UUID REFERENCES survey_questions(id) ON DELETE CASCADE,
    respondent_user_id UUID REFERENCES users(id), -- Qui respon (pot ser NULL si és anònim)
    respondent_student_id UUID REFERENCES students(id), -- Si és un alumne
    workshop_edition_id UUID REFERENCES workshop_editions(id), -- Sobre quin taller opina
    
    -- Resposta (només un d'aquests camps tindrà valor segons el tipus)
    rating_value INT CHECK (rating_value >= 1 AND rating_value <= 5),
    text_value TEXT,
    choice_value VARCHAR(255),
    boolean_value BOOLEAN,
    
    submitted_at TIMESTAMP DEFAULT NOW(),
    
    -- Evitar respostes duplicades
    UNIQUE(survey_id, question_id, respondent_user_id, respondent_student_id, workshop_edition_id)
);

-- ==========================================
-- ÍNDEXS PER MILLORAR RENDIMENT
-- ==========================================
CREATE INDEX idx_students_school ON students(school_id);

CREATE INDEX idx_allocations_edition ON allocations(workshop_edition_id);
CREATE INDEX idx_allocations_school ON allocations(school_id);
CREATE INDEX idx_attendance_session ON attendance_logs(session_id);
CREATE INDEX idx_attendance_student ON attendance_logs(student_id);
CREATE INDEX idx_workshop_sessions_edition ON workshop_sessions(workshop_edition_id);
CREATE INDEX idx_student_grades_student ON student_grades(student_id);
CREATE INDEX idx_student_grades_edition ON student_grades(workshop_edition_id);
CREATE INDEX idx_survey_responses_survey ON survey_responses(survey_id);
CREATE INDEX idx_requests_period ON requests(enrollment_period_id);
CREATE INDEX idx_requests_school ON requests(school_id);