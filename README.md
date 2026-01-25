# 🎓 Enginy - Plataforma de Gestió de Tallers Educatius

<p align="center">
  <img src="docs/images/logo-placeholder.svg" alt="Enginy Logo" width="200"/>
</p>

<p align="center">
  <strong>Sistema integral per a la gestió d'inscripcions i assignació de tallers educatius</strong>
</p>

<p align="center">
  <a href="#-característiques">Característiques</a> •
  <a href="#-inici-ràpid">Inici Ràpid</a> •
  <a href="#-documentació">Documentació</a> •
  <a href="#-tecnologies">Tecnologies</a>
</p>

---

## 📋 Descripció

**Enginy** és una plataforma web dissenyada per gestionar el procés complet d'inscripció i assignació de tallers educatius a centres escolars. El sistema permet als centres sol·licitar places per als seus alumnes, i a l'administració assignar-les de manera equitativa mitjançant un algoritme intel·ligent.

### 🎯 Objectius del Sistema

- Digitalitzar el procés de sol·licitud de tallers educatius
- Garantir una assignació justa i transparent de places
- Facilitar el seguiment d'assistència i avaluació
- Proporcionar eines de gestió per a totes les parts implicades

---

## ✨ Característiques

### Per a Coordinadors de Centre
- 📝 Sol·licitar places per a tallers del catàleg
- 👥 Gestionar alumnes i professors acompanyants
- 📂 Pujada de documentació (autoritzacions, DNI)
- 📊 Visualitzar assignacions obtingudes
- ✅ Confirmar nominalment els alumnes

### Per a Administradors
- 🎛️ Gestionar períodes d'inscripció i fases
- 📚 Administrar catàleg de tallers i proveïdors
- ⚙️ Executar algoritme d'assignació
- 📈 Monitoritzar sol·licituds i estadístiques
- 📄 Validar documentació d'alumnes

### Per a Professors
- 📋 Passar llista d'assistència
- ⭐ Avaluar competències i tallers
- 👀 Veure els alumnes assignats

---

## 🚀 Inici Ràpid

### Prerequisits

- Docker i Docker Compose
- Node.js 18+ (per a desenvolupament local)
- PostgreSQL 15+ (si no s'usa Docker)

### Instal·lació amb Docker (Recomanat)

```bash
# Clonar el repositori
git clone https://github.com/inspedralbes/tr2-reptes-tr2-grup3.git
cd tr2-reptes-tr2-grup3

# Aixecar els contenidors
docker-compose up -d

# L'aplicació estarà disponible a:
# - Frontend: http://localhost:5173
# - Backend API: http://localhost:3000
# - Base de dades: localhost:5432
```

### Instal·lació Manual

```bash
# Backend
cd backend
npm install
npm run dev

# Frontend (en una altra terminal)
cd frontend
npm install
npm run dev
```

### Credencials de Prova

| Rol | Email | Contrasenya |
|-----|-------|-------------|
| Admin | admin@enginy.cat | admin123 |
| Coordinador | coord@escola-mari.cat | admin123 |
| Professor | jordi.lopez@elroure.cat | admin123 |

---

## 📖 Documentació

Tota la documentació detallada es troba a la carpeta [`/docs`](./docs/):

| Document | Descripció |
|----------|------------|
| [📐 Arquitectura](./docs/ARCHITECTURE.md) | Arquitectura del sistema i components |
| [🔄 Flux de l'Aplicació](./docs/APPLICATION_FLOW.md) | Fases i workflow complet |
| [🗄️ Base de Dades](./docs/DATABASE.md) | Esquema i relacions |
| [🔌 API Reference](./docs/api/README.md) | Documentació dels endpoints |
| [🎨 Frontend](./docs/FRONTEND.md) | Components i estructura |
| [⚙️ Backend](./docs/BACKEND.md) | Mòduls i serveis |
| [🧪 Testing](./docs/guides/TESTING.md) | Guia de proves |
| [🚢 Desplegament](./docs/guides/DEPLOYMENT.md) | Guia de producció |

---

## 🛠️ Tecnologies

<table>
<tr>
<td align="center" width="150">

**Frontend**

</td>
<td>

- React 19 + Vite
- TailwindCSS 4
- React Router DOM 7
- React Hot Toast
- Lucide Icons

</td>
</tr>
<tr>
<td align="center">

**Backend**

</td>
<td>

- Node.js + Express
- PostgreSQL 15
- JWT Authentication
- Multer (uploads)
- Nodemailer

</td>
</tr>
<tr>
<td align="center">

**Infraestructura**

</td>
<td>

- Docker + Docker Compose
- Nginx (producció)
- GitHub Actions (CI/CD)

</td>
</tr>
</table>

---

## 📁 Estructura del Projecte

```
tr2-reptes-tr2-grup3/
├── 📂 backend/              # API REST amb Express
│   ├── src/
│   │   ├── modules/         # Mòduls per funcionalitat
│   │   ├── common/          # Middleware i utilitats
│   │   └── config/          # Configuració BD
│   └── Dockerfile
├── 📂 frontend/             # SPA amb React
│   ├── src/
│   │   ├── pages/           # Pàgines per zona
│   │   ├── components/      # Components reutilitzables
│   │   ├── context/         # Context d'autenticació
│   │   └── api/             # Clients API
│   └── Dockerfile
├── 📂 database/             # Scripts SQL
│   ├── init.sql             # Esquema inicial
│   └── seed/                # Dades de prova
├── 📂 docs/                 # Documentació
│   ├── images/              # Diagrames i esquemes
│   ├── api/                 # Referència API
│   └── guides/              # Guies d'ús
├── 📂 nginx/                # Configuració proxy
├── docker-compose.yml       # Desenvolupament
└── docker-compose.prod.yml  # Producció
```

---

## 🤝 Contribuir

1. Fork del repositori
2. Crear branca feature (`git checkout -b feature/nova-funcionalitat`)
3. Commit dels canvis (`git commit -m 'Afegir nova funcionalitat'`)
4. Push a la branca (`git push origin feature/nova-funcionalitat`)
5. Obrir Pull Request

---

## 📄 Llicència

Aquest projecte està sota la llicència MIT. Veure [LICENSE](./LICENSE) per a més detalls.

---

## 👥 Equip

Desenvolupat per **Grup 3** - Institut Pedralbes, TR2

---

<p align="center">
  <sub>Fet amb ❤️ per a la comunitat educativa</sub>
</p>
