# ⚙️ Backend

## Visió General

El backend d'Enginy és una API REST construïda amb **Node.js** i **Express**. Segueix una arquitectura modular amb separació clara de responsabilitats.

## Estructura de Carpetes

```
backend/
├── server.js              # Entry point simple
├── package.json           # Dependències
├── Dockerfile             # Contenidor dev
├── Dockerfile.prod        # Contenidor producció
│
└── src/
    ├── main.js            # Configuració Express
    │
    ├── config/
    │   └── db.js          # Connexió PostgreSQL
    │
    ├── common/
    │   ├── jwtHelpers.js  # Utilitats JWT
    │   └── middleware/
    │       ├── authMiddleware.js   # Verificació token
    │       ├── phaseMiddleware.js  # Control de fases
    │       └── validation.js       # Validació d'input
    │
    └── modules/           # Mòduls de negoci
        ├── auth/
        ├── allocation/
        ├── catalog/
        ├── centers/
        ├── classroom/
        ├── enrollment/
        ├── providers/
        ├── requests/
        ├── sessions/
        ├── students/
        ├── teachers/
        └── users/
```

---

## Arquitectura Modular

Cada mòdul segueix la mateixa estructura:

```
modules/example/
├── controller.js   # Handlers HTTP (req, res)
├── routes.js       # Definició de rutes Express
└── service.js      # Lògica de negoci (opcional)
```

### Exemple de Mòdul

```javascript
// routes.js
const express = require('express');
const router = express.Router();
const { authenticate } = require('../../common/middleware/authMiddleware');
const { getAll, getById, create, update, remove } = require('./controller');

router.get('/', authenticate, getAll);
router.get('/:id', authenticate, getById);
router.post('/', authenticate, create);
router.put('/:id', authenticate, update);
router.delete('/:id', authenticate, remove);

module.exports = router;
```

```javascript
// controller.js
const db = require('../../config/db');

const getAll = async (req, res) => {
  try {
    const result = await db.query('SELECT * FROM examples');
    res.json(result.rows);
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: 'Error intern del servidor' });
  }
};

module.exports = { getAll, getById, create, update, remove };
```

---

## Middleware

### 1. Auth Middleware

Verifica el token JWT i afegeix l'usuari al request.

```javascript
// middleware/authMiddleware.js
const jwt = require('jsonwebtoken');

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token no proporcionat' });
  }
  
  const token = authHeader.split(' ')[1];
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token invàlid' });
  }
};

const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user?.role)) {
      return res.status(403).json({ 
        error: 'No tens permisos per aquesta acció',
        required: roles,
        current: req.user?.role
      });
    }
    next();
  };
};

module.exports = { authenticate, requireRole };
```

### 2. Phase Middleware

Controla les accions segons la fase del període.

```javascript
// middleware/phaseMiddleware.js

/**
 * FASES DEL SISTEMA:
 * - SOLICITUDES: Centres creen sol·licituds
 * - ASIGNACION: Admin executa algoritme
 * - PUBLICACION: Resultats visibles, centres confirmen
 * - EJECUCION: Tallers en marxa, professors passen llista
 */

const requirePhase = (allowedPhases, options = {}) => {
  return async (req, res, next) => {
    // Admin bypass si està configurat
    if (options.adminBypass && req.user?.role === 'ADMIN') {
      return next();
    }
    
    // Verificar fase actual
    const period = await getActivePeriodPhase();
    
    if (!period) {
      return res.status(400).json({
        error: 'No hi ha cap període actiu',
        code: 'NO_ACTIVE_PERIOD'
      });
    }
    
    if (!allowedPhases.includes(period.current_phase)) {
      return res.status(403).json({
        error: 'Acció no disponible en aquesta fase',
        code: 'INVALID_PHASE',
        current_phase: period.current_phase,
        allowed_phases: allowedPhases
      });
    }
    
    req.activePeriod = period;
    next();
  };
};

// Middlewares predefinits
const canCreateRequests = requirePhase(['SOLICITUDES'], { 
  allowedRoles: ['CENTER_COORD'] 
});

const canRunAllocation = requirePhase(['ASIGNACION'], { 
  allowedRoles: ['ADMIN'] 
});

const canViewAllocations = requirePhase(['PUBLICACION', 'EJECUCION'], { 
  adminBypass: true 
});

const canTakeAttendance = requirePhase(['EJECUCION'], { 
  allowedRoles: ['TEACHER'] 
});

module.exports = {
  requirePhase,
  canCreateRequests,
  canRunAllocation,
  canViewAllocations,
  canTakeAttendance
};
```

### Diagrama de Fases i Permisos

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        MATRIU DE PERMISOS PER FASE                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│              │ SOLICITUDES │ ASIGNACION │ PUBLICACION │ EJECUCION │        │
│ ─────────────┼─────────────┼────────────┼─────────────┼───────────┤        │
│ Crear        │     ✅      │     ❌     │      ❌     │     ❌    │        │
│ sol·licitud  │  CENTER     │            │             │           │        │
│ ─────────────┼─────────────┼────────────┼─────────────┼───────────┤        │
│ Executar     │     ❌      │     ✅     │      ❌     │     ❌    │        │
│ algoritme    │             │   ADMIN    │             │           │        │
│ ─────────────┼─────────────┼────────────┼─────────────┼───────────┤        │
│ Veure        │     ❌      │     ❌     │      ✅     │     ✅    │        │
│ assignacions │             │            │  CENTER     │  CENTER   │        │
│ ─────────────┼─────────────┼────────────┼─────────────┼───────────┤        │
│ Confirmar    │     ❌      │     ❌     │      ✅     │     ✅    │        │
│ alumnes      │             │            │  CENTER     │  CENTER   │        │
│ ─────────────┼─────────────┼────────────┼─────────────┼───────────┤        │
│ Passar       │     ❌      │     ❌     │      ❌     │     ✅    │        │
│ llista       │             │            │             │  TEACHER  │        │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Connexió a Base de Dades

```javascript
// config/db.js
const { Pool } = require('pg');

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 5432,
  database: process.env.DB_NAME || 'enginy',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
});

// Verificar connexió
pool.connect((err, client, release) => {
  if (err) {
    console.error('Error connectant a PostgreSQL:', err.stack);
  } else {
    console.log('✅ Connectat a PostgreSQL');
    release();
  }
});

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool
};
```

### Ús en Controllers

```javascript
const db = require('../../config/db');

// Query simple
const result = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// Transacció
const client = await db.pool.connect();
try {
  await client.query('BEGIN');
  await client.query('INSERT INTO table1 ...', []);
  await client.query('INSERT INTO table2 ...', []);
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

---

## Mòduls Principals

### Auth Module

Gestiona autenticació JWT i login de professors.

```javascript
// POST /api/auth/login
// Retorna token JWT per usuaris (admin, coordinadors)

// POST /api/auth/teacher-login
// Envia magic link per email als professors

// GET /api/auth/me
// Retorna dades de l'usuari autenticat

// POST /api/auth/verify-token
// Verifica token del magic link de professor
```

### Allocation Module

Gestiona l'algoritme d'assignació i confirmació nominal.

```javascript
// GET /api/allocation
// Llistar assignacions (filtrades per rol)

// POST /api/allocation/run
// Executar algoritme d'assignació (només admin, fase ASIGNACION)

// POST /api/allocation/publish  
// Publicar resultats (canvia fase a PUBLICACION)

// PUT /api/allocation/:id/confirm
// Confirmar alumnes nominalment (fase PUBLICACION/EJECUCION)

// GET /api/allocation/:id
// Detall d'una assignació
```

### Requests Module

Gestiona sol·licituds dels centres.

```javascript
// GET /api/requests
// Llistar sol·licituds

// GET /api/requests/my-requests
// Sol·licituds del centre de l'usuari

// POST /api/requests
// Crear sol·licitud (fase SOLICITUDES)

// PUT /api/requests/:id
// Actualitzar sol·licitud (només DRAFT)

// PUT /api/requests/:id/submit
// Enviar sol·licitud (DRAFT → SUBMITTED)

// DELETE /api/requests/:id
// Eliminar sol·licitud (només DRAFT)
```

### Sessions Module

Gestiona sessions de taller i assistència.

```javascript
// GET /api/sessions
// Llistar sessions

// GET /api/sessions/teacher/:teacherId
// Sessions d'un professor

// POST /api/sessions/:id/attendance
// Registrar assistència (fase EJECUCION)

// POST /api/sessions/:id/evaluation
// Avaluar sessió
```

---

## Gestió d'Errors

### Format Estàndard

```javascript
// Error de validació
res.status(400).json({
  error: 'Dades invàlides',
  code: 'VALIDATION_ERROR',
  details: {
    field: 'email',
    message: 'Format d\'email invàlid'
  }
});

// Error d'autenticació
res.status(401).json({
  error: 'Token invàlid o expirat',
  code: 'INVALID_TOKEN'
});

// Error de permisos
res.status(403).json({
  error: 'No tens permisos per aquesta acció',
  code: 'FORBIDDEN',
  required_role: 'ADMIN',
  current_role: 'CENTER_COORD'
});

// Error de fase
res.status(403).json({
  error: 'Acció no disponible en aquesta fase',
  code: 'INVALID_PHASE',
  current_phase: 'SOLICITUDES',
  allowed_phases: ['PUBLICACION', 'EJECUCION']
});

// Error intern
res.status(500).json({
  error: 'Error intern del servidor',
  code: 'INTERNAL_ERROR'
});
```

### Middleware de Gestió d'Errors

```javascript
// Al final de main.js
app.use((err, req, res, next) => {
  console.error('Error:', err);
  
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: err.message,
      code: 'VALIDATION_ERROR'
    });
  }
  
  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'Token invàlid',
      code: 'INVALID_TOKEN'
    });
  }
  
  res.status(500).json({
    error: 'Error intern del servidor',
    code: 'INTERNAL_ERROR'
  });
});
```

---

## Upload de Fitxers

```javascript
const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/documents/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowed = ['.pdf', '.jpg', '.jpeg', '.png'];
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowed.includes(ext)) {
      cb(null, true);
    } else {
      cb(new Error('Format de fitxer no permès'));
    }
  }
});

// Ús en ruta
router.post('/:id/documents', authenticate, upload.single('document'), uploadDocument);
```

---

## Enviament d'Emails

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS
  }
});

const sendEmail = async (to, subject, html) => {
  await transporter.sendMail({
    from: '"Enginy" <no-reply@enginy.cat>',
    to,
    subject,
    html
  });
};

// Exemple: Magic link per professor
const sendMagicLink = async (email, token) => {
  const link = `${process.env.FRONTEND_URL}/auth/verify?token=${token}`;
  await sendEmail(
    email,
    'Accés a Enginy',
    `<p>Clica <a href="${link}">aquí</a> per accedir a Enginy.</p>`
  );
};
```

---

## Variables d'Entorn

```env
# .env
NODE_ENV=development
PORT=3000

# Base de dades
DB_HOST=localhost
DB_PORT=5432
DB_NAME=enginy
DB_USER=postgres
DB_PASSWORD=postgres

# JWT
JWT_SECRET=your-super-secret-key
JWT_EXPIRES_IN=24h

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=465
SMTP_USER=user@example.com
SMTP_PASS=password

# Frontend
FRONTEND_URL=http://localhost:5173
```

---

## Scripts Disponibles

```bash
# Desenvolupament (amb hot reload)
npm run dev

# Producció
npm start

# Linting
npm run lint
```

---

## Logs i Debugging

```javascript
// Habilitar logs de queries SQL
pool.on('query', (query) => {
  console.log('SQL:', query.text);
  console.log('Params:', query.values);
});

// Logging de requests
app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});
```

---

## Següents Passos

- [📐 Arquitectura](./ARCHITECTURE.md) - Visió general
- [🗄️ Base de Dades](./DATABASE.md) - Esquema i queries
- [🔌 API Reference](./api/README.md) - Tots els endpoints
- [🧪 Testing](./guides/TESTING.md) - Proves
