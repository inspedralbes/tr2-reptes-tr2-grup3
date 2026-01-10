# 🔄 Flujo Completo de la Aplicación ENGINY

## 📋 Índice
1. [Visión General del Ciclo](#visión-general-del-ciclo)
2. [Fase 1: Configuración Inicial (ADMIN)](#fase-1-configuración-inicial-admin)
3. [Fase 2: Alta de Centros Educativos](#fase-2-alta-de-centros-educativos)
4. [Fase 3: Catálogo de Talleres](#fase-3-catálogo-de-talleres)
5. [Fase 4: Solicitudes de Centros](#fase-4-solicitudes-de-centros)
6. [Fase 5: Algoritmo de Asignación](#fase-5-algoritmo-de-asignación)
7. [Fase 6: Recepción y Confirmación de Asignaciones](#fase-6-recepción-y-confirmación-de-asignaciones)
8. [Fase 7: Ejecución de Talleres](#fase-7-ejecución-de-talleres)
9. [Diagrama de Flujo Visual](#diagrama-de-flujo-visual)

---

## 🎯 Visión General del Ciclo

ENGINY gestiona el ciclo completo de talleres educativos (Modalitat C) desde la configuración inicial hasta la evaluación final:

```
[Configuración] → [Solicitudes] → [Asignación] → [Confirmación] → [Ejecución] → [Evaluación]
```

**Estados del Período de Inscripción:**
- `OPEN` → Los centros pueden enviar solicitudes
- `PROCESSING` → Se está ejecutando el algoritmo de asignación
- `PUBLISHED` → Las asignaciones están publicadas y los centros pueden confirmarlas
- `CLOSED` → Período cerrado, talleres en ejecución

---

## 📍 Fase 1: Configuración Inicial (ADMIN)

### 1.1 Crear Período de Inscripción

**Rol:** ADMIN  
**Acceso:** `/admin/enrollment`

El administrador crea un nuevo período de inscripción con:
- **Nombre** (ej: "Enginy 2025-2026 - Modalitat C")
- **Fecha inicio solicitudes** (`start_date_requests`)
- **Fecha fin solicitudes** (`end_date_requests`)
- **Fecha publicación** (`publication_date`)
- **Estado inicial:** `OPEN`

**Ejemplo:**
```json
{
  "name": "Enginy 2025-2026",
  "start_date_requests": "2024-09-30T13:00:00Z",
  "end_date_requests": "2024-10-10T23:59:59Z",
  "publication_date": "2024-10-20T10:00:00Z",
  "status": "OPEN"
}
```

### 1.2 Alta de Centros Educativos

**Rol:** ADMIN (gestión manual o importación)  
**Datos necesarios:**
- Nombre del centro (ej: "Escola Baixeras")
- Código del centro (ej: "08001595")

**Tabla:** `schools`
```sql
INSERT INTO schools (name, code) 
VALUES ('Escola Baixeras', '08001595');
```

**Nota:** Los centros se pueden importar desde un CSV con los datos de los centros de Barcelona.

### 1.3 Crear Usuarios Coordinadores de Centros

**Rol:** ADMIN  
**Tabla:** `users`

Cada centro necesita un usuario coordinador con rol `CENTER_COORD`:

```sql
INSERT INTO users (email, password_hash, full_name, role, school_id)
VALUES (
  'coord1@escola1.cat',
  '$2b$10$...',
  'Coordinador Escola 1',
  'CENTER_COORD',
  (SELECT id FROM schools WHERE code = '08001595')
);
```

**Nota:** El `school_id` vincula el usuario con su centro educativo.

---

## 🔧 Fase 2: Alta de Centros Educativos

### 2.1 Registro Manual

Aunque los centros se suelen dar de alta desde el admin, el sistema permite:

**Flujo para nuevos centros:**
1. El admin crea el registro en `schools`
2. Se asigna un usuario coordinador (`CENTER_COORD`)
3. El coordinador recibe credenciales de acceso
4. El coordinador puede iniciar sesión en `/center/*`

### 2.2 Importación Masiva

El sistema puede importar centros desde:
- CSV con datos de Barcelona (`totcat-centres-educatius.csv`)
- Script Python que extrae centros de Barcelona (`extract_barcelona_centers.py`)

---

## 🎨 Fase 3: Catálogo de Talleres

### 3.1 Crear Proveedores

**Rol:** ADMIN  
**Acceso:** `/admin/catalog`

Antes de crear talleres, se deben crear los proveedores (organizaciones que imparten los talleres):

```sql
INSERT INTO providers (name, address)
VALUES ('ISMAB', 'C/ Mollerussa, 71');
```

### 3.2 Crear Talleres

**Rol:** ADMIN  
**Acceso:** `/admin/catalog`

Cada taller tiene:
- **Título** (ej: "Jardineria", "Serigrafia")
- **Ámbito** (ej: "Medi ambient i sostenibilitat", "Tecnològic")
- **Proveedor** (relación con `providers`)

**Ejemplo:**
```json
{
  "title": "Jardineria",
  "ambit": "Medi ambient i sostenibilitat",
  "provider_id": "uuid-del-proveedor"
}
```

### 3.3 Crear Ediciones de Talleres

**Rol:** ADMIN  
**Acceso:** `/admin/catalog/:editionId`

Cada taller puede tener múltiples **ediciones** (diferentes horarios/trimestres):

**Características de una edición:**
- **Trimestre:** `1R_TRIMESTRE`, `2N_TRIMESTRE`, `3R_TRIMESTRE`
- **Día de la semana:** `MONDAY`, `TUESDAY`, `THURSDAY`, etc.
- **Horario:** `start_time`, `end_time` (ej: "09:00", "12:00")
- **Capacidad total:** Máximo 16 alumnos por taller (regla de Modalitat C)
- **Máximo por centro:** Máximo 4 alumnos por centro (regla de Modalitat C)
- **Período de inscripción:** Vinculado a `enrollment_periods`

**Ejemplo:**
```json
{
  "workshop_id": "uuid-taller",
  "enrollment_period_id": "uuid-periodo",
  "term": "2N_TRIMESTRE",
  "day_of_week": "THURSDAY",
  "start_time": "09:00",
  "end_time": "12:00"
}
```

**Nota:** Cuando el admin **publica** el período (`PUBLISHED`), se generan automáticamente las 10 sesiones del taller en `workshop_sessions`.

---

## 📝 Fase 4: Solicitudes de Centros

### 4.1 Acceso al Catálogo

**Rol:** CENTER_COORD  
**Acceso:** `/center/catalog`

El coordinador del centro puede explorar todos los talleres disponibles:
- Filtrar por ámbito (Tecnològic, Artístic, Sostenibilitat)
- Ver detalles de cada taller y sus ediciones
- Ver horarios, días, capacidad disponible

### 4.2 Crear Solicitud (Wizard de 3 Pasos)

**Rol:** CENTER_COORD  
**Acceso:** `/center/request`

#### Paso 1: Datos del Centro
- Seleccionar **período de inscripción** (debe estar en estado `OPEN`)
- Indicar si es la **primera vez** que participan (`is_first_time_participation`)
- Indicar si están **disponibles los martes** (`available_for_tuesdays`)

#### Paso 2: Selección de Talleres
El coordinador puede seleccionar múltiples talleres con:
- **Taller y edición específica** (ej: "Jardineria - 2n Trimestre - Jueves 09:00")
- **Número de alumnos** solicitados (1-4 alumnos por taller, por centro)
- **Prioridad** (1 = más prioritario)

**Restricciones:**
- Máximo 4 alumnos por centro, por taller
- Debe seleccionar una edición específica

**Ejemplo de selección:**
```
Prioridad 1: Jardineria (2n Trimestre, Jueves 09:00) - 4 alumnos
Prioridad 2: Serigrafia (2n Trimestre, Jueves 09:00) - 2 alumnos
Prioridad 3: Oficis Gastronòmics (2n Trimestre, Jueves 08:30) - 3 alumnos
```

#### Paso 3: Preferencias de Profesor Referent
El coordinador puede indicar si quiere que algún profesor de su centro sea **profesor referent** de algún taller:

- Seleccionar taller/edición
- Indicar orden de preferencia (1, 2, 3)
- Máximo 3 preferencias

**Nota:** Los profesores referents acompañan a los alumnos y ayudan en el taller.

### 4.3 Enviar Solicitud

Al finalizar el wizard, la solicitud se crea con estado `DRAFT`. El coordinador puede:
- **Editar** la solicitud antes de enviarla
- **Enviar** la solicitud (cambia a `SUBMITTED`)
- Una vez `SUBMITTED`, no se puede editar

**Tablas afectadas:**
- `requests` → Solicitud general
- `request_items` → Cada taller solicitado
- `request_teacher_preferences` → Preferencias de profesor referent

---

## 🤖 Fase 5: Algoritmo de Asignación

### 5.1 Ver Resumen de Demanda

**Rol:** ADMIN  
**Acceso:** `/admin/allocation`

Antes de ejecutar el algoritmo, el admin puede ver un resumen:
- Total de solicitudes por taller
- Capacidad disponible vs demanda
- Centros interesados por taller
- Indicador de sobredemanda

### 5.2 Ejecutar Algoritmo

**Rol:** ADMIN  
**Endpoint:** `POST /api/allocation/run`

**Condiciones:**
- El período debe estar en estado `OPEN`
- Debe haber solicitudes `SUBMITTED`

**Restricciones del Algoritmo:**

1. **Disponibilidad de martes:**
   - Si un centro marcó `available_for_tuesdays = false`, NO se le asigna ningún taller los martes

2. **Máximo 4 alumnos por centro:**
   - Un centro no puede recibir más de 4 alumnos para la misma edición de taller

3. **Capacidad total del taller:**
   - Máximo 16 alumnos por edición (suma de todos los centros)

4. **Priorización:**
   - Primero por **prioridad** de la solicitud (1, 2, 3...)
   - Luego por **fecha de envío** (primero en llegar, primero servido)
   - Los profesores referents tienen prioridad adicional

**Proceso del Algoritmo:**

```javascript
1. Obtener todas las solicitudes SUBMITTED para el período
2. Ordenar por: priority ASC, submitted_at ASC
3. Para cada solicitud:
   a. Verificar restricción de martes
   b. Calcular cuántos alumnos se pueden asignar (min entre:
      - alumnos solicitados
      - capacidad restante del taller
      - 4 - alumnos ya asignados a este centro en este taller)
   c. Si se puede asignar > 0:
      - Crear asignación PROVISIONAL
      - Actualizar contadores de capacidad
4. Cambiar estado del período a PROCESSING
5. Insertar todas las asignaciones en tabla allocations
```

**Resultado:**
- Se crean registros en `allocations` con estado `PROVISIONAL`
- Cada asignación incluye:
  - `workshop_edition_id`
  - `school_id`
  - `assigned_seats` (número de plazas asignadas, 1-4)
  - `status: 'PROVISIONAL'`

### 5.3 Publicar Asignaciones

**Rol:** ADMIN  
**Acceso:** `/admin/allocation`

Después de ejecutar el algoritmo, el admin puede:
- **Revisar** las asignaciones generadas
- **Ajustar manualmente** si es necesario (futura funcionalidad)
- **Publicar** las asignaciones (cambia estado del período a `PUBLISHED`)

**Al publicar:**
- Se generan automáticamente las **10 sesiones** del taller en `workshop_sessions`
- Las asignaciones cambian de `PROVISIONAL` a `PUBLISHED`
- Los centros ahora pueden ver sus asignaciones

### 5.4 Asignar Professores Referents

**Rol:** ADMIN  
**Acceso:** `/admin/catalog/:editionId`

El admin puede asignar profesores referents a cada edición de taller:
- Seleccionar usuario con rol `TEACHER`
- Indicar si es `is_main_referent` (profesor principal)
- Un taller puede tener múltiples profesores referents

**Tabla:** `workshop_teachers` (relación entre `workshop_editions` y `users`)

---

## ✅ Fase 6: Recepción y Confirmación de Asignaciones

### 6.1 Visualización de Asignaciones

**Rol:** CENTER_COORD  
**Acceso:** `/center/allocations`

El coordinador del centro puede ver todas sus asignaciones:

**Información mostrada:**
- Taller asignado (título, ámbito)
- Edición (trimestre, día, horario)
- Número de plazas asignadas (`assigned_seats`)
- Estado: `PUBLISHED`, `ACCEPTED`, `PROVISIONAL`
- Proveedor del taller

**Filtros:**
- Por período de inscripción
- Por estado

### 6.2 Confirmar Asignación e Inscribir Alumnos

**Rol:** CENTER_COORD  
**Acceso:** `/center/allocations`

Para cada asignación con estado `PUBLISHED`, el coordinador puede:

1. **Confirmar la asignación**
2. **Añadir nombres de alumnos** (hasta el número de plazas asignadas)

**Datos de cada alumno:**
- Nombre completo (`full_name`)
- ID alumno opcional (`idalu`)
- Email del tutor (`tutor_email`) - opcional
- Teléfono del tutor (`tutor_phone`) - opcional

**Proceso:**
```
1. Coordinador hace clic en "Confirmar" en una asignación
2. Se abre formulario para añadir alumnos
3. Se muestran campos para hasta N alumnos (según assigned_seats)
4. Coordinador completa datos y guarda
```

**Backend:**
- Se actualiza `allocations.status` a `ACCEPTED`
- Se crean registros en `students` (si no existen)
- Se crean registros en `allocation_students` (vinculan alumnos con la asignación)

**Tablas afectadas:**
```sql
-- Actualizar asignación
UPDATE allocations SET status = 'ACCEPTED' WHERE id = 'xxx';

-- Crear/alta alumno
INSERT INTO students (full_name, school_id, tutor_email, tutor_phone)
VALUES ('Juan Pérez', 'school-uuid', 'tutor@email.com', '612345678');

-- Vincular alumno a asignación
INSERT INTO allocation_students (allocation_id, student_id, status)
VALUES ('allocation-uuid', 'student-uuid', 'ACTIVE');
```

### 6.3 Subir Documentación

**Rol:** CENTER_COORD  
**Acceso:** `/center/documents`

El coordinador puede subir documentos (autorizaciones PDF) por alumno:
- Seleccionar alumno
- Subir archivo PDF (autorización parental, etc.)
- Los documentos se guardan en `student_documents`

---

## 🎓 Fase 7: Ejecución de Talleres

### 7.1 Vista de Profesor Referent

**Rol:** TEACHER  
**Acceso:** `/teacher/*`

El profesor referent puede ver:
- **Sus talleres asignados** (`/teacher/my-workshops`)
- **Sesiones del taller** (10 sesiones pre-generadas)
- **Alumnos inscritos** (de todos los centros participantes)

### 7.2 Pasar Lista de Asistencia

**Rol:** TEACHER  
**Acceso:** `/teacher/sessions/:sessionId/attendance`

Para cada sesión del taller, el profesor puede:

1. Ver lista de todos los alumnos inscritos
2. Marcar asistencia para cada alumno:
   - ✅ **PRESENT** (Presente)
   - ❌ **ABSENT** (Falta)
   - ⏰ **LATE** (Retraso)
   - 📝 **EXCUSED** (Justificado)
3. Añadir observaciones por alumno
4. Guardar asistencia

**Backend:**
- Se guardan registros en `attendance_logs`
- Cada registro vincula: `session_id`, `student_id`, `status`, `observation`

**Tabla:** `attendance_logs`
```sql
INSERT INTO attendance_logs (session_id, student_id, status, observation)
VALUES ('session-uuid', 'student-uuid', 'PRESENT', 'Participación activa');
```

### 7.3 Evaluar Competencias

**Rol:** TEACHER  
**Acceso:** `/teacher/workshops/:editionId/evaluate`

Al finalizar el taller (o durante), el profesor evalúa cada alumno en competencias:

**Competencias evaluadas (escala 1-5):**
- Conocimientos técnicos (`tech_knowledge`)
- Habilidades técnicas (`tech_skills`)
- Resolución de problemas (`tech_problem_solving`)
- Trabajo en equipo (`teamwork`)
- Comunicación (`communication`)
- Responsabilidad (`responsibility`)
- Creatividad (`creativity`)
- Comentarios generales (`comments`)

**Backend:**
- Se guardan registros en `student_grades`
- Una evaluación por alumno, por edición de taller

**Tabla:** `student_grades`
```sql
INSERT INTO student_grades (
  student_id, workshop_edition_id,
  tech_knowledge, tech_skills, tech_problem_solving,
  teamwork, communication, responsibility, creativity,
  comments
) VALUES (
  'student-uuid', 'edition-uuid',
  4, 5, 4, 5, 4, 5, 4,
  'Excelente progreso durante el taller'
);
```

### 7.4 Visualización para Centros

**Rol:** CENTER_COORD  
**Acceso:** `/center/allocations/:allocationId`

Los coordinadores pueden ver:
- Estado de asistencia de sus alumnos (después de cada sesión)
- Evaluaciones finales (cuando el profesor las complete)
- Estadísticas: % asistencia, promedio de competencias

---

## 📊 Diagrama de Flujo Visual

```
┌─────────────────────────────────────────────────────────────────┐
│                    ADMIN: CONFIGURACIÓN INICIAL                 │
├─────────────────────────────────────────────────────────────────┤
│  1. Crear período (OPEN)                                        │
│  2. Alta centros educativos                                     │
│  3. Crear usuarios CENTER_COORD                                 │
│  4. Crear proveedores                                           │
│  5. Crear talleres + ediciones                                  │
│  6. Asignar profesores referents                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CENTER_COORD: SOLICITUDES (Período OPEN)           │
├─────────────────────────────────────────────────────────────────┤
│  1. Explorar catálogo                                           │
│  2. Crear solicitud (Wizard 3 pasos):                           │
│     - Paso 1: Datos centro                                      │
│     - Paso 2: Seleccionar talleres (prioridad, alumnos)         │
│     - Paso 3: Preferencias profesor referent                    │
│  3. Enviar solicitud (DRAFT → SUBMITTED)                        │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                  ADMIN: ASIGNACIÓN (Período OPEN)               │
├─────────────────────────────────────────────────────────────────┤
│  1. Ver resumen de demanda                                      │
│  2. Ejecutar algoritmo de asignación:                           │
│     ✓ Respetar disponibilidad martes                            │
│     ✓ Máximo 4 alumnos/centro/taller                            │
│     ✓ Máximo 16 alumnos/taller                                  │
│     ✓ Priorizar por preferencias                                │
│  3. Revisar asignaciones PROVISIONAL                            │
│  4. Publicar asignaciones (OPEN → PUBLISHED)                    │
│  5. Generar 10 sesiones automáticamente                         │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│         CENTER_COORD: CONFIRMACIÓN (Período PUBLISHED)          │
├─────────────────────────────────────────────────────────────────┤
│  1. Ver asignaciones recibidas                                  │
│  2. Confirmar cada asignación                                   │
│  3. Añadir nombres de alumnos (hasta assigned_seats)            │
│  4. Subir documentación (autorizaciones)                        │
│  5. Asignación cambia: PUBLISHED → ACCEPTED                     │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              TEACHER: EJECUCIÓN (Período CLOSED)                │
├─────────────────────────────────────────────────────────────────┤
│  Para cada sesión (1-10):                                       │
│    1. Ver alumnos inscritos                                     │
│    2. Pasar lista: PRESENT/ABSENT/LATE/EXCUSED                  │
│    3. Guardar asistencia                                        │
│                                                                  │
│  Al finalizar taller:                                           │
│    4. Evaluar competencias (escala 1-5)                         │
│    5. Añadir comentarios                                        │
│    6. Guardar evaluaciones                                      │
└─────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│              CENTER_COORD: SEGUIMIENTO                          │
├─────────────────────────────────────────────────────────────────┤
│  1. Ver asistencia de alumnos (después de cada sesión)          │
│  2. Ver evaluaciones finales                                    │
│  3. Ver estadísticas (% asistencia, promedio)                   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 Estados y Transiciones

### Estados del Período (`enrollment_periods.status`)

```
OPEN
  ↓ (ADMIN ejecuta algoritmo)
PROCESSING
  ↓ (ADMIN publica)
PUBLISHED
  ↓ (Fin período o inicio talleres)
CLOSED
```

### Estados de Solicitud (`requests.status`)

```
DRAFT
  ↓ (CENTER_COORD envía)
SUBMITTED
  ↓ (Algoritmo procesa)
PROCESSED (si fue asignada parcialmente)
REJECTED (si no se pudo asignar nada)
```

### Estados de Asignación (`allocations.status`)

```
PROVISIONAL
  ↓ (ADMIN publica)
PUBLISHED
  ↓ (CENTER_COORD confirma)
ACCEPTED
```

---

## 🎯 Resumen del Propósito de la Aplicación

**ENGINY** simula un sistema completo de gestión de talleres educativos (Modalitat C) donde:

1. **Administradores** configuran la oferta educativa (talleres, horarios, períodos)
2. **Centros educativos** solicitan talleres según sus necesidades y preferencias
3. **Un algoritmo inteligente** asigna automáticamente los talleres respetando restricciones (capacidad, disponibilidad, preferencias)
4. **Los centros confirman** las asignaciones e inscriben a sus alumnos
5. **Los profesores referents** gestionan las sesiones (asistencia, evaluación)
6. **Los centros pueden hacer seguimiento** del progreso de sus alumnos

Todo el flujo está diseñado para ser **transparente**, **automatizado** donde es posible, y **controlado** por los diferentes roles según sus responsabilidades.
