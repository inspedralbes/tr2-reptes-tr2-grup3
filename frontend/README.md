# ENGINY - Frontend TypeScript + React

Arquitectura moderna de frontend con React 19, TypeScript, Vite y Tailwind CSS.

## 📋 Estructura del Proyecto

```
src/
├── assets/           # Imágenes y recursos estáticos
├── components/
│   ├── ui/          # Componentes base (Button, Card, Input, Modal, Badge)
│   ├── layout/      # Layouts (Navbar, Sidebar, LayoutMain, LayoutAuth)
│   └── forms/       # Componentes de formularios (LoginForm, RequestWizardSteps, etc.)
├── context/         # AuthContext.tsx (gestión de autenticación)
├── hooks/           # Custom hooks (useAuth, useWorkshops, useRequests)
├── pages/           # Páginas de aplicación
│   ├── Login.tsx
│   ├── NotFound.tsx
│   ├── admin/       # Vistas ADMIN
│   └── center/      # Vistas CENTER
├── services/        # API calls (auth, catalog, requests)
├── types/           # TypeScript interfaces
├── App.tsx          # Router principal con PrivateRoute guards
├── main.tsx         # Entry point
└── index.css        # Estilos globales Tailwind
```

## 🚀 Inicio Rápido

### Con Docker (Recomendado)

```bash
# En la raíz del proyecto
docker-compose up

# Frontend estará disponible en: http://localhost:5173
# Backend estará disponible en: http://localhost:3000
```

### Sin Docker (Desarrollo Local)

```bash
cd frontend
npm install
npm run dev
```

Asegúrate de que el archivo `.env.local` tenga la configuración correcta:
```
VITE_API_URL=http://localhost:3000/api
```

## 🔑 Variables de Entorno

### `.env` (Docker)
```
VITE_API_URL=http://backend:3000/api
```

### `.env.local` (Desarrollo Local)
```
VITE_API_URL=http://localhost:3000/api
```

## 📦 Dependencias Principales

- **react** ^19.2.3 - Framework UI
- **react-router-dom** ^7.10.1 - Enrutamiento
- **typescript** ^5.9.3 - Tipado estático
- **tailwindcss** ^4.1.18 - Estilos CSS
- **react-hook-form** ^7.68.0 - Gestión de formularios
- **axios** ^1.13.2 - Cliente HTTP
- **clsx** ^2.1.1 - Utilidad para classNames

## 🛠️ Scripts disponibles

```bash
npm run dev          # Inicia el servidor de desarrollo
npm run build        # Compila para producción
npm run preview      # Vista previa de la compilación
npm run type-check   # Verifica tipos TypeScript
```

## 🔐 Autenticación

### AuthContext.tsx
- Gestiona el estado de sesión del usuario
- Almacena el token JWT en `localStorage`
- Proporciona métodos `login()` y `logout()`
- Interfaz `AuthContextType` tipada

### API Service (services/api.ts)
- Instancia de Axios preconfigurada
- Interceptor automático de Bearer token
- Manejo automático de errores 401

## 🛣️ Rutas Protegidas

### Admin Routes (`/admin`)
- `/admin/dashboard` - Dashboard principal
- `/admin/workshops` - Gestión de talleres
- `/admin/allocation` - Panel de asignación

### Center Routes (`/center`)
- `/center/catalog` - Catálogo de talleres
- `/center/request` - Solicitud de talleres (Wizard)
- `/center/allocations` - Mis asignaciones

## 📱 Componentes Disponibles

### UI Base
- **Button** - Botón con variantes (primary, secondary, danger, ghost)
- **Card** - Contenedor con bordes y sombra
- **Input** - Campo de texto con validación
- **Modal** - Diálogo modal
- **Badge** - Etiqueta pequeña

### Forms
- **LoginForm** - Formulario de autenticación
- **RequestWizardSteps** - Wizard multi-paso
- **StudentCounter** - Selector de cantidad
- **TeacherPrefSelector** - Matriz de selección

## 🎨 Tailwind CSS

Configuración en `tailwind.config.js`. Los estilos están optimizados para:
- Modo oscuro opcional
- Responsivas (móvil-first)
- Accesibilidad

## ✨ Características

- ✅ TypeScript estricto
- ✅ Autenticación JWT
- ✅ Guards de rutas protegidas por rol
- ✅ Formularios con React Hook Form
- ✅ Diseño modular y escalable
- ✅ Componentes reutilizables
- ✅ Hot Module Replacement (HMR) en desarrollo
- ✅ Build optimizado para producción

## 🔗 Integración Backend

El frontend se conecta al backend en `/api`:

```typescript
// services/api.ts
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
```

Endpoints esperados:
- `POST /auth/login` - Login
- `GET /auth/me` - Obtener perfil
- `GET /catalog/workshops` - Listar talleres
- `GET /requests` - Listar solicitudes
- `POST /requests` - Crear solicitud

## 🐛 Debugging

Para ver logs de Redux DevTools:
1. Instala la extensión en tu navegador
2. Los logs aparecerán automáticamente en development

## 📚 Recursos

- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs)
- [Tailwind CSS](https://tailwindcss.com)
- [Vite Guide](https://vitejs.dev)

---

**Versión:** 1.0.0  
**Última actualización:** 2025-12-17
