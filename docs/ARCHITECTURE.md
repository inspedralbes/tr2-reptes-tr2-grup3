# 📐 Arquitectura del Sistema

## Visió General

Enginy segueix una arquitectura de **3 capes** amb separació clara entre frontend, backend i base de dades. El sistema està dissenyat per ser escalable, mantenible i fàcil de desplegar mitjançant contenidors Docker.

## Diagrama d'Arquitectura

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                              NAVEGADOR WEB                                   │
│                         (Chrome, Firefox, Safari)                            │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │ HTTPS
                                  ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│                           NGINX (Producció)                                  │
│                        Reverse Proxy + SSL                                   │
│                          Port 80/443                                         │
└─────────────────────────────────┬───────────────────────────────────────────┘
                                  │
                    ┌─────────────┴─────────────┐
                    │                           │
                    ▼                           ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐
│         FRONTEND              │ │          BACKEND              │
│     React + Vite + TailwindCSS│ │      Node.js + Express        │
│         Port 5173             │ │         Port 3000             │
│                               │ │                               │
│  ┌─────────────────────────┐  │ │  ┌─────────────────────────┐  │
│  │      Zones d'Usuari     │  │ │  │    Mòduls de Negoci     │  │
│  │  ┌───────┐ ┌─────────┐  │  │ │  │  ┌──────┐ ┌──────────┐  │  │
│  │  │ Admin │ │ Center  │  │  │ │  │  │ Auth │ │ Requests │  │  │
│  │  └───────┘ └─────────┘  │  │ │  │  └──────┘ └──────────┘  │  │
│  │  ┌─────────────────┐    │  │ │  │  ┌──────┐ ┌──────────┐  │  │
│  │  │    Teacher      │    │  │ │  │  │Alloc │ │ Sessions │  │  │
│  │  └─────────────────┘    │  │ │  │  └──────┘ └──────────┘  │  │
│  └─────────────────────────┘  │ │  └─────────────────────────┘  │
│                               │ │                               │
│  ┌─────────────────────────┐  │ │  ┌─────────────────────────┐  │
│  │    Context & Services   │  │ │  │      Middleware         │  │
│  │  • AuthContext          │  │ │  │  • JWT Auth             │  │
│  │  • API Clients          │  │ │  │  • Phase Control        │  │
│  │  • React Router         │  │ │  │  • Validation           │  │
│  └─────────────────────────┘  │ │  └─────────────────────────┘  │
└───────────────────────────────┘ └───────────────┬───────────────┘
                                                  │
                                                  ▼
                              ┌───────────────────────────────────┐
                              │        BASE DE DADES              │
                              │        PostgreSQL 15              │
                              │          Port 5432                │
                              │                                   │
                              │  ┌─────────────────────────────┐  │
                              │  │     Taules Principals       │  │
                              │  │  • users, schools, teachers │  │
                              │  │  • students, providers      │  │
                              │  │  • workshops, editions      │  │
                              │  │  • requests, allocations    │  │
                              │  │  • sessions, attendance     │  │
                              │  └─────────────────────────────┘  │
                              └───────────────────────────────────┘
```

---

## Components Principals

### 🎨 Frontend (React)

El frontend és una **Single Page Application (SPA)** construïda amb React i Vite.

```
frontend/src/
├── pages/                    # Pàgines organitzades per rol
│   ├── admin/               # Zona administrador
│   │   ├── AdminDashboard   # Dashboard principal
│   │   ├── CatalogManager   # Gestió de tallers
│   │   ├── AllocationPanel  # Executar assignació
│   │   ├── EnrollmentManager# Gestió de períodes
│   │   ├── RequestsMonitor  # Monitor sol·licituds
│   │   ├── ProviderManager  # Gestió proveïdors
│   │   └── CenterManager    # Gestió centres
│   ├── center/              # Zona coordinador
│   │   ├── CenterDashboard  # Dashboard centre
│   │   ├── CatalogBrowser   # Explorar catàleg
│   │   ├── RequestWizard    # Crear sol·licitud
│   │   ├── MyAllocations    # Veure assignacions
│   │   ├── MyRequests       # Les meves sol·licituds
│   │   ├── NominalConfirm.  # Confirmar alumnes
│   │   ├── StudentManager   # Gestió alumnes
│   │   └── TeachersManager  # Gestió professors
│   ├── teacher/             # Zona professor
│   │   ├── TeacherDashboard # Dashboard professor
│   │   ├── MyStudents       # Els meus alumnes
│   │   ├── WorkshopAttend.  # Passar llista
│   │   └── WorkshopEvaluate # Avaluar taller
│   ├── auth/                # Autenticació
│   └── errors/              # Pàgines d'error
├── components/              # Components reutilitzables
│   ├── ui/                  # Button, Card, Modal...
│   ├── common/              # ConfirmModal, etc.
│   ├── layout/              # Navbar, Sidebar
│   └── forms/               # Formularis
├── context/                 # React Context
│   └── AuthContext.jsx      # Estat d'autenticació
├── api/                     # Clients HTTP
│   ├── client.js            # Axios instance
│   └── requests.js          # API calls
└── services/                # Lògica de negoci
```

### ⚙️ Backend (Express)

El backend segueix una arquitectura **modular** amb separació per funcionalitats.

```
backend/src/
├── modules/                 # Mòduls de negoci
│   ├── auth/               # Autenticació
│   │   ├── controller.js   # Handlers HTTP
│   │   ├── routes.js       # Definició rutes
│   │   └── service.js      # Lògica de negoci
│   ├── allocation/         # Assignació de places
│   ├── catalog/            # Catàleg de tallers
│   ├── centers/            # Gestió de centres
│   ├── classroom/          # Aules virtuals
│   ├── enrollment/         # Períodes d'inscripció
│   ├── providers/          # Proveïdors de tallers
│   ├── requests/           # Sol·licituds
│   ├── sessions/           # Sessions i assistència
│   ├── students/           # Alumnes
│   ├── teachers/           # Professors
│   └── users/              # Usuaris
├── common/                 # Codi compartit
│   ├── middleware/         # Middlewares
│   │   ├── authMiddleware  # Verificació JWT
│   │   ├── phaseMiddleware # Control de fases
│   │   └── validation      # Validació input
│   └── jwtHelpers.js       # Utilitats JWT
├── config/                 # Configuració
│   └── db.js               # Connexió PostgreSQL
└── main.js                 # Entry point
```

### 🗄️ Base de Dades (PostgreSQL)

Veure [DATABASE.md](./DATABASE.md) per a l'esquema complet.

---

## Patrons de Disseny

### 1. MVC (Model-View-Controller)
- **Model**: Esquema PostgreSQL + queries
- **View**: Components React
- **Controller**: Express routes + controllers

### 2. Repository Pattern (implícit)
Els controllers accedeixen directament a la BD via `pg`, però amb queries encapsulades.

### 3. Middleware Chain
```
Request → Auth → Phase → Validation → Controller → Response
```

### 4. Context Pattern (Frontend)
```jsx
<AuthProvider>
  <App />
</AuthProvider>
```

---

## Flux de Dades

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│   Frontend   │────►│   Backend    │────►│  PostgreSQL  │
│    React     │     │   Express    │     │              │
└──────────────┘     └──────────────┘     └──────────────┘
       │                    │                    │
       │  1. User Action    │                    │
       ├───────────────────►│                    │
       │                    │  2. SQL Query      │
       │                    ├───────────────────►│
       │                    │                    │
       │                    │  3. Result Set     │
       │                    │◄───────────────────┤
       │  4. JSON Response  │                    │
       │◄───────────────────┤                    │
       │                    │                    │
       │  5. Update UI      │                    │
       │                    │                    │
```

---

## Seguretat

### Autenticació
- **JWT (JSON Web Tokens)** per a usuaris web
- **Magic Links** per a professors (sense contrasenya)
- Tokens amb expiració de 24h

### Autorització
- **Middleware de rol**: Verifica `ADMIN`, `CENTER_COORD`, `TEACHER`
- **Middleware de fase**: Controla accions segons la fase del període

### Protecció de Dades
- Contrasenyes hashejades amb bcrypt
- Variables d'entorn per a secrets
- CORS configurat per a dominis autoritzats

---

## Escalabilitat

### Actual (Monòlit)
- Tots els mòduls en un sol backend
- Adequat per a volum actual

### Futur (Microserveis)
Es podrien separar:
- Servei d'Autenticació
- Servei de Sol·licituds
- Servei d'Assignació
- Servei de Notificacions

---

## Entorns

| Entorn | URL | Descripció |
|--------|-----|------------|
| Desenvolupament | localhost:5173 | Docker Compose local |
| Staging | staging.enginy.cat | Pre-producció |
| Producció | enginy.cat | Entorn real |

---

## Tecnologies i Versions

| Component | Tecnologia | Versió |
|-----------|------------|--------|
| Frontend Runtime | Node.js | 18.x |
| Frontend Framework | React | 18.x |
| Build Tool | Vite | 5.x |
| CSS Framework | TailwindCSS | 3.x |
| Backend Runtime | Node.js | 18.x |
| Backend Framework | Express | 4.x |
| Base de Dades | PostgreSQL | 15.x |
| Contenidors | Docker | 24.x |
| Orquestració | Docker Compose | 2.x |

---

## Següents Passos

- [🔄 Flux de l'Aplicació](./APPLICATION_FLOW.md) - Entendre les fases del sistema
- [🗄️ Base de Dades](./DATABASE.md) - Esquema i relacions
- [🔌 API Reference](./api/README.md) - Endpoints disponibles
