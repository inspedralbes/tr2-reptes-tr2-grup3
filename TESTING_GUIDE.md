# 🧪 GUÍA DE TESTING - Flujo Completo ENGINY

## 📋 Datos de Prueba

### Usuarios Disponibles
| Email | Password | Rol | Descripción |
|-------|----------|-----|-------------|
| `admin@enginy.cat` | admin123 | ADMIN | Administrador del sistema |
| `coord1@baixeras.cat` | admin123 | CENTER_COORD | Coordinador Escola Baixeras |
| `coord2@ciutadella.cat` | admin123 | CENTER_COORD | Coordinador Escola Parc de la Ciutadella |
| `coord3@verdaguer.cat` | admin123 | CENTER_COORD | Coordinador Escola Mossén Jacint Verdaguer |
| `coord4@polvorin.cat` | admin123 | CENTER_COORD | Coordinador Escola El Polvorí |
| `coord5@canclos.cat` | admin123 | CENTER_COORD | Coordinador Escola Can Clos |
| `profe.jardineria@enginy.cat` | admin123 | TEACHER | Profesor Referente - Jardinería |
| `profe.tecnolab@enginy.cat` | admin123 | TEACHER | Profesor Referente - TecnoLab |
| `profe.serigrafia@enginy.cat` | admin123 | TEACHER | Profesor Referente - Serigrafia |
| `profe.cuina@enginy.cat` | admin123 | TEACHER | Profesor Referente - Cuina |
| `profe.bici@enginy.cat` | admin123 | TEACHER | Profesor Referente - Bicicleta |

### Roles del Sistema
| Rol | Descripción |
|-----|-------------|
| **ADMIN** | Gestiona períodos, catálogo, puede ver todo |
| **CENTER_COORD** | Coordinador de centro: crea solicitudes, gestiona alumnos, **NO pasa lista** |
| **TEACHER** | Profesor referente: **PASA LISTA**, evalúa alumnos en talleres |

### Datos Insertados
- **5 Centros educativos** con coordinadores
- **8 Profesores acompañantes** (tabla teachers, van con alumnos)
- **5 Profesores referentes** (usuarios TEACHER, imparten talleres)
- **18 Alumnos** (3-4 por centro)
- **6 Talleres** con ediciones 2T y 3T
- **14 Asignaciones** publicadas
- **12 Alumnos vinculados** a asignaciones
- **50 Sesiones** de taller programadas
- **Registros de asistencia** de ejemplo

---

## 🔄 FASES DEL SISTEMA

El sistema tiene 4 fases principales que restringen las acciones disponibles:

| Fase | Acciones Permitidas |
|------|---------------------|
| **SOLICITUDES** | Centros crean/editan solicitudes |
| **ASIGNACION** | Admin ejecuta algoritmo (interno) |
| **PUBLICACION** | Centros ven resultados, confirman alumnos |
| **EJECUCION** | **PROFESORES (TEACHER)** pasan lista, evalúan |

---

## 📝 FASE 1: SOLICITUDES

### ✅ Tests a Realizar

#### Como ADMIN (`admin@enginy.cat`)
1. **Acceder al panel de administración** → `/admin`
2. **Ver catálogo de talleres** → `/admin/catalog`
3. **Ver monitor de solicitudes** → `/admin/requests`
4. **Ver gestión de períodos** → `/admin/enrollment`
   - Verificar que el período está en fase "SOLICITUDES"

#### Como CENTER_COORD (`coord1@baixeras.cat`)
1. **Acceder al dashboard del centro** → `/center`
2. **Explorar catálogo de talleres** → `/center/catalog`
3. **Crear nueva solicitud** → `/center/request/new`
   - ✅ Debería funcionar (estamos en fase SOLICITUDES)
4. **Gestionar alumnos** → `/center/students`
5. **Gestionar profesores** → `/center/teachers`

### ❌ Tests de Restricción (Deberían FALLAR)
- CENTER_COORD intenta ver asignaciones → **ERROR 403** (Solo en PUBLICACION/EJECUCION)
- CENTER_COORD intenta pasar lista → **ERROR 403** (Solo en EJECUCION)

### 🔧 Comando para Cambiar Fase
```bash
# Como ADMIN, avanzar a fase ASIGNACION
curl -X PUT http://localhost:3000/api/enrollment/periods/{period_id}/advance-phase \
  -H "Authorization: Bearer {token}" \
  -H "Content-Type: application/json"
```

---

## ⚙️ FASE 2: ASIGNACION

### ✅ Tests a Realizar

#### Como ADMIN
1. **Ver resumen de demanda** → `/admin/allocation`
2. **Ejecutar algoritmo de asignación**
   - POST `/api/allocation/run`
3. **Editar asignaciones manualmente** si es necesario
4. **Publicar todas las asignaciones**
   - POST `/api/allocation/publish-all`

### ❌ Tests de Restricción
- CENTER_COORD intenta crear solicitud → **ERROR 403** (Ya cerrado)
- CENTER_COORD intenta ver asignaciones → **ERROR 403** (Aún no publicadas)

---

## 📢 FASE 3: PUBLICACION

### ✅ Tests a Realizar

#### Como CENTER_COORD
1. **Ver mis asignaciones** → `/center/allocations`
   - ✅ Ahora debería funcionar
2. **Confirmar asignación con alumnos** → `/center/allocations/:id/confirm`
3. **Ver talleres asignados a mi centro**

#### Como ADMIN
1. **Ver estado de confirmaciones**
2. **Generar sesiones de taller** (automático al pasar a PUBLICACION)

### ❌ Tests de Restricción
- CENTER_COORD intenta crear nueva solicitud → **ERROR 403**
- CENTER_COORD intenta pasar lista → **ERROR 403** (No es TEACHER)
- TEACHER intenta pasar lista → **ERROR 403** (Aún no estamos en EJECUCION)

---

## 🎓 FASE 4: EJECUCION

### ✅ Tests a Realizar

#### Como TEACHER (`profe.jardineria@enginy.cat`) - **QUIEN PASA LISTA**
1. **Acceder a "Mi Área"** → `/teacher`
2. **Ver talleres asignados**
3. **Acceder a "Passar Llista"** → `/teacher/workshop/:id/attendance`
   - ✅ Solo TEACHER puede hacer esto
4. **Registrar asistencia**
   - Marcar alumnos como PRESENT, ABSENT, LATE, EXCUSED
5. **Evaluar competencias** → `/teacher/workshop/:id/evaluate`

#### Como CENTER_COORD (Coordinador de centro)
1. **Ver dashboard con talleres donde tiene alumnos**
2. **NO puede pasar lista** → ERROR 403 `INVALID_ROLE`
3. **Puede ver información de sus alumnos**

#### Como ADMIN
1. **Ver estadísticas de asistencia**
2. **Generar informes**
3. **Cancelar sesiones si es necesario**
4. **También puede pasar lista** (adminBypass)

### ❌ Tests de Restricción
- **CENTER_COORD intenta pasar lista** → **ERROR 403 INVALID_ROLE** ✅

---

## 🔒 MATRIZ DE PERMISOS POR FASE

| Acción | SOLICITUDES | ASIGNACION | PUBLICACION | EJECUCION |
|--------|-------------|------------|-------------|-----------|
| Crear solicitud | ✅ CENTER | ❌ | ❌ | ❌ |
| Editar solicitud | ✅ CENTER | ❌ | ❌ | ❌ |
| Ejecutar algoritmo | ❌ | ✅ ADMIN | ❌ | ❌ |
| Ver asignaciones | ❌ | ❌ | ✅ TODOS | ✅ TODOS |
| Confirmar alumnos | ❌ | ❌ | ✅ CENTER | ✅ CENTER |
| Pasar lista | ❌ | ❌ | ❌ | ✅ **TEACHER** |
| Evaluar | ❌ | ❌ | ❌ | ✅ **TEACHER** |

---

## 🐛 POSIBLES ERRORES A DETECTAR

### 1. Errores de Fase
```json
{
  "error": "Aquesta acció no està disponible en la fase actual (Sol·licituds)",
  "code": "INVALID_PHASE",
  "current_phase": "SOLICITUDES",
  "allowed_phases": ["EJECUCION"]
}
```

### 2. Errores de Autorización
```json
{
  "error": "Only admins can perform this action"
}
```

### 3. Errores de Período
```json
{
  "error": "No hi ha cap període actiu",
  "code": "NO_ACTIVE_PERIOD"
}
```

---

## 📊 SCRIPT DE VERIFICACIÓN

Ejecutar después de insertar datos:

```sql
-- Verificar datos insertados
SELECT 'Períodos' as tabla, count(*) as total FROM enrollment_periods
UNION ALL SELECT 'Usuarios', count(*) FROM users
UNION ALL SELECT 'Centros', count(*) FROM schools
UNION ALL SELECT 'Profesores', count(*) FROM teachers
UNION ALL SELECT 'Alumnos', count(*) FROM students
UNION ALL SELECT 'Talleres', count(*) FROM workshops
UNION ALL SELECT 'Ediciones', count(*) FROM workshop_editions
UNION ALL SELECT 'Asignaciones', count(*) FROM allocations
UNION ALL SELECT 'Sesiones', count(*) FROM workshop_sessions;

-- Ver fase actual
SELECT name, status, current_phase FROM enrollment_periods WHERE status = 'ACTIVE';

-- Ver asignaciones con alumnos
SELECT 
  w.title as taller,
  s.name as centro,
  a.assigned_seats as plazas,
  count(als.id) as alumnos_confirmados
FROM allocations a
JOIN workshop_editions we ON a.workshop_edition_id = we.id
JOIN workshops w ON we.workshop_id = w.id
JOIN schools s ON a.school_id = s.id
LEFT JOIN allocation_students als ON a.id = als.allocation_id
GROUP BY w.title, s.name, a.assigned_seats
ORDER BY w.title, s.name;
```

---

## 🚀 CÓMO EJECUTAR LOS TESTS

### 1. Reiniciar Base de Datos
```bash
# Desde la raíz del proyecto
docker-compose down -v
docker-compose up -d
```

### 2. Ejecutar Scripts SQL
```bash
# Los scripts se ejecutan automáticamente al iniciar el contenedor
# init.sql -> Crea tablas
# insert.sql -> Inserta datos de prueba
```

### 3. Iniciar Aplicación
```bash
# Backend
cd backend && npm run dev

# Frontend
cd frontend && npm run dev
```

### 4. Acceder a la Aplicación
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000

### 5. Probar Cada Fase
1. Login como `admin@enginy.cat`
2. Ir a `/admin/enrollment`
3. Cambiar fase del período activo
4. Verificar restricciones con usuarios CENTER_COORD

---

## 📌 CHECKLIST DE TESTING

### Fase SOLICITUDES
- [ ] Admin puede ver todas las solicitudes
- [ ] CENTER_COORD puede crear solicitud
- [ ] CENTER_COORD puede editar solicitud en borrador
- [ ] CENTER_COORD NO puede ver asignaciones
- [ ] CENTER_COORD NO puede pasar lista

### Fase ASIGNACION
- [ ] Admin puede ejecutar algoritmo
- [ ] Admin puede editar asignaciones
- [ ] CENTER_COORD NO puede crear solicitudes
- [ ] CENTER_COORD NO puede ver asignaciones

### Fase PUBLICACION
- [ ] CENTER_COORD puede ver sus asignaciones
- [ ] CENTER_COORD puede confirmar alumnos
- [ ] Sesiones generadas automáticamente
- [ ] CENTER_COORD NO puede pasar lista

### Fase EJECUCION
- [ ] CENTER_COORD puede pasar lista
- [ ] CENTER_COORD puede evaluar competencias
- [ ] Registros de asistencia se guardan correctamente
- [ ] Admin puede ver estadísticas
