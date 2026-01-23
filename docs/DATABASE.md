# 🗄️ Base de Dades

## Visió General

Enginy utilitza **PostgreSQL 15** com a sistema de gestió de base de dades relacional. L'esquema està dissenyat per suportar el flux complet de sol·licituds, assignacions i seguiment de tallers educatius.

## Diagrama Entitat-Relació

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              DIAGRAMA ENTITAT-RELACIÓ                                   │
└─────────────────────────────────────────────────────────────────────────────────────────┘

                                    ┌─────────────────┐
                                    │     users       │
                                    │─────────────────│
                                    │ id (PK)         │
                                    │ email           │
                                    │ password_hash   │
                                    │ role            │
                                    │ school_id (FK)  │──────────┐
                                    └────────┬────────┘          │
                                             │                   │
                              ┌──────────────┘                   │
                              │                                  │
                              ▼                                  ▼
┌─────────────────┐    ┌─────────────────┐              ┌─────────────────┐
│   providers     │    │    schools      │              │    teachers     │
│─────────────────│    │─────────────────│              │─────────────────│
│ id (PK)         │    │ id (PK)         │◄─────────────│ school_id (FK)  │
│ name            │    │ name            │              │ id (PK)         │
│ contact_email   │    │ address         │              │ name            │
│ phone           │    │ district        │              │ email           │
│ address         │    │ phone           │              │ phone           │
└────────┬────────┘    └────────┬────────┘              └────────┬────────┘
         │                      │                                │
         │                      │                                │
         ▼                      │                                │
┌─────────────────┐             │                                │
│   workshops     │             │                                │
│─────────────────│             │                                │
│ id (PK)         │             │                                │
│ provider_id(FK) │             │                                │
│ title           │             │                                │
│ description     │             │                                │
│ target_audience │             │                                │
└────────┬────────┘             │                                │
         │                      │                                │
         ▼                      │                                │
┌─────────────────┐             │                                │
│workshop_editions│             │                                │
│─────────────────│             │                                │
│ id (PK)         │             │                                │
│ workshop_id(FK) │             │                                │
│ period_id (FK)  │──┐          │                                │
│ day_of_week     │  │          │                                │
│ start_time      │  │          │                                │
│ max_capacity    │  │          │                                │
└────────┬────────┘  │          │                                │
         │           │          │                                │
         │           │          ▼                                │
         │           │  ┌─────────────────┐                      │
         │           │  │enrollment_period│                      │
         │           └─►│─────────────────│                      │
         │              │ id (PK)         │                      │
         │              │ name            │                      │
         │              │ current_phase   │                      │
         │              │ status          │                      │
         │              └────────┬────────┘                      │
         │                       │                               │
         ▼                       ▼                               │
┌─────────────────┐    ┌─────────────────┐                       │
│   allocations   │    │    requests     │                       │
│─────────────────│    │─────────────────│                       │
│ id (PK)         │◄───│ id (PK)         │                       │
│ request_id (FK) │    │ school_id (FK)  │───────────────────────┘
│ edition_id (FK) │    │ edition_id (FK) │                       │
│ assigned_seats  │    │ teacher_id (FK) │───────────────────────┤
│ status          │    │ students_count  │                       │
└────────┬────────┘    │ preference      │                       │
         │             │ status          │                       │
         │             └─────────────────┘                       │
         │                                                       │
         ▼                                                       │
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│allocation_stud. │    │    students     │    │student_documents│
│─────────────────│    │─────────────────│    │─────────────────│
│ allocation_id   │───►│ id (PK)         │───►│ student_id (FK) │
│ student_id (FK) │    │ school_id (FK)  │    │ document_type   │
└─────────────────┘    │ name            │    │ file_path       │
                       │ birth_date      │    └─────────────────┘
                       │ grade           │
                       └─────────────────┘

┌─────────────────┐    ┌─────────────────┐
│workshop_sessions│    │ attendance_logs │
│─────────────────│    │─────────────────│
│ id (PK)         │───►│ session_id (FK) │
│ edition_id (FK) │    │ student_id (FK) │
│ teacher_id (FK) │    │ status          │
│ session_date    │    │ notes           │
│ status          │    └─────────────────┘
└─────────────────┘
```

---

## Taules Principals

### 🔐 Autenticació i Usuaris

#### `users`
Usuaris del sistema amb accés web (admin i coordinadors).

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `email` | VARCHAR(255) UNIQUE | Email d'accés |
| `password_hash` | VARCHAR(255) | Contrasenya hashejada (bcrypt) |
| `role` | user_role_enum | ADMIN, CENTER_COORD |
| `school_id` | INT FK | Centre associat (NULL per admin) |
| `first_name` | VARCHAR(100) | Nom |
| `last_name` | VARCHAR(100) | Cognoms |
| `created_at` | TIMESTAMP | Data de creació |

```sql
CREATE TYPE user_role_enum AS ENUM ('ADMIN', 'CENTER_COORD');

CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role user_role_enum NOT NULL DEFAULT 'CENTER_COORD',
    school_id INT REFERENCES schools(id),
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### `teachers`
Professors acompanyants dels centres. **No tenen compte d'usuari** - accedeixen per magic link.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `school_id` | INT FK | Centre al que pertany |
| `name` | VARCHAR(255) | Nom complet |
| `email` | VARCHAR(255) | Email (per notificacions) |
| `phone` | VARCHAR(50) | Telèfon |
| `created_at` | TIMESTAMP | Data de creació |

---

### 🏫 Centres i Alumnes

#### `schools`
Centres educatius participants.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `name` | VARCHAR(255) | Nom del centre |
| `code` | VARCHAR(50) | Codi oficial |
| `address` | TEXT | Adreça |
| `district` | VARCHAR(100) | Districte |
| `phone` | VARCHAR(50) | Telèfon |
| `email` | VARCHAR(255) | Email del centre |

#### `students`
Alumnes dels centres.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `school_id` | INT FK | Centre al que pertany |
| `name` | VARCHAR(255) | Nom complet |
| `birth_date` | DATE | Data de naixement |
| `grade` | VARCHAR(50) | Curs (1r ESO, 2n ESO...) |
| `group_name` | VARCHAR(10) | Grup (A, B, C...) |

---

### 📚 Tallers i Proveïdors

#### `providers`
Entitats que ofereixen tallers.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `name` | VARCHAR(255) | Nom del proveïdor |
| `description` | TEXT | Descripció |
| `contact_email` | VARCHAR(255) | Email de contacte |
| `phone` | VARCHAR(50) | Telèfon |
| `address` | TEXT | Adreça |

#### `workshops`
Tallers disponibles (definició general).

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `provider_id` | INT FK | Proveïdor que l'ofereix |
| `title` | VARCHAR(255) | Títol del taller |
| `description` | TEXT | Descripció detallada |
| `target_audience` | VARCHAR(100) | Públic objectiu |
| `duration_minutes` | INT | Durada en minuts |

#### `workshop_editions`
Edicions concretes d'un taller per període.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `workshop_id` | INT FK | Taller base |
| `period_id` | INT FK | Període d'inscripció |
| `day_of_week` | day_enum | TUESDAY, THURSDAY |
| `start_time` | TIME | Hora d'inici |
| `end_time` | TIME | Hora de fi |
| `max_capacity` | INT | Places màximes |
| `location` | TEXT | Ubicació |

```sql
CREATE TYPE day_enum AS ENUM ('TUESDAY', 'THURSDAY');
```

---

### 📋 Sol·licituds i Assignacions

#### `enrollment_periods`
Períodes d'inscripció amb les seves fases.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `name` | VARCHAR(255) | Nom del període |
| `start_date` | DATE | Data d'inici |
| `end_date` | DATE | Data de fi |
| `current_phase` | phase_enum | Fase actual |
| `status` | period_status | ACTIVE, CLOSED |

```sql
CREATE TYPE period_phase_enum AS ENUM (
    'SOLICITUDES',   -- Centres sol·liciten
    'ASIGNACION',    -- Admin assigna
    'PUBLICACION',   -- Resultats publicats
    'EJECUCION'      -- Tallers en marxa
);

CREATE TYPE period_status_enum AS ENUM ('ACTIVE', 'CLOSED');
```

#### `requests`
Sol·licituds de places dels centres.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `school_id` | INT FK | Centre sol·licitant |
| `edition_id` | INT FK | Edició sol·licitada |
| `teacher_id` | INT FK | Professor acompanyant |
| `students_count` | INT | Nombre d'alumnes |
| `preference` | preference_enum | Ordre de preferència |
| `status` | request_status | Estat de la sol·licitud |
| `created_at` | TIMESTAMP | Data de creació |
| `submitted_at` | TIMESTAMP | Data d'enviament |

```sql
CREATE TYPE preference_enum AS ENUM (
    'FIRST_CHOICE',
    'SECOND_CHOICE', 
    'THIRD_CHOICE'
);

CREATE TYPE request_status_enum AS ENUM (
    'DRAFT',              -- Esborrany
    'SUBMITTED',          -- Enviada
    'PARTIALLY_ASSIGNED', -- Parcialment assignada
    'ASSIGNED',           -- Totalment assignada
    'REJECTED'            -- Rebutjada
);
```

#### `allocations`
Assignacions resultants de l'algoritme.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `request_id` | INT FK | Sol·licitud origen |
| `edition_id` | INT FK | Edició assignada |
| `assigned_seats` | INT | Places assignades |
| `status` | allocation_status | PENDING, ACCEPTED |
| `created_at` | TIMESTAMP | Data de creació |

```sql
CREATE TYPE allocation_status_enum AS ENUM (
    'PENDING',   -- Pendent de confirmació
    'ACCEPTED',  -- Confirmada pel centre
    'REJECTED'   -- Rebutjada pel centre
);
```

#### `allocation_students`
Relació entre assignacions i alumnes confirmats.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `allocation_id` | INT FK | Assignació |
| `student_id` | INT FK | Alumne assignat |
| `created_at` | TIMESTAMP | Data d'assignació |

```sql
CREATE TABLE allocation_students (
    allocation_id INT REFERENCES allocations(id),
    student_id INT REFERENCES students(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (allocation_id, student_id)
);
```

---

### 📅 Sessions i Assistència

#### `workshop_sessions`
Sessions individuals de taller.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `edition_id` | INT FK | Edició del taller |
| `teacher_id` | INT FK | Professor assignat |
| `session_date` | DATE | Data de la sessió |
| `status` | session_status | SCHEDULED, COMPLETED |

#### `attendance_logs`
Registre d'assistència.

| Columna | Tipus | Descripció |
|---------|-------|------------|
| `id` | SERIAL PK | Identificador únic |
| `session_id` | INT FK | Sessió |
| `student_id` | INT FK | Alumne |
| `status` | attendance_status | PRESENT, ABSENT, LATE |
| `notes` | TEXT | Observacions |
| `recorded_at` | TIMESTAMP | Data de registre |
| `recorded_by` | INT FK | Professor que registra |

```sql
CREATE TYPE attendance_status_enum AS ENUM (
    'PRESENT',
    'ABSENT',
    'LATE',
    'EXCUSED'
);
```

---

## Índexs

```sql
-- Usuaris
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_school ON users(school_id);

-- Sol·licituds
CREATE INDEX idx_requests_school ON requests(school_id);
CREATE INDEX idx_requests_edition ON requests(edition_id);
CREATE INDEX idx_requests_status ON requests(status);

-- Assignacions
CREATE INDEX idx_allocations_request ON allocations(request_id);
CREATE INDEX idx_allocations_edition ON allocations(edition_id);

-- Assistència
CREATE INDEX idx_attendance_session ON attendance_logs(session_id);
CREATE INDEX idx_attendance_student ON attendance_logs(student_id);
```

---

## Restriccions i Triggers

### Restriccions de Negoci

```sql
-- Un centre no pot sol·licitar més del 30% de places d'una edició
-- (implementat en lògica de negoci, no en BD)

-- Un alumne no pot estar en dues sessions el mateix dia/hora
-- (implementat via validació en el controller)

-- El nombre d'alumnes confirmats no pot superar assigned_seats
ALTER TABLE allocations ADD CONSTRAINT check_seats 
    CHECK (confirmed_students <= assigned_seats);
```

### Triggers

```sql
-- Actualitzar comptador d'alumnes confirmats
CREATE OR REPLACE FUNCTION update_confirmed_count()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE allocations 
    SET confirmed_students = (
        SELECT COUNT(*) FROM allocation_students 
        WHERE allocation_id = NEW.allocation_id
    )
    WHERE id = NEW.allocation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER tr_update_confirmed
AFTER INSERT OR DELETE ON allocation_students
FOR EACH ROW EXECUTE FUNCTION update_confirmed_count();
```

---

## Dades de Prova

Les dades de prova es troben a `/database/seed/insert.sql`. Inclou:

- 7 usuaris (1 admin, 6 coordinadors)
- 6 centres educatius
- 14 professors
- 60 alumnes
- 6 proveïdors
- 6 tallers amb 10 edicions
- 1 període actiu en fase SOLICITUDES
- 6 sol·licituds d'exemple

**Credencials de prova:** Tots els usuaris tenen contrasenya `admin123`

---

## Backup i Restauració

```bash
# Backup
docker exec -t enginy_db pg_dump -U postgres enginy > backup.sql

# Restauració
docker exec -i enginy_db psql -U postgres enginy < backup.sql
```

---

## Següents Passos

- [📐 Arquitectura](./ARCHITECTURE.md) - Visió general del sistema
- [🔌 API Reference](./api/README.md) - Endpoints que accedeixen a la BD
- [🧪 Testing](./guides/TESTING.md) - Proves amb dades de seed
