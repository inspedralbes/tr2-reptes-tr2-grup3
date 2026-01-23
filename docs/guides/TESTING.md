# 🧪 Guia de Testing

## Visió General

Aquesta guia explica com configurar l'entorn de proves i executar tests a Enginy.

---

## Configuració de l'Entorn

### 1. Aixecar Contenidors

```bash
# Desenvolupament complet
docker-compose up -d

# Només base de dades
docker-compose up -d db
```

### 2. Carregar Dades de Prova

```bash
# Les dades de seed es carreguen automàticament amb Docker
# Si cal recarregar manualment:
docker exec -i enginy_db psql -U postgres enginy < database/seed/insert.sql
```

### 3. Verificar Serveis

```bash
# Backend
curl http://localhost:3000/api/health

# Frontend
curl http://localhost:5173
```

---

## Credencials de Prova

| Rol | Email | Contrasenya |
|-----|-------|-------------|
| **Admin** | admin@enginy.cat | admin123 |
| **Coordinador 1** | coord@escola-mediterrani.cat | admin123 |
| **Coordinador 2** | coord@escola-mari.cat | admin123 |
| **Coordinador 3** | coord@escola-sol.cat | admin123 |
| **Professor** | maria.garcia@mail.com | (magic link) |
| **Professor** | joan.martinez@mail.com | (magic link) |

---

## Test Manual per Fases

### Fase 1: SOLICITUDES

```
1. Login com a coordinador: coord@escola-mediterrani.cat / admin123

2. Explorar catàleg:
   - Anar a /center/catalog
   - Verificar que es mostren els tallers disponibles
   - Comprovar filtres per dia (Dimarts/Dijous)

3. Crear sol·licitud:
   - Clicar "Sol·licitar" en un taller
   - Completar el wizard:
     a) Seleccionar nombre d'alumnes (ex: 20)
     b) Indicar preferència (Primera opció)
     c) Seleccionar professor acompanyant
   - Guardar com esborrany o enviar

4. Gestionar sol·licituds:
   - Anar a /center/requests
   - Verificar sol·licituds en DRAFT i SUBMITTED
   - Editar una sol·licitud en DRAFT
   - Enviar sol·licitud (DRAFT → SUBMITTED)

5. Gestionar alumnes:
   - Anar a /center/students
   - Afegir nous alumnes
   - Editar dades d'alumnes existents

6. Gestionar professors:
   - Anar a /center/teachers
   - Afegir nou professor
   - Verificar que apareix com a opció en sol·licituds
```

### Fase 2: ASIGNACION

```
1. Login com a admin: admin@enginy.cat / admin123

2. Canviar fase:
   - Anar a /admin/enrollment
   - Canviar fase a ASIGNACION

3. Revisar sol·licituds:
   - Anar a /admin/requests
   - Verificar totes les sol·licituds SUBMITTED
   - Comprovar estadístiques

4. Executar algoritme:
   - Anar a /admin/allocation
   - Clicar "Executar Assignació"
   - Esperar resultats
   - Revisar assignacions generades

5. Publicar resultats:
   - Clicar "Publicar Resultats"
   - Confirmar acció
   - Verificar que la fase canvia a PUBLICACION
```

### Fase 3: PUBLICACION

```
1. Login com a coordinador: coord@escola-mediterrani.cat

2. Veure assignacions:
   - Anar a /center/allocations
   - Verificar places obtingudes
   - Comprovar agrupació per dia

3. Confirmar alumnes:
   - Clicar "Confirmar alumnes" en una assignació
   - Seleccionar alumnes del centre
   - Confirmar enviament
   - Verificar que l'estat canvia a ACCEPTED

4. Login com a admin i canviar a EJECUCION
```

### Fase 4: EJECUCION

```
1. Login com a professor (via magic link o test)

2. Veure sessions:
   - Anar a /teacher
   - Verificar sessions assignades

3. Passar llista:
   - Clicar en una sessió
   - Anar a /teacher/attendance/:sessionId
   - Marcar assistència (PRESENT/ABSENT/LATE)
   - Guardar

4. Avaluar taller:
   - Anar a /teacher/workshop/:editionId/evaluate
   - Completar formulari de satisfacció
   - Enviar avaluació
```

---

## Tests amb API (cURL)

### Autenticació

```bash
# Login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@enginy.cat","password":"admin123"}'

# Guardar token
TOKEN="eyJhbGciOiJIUzI1NiIs..."

# Verificar usuari
curl http://localhost:3000/api/auth/me \
  -H "Authorization: Bearer $TOKEN"
```

### Catàleg

```bash
# Llistar edicions
curl http://localhost:3000/api/catalog/editions \
  -H "Authorization: Bearer $TOKEN"

# Filtrar per dia
curl "http://localhost:3000/api/catalog/editions?day_of_week=TUESDAY" \
  -H "Authorization: Bearer $TOKEN"
```

### Sol·licituds

```bash
# Llistar sol·licituds
curl http://localhost:3000/api/requests \
  -H "Authorization: Bearer $TOKEN"

# Crear sol·licitud
curl -X POST http://localhost:3000/api/requests \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "edition_id": 1,
    "students_count": 20,
    "preference": "FIRST_CHOICE",
    "teacher_id": 1
  }'

# Enviar sol·licitud
curl -X PUT http://localhost:3000/api/requests/1/submit \
  -H "Authorization: Bearer $TOKEN"
```

### Assignació (Admin)

```bash
# Executar algoritme
curl -X POST http://localhost:3000/api/allocation/run \
  -H "Authorization: Bearer $TOKEN"

# Publicar resultats
curl -X POST http://localhost:3000/api/allocation/publish \
  -H "Authorization: Bearer $TOKEN"

# Llistar assignacions
curl http://localhost:3000/api/allocation \
  -H "Authorization: Bearer $TOKEN"

# Confirmar alumnes
curl -X PUT http://localhost:3000/api/allocation/1/confirm \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"students": [1, 2, 3, 4, 5]}'
```

---

## Tests de Base de Dades

### Verificar Dades de Seed

```sql
-- Connectar
docker exec -it enginy_db psql -U postgres enginy

-- Verificar usuaris
SELECT id, email, role, school_id FROM users;

-- Verificar escoles
SELECT id, name, district FROM schools;

-- Verificar tallers
SELECT w.title, p.name as provider, e.day_of_week, e.max_capacity
FROM workshop_editions e
JOIN workshops w ON e.workshop_id = w.id
JOIN providers p ON w.provider_id = p.id;

-- Verificar sol·licituds
SELECT r.id, s.name as school, w.title as workshop, 
       r.students_count, r.preference, r.status
FROM requests r
JOIN schools s ON r.school_id = s.id
JOIN workshop_editions e ON r.edition_id = e.id
JOIN workshops w ON e.workshop_id = w.id;

-- Verificar període actiu
SELECT name, current_phase, status FROM enrollment_periods;
```

### Reset de Dades

```bash
# Eliminar i recrear BD
docker exec -it enginy_db psql -U postgres -c "DROP DATABASE IF EXISTS enginy"
docker exec -it enginy_db psql -U postgres -c "CREATE DATABASE enginy"

# Carregar esquema
docker exec -i enginy_db psql -U postgres enginy < database/init.sql

# Carregar dades de prova
docker exec -i enginy_db psql -U postgres enginy < database/seed/insert.sql
```

---

## Casos de Prova Específics

### CP-01: Límit de Places

```
Objectiu: Verificar que no es poden sol·licitar més places que la capacitat

1. Obtenir capacitat màxima d'una edició (ex: 25)
2. Crear sol·licituds que sumin més de 25
3. Verificar que l'algoritme assigna el màxim permès
```

### CP-02: Restricció de Fase

```
Objectiu: Verificar que les accions estan bloquejades per fase

1. Estar en fase SOLICITUDES
2. Intentar GET /api/allocation
3. Verificar error 403 amb code INVALID_PHASE
```

### CP-03: Confirmació Nominal

```
Objectiu: Verificar que no es poden confirmar més alumnes que places

1. Tenir una assignació amb 10 places
2. Intentar confirmar 15 alumnes
3. Verificar error de validació
```

### CP-04: Permisos de Rol

```
Objectiu: Verificar que CENTER_COORD no pot executar assignació

1. Login com a coordinador
2. Intentar POST /api/allocation/run
3. Verificar error 403 FORBIDDEN
```

---

## Problemes Comuns

### Error: "No hi ha cap període actiu"

```sql
-- Verificar períodes
SELECT * FROM enrollment_periods;

-- Activar període
UPDATE enrollment_periods SET status = 'ACTIVE' WHERE id = 1;
```

### Error: "Token invàlid"

```bash
# El token ha expirat, tornar a fer login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@enginy.cat","password":"admin123"}'
```

### Error: "Acció no disponible en aquesta fase"

```sql
-- Canviar fase manualment (per testing)
UPDATE enrollment_periods 
SET current_phase = 'PUBLICACION' 
WHERE status = 'ACTIVE';
```

---

## Checklist de Validació

### Abans de Producció

- [ ] Tots els endpoints responen correctament
- [ ] Autenticació funciona per tots els rols
- [ ] Middleware de fases bloqueja correctament
- [ ] Permisos de rol s'apliquen
- [ ] Sol·licituds es creen i envien
- [ ] Algoritme d'assignació funciona
- [ ] Confirmació nominal guarda alumnes
- [ ] Assistència es registra correctament
- [ ] Emails s'envien (magic link)
- [ ] Uploads de documents funcionen
- [ ] No hi ha errors a la consola

---

## Següents Passos

- [🚢 Desplegament](./DEPLOYMENT.md) - Posar en producció
- [📐 Arquitectura](../ARCHITECTURE.md) - Entendre el sistema
- [🔌 API Reference](../api/README.md) - Tots els endpoints
