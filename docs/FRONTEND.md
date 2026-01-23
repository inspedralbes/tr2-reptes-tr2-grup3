# 🎨 Frontend

## Visió General

El frontend d'Enginy és una **Single Page Application (SPA)** construïda amb React 18 i Vite. Utilitza TailwindCSS per l'estilització i React Router per la navegació.

## Estructura de Carpetes

```
frontend/src/
├── App.jsx                 # Component principal amb rutes
├── main.jsx               # Entry point
├── index.css              # Estils globals + Tailwind
│
├── api/                   # Clients HTTP
│   ├── client.js          # Instància Axios configurada
│   ├── auth.js            # Endpoints d'autenticació
│   ├── catalog.js         # Endpoints de catàleg
│   └── requests.js        # Endpoints de sol·licituds
│
├── context/               # React Context
│   └── AuthContext.jsx    # Estat global d'autenticació
│
├── components/            # Components reutilitzables
│   ├── ui/               # Components bàsics
│   │   ├── Button.jsx
│   │   ├── Card.jsx
│   │   ├── Input.jsx
│   │   └── Modal.jsx
│   ├── common/           # Components compartits
│   │   └── ConfirmModal.jsx
│   ├── layout/           # Estructura de pàgina
│   │   ├── Navbar.jsx
│   │   └── Sidebar.jsx
│   └── forms/            # Formularis
│
├── pages/                # Pàgines organitzades per zona
│   ├── auth/
│   │   └── Login.jsx
│   ├── errors/
│   │   ├── NotFound.jsx
│   │   └── Forbidden.jsx
│   ├── admin/           # 🔴 Zona Administrador
│   │   ├── AdminDashboard.jsx
│   │   ├── CatalogManager.jsx
│   │   ├── WorkshopDetail.jsx
│   │   ├── AllocationPanel.jsx
│   │   ├── EnrollmentManager.jsx
│   │   ├── RequestsMonitor.jsx
│   │   ├── ProviderManager.jsx
│   │   └── CenterManager.jsx
│   ├── center/          # 🟢 Zona Coordinador
│   │   ├── CenterDashboard.jsx
│   │   ├── CatalogBrowser.jsx
│   │   ├── RequestWizard.jsx
│   │   ├── MyAllocations.jsx
│   │   ├── MyRequests.jsx
│   │   ├── RequestDetail.jsx
│   │   ├── NominalConfirmation.jsx
│   │   ├── StudentManager.jsx
│   │   └── TeachersManager.jsx
│   └── teacher/         # 🔵 Zona Professor
│       ├── TeacherDashboard.jsx
│       ├── MyStudents.jsx
│       ├── WorkshopAttendance.jsx
│       └── WorkshopEvaluate.jsx
│
├── services/            # Lògica de negoci
│   ├── api.js
│   ├── auth.service.js
│   ├── catalog.service.js
│   └── request.service.js
│
└── types/              # Definicions de tipus
    ├── index.js
    ├── request.types.js
    └── user.types.js
```

---

## Rutes de l'Aplicació

### Diagrama de Navegació

```
                                    ┌─────────────┐
                                    │   /login    │
                                    └──────┬──────┘
                                           │
                    ┌──────────────────────┼──────────────────────┐
                    │                      │                      │
                    ▼                      ▼                      ▼
            ┌───────────────┐      ┌───────────────┐      ┌───────────────┐
            │    /admin     │      │    /center    │      │   /teacher    │
            │  (Dashboard)  │      │  (Dashboard)  │      │  (Dashboard)  │
            └───────┬───────┘      └───────┬───────┘      └───────┬───────┘
                    │                      │                      │
        ┌───────────┼───────────┐          │          ┌───────────┼───────────┐
        │           │           │          │          │           │           │
        ▼           ▼           ▼          │          ▼           ▼           ▼
    /catalog   /allocation  /providers     │     /students  /attendance  /evaluate
        │           │           │          │                   /:id        /:id
        ▼           │           │          │
    /:editionId     │           │          │
                    │           │          │
                    │           │          ├────────────────────┐
                    │           │          │                    │
                    │           │          ▼                    ▼
                    │           │      /catalog            /allocations
                    │           │          │                    │
                    │           │          ▼                    ▼
                    │           │      /request         /allocation/:id
                    │           │          │               /confirm
                    │           │          ▼
                    │           │      /requests
                    │           │          │
                    │           │          ▼
                    │           │     /request/:id
```

### Taula de Rutes

| Ruta | Component | Rol | Descripció |
|------|-----------|-----|------------|
| `/login` | Login | Públic | Pàgina d'accés |
| `/admin` | AdminDashboard | ADMIN | Dashboard administrador |
| `/admin/catalog` | CatalogManager | ADMIN | Gestió de tallers |
| `/admin/catalog/:editionId` | WorkshopDetail | ADMIN | Detall d'edició |
| `/admin/providers` | ProviderManager | ADMIN | Gestió proveïdors |
| `/admin/centers` | CenterManager | ADMIN | Gestió centres |
| `/admin/allocation` | AllocationPanel | ADMIN | Panel d'assignació |
| `/admin/enrollment` | EnrollmentManager | ADMIN | Gestió períodes |
| `/admin/requests` | RequestsMonitor | ADMIN | Monitor sol·licituds |
| `/center` | CenterDashboard | CENTER_COORD | Dashboard centre |
| `/center/catalog` | CatalogBrowser | CENTER_COORD | Explorar tallers |
| `/center/request` | RequestWizard | CENTER_COORD | Nova sol·licitud |
| `/center/allocations` | MyAllocations | CENTER_COORD | Veure assignacions |
| `/center/allocation/:id/confirm` | NominalConfirmation | CENTER_COORD | Confirmar alumnes |
| `/center/requests` | MyRequests | CENTER_COORD | Les meves sol·licituds |
| `/center/request/:id` | RequestDetail | CENTER_COORD | Detall sol·licitud |
| `/center/teachers` | TeachersManager | CENTER_COORD | Gestió professors |
| `/center/students` | StudentManager | CENTER_COORD | Gestió alumnes |
| `/teacher` | TeacherDashboard | TEACHER | Dashboard professor |
| `/teacher/students` | MyStudents | TEACHER | Els meus alumnes |
| `/teacher/attendance/:sessionId` | WorkshopAttendance | TEACHER | Passar llista |
| `/teacher/workshop/:editionId/evaluate` | WorkshopEvaluate | TEACHER | Avaluar taller |

---

## Components Principals

### AuthContext

Gestiona l'estat d'autenticació global.

```jsx
// Ús
import { useAuth } from './context/AuthContext';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  return <div>Hola {user.first_name}</div>;
}
```

**Estat disponible:**
```javascript
{
  user: {
    id: 1,
    email: "admin@enginy.cat",
    role: "ADMIN",
    first_name: "Admin",
    last_name: "Enginy",
    school_id: null,
    school_name: null
  },
  isAuthenticated: true,
  loading: false
}
```

---

### ProtectedRoute

Component que protegeix rutes autenticades.

```jsx
<Route 
  path="/admin" 
  element={
    <ProtectedRoute>
      <AdminDashboard />
    </ProtectedRoute>
  } 
/>
```

---

### Layout (Navbar + Sidebar)

```
┌─────────────────────────────────────────────────────────────┐
│  🎓 Enginy                           [User] [▼] [Logout]    │  ← Navbar
├─────────────┬───────────────────────────────────────────────┤
│             │                                               │
│  Dashboard  │                                               │
│  Catàleg    │           CONTINGUT PRINCIPAL                │
│  Sol·lic.   │                                               │
│  Alumnes    │             (React Router Outlet)             │
│  Profes.    │                                               │
│             │                                               │
├─────────────┴───────────────────────────────────────────────┤
│  ← Sidebar                                                  │
└─────────────────────────────────────────────────────────────┘
```

El Sidebar mostra opcions diferents segons el rol:

**ADMIN:**
- Dashboard
- Catàleg
- Proveïdors
- Centres
- Assignació
- Períodes
- Sol·licituds

**CENTER_COORD:**
- Dashboard
- Catàleg
- Sol·licitar
- Les meves sol·licituds
- Assignacions
- Alumnes
- Professors

**TEACHER:**
- Dashboard
- Els meus alumnes
- Passar llista

---

## Components UI

### Button

```jsx
import Button from './components/ui/Button';

<Button variant="primary" size="md" onClick={handleClick}>
  Guardar
</Button>

<Button variant="secondary" size="sm" disabled>
  Cancel·lar
</Button>

<Button variant="danger" loading>
  Eliminant...
</Button>
```

**Props:**
| Prop | Tipus | Default | Valors |
|------|-------|---------|--------|
| `variant` | string | "primary" | primary, secondary, danger, ghost |
| `size` | string | "md" | sm, md, lg |
| `disabled` | boolean | false | - |
| `loading` | boolean | false | - |
| `className` | string | "" | Classes addicionals |

---

### Card

```jsx
import Card from './components/ui/Card';

<Card>
  <Card.Header>
    <h2>Títol</h2>
  </Card.Header>
  <Card.Body>
    Contingut
  </Card.Body>
  <Card.Footer>
    <Button>Acció</Button>
  </Card.Footer>
</Card>
```

---

### ConfirmModal

```jsx
import ConfirmModal from './components/common/ConfirmModal';

const [showModal, setShowModal] = useState(false);

<ConfirmModal
  isOpen={showModal}
  onClose={() => setShowModal(false)}
  onConfirm={handleDelete}
  title="Eliminar element"
  message="Estàs segur que vols eliminar aquest element?"
  variant="danger"
  confirmText="Eliminar"
/>
```

---

## Client API

### Configuració Base

```javascript
// api/client.js
import axios from 'axios';

const client = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor per afegir token
client.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default client;
```

### Ús

```javascript
import client from './api/client';

// GET
const response = await client.get('/catalog/editions');

// POST
const response = await client.post('/requests', {
  edition_id: 1,
  students_count: 20
});

// PUT
await client.put(`/requests/${id}`, data);

// DELETE
await client.delete(`/students/${id}`);
```

---

## Estils amb TailwindCSS

### Colors del Tema

```css
/* tailwind.config.js */
colors: {
  primary: {
    50: '#eff6ff',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
  },
  // Zones
  admin: '#dc2626',    // Vermell
  center: '#16a34a',   // Verd
  teacher: '#2563eb',  // Blau
}
```

### Classes Comunes

```jsx
// Card
<div className="bg-white rounded-xl border border-gray-200 shadow-sm p-4">

// Badge d'estat
<span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
  Actiu
</span>

// Grid responsive
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">

// Formulari
<div className="space-y-4">
  <label className="block text-sm font-medium text-gray-700">
    Nom
  </label>
  <input className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500" />
</div>
```

---

## Icones (Lucide)

```jsx
import { 
  Home, Users, BookOpen, Calendar, 
  Check, X, Plus, Edit, Trash,
  ChevronDown, ChevronRight, Menu
} from 'lucide-react';

<Home size={20} className="text-gray-500" />
<Users size={16} />
<BookOpen className="w-6 h-6 text-blue-600" />
```

---

## Notificacions (React Hot Toast)

```jsx
import toast from 'react-hot-toast';

// Èxit
toast.success('Sol·licitud enviada correctament');

// Error
toast.error('Error al guardar els canvis');

// Personalitzat
toast.custom((t) => (
  <div className={`${t.visible ? 'animate-enter' : 'animate-leave'}`}>
    Notificació personalitzada
  </div>
));
```

---

## Variables d'Entorn

```env
# .env
VITE_API_URL=http://localhost:3000/api
VITE_APP_NAME=Enginy
```

Accés:
```javascript
const apiUrl = import.meta.env.VITE_API_URL;
```

---

## Scripts Disponibles

```bash
# Desenvolupament
npm run dev

# Build producció
npm run build

# Preview build
npm run preview

# Linting
npm run lint
```

---

## Següents Passos

- [📐 Arquitectura](./ARCHITECTURE.md) - Visió general
- [🔌 API Reference](./api/README.md) - Endpoints disponibles
- [⚙️ Backend](./BACKEND.md) - Integració amb backend
