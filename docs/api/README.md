# 🔌 API Reference

## Visió General

L'API d'Enginy és una API REST construïda amb Express.js. Totes les rutes retornen JSON i requereixen autenticació JWT excepte les rutes públiques.

## Base URL

```
Desenvolupament: http://localhost:3000/api
Producció:       https://api.enginy.cat/api
```

## Autenticació

La majoria d'endpoints requereixen un token JWT al header:

```
Authorization: Bearer <token>
```

El token s'obté mitjançant `/api/auth/login`.

---

## Índex d'Endpoints

| Mòdul | Prefix | Descripció |
|-------|--------|------------|
| [Auth](#auth) | `/api/auth` | Autenticació |
| [Catalog](#catalog) | `/api/catalog` | Catàleg de tallers |
| [Requests](#requests) | `/api/requests` | Sol·licituds |
| [Allocation](#allocation) | `/api/allocation` | Assignacions |
| [Students](#students) | `/api/students` | Alumnes |
| [Teachers](#teachers) | `/api/teachers` | Professors |
| [Sessions](#sessions) | `/api/sessions` | Sessions i assistència |
| [Enrollment](#enrollment) | `/api/enrollment` | Períodes |
| [Providers](#providers) | `/api/providers` | Proveïdors |
| [Centers](#centers) | `/api/centers` | Centres |

---

## Auth

### POST `/api/auth/login`

Autenticar usuari i obtenir token JWT.

**Body:**
```json
{
  "email": "admin@enginy.cat",
  "password": "admin123"
}
```

**Response 200:**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": 1,
    "email": "admin@enginy.cat",
    "role": "ADMIN",
    "first_name": "Admin",
    "last_name": "Enginy",
    "school_id": null
  }
}
```

**Errors:**
- `401` - Credencials incorrectes

---

### POST `/api/auth/teacher-login`

Login per professors via magic link (sense contrasenya).

**Body:**
```json
{
  "email": "maria.garcia@mail.com"
}
```

**Response 200:**
```json
{
  "message": "Magic link enviat al correu",
  "success": true
}
```

---

### GET `/api/auth/me`

Obtenir dades de l'usuari autenticat.

**Headers:** `Authorization: Bearer <token>`

**Response 200:**
```json
{
  "id": 1,
  "email": "admin@enginy.cat",
  "role": "ADMIN",
  "first_name": "Admin",
  "last_name": "Enginy",
  "school_id": null,
  "school_name": null
}
```

---

## Catalog

### GET `/api/catalog/editions`

Llistar edicions de tallers disponibles.

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `period_id` | int | Filtrar per període |
| `day_of_week` | string | TUESDAY o THURSDAY |
| `available_only` | boolean | Només amb places |

**Response 200:**
```json
[
  {
    "id": 1,
    "workshop_id": 1,
    "workshop_title": "Robòtica Educativa",
    "provider_name": "TechEdu Barcelona",
    "day_of_week": "TUESDAY",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "max_capacity": 25,
    "available_seats": 15,
    "location": "Carrer Tecnologia 123"
  }
]
```

---

### GET `/api/catalog/editions/:id`

Obtenir detall d'una edició.

**Response 200:**
```json
{
  "id": 1,
  "workshop": {
    "id": 1,
    "title": "Robòtica Educativa",
    "description": "Taller d'introducció a la robòtica...",
    "target_audience": "ESO",
    "duration_minutes": 120
  },
  "provider": {
    "id": 1,
    "name": "TechEdu Barcelona",
    "contact_email": "info@techedu.cat"
  },
  "day_of_week": "TUESDAY",
  "start_time": "09:00:00",
  "end_time": "11:00:00",
  "max_capacity": 25,
  "current_requests": 3,
  "total_requested_seats": 45
}
```

---

## Requests

### GET `/api/requests`

Llistar sol·licituds (admin veu totes, centre veu les seves).

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `school_id` | int | Filtrar per centre |
| `status` | string | DRAFT, SUBMITTED, etc. |
| `period_id` | int | Filtrar per període |

**Response 200:**
```json
[
  {
    "id": 1,
    "school_name": "Escola Mediterrània",
    "edition_id": 1,
    "workshop_title": "Robòtica Educativa",
    "students_count": 20,
    "preference": "FIRST_CHOICE",
    "status": "SUBMITTED",
    "teacher_name": "Maria García",
    "created_at": "2026-01-15T10:00:00Z"
  }
]
```

---

### POST `/api/requests`

Crear nova sol·licitud.

**Fase requerida:** `SOLICITUDES`

**Body:**
```json
{
  "edition_id": 1,
  "students_count": 20,
  "preference": "FIRST_CHOICE",
  "teacher_id": 1,
  "notes": "Preferim matí"
}
```

**Response 201:**
```json
{
  "id": 1,
  "message": "Sol·licitud creada correctament",
  "status": "DRAFT"
}
```

---

### PUT `/api/requests/:id`

Actualitzar sol·licitud (només en DRAFT).

**Body:**
```json
{
  "students_count": 25,
  "teacher_id": 2
}
```

---

### PUT `/api/requests/:id/submit`

Enviar sol·licitud (DRAFT → SUBMITTED).

**Fase requerida:** `SOLICITUDES`

**Response 200:**
```json
{
  "message": "Sol·licitud enviada correctament",
  "status": "SUBMITTED"
}
```

---

## Allocation

### GET `/api/allocation`

Llistar assignacions.

**Fase requerida:** `PUBLICACION` o `EJECUCION`

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `school_id` | int | Filtrar per centre |

**Response 200:**
```json
[
  {
    "id": 1,
    "request_id": 1,
    "edition_id": 1,
    "workshop_title": "Robòtica Educativa",
    "day_of_week": "TUESDAY",
    "start_time": "09:00:00",
    "end_time": "11:00:00",
    "assigned_seats": 15,
    "confirmed_students": 0,
    "status": "PENDING",
    "provider_name": "TechEdu Barcelona"
  }
]
```

---

### POST `/api/allocation/run`

Executar algoritme d'assignació.

**Rol requerit:** `ADMIN`
**Fase requerida:** `ASIGNACION`

**Response 200:**
```json
{
  "message": "Assignació executada correctament",
  "stats": {
    "total_requests": 45,
    "fully_assigned": 30,
    "partially_assigned": 10,
    "not_assigned": 5,
    "total_seats_assigned": 450
  }
}
```

---

### POST `/api/allocation/publish`

Publicar resultats d'assignació.

**Rol requerit:** `ADMIN`

**Response 200:**
```json
{
  "message": "Resultats publicats. Fase canviada a PUBLICACION"
}
```

---

### PUT `/api/allocation/:id/confirm`

Confirmar nominalment els alumnes d'una assignació.

**Fase requerida:** `PUBLICACION` o `EJECUCION`

**Body:**
```json
{
  "students": [1, 2, 3, 4, 5]
}
```

**Response 200:**
```json
{
  "message": "Allocation confirmed successfully",
  "allocation_id": 1,
  "students_confirmed": 5
}
```

---

## Students

### GET `/api/students`

Llistar alumnes del centre.

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `school_id` | int | Filtrar per centre |
| `grade` | string | Filtrar per curs |
| `allocation_id` | int | Alumnes d'una assignació |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Anna López",
    "birth_date": "2012-05-15",
    "grade": "1r ESO",
    "group_name": "A"
  }
]
```

---

### POST `/api/students`

Crear alumne.

**Body:**
```json
{
  "name": "Anna López",
  "birth_date": "2012-05-15",
  "grade": "1r ESO",
  "group_name": "A"
}
```

---

### POST `/api/students/:id/documents`

Pujar document d'un alumne.

**Body:** `multipart/form-data`
| Camp | Tipus | Descripció |
|------|-------|------------|
| `document` | file | Fitxer a pujar |
| `document_type` | string | authorization, medical, etc. |

---

## Teachers

### GET `/api/teachers`

Llistar professors del centre.

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Maria García",
    "email": "maria.garcia@mail.com",
    "phone": "612345678"
  }
]
```

---

### POST `/api/teachers`

Crear professor.

**Body:**
```json
{
  "name": "Maria García",
  "email": "maria.garcia@mail.com",
  "phone": "612345678"
}
```

---

## Sessions

### GET `/api/sessions`

Llistar sessions.

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `teacher_id` | int | Sessions d'un professor |
| `edition_id` | int | Sessions d'una edició |

---

### GET `/api/sessions/teacher/:teacherId`

Sessions assignades a un professor.

**Response 200:**
```json
[
  {
    "id": 1,
    "edition_id": 1,
    "workshop_title": "Robòtica Educativa",
    "session_date": "2026-02-15",
    "status": "SCHEDULED",
    "students_count": 15
  }
]
```

---

### POST `/api/sessions/:id/attendance`

Registrar assistència.

**Fase requerida:** `EJECUCION`

**Body:**
```json
{
  "attendance": [
    { "student_id": 1, "status": "PRESENT" },
    { "student_id": 2, "status": "ABSENT" },
    { "student_id": 3, "status": "LATE", "notes": "5 minuts" }
  ]
}
```

---

### POST `/api/sessions/:id/evaluation`

Avaluar sessió.

**Body:**
```json
{
  "satisfaction": 4,
  "comments": "Molt interessant pels alumnes",
  "would_recommend": true
}
```

---

## Enrollment

### GET `/api/enrollment/periods`

Llistar períodes d'inscripció.

**Query params:**
| Param | Tipus | Descripció |
|-------|-------|------------|
| `status` | string | ACTIVE o CLOSED |

**Response 200:**
```json
[
  {
    "id": 1,
    "name": "Curs 2025-2026 Q2",
    "start_date": "2026-01-01",
    "end_date": "2026-06-30",
    "current_phase": "SOLICITUDES",
    "status": "ACTIVE"
  }
]
```

---

### PUT `/api/enrollment/periods/:id/phase`

Canviar fase del període.

**Rol requerit:** `ADMIN`

**Body:**
```json
{
  "phase": "ASIGNACION"
}
```

---

## Providers

### GET `/api/providers`

Llistar proveïdors.

---

### POST `/api/providers`

Crear proveïdor.

**Rol requerit:** `ADMIN`

**Body:**
```json
{
  "name": "TechEdu Barcelona",
  "description": "Tallers de tecnologia educativa",
  "contact_email": "info@techedu.cat",
  "phone": "934567890",
  "address": "Carrer Tecnologia 123"
}
```

---

## Centers

### GET `/api/centers`

Llistar centres educatius.

---

### POST `/api/centers`

Crear centre.

**Rol requerit:** `ADMIN`

**Body:**
```json
{
  "name": "Escola Mediterrània",
  "code": "08001234",
  "address": "Carrer del Mar 1",
  "district": "Ciutat Vella",
  "phone": "932345678",
  "email": "info@escola-mediterrania.cat"
}
```

---

## Codis d'Error

| Codi | Descripció |
|------|------------|
| `400` | Bad Request - Dades invàlides |
| `401` | Unauthorized - Token invàlid o absent |
| `403` | Forbidden - Sense permisos |
| `404` | Not Found - Recurs no trobat |
| `500` | Internal Server Error |

### Errors de Fase

```json
{
  "error": "Aquesta acció no està disponible en la fase actual",
  "code": "INVALID_PHASE",
  "current_phase": "SOLICITUDES",
  "allowed_phases": ["PUBLICACION", "EJECUCION"]
}
```

### Errors de Rol

```json
{
  "error": "Aquesta acció requereix un dels següents rols: ADMIN",
  "code": "INVALID_ROLE",
  "required_roles": ["ADMIN"],
  "current_role": "CENTER_COORD"
}
```

---

## Paginació

Els endpoints de llistat suporten paginació:

**Query params:**
| Param | Default | Descripció |
|-------|---------|------------|
| `page` | 1 | Número de pàgina |
| `limit` | 20 | Elements per pàgina |

**Response headers:**
```
X-Total-Count: 150
X-Total-Pages: 8
```

---

## Rate Limiting

- **100 requests/minut** per IP en desenvolupament
- **1000 requests/minut** per IP en producció

---

## Documentació Addicional

- [Exemples d'ús](./api/EXAMPLES.md)
- [Errors comuns](./api/ERRORS.md)
- [Postman Collection](./api/enginy-api.postman_collection.json)
