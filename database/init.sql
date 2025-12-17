-- Habilitar extensión UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- ENUMS (Tipos de datos fijos)
-- ==========================================
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'CENTER_COORD', 'TEACHER');
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
);

CREATE TABLE schools (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL, -- Codi Centre
    name VARCHAR(255) NOT NULL,
    coordinator_user_id UUID REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    idalu VARCHAR(50), -- Nullable al principio, se llena al confirmar
    full_name VARCHAR(255) NOT NULL,
    school_id UUID REFERENCES schools(id) ON DELETE CASCADE,
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
    [cite_start]capacity_total INT DEFAULT 16, -- [cite: 216]
    [cite_start]max_per_school INT DEFAULT 4   -- [cite: 217]
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
    [cite_start]requested_students INT NOT NULL CHECK (requested_students <= 4) -- [cite: 217]
);

-- Nueva tabla para "Voldríem ser referents del projecte"
CREATE TABLE request_teacher_preferences (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    request_id UUID REFERENCES requests(id) ON DELETE CASCADE,
    workshop_edition_id UUID REFERENCES workshop_editions(id), -- Taller que el profe quiere vigilar
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