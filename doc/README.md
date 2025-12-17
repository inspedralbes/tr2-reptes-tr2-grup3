# 📚 Documentació ENGINY - Plataforma de Gestió de Tallers

## 📋 Índex
- [Objectius](#-objectius)
- [Arquitectura](#-arquitectura)
- [Entorn de Desenvolupament](#-entorn-de-desenvolupament)
- [Desplegament a Producció](#-desplegament-a-producció)
- [Endpoints de l'API](#-endpoints-de-lapi)
- [Esquema de Base de Dades](#-esquema-de-base-de-dades)
- [Guia d'Usuari per Rols](#-guia-dusuari-per-rols)

---

## 🎯 Objectius

**ENGINY** és una plataforma web per a la gestió integral de tallers educatius (Modalitat C). Permet:

1. **Administradors**: Gestionar el catàleg de tallers, períodes d'inscripció, executar l'algoritme d'assignació i assignar professors referents.
2. **Centres Educatius**: Explorar l'oferta de tallers, enviar sol·licituds amb preferències, confirmar assignacions i pujar documentació.
3. **Professors Referents**: Passar llista d'assistència i avaluar competències dels alumnes.

### Funcionalitats Principals
- ✅ Autenticació JWT amb rols (ADMIN, CENTER_COORD, TEACHER)
- ✅ Gestió de períodes d'inscripció (OPEN → PROCESSING → PUBLISHED → CLOSED)
- ✅ Catàleg de tallers amb àmbits i edicions
- ✅ Wizard de sol·licituds en 4 passos
- ✅ Algoritme d'assignació automàtica amb 4 restriccions
- ✅ Control d'assistència i avaluació de competències
- ✅ Pujada de documents (autoritzacions PDF)
- ✅ Enquestes de satisfacció

---

## 🏗️ Arquitectura

### Tecnologies Utilitzades

| Capa | Tecnologia | Versió |
|------|------------|--------|
| **Frontend** | React + Vite | 19.x / 5.4 |
| **Estils** | Tailwind CSS | 4.1 |
| **Backend** | Express.js (Node.js) | 4.x / 20.x |
| **Base de Dades** | PostgreSQL | 15 |
| **Contenidors** | Docker + Docker Compose | 24.x |
| **Autenticació** | JWT (jsonwebtoken) | - |

### Diagrama d'Arquitectura

```
┌─────────────────────────────────────────────────────────────────┐
│                        DOCKER COMPOSE                           │
├─────────────┬─────────────┬─────────────┬─────────────────────┤
│             │             │             │                     │
│  Frontend   │   Backend   │  PostgreSQL │     Adminer         │
│  (React)    │  (Express)  │    (DB)     │   (DB Admin)        │
│  :5173      │   :3000     │   :5432     │     :8080           │
│             │             │             │                     │
└──────┬──────┴──────┬──────┴──────┬──────┴─────────────────────┘
       │             │             │
       │   REST API  │   pg pool   │
       └─────────────┴─────────────┘
```

### Estructura de Carpetes

```
tr2-reptes-tr2-grup3/
├── backend/
│   ├── src/
│   │   ├── modules/           # Mòduls funcionals
│   │   │   ├── auth/          # Autenticació
│   │   │   ├── catalog/       # Catàleg tallers
│   │   │   ├── enrollment/    # Períodes inscripció
│   │   │   ├── requests/      # Sol·licituds
│   │   │   ├── allocation/    # Assignació
│   │   │   ├── sessions/      # Sessions taller
│   │   │   ├── classroom/     # Aula (assistència)
│   │   │   ├── teachers/      # Professors referents
│   │   │   └── students/      # Alumnes i documents
│   │   ├── config/            # Configuració DB
│   │   └── common/            # Middleware compartit
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── admin/         # Zona Administrador
│   │   │   ├── center/        # Zona Centre
│   │   │   └── teacher/       # Zona Professor
│   │   ├── components/        # Components reutilitzables
│   │   ├── context/           # AuthContext
│   │   └── services/          # Crides API
│   └── Dockerfile
├── database/
│   ├── init.sql               # Esquema complet
│   └── insert.sql             # Dades de prova
└── docker-compose.yml
```

---

## 💻 Entorn de Desenvolupament

### Requisits Previs
- Docker i Docker Compose instal·lats
- Node.js 20+ (opcional, per desenvolupament local sense Docker)
- Git

### Passos per Iniciar

```bash
# 1. Clonar el repositori
git clone https://github.com/inspedralbes/tr2-reptes-tr2-grup3.git
cd tr2-reptes-tr2-grup3

# 2. Iniciar tots els serveis amb Docker
docker-compose up -d

# 3. Verificar que els serveis estiguin funcionant
docker-compose ps
```

### URLs de Desenvolupament

| Servei | URL | Descripció |
|--------|-----|------------|
| Frontend | http://localhost:5173 | Aplicació React |
| Backend API | http://localhost:3000 | API REST |
| Adminer | http://localhost:8080 | Administrador BD |

### Usuaris de Prova

| Email | Password | Rol |
|-------|----------|-----|
| admin@enginy.cat | admin123 | ADMIN |
| coord1@escola1.cat | admin123 | CENTER_COORD |
| coord2@escola2.cat | admin123 | CENTER_COORD |
| teacher@enginy.cat | admin123 | TEACHER |

### Variables d'Entorn

**Backend (.env)**
```env
DB_HOST=postgres
DB_PORT=5432
DB_NAME=enginy
DB_USER=enginy_user
DB_PASSWORD=enginy_pass
JWT_SECRET=your-secret-key
PORT=3000
```

**Frontend (.env)**
```env
VITE_API_URL=http://localhost:3000/api
```

---

## 🚀 Desplegament a Producció

### Amb Docker Compose

```bash
# 1. Configurar variables d'entorn de producció
cp .env.example .env.production
# Editar .env.production amb valors segurs

# 2. Construir i desplegar
docker-compose -f docker-compose.prod.yml up -d --build

# 3. Verificar logs
docker-compose logs -f
```

### Consideracions de Producció
- Configurar HTTPS amb certificat SSL
- Utilitzar secrets segurs per JWT_SECRET i DB_PASSWORD
- Configurar backups automàtics de PostgreSQL
- Habilitar rate limiting a l'API
- Configurar CORS correctament

---

## 📡 Endpoints de l'API

### Base URL
```
http://localhost:3000/api
```

### Autenticació
Tots els endpoints (excepte login) requereixen header:
```
Authorization: Bearer <token>
```

---

### 🔐 Auth Module

#### POST /api/auth/login
Iniciar sessió i obtenir token JWT.

**Request:**
```json
{
  "email": "admin@enginy.cat",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "uuid",
    "email": "admin@enginy.cat",
    "full_name": "Admin Enginy",
    "role": "ADMIN"
  }
}
```

**Response 401:**
```json
{
  "error": "Credencials incorrectes"
}
```

#### GET /api/auth/me
Obtenir perfil de l'usuari autenticat.

**Response 200:**
```json
{
  "id": "uuid",
  "email": "admin@enginy.cat",
  "full_name": "Admin Enginy",
  "role": "ADMIN"
}
```

---

### 📅 Enrollment Module

#### GET /api/enrollment/periods
Llistar tots els períodes d'inscripció.

**Query Params:** `?status=OPEN`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "name": "Enginy 2025-2026",
    "start_date_requests": "2024-09-30T13:00:00Z",
    "end_date_requests": "2024-10-10T23:59:59Z",
    "publication_date": "2024-10-20T10:00:00Z",
    "status": "OPEN"
  }
]
```

#### POST /api/enrollment/periods (ADMIN)
Crear nou període.

**Request:**
```json
{
  "name": "Enginy 2025-2026",
  "start_date_requests": "2024-09-30T13:00:00Z",
  "end_date_requests": "2024-10-10T23:59:59Z"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "name": "Enginy 2025-2026",
  "status": "OPEN",
  "created_at": "2024-09-01T10:00:00Z"
}
```

#### PUT /api/enrollment/periods/:id/publish (ADMIN)
Publicar període i generar sessions.

**Response 200:**
```json
{
  "message": "Període publicat correctament",
  "sessions_generated": 60
}
```

---

### 📚 Catalog Module

#### GET /api/catalog/workshops
Llistar tallers amb filtres.

**Query Params:** `?ambit=Tecnologic&is_new=true`

**Response 200:**
```json
[
  {
    "id": "uuid",
    "title": "Robòtica Educativa",
    "description": "Introducció a la robòtica...",
    "ambit": "Tecnologic",
    "is_new": true,
    "provider": {
      "id": "uuid",
      "name": "TechLab BCN"
    },
    "editions": [
      {
        "id": "uuid",
        "term": "2N_TRIMESTRE",
        "day_of_week": "TUESDAY",
        "start_time": "09:00",
        "end_time": "12:00",
        "capacity_total": 16,
        "max_per_school": 4
      }
    ]
  }
]
```

#### POST /api/catalog/workshops (ADMIN)
Crear nou taller.

**Request:**
```json
{
  "title": "Robòtica Educativa",
  "description": "Introducció a la robòtica amb Arduino",
  "ambit": "Tecnologic",
  "is_new": true,
  "provider_id": "uuid"
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "title": "Robòtica Educativa",
  "ambit": "Tecnologic",
  "is_new": true
}
```

---

### 📝 Requests Module

#### POST /api/requests (CENTER_COORD)
Crear sol·licitud completa amb items i preferències.

**Request:**
```json
{
  "enrollment_period_id": "uuid",
  "is_first_time_participation": true,
  "available_for_tuesdays": true,
  "teacher_comments": "Preferim horari de matí",
  "items": [
    {
      "workshop_edition_id": "uuid",
      "priority": 1,
      "requested_students": 4
    },
    {
      "workshop_edition_id": "uuid",
      "priority": 2,
      "requested_students": 2
    }
  ],
  "teacher_preferences": [
    {
      "workshop_edition_id": "uuid",
      "preference_order": 1
    }
  ]
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "status": "DRAFT",
  "school_id": "uuid",
  "items_count": 2,
  "created_at": "2024-10-01T10:00:00Z"
}
```

#### PUT /api/requests/:id/submit (CENTER_COORD)
Enviar sol·licitud definitiva.

**Response 200:**
```json
{
  "id": "uuid",
  "status": "SUBMITTED",
  "submitted_at": "2024-10-05T15:30:00Z"
}
```

---

### 🎯 Allocation Module

#### GET /api/allocation/demand-summary (ADMIN)
Veure resum de demanda abans d'assignar.

**Response 200:**
```json
[
  {
    "workshop_id": "uuid",
    "workshop_title": "Robòtica Educativa",
    "edition_id": "uuid",
    "day_of_week": "TUESDAY",
    "total_requested": 45,
    "capacity": 16,
    "centers_interested": 12,
    "oversubscribed": true
  }
]
```

#### POST /api/allocation/run (ADMIN)
Executar algoritme d'assignació.

**Request:**
```json
{
  "enrollment_period_id": "uuid"
}
```

**Response 200:**
```json
{
  "message": "Assignació completada",
  "stats": {
    "total_allocations": 45,
    "total_students_assigned": 120,
    "editions_processed": 15
  }
}
```

#### PUT /api/allocation/:id/confirm (CENTER_COORD)
Confirmar assignació i afegir noms d'alumnes.

**Request:**
```json
{
  "students": [
    {
      "full_name": "Joan García",
      "idalu": "12345",
      "tutor_email": "tutor@email.com",
      "tutor_phone": "612345678"
    }
  ]
}
```

**Response 200:**
```json
{
  "id": "uuid",
  "status": "ACCEPTED",
  "students_confirmed": 4
}
```

---

### 👨‍🏫 Teachers Module

#### GET /api/teachers/my-workshops (TEACHER)
Obtenir tallers assignats al professor.

**Response 200:**
```json
[
  {
    "edition_id": "uuid",
    "workshop_title": "Robòtica Educativa",
    "day_of_week": "TUESDAY",
    "start_time": "09:00",
    "end_time": "12:00",
    "is_main_referent": true,
    "total_students": 16,
    "next_session": {
      "id": "uuid",
      "date": "2024-11-05",
      "session_number": 3
    }
  }
]
```

#### POST /api/teachers/assign (ADMIN)
Assignar professor a un taller.

**Request:**
```json
{
  "workshop_edition_id": "uuid",
  "teacher_user_id": "uuid",
  "is_main_referent": true
}
```

**Response 201:**
```json
{
  "id": "uuid",
  "workshop_edition_id": "uuid",
  "teacher_user_id": "uuid",
  "is_main_referent": true
}
```

---

### 📋 Classroom Module

#### GET /api/classroom/students/:editionId
Obtenir alumnes d'una edició de taller.

**Response 200:**
```json
[
  {
    "id": "uuid",
    "full_name": "Joan García",
    "school_name": "INS Poeta Maragall",
    "tutor_email": "tutor@email.com"
  }
]
```

#### POST /api/classroom/attendance/:sessionId
Guardar assistència d'una sessió.

**Request:**
```json
{
  "attendance": [
    {
      "student_id": "uuid",
      "status": "PRESENT",
      "observation": ""
    },
    {
      "student_id": "uuid",
      "status": "ABSENT",
      "observation": "No ha vingut sense justificar"
    }
  ]
}
```

**Response 200:**
```json
{
  "message": "Assistència guardada",
  "records_saved": 16
}
```

#### POST /api/classroom/evaluations/:editionId
Guardar avaluacions de competències.

**Request:**
```json
{
  "evaluations": {
    "student-uuid-1": {
      "tech_knowledge": 4,
      "tech_skills": 5,
      "tech_problem_solving": 4,
      "teamwork": 5,
      "communication": 4,
      "responsibility": 5,
      "creativity": 4,
      "comments": "Excel·lent progrés"
    }
  }
}
```

**Response 200:**
```json
{
  "message": "Avaluacions guardades",
  "students_evaluated": 16
}
```

---

### 📄 Students Module

#### POST /api/students/:id/documents
Pujar document PDF (autorització).

**Request:** `multipart/form-data`
- `file`: Fitxer PDF
- `document_type`: `AUTORITZACIO_IMATGE` | `AUTORITZACIO_SORTIDA` | `ALTRES`

**Response 201:**
```json
{
  "id": "uuid",
  "student_id": "uuid",
  "document_type": "AUTORITZACIO_IMATGE",
  "file_url": "/uploads/documents/uuid-autoritzacio.pdf",
  "uploaded_at": "2024-10-15T10:00:00Z"
}
```

#### PUT /api/students/documents/:id/verify (ADMIN)
Verificar document pujat.

**Response 200:**
```json
{
  "id": "uuid",
  "is_verified": true
}
```

---

## 🗄️ Esquema de Base de Dades

### Diagrama ER Simplificat

```
enrollment_periods ─┬─< workshop_editions >─┬─ workshops ─── providers
                    │                       │
                    │                       ├─< workshop_sessions
                    │                       │
                    │                       ├─< workshop_assigned_teachers >── users
                    │                       │
requests ──────────┬┴─< request_items      ├─< allocations >─┬─ schools
                   │                        │                 │
                   └─< request_teacher_prefs                  └─< allocation_students >── students
                                                                                          │
                                                              attendance_logs <───────────┤
                                                              student_grades <────────────┤
                                                              student_documents <─────────┘

surveys ─< survey_questions ─< survey_responses
```

### Taules Principals

| Taula | Descripció |
|-------|------------|
| `users` | Usuaris del sistema (ADMIN, CENTER_COORD, TEACHER) |
| `schools` | Centres educatius participants |
| `students` | Alumnes amb dades tutor (email, telèfon) |
| `workshops` | Catàleg de tallers amb àmbit i proveïdor |
| `workshop_editions` | Edicions (trimestre, dia, horari, capacitat) |
| `requests` | Sol·licituds dels centres |
| `request_items` | Ítems de sol·licitud (taller + places) |
| `allocations` | Assignacions resultants de l'algoritme |
| `workshop_sessions` | 10 sessions per edició |
| `attendance_logs` | Registres d'assistència |
| `student_grades` | Avaluacions de competències (1-5) |
| `student_documents` | Documents pujats (PDFs) |
| `surveys` | Enquestes de satisfacció |

---

## 👥 Guia d'Usuari per Rols

### 🔴 Administrador (ADMIN)

**Accés:** `/admin/*`

1. **Dashboard** - Estadístiques generals
2. **Períodes** - Crear/editar convocatòries
3. **Catàleg** - Gestionar tallers i edicions
4. **Monitor Sol·licituds** - Veure totes les sol·licituds
5. **Assignació** - Executar algoritme i veure resultats
6. **Detall Taller** - Assignar professors referents

### 🟢 Coordinador de Centre (CENTER_COORD)

**Accés:** `/center/*`

1. **Dashboard** - Alertes i accions ràpides
2. **Catàleg** - Explorar tallers disponibles
3. **Nova Sol·licitud** - Wizard de 4 passos
4. **Les Meves Sol·licituds** - Veure/editar sol·licituds
5. **Assignacions** - Confirmar i afegir alumnes
6. **Documents** - Pujar autoritzacions PDF

### 🔵 Professor Referent (TEACHER)

**Accés:** `/teacher/*`

1. **Els Meus Tallers** - Llista de sessions
2. **Passar Llista** - Marcar Present/Absent
3. **Avaluar** - Puntuar competències (1-5)

---

## 📞 Suport

Per qualsevol dubte o incidència:
- 📧 Email: suport@enginy.cat
- 📚 Repositori: https://github.com/inspedralbes/tr2-reptes-tr2-grup3
