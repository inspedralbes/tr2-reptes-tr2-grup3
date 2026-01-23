# Database - Enginy

## Estructura de carpetas

```
database/
├── init.sql              # Esquema base de la BD (se ejecuta automáticamente al levantar Docker)
├── migrations/           # Migraciones para actualizar esquema existente
│   ├── add_tutor_fields.sql
│   ├── 03_add_priority_and_preferences.sql
│   └── add_teacher_student_notes.sql
├── seed/                 # Datos de prueba (NO se ejecutan automáticamente)
│   └── insert.sql        # Datos completos de prueba
└── data/                 # Archivos de datos externos (CSV, etc.)
    ├── alumnos_export.csv
    ├── centros_secundaria_barcelona.csv
    └── ...
```

## Uso

### Levantar BD limpia (solo esquema)
```bash
docker compose up postgres -d
```
Esto solo ejecuta `init.sql` y crea las tablas vacías.

### Insertar datos de prueba (opcional)
```bash
docker exec -i enginy_postgres psql -U admin -d enginy_db < database/seed/insert.sql
```

### Ejecutar migraciones (en BD existente)
Si la BD ya tiene datos y necesitas aplicar cambios de esquema:
```bash
docker exec -i enginy_postgres psql -U admin -d enginy_db < database/migrations/add_teacher_student_notes.sql
```

### Resetear BD completa
```bash
docker compose down -v
docker compose up postgres -d
# Esperar unos segundos y luego insertar datos de prueba si los necesitas
docker exec -i enginy_postgres psql -U admin -d enginy_db < database/seed/insert.sql
```

## Migraciones incluidas

1. **add_tutor_fields.sql** - Añade campos de tutor (nombre, email, teléfono) a students
2. **03_add_priority_and_preferences.sql** - Añade prioridad a request_items y tabla de preferencias de profesores
3. **add_teacher_student_notes.sql** - Tabla para notas personales del profesor sobre alumnos
