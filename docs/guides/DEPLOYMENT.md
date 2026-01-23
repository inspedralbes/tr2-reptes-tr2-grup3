# 🚢 Guia de Desplegament

## Visió General

Aquesta guia explica com desplegar Enginy en diferents entorns, des de desenvolupament local fins a producció.

---

## Entorns

| Entorn | Propòsit | URL |
|--------|----------|-----|
| **Local** | Desenvolupament | localhost:5173 |
| **Staging** | Pre-producció | staging.enginy.cat |
| **Producció** | Entorn real | enginy.cat |

---

## Desenvolupament Local

### Opció 1: Docker Compose (Recomanat)

```bash
# Clonar repositori
git clone https://github.com/inspedralbes/tr2-reptes-tr2-grup3.git
cd tr2-reptes-tr2-grup3

# Aixecar tots els serveis
docker-compose up -d

# Verificar contenidors
docker-compose ps

# Veure logs
docker-compose logs -f

# Aturar
docker-compose down
```

**Serveis:**
- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- PostgreSQL: localhost:5432

### Opció 2: Sense Docker

```bash
# Prerequisits
# - Node.js 18+
# - PostgreSQL 15+

# Crear base de dades
createdb enginy
psql enginy < database/init.sql
psql enginy < database/seed/insert.sql

# Backend
cd backend
cp .env.example .env  # Configurar variables
npm install
npm run dev

# Frontend (altra terminal)
cd frontend
cp .env.example .env
npm install
npm run dev
```

---

## Producció amb Docker

### docker-compose.prod.yml

```yaml
version: '3.8'

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.prod
    restart: always
    
  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.prod
    restart: always
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_NAME=enginy
      - DB_USER=${DB_USER}
      - DB_PASSWORD=${DB_PASSWORD}
      - JWT_SECRET=${JWT_SECRET}
    depends_on:
      - db
      
  db:
    image: postgres:15-alpine
    restart: always
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      - POSTGRES_DB=enginy
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
      
  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
      - ./nginx/ssl:/etc/nginx/ssl
    depends_on:
      - frontend
      - backend

volumes:
  postgres_data:
```

### Desplegament

```bash
# Copiar fitxers al servidor
scp -r . user@server:/var/www/enginy

# Al servidor
cd /var/www/enginy

# Crear .env amb variables de producció
cat > .env << EOF
DB_USER=enginy_user
DB_PASSWORD=super_secure_password
JWT_SECRET=production_jwt_secret_key
EOF

# Construir i aixecar
docker-compose -f docker-compose.prod.yml up -d --build

# Verificar
docker-compose -f docker-compose.prod.yml ps
```

---

## Configuració de Nginx

### nginx/nginx.conf (Producció)

```nginx
events {
    worker_connections 1024;
}

http {
    include       /etc/nginx/mime.types;
    default_type  application/octet-stream;

    # Logging
    access_log /var/log/nginx/access.log;
    error_log /var/log/nginx/error.log;

    # Gzip
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;

    # Upstream servers
    upstream frontend {
        server frontend:80;
    }

    upstream backend {
        server backend:3000;
    }

    # HTTP → HTTPS redirect
    server {
        listen 80;
        server_name enginy.cat www.enginy.cat;
        return 301 https://$server_name$request_uri;
    }

    # HTTPS server
    server {
        listen 443 ssl http2;
        server_name enginy.cat www.enginy.cat;

        # SSL certificates
        ssl_certificate /etc/nginx/ssl/fullchain.pem;
        ssl_certificate_key /etc/nginx/ssl/privkey.pem;

        # SSL configuration
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256;
        ssl_prefer_server_ciphers off;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;

        # API
        location /api {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://backend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        # Uploads
        location /uploads {
            proxy_pass http://backend/uploads;
            client_max_body_size 10M;
        }

        # Frontend
        location / {
            proxy_pass http://frontend;
            proxy_http_version 1.1;
            proxy_set_header Host $host;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_cache_bypass $http_upgrade;
        }
    }
}
```

---

## SSL amb Let's Encrypt

### Instal·lació de Certbot

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install certbot

# Obtenir certificat
sudo certbot certonly --standalone -d enginy.cat -d www.enginy.cat

# Els certificats es guarden a:
# /etc/letsencrypt/live/enginy.cat/fullchain.pem
# /etc/letsencrypt/live/enginy.cat/privkey.pem

# Copiar a carpeta del projecte
sudo cp /etc/letsencrypt/live/enginy.cat/*.pem nginx/ssl/

# Renovació automàtica (cron)
0 0 * * * certbot renew --quiet && docker-compose -f docker-compose.prod.yml restart nginx
```

---

## Variables d'Entorn de Producció

### Backend (.env)

```env
NODE_ENV=production
PORT=3000

# Base de dades
DB_HOST=db
DB_PORT=5432
DB_NAME=enginy
DB_USER=enginy_user
DB_PASSWORD=super_secure_password_here

# JWT
JWT_SECRET=production_jwt_secret_minimum_32_chars
JWT_EXPIRES_IN=24h

# Email (producció)
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=465
SMTP_USER=apikey
SMTP_PASS=SG.xxxxx

# URLs
FRONTEND_URL=https://enginy.cat
API_URL=https://enginy.cat/api
```

### Frontend (.env)

```env
VITE_API_URL=https://enginy.cat/api
VITE_APP_NAME=Enginy
```

---

## Backup i Restauració

### Backup Automàtic

```bash
#!/bin/bash
# backup.sh

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR=/var/backups/enginy

# Crear directori
mkdir -p $BACKUP_DIR

# Backup PostgreSQL
docker exec enginy_db pg_dump -U postgres enginy > $BACKUP_DIR/db_$DATE.sql

# Backup uploads
tar -czf $BACKUP_DIR/uploads_$DATE.tar.gz /var/www/enginy/backend/uploads

# Eliminar backups antics (>7 dies)
find $BACKUP_DIR -type f -mtime +7 -delete

echo "Backup completat: $DATE"
```

```bash
# Cron per backup diari a les 3:00
0 3 * * * /var/www/enginy/scripts/backup.sh >> /var/log/enginy_backup.log 2>&1
```

### Restaurar Backup

```bash
# Restaurar BD
docker exec -i enginy_db psql -U postgres enginy < /var/backups/enginy/db_20260115_030000.sql

# Restaurar uploads
tar -xzf /var/backups/enginy/uploads_20260115_030000.tar.gz -C /var/www/enginy/backend/
```

---

## Monitorització

### Health Checks

```bash
# Backend health
curl -f https://enginy.cat/api/health || echo "Backend DOWN"

# Frontend
curl -f https://enginy.cat || echo "Frontend DOWN"

# PostgreSQL
docker exec enginy_db pg_isready -U postgres
```

### Script de Monitorització

```bash
#!/bin/bash
# monitor.sh

ENDPOINTS=(
    "https://enginy.cat/api/health"
    "https://enginy.cat"
)

for endpoint in "${ENDPOINTS[@]}"; do
    status=$(curl -s -o /dev/null -w "%{http_code}" $endpoint)
    if [ $status -ne 200 ]; then
        echo "ALERT: $endpoint returned $status"
        # Enviar notificació (email, Slack, etc.)
    fi
done
```

### Logs

```bash
# Veure logs de tots els serveis
docker-compose -f docker-compose.prod.yml logs -f

# Logs d'un servei específic
docker-compose -f docker-compose.prod.yml logs -f backend

# Logs d'Nginx
docker exec enginy_nginx tail -f /var/log/nginx/access.log
docker exec enginy_nginx tail -f /var/log/nginx/error.log
```

---

## CI/CD amb GitHub Actions

### .github/workflows/deploy.yml

```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
          
      - name: Install dependencies
        run: |
          cd backend && npm ci
          cd ../frontend && npm ci
          
      - name: Run linting
        run: |
          cd backend && npm run lint
          cd ../frontend && npm run lint

  deploy:
    needs: test
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to server
        uses: appleboy/ssh-action@master
        with:
          host: ${{ secrets.SERVER_HOST }}
          username: ${{ secrets.SERVER_USER }}
          key: ${{ secrets.SSH_PRIVATE_KEY }}
          script: |
            cd /var/www/enginy
            git pull origin main
            docker-compose -f docker-compose.prod.yml up -d --build
            docker system prune -f
```

---

## Checklist de Desplegament

### Abans del Deploy

- [ ] Tests passats
- [ ] Variables d'entorn configurades
- [ ] Backup de BD creat
- [ ] SSL certificats vàlids

### Després del Deploy

- [ ] Health checks OK
- [ ] Login funciona
- [ ] API respon correctament
- [ ] Frontend carrega
- [ ] No errors a logs

### Rollback

```bash
# Si alguna cosa falla
cd /var/www/enginy
git checkout HEAD~1
docker-compose -f docker-compose.prod.yml up -d --build
```

---

## Escalar

### Horitzontal

```yaml
# docker-compose.prod.yml
services:
  backend:
    deploy:
      replicas: 3
```

### Vertical

```yaml
services:
  db:
    deploy:
      resources:
        limits:
          cpus: '2'
          memory: 4G
```

---

## Següents Passos

- [📐 Arquitectura](../ARCHITECTURE.md) - Entendre el sistema
- [🧪 Testing](./TESTING.md) - Validar abans de producció
- [🔌 API Reference](../api/README.md) - Documentació API
