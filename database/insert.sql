-- ==================================================================
-- SCRIPT DE TESTING: DATOS COMPLETOS PARA PROBAR TODO EL FLUJO
-- ==================================================================
-- Este script inserta datos de prueba para testear:
-- 1. Fase SOLICITUDES: Crear solicitudes desde centros
-- 2. Fase ASIGNACION: Admin ejecuta algoritmo
-- 3. Fase PUBLICACION: Centros ven asignaciones, confirman alumnos
-- 4. Fase EJECUCION: Profesores pasan lista, evalúan
-- ==================================================================

-- 0. INSERTAR USUARIOS PARA AUTENTICACIÓN
-- Password: 'admin123' para todos (hash bcrypt)
-- NOTA: Solo ADMIN y CENTER_COORD están en tabla users
-- Los profesores acompañantes están en tabla teachers (con password para login)
INSERT INTO users (email, password_hash, full_name, role) VALUES 
    ('admin@enginy.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Admin Enginy', 'ADMIN'),
    ('coord1@baixeras.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Marta García (Coord. Baixeras)', 'CENTER_COORD'),
    ('coord2@ciutadella.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Joan Puig (Coord. Ciutadella)', 'CENTER_COORD'),
    ('coord3@verdaguer.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Anna López (Coord. Verdaguer)', 'CENTER_COORD'),
    ('coord4@polvorin.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Pere Vidal (Coord. Polvorí)', 'CENTER_COORD'),
    ('coord5@canclos.cat', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG', 'Laura Martí (Coord. Can Clos)', 'CENTER_COORD')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
    -- Variables para IDs generados
    v_period_id UUID;
    
    -- Proveedores
    v_prov_ismab UUID; 
    v_prov_impulsem UUID; 
    v_prov_santpere UUID;
    v_prov_biciclot UUID; 
    v_prov_colomer UUID; 
    v_prov_vela UUID;
    
    -- Centros
    v_school_baixeras UUID;
    v_school_ciutadella UUID;
    v_school_verdaguer UUID;
    v_school_polvorin UUID;
    v_school_canclos UUID;
    
    -- Workshops y ediciones
    v_workshop_id UUID;
    v_edition_id UUID;
    v_edition_jardineria_2t UUID;
    v_edition_jardineria_3t UUID;
    v_edition_tecnolab_2t UUID;
    v_edition_serigrafia_2t UUID;
    v_edition_cuina_2t UUID;
    v_edition_bici_2t UUID;
    
    -- Allocations para vincular estudiantes
    v_alloc_baixeras_jardineria UUID;
    v_alloc_ciutadella_jardineria UUID;
    v_alloc_verdaguer_tecnolab UUID;
    v_alloc_polvorin_serigrafia UUID;
    v_alloc_canclos_cuina UUID;
    
    -- Teachers
    v_teacher_baixeras_1 UUID;
    v_teacher_baixeras_2 UUID;
    v_teacher_ciutadella_1 UUID;
    v_teacher_verdaguer_1 UUID;
    v_teacher_polvorin_1 UUID;
    v_teacher_canclos_1 UUID;
    
    -- Students
    v_student_id UUID;
    
    -- Sessions
    v_session_id UUID;
    
BEGIN
    -- ==================================================================
    -- 1. CREAR PERÍODO DE INSCRIPCIÓN PARA TESTING
    -- ==================================================================
    -- Configuramos las fases para poder probar cada una:
    -- - SOLICITUDES: Ahora hasta febrero (para poder crear solicitudes)
    -- - PUBLICACION: Febrero
    -- - EJECUCION: Marzo en adelante
    
    INSERT INTO enrollment_periods (
        name, status, current_phase,
        phase_solicitudes_start, phase_solicitudes_end,
        phase_publicacion_start, phase_publicacion_end,
        phase_ejecucion_start, phase_ejecucion_end
    )
    VALUES (
        'ENGINY 2025-2026 Testing', 
        'ACTIVE', 
        'SOLICITUDES',  -- Empezamos en fase de solicitudes para testing
        '2025-09-01 08:00:00', '2026-02-15 23:59:59',  -- Solicitudes
        '2026-02-20 08:00:00', '2026-02-28 23:59:59',  -- Publicación
        '2026-03-01 08:00:00', '2026-06-30 14:00:00'   -- Ejecución
    )
    RETURNING id INTO v_period_id;

    RAISE NOTICE 'Período creado: %', v_period_id;

    -- ==================================================================
    -- 2. CREAR PROVEEDORES
    -- ==================================================================
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('ISMAB (Institut de Sostenibilitat)', 'C/ Mollerussa, 71', 'info@ismab.cat') 
    RETURNING id INTO v_prov_ismab;
    
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('Impulsem SCCL', 'C/ Tàpies, 6', 'info@impulsem.cat') 
    RETURNING id INTO v_prov_impulsem;
    
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('Centre Sant Pere 1892', 'C/ Sant Pere Més Alt, 25', 'info@santpere.cat') 
    RETURNING id INTO v_prov_santpere;
    
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('Biciclot', 'C/ de la Verneda, 16-18', 'info@biciclot.cat') 
    RETURNING id INTO v_prov_biciclot;
    
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('Centre Formació Colomer', 'C/ Leiva, 17-19', 'info@colomer.cat') 
    RETURNING id INTO v_prov_colomer;
    
    INSERT INTO providers (name, address, contact_email) VALUES 
        ('Centre Municipal de Vela', 'Port Olímpic, Moll de Gregal, 33', 'info@vela.bcn.cat') 
    RETURNING id INTO v_prov_vela;

    RAISE NOTICE 'Proveedores creados';

    -- ==================================================================
    -- 3. CREAR CENTROS EDUCATIVOS CON COORDINADORES
    -- ==================================================================
    INSERT INTO schools (name, code, address, municipality, coordinator_user_id) VALUES 
        ('Escola Baixeras', '08001595', 'Av. Francesc Cambó, 8', 'Barcelona',
         (SELECT id FROM users WHERE email = 'coord1@baixeras.cat'))
    RETURNING id INTO v_school_baixeras;
    
    INSERT INTO schools (name, code, address, municipality, coordinator_user_id) VALUES 
        ('Escola Parc de la Ciutadella', '08001601', 'Pg. Circumval·lació, 8', 'Barcelona',
         (SELECT id FROM users WHERE email = 'coord2@ciutadella.cat'))
    RETURNING id INTO v_school_ciutadella;
    
    INSERT INTO schools (name, code, address, municipality, coordinator_user_id) VALUES 
        ('Escola Mossén Jacint Verdaguer', '08001649', 'C/ Roger de Flor, 309', 'Barcelona',
         (SELECT id FROM users WHERE email = 'coord3@verdaguer.cat'))
    RETURNING id INTO v_school_verdaguer;
    
    INSERT INTO schools (name, code, address, municipality, coordinator_user_id) VALUES 
        ('Escola El Polvorí', '08001650', 'C/ Mare de Déu de Port, 257', 'Barcelona',
         (SELECT id FROM users WHERE email = 'coord4@polvorin.cat'))
    RETURNING id INTO v_school_polvorin;
    
    INSERT INTO schools (name, code, address, municipality, coordinator_user_id) VALUES 
        ('Escola Can Clos', '08001674', 'Pg. de la Zona Franca, 118', 'Barcelona',
         (SELECT id FROM users WHERE email = 'coord5@canclos.cat'))
    RETURNING id INTO v_school_canclos;

    RAISE NOTICE 'Centros creados con coordinadores';

    -- ==================================================================
    -- 4. CREAR PROFESORES POR CADA CENTRO (CON PASSWORD PARA LOGIN)
    -- ==================================================================
    -- Password: 'admin123' para todos (hash bcrypt)
    -- Escola Baixeras
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Jordi López', 'jordi.lopez@baixeras.cat', '611223344', v_school_baixeras, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_baixeras_1;
    
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Carla Fernández', 'carla.fernandez@baixeras.cat', '622334455', v_school_baixeras, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_baixeras_2;
    
    -- Escola Ciutadella
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Marc Soler', 'marc.soler@ciutadella.cat', '633445566', v_school_ciutadella, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_ciutadella_1;
    
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Nuria Camps', 'nuria.camps@ciutadella.cat', '644556677', v_school_ciutadella, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG');
    
    -- Escola Verdaguer
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Albert Roca', 'albert.roca@verdaguer.cat', '655667788', v_school_verdaguer, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_verdaguer_1;
    
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Elena Mas', 'elena.mas@verdaguer.cat', '666778899', v_school_verdaguer, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG');
    
    -- Escola El Polvorí
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('David Gómez', 'david.gomez@polvorin.cat', '677889900', v_school_polvorin, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_polvorin_1;
    
    -- Escola Can Clos
    INSERT INTO teachers (full_name, email, phone_number, school_id, password_hash) VALUES
        ('Sandra Pérez', 'sandra.perez@canclos.cat', '688990011', v_school_canclos, '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
    RETURNING id INTO v_teacher_canclos_1;

    RAISE NOTICE 'Profesores creados (con login habilitado)';

    -- ==================================================================
    -- 5. CREAR ALUMNOS POR CADA CENTRO
    -- ==================================================================
    -- Escola Baixeras (4 alumnos para poder llenar 2 talleres)
    INSERT INTO students (nombre_completo, email, curso, check_acuerdo_pedagogico, 
                         check_autorizacion_movilidad, check_derechos_imagen, nivel_absentismo, school_id) VALUES
        ('Marc García Martínez', 'marc.garcia@baixeras.cat', '3 ESO', 1, 1, 1, 1, v_school_baixeras),
        ('Laia Puig Costa', 'laia.puig@baixeras.cat', '4 ESO', 1, 1, 0, 2, v_school_baixeras),
        ('Pau Vidal Serra', 'pau.vidal@baixeras.cat', '3 ESO', 1, 0, 1, 1, v_school_baixeras),
        ('Anna López Roca', 'anna.lopez@baixeras.cat', '4 ESO', 0, 1, 1, 3, v_school_baixeras);
    
    -- Escola Ciutadella (3 alumnos)
    INSERT INTO students (nombre_completo, email, curso, check_acuerdo_pedagogico, 
                         check_autorizacion_movilidad, check_derechos_imagen, nivel_absentismo, school_id) VALUES
        ('Júlia Mas Font', 'julia.mas@ciutadella.cat', '3 ESO', 1, 1, 1, 1, v_school_ciutadella),
        ('Oriol Camps Pla', 'oriol.camps@ciutadella.cat', '4 ESO', 1, 1, 1, 2, v_school_ciutadella),
        ('Berta Solé Mir', 'berta.sole@ciutadella.cat', '3 ESO', 1, 1, 1, 1, v_school_ciutadella);
    
    -- Escola Verdaguer (4 alumnos)
    INSERT INTO students (nombre_completo, email, curso, check_acuerdo_pedagogico, 
                         check_autorizacion_movilidad, check_derechos_imagen, nivel_absentismo, school_id) VALUES
        ('Arnau Ferrer Gil', 'arnau.ferrer@verdaguer.cat', '3 ESO', 1, 1, 1, 1, v_school_verdaguer),
        ('Martina Sala Bosch', 'martina.sala@verdaguer.cat', '4 ESO', 1, 1, 0, 2, v_school_verdaguer),
        ('Jan Torres Gómez', 'jan.torres@verdaguer.cat', '3 ESO', 1, 1, 1, 1, v_school_verdaguer),
        ('Aina Prat Valls', 'aina.prat@verdaguer.cat', '4 ESO', 1, 0, 1, 4, v_school_verdaguer);
    
    -- Escola El Polvorí (3 alumnos)
    INSERT INTO students (nombre_completo, email, curso, check_acuerdo_pedagogico, 
                         check_autorizacion_movilidad, check_derechos_imagen, nivel_absentismo, school_id) VALUES
        ('Eric Muñoz López', 'eric.munoz@polvorin.cat', '3 ESO', 1, 1, 1, 2, v_school_polvorin),
        ('Clàudia Ruiz Pérez', 'claudia.ruiz@polvorin.cat', '4 ESO', 0, 1, 1, 3, v_school_polvorin),
        ('Hugo Martínez Vidal', 'hugo.martinez@polvorin.cat', '3 ESO', 1, 1, 1, 1, v_school_polvorin);
    
    -- Escola Can Clos (4 alumnos)
    INSERT INTO students (nombre_completo, email, curso, check_acuerdo_pedagogico, 
                         check_autorizacion_movilidad, check_derechos_imagen, nivel_absentismo, school_id) VALUES
        ('Noa Sánchez Riera', 'noa.sanchez@canclos.cat', '3 ESO', 1, 1, 1, 1, v_school_canclos),
        ('Leo Navarro Pons', 'leo.navarro@canclos.cat', '4 ESO', 1, 1, 1, 2, v_school_canclos),
        ('Emma Giménez Blanco', 'emma.gimenez@canclos.cat', '3 ESO', 1, 1, 0, 1, v_school_canclos),
        ('Pol Fernández Soler', 'pol.fernandez@canclos.cat', '4 ESO', 1, 0, 1, 5, v_school_canclos);

    RAISE NOTICE 'Alumnos creados';

    -- ==================================================================
    -- 6. CREAR TALLERES Y EDICIONES
    -- ==================================================================
    
    -- TALLER: JARDINERIA
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Jardineria', 'Taller de jardineria sostenible i horticultura urbana', 
         'Medi ambient i sostenibilitat', false, v_prov_ismab) 
    RETURNING id INTO v_workshop_id;
    
    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00', 16, 4) 
    RETURNING id INTO v_edition_jardineria_2t;
    
    -- Edición 3r Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00', 16, 4) 
    RETURNING id INTO v_edition_jardineria_3t;

    -- TALLER: TECNOLAB MAKERS
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Tecnolab Makers', 'Introducció a la fabricació digital i prototipatge', 
         'Tecnològic', true, v_prov_ismab) 
    RETURNING id INTO v_workshop_id;
    
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00', 16, 4) 
    RETURNING id INTO v_edition_tecnolab_2t;

    -- TALLER: SERIGRAFIA
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Serigrafia', 'Tècniques bàsiques d''estampació serigràfica', 
         'Indústria-manufactura', false, v_prov_impulsem) 
    RETURNING id INTO v_workshop_id;
    
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00', 16, 4) 
    RETURNING id INTO v_edition_serigrafia_2t;

    -- TALLER: CUINA COMUNITÀRIA
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Cuina Comunitària', 'Aprèn a cuinar en equip i coneix la gastronomia local', 
         'Hoteleria-Indústries alimentàries', false, v_prov_colomer) 
    RETURNING id INTO v_workshop_id;
    
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '10:00', '13:00', 16, 4) 
    RETURNING id INTO v_edition_cuina_2t;

    -- TALLER: MECÀNICA DE BICICLETA
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Mecànica de la Bicicleta', 'Aprèn a reparar i mantenir la teva bici', 
         'Indústria 4.0', false, v_prov_biciclot) 
    RETURNING id INTO v_workshop_id;
    
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'TUESDAY', '09:00', '12:00', 16, 4) 
    RETURNING id INTO v_edition_bici_2t;

    -- TALLER: VELA
    INSERT INTO workshops (title, description, ambit, is_new, provider_id) VALUES 
        ('Vela', 'Iniciació a la navegació a vela al Port Olímpic', 
         'Esportiu, oci i benestar', true, v_prov_vela) 
    RETURNING id INTO v_workshop_id;
    
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, 
                                   start_time, end_time, capacity_total, max_per_school)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00', 16, 4);

    RAISE NOTICE 'Talleres y ediciones creados';

    -- ==================================================================
    -- 7. CREAR ASIGNACIONES (ALLOCATIONS) - Simular después de algoritmo
    -- ==================================================================
    -- Baixeras -> Jardineria 2T (2 plazas)
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) 
    VALUES (v_edition_jardineria_2t, v_school_baixeras, 2, 'PUBLISHED')
    RETURNING id INTO v_alloc_baixeras_jardineria;
    
    -- Ciutadella -> Jardineria 2T (2 plazas)
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) 
    VALUES (v_edition_jardineria_2t, v_school_ciutadella, 2, 'PUBLISHED')
    RETURNING id INTO v_alloc_ciutadella_jardineria;
    
    -- Verdaguer -> Tecnolab 2T (3 plazas)
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) 
    VALUES (v_edition_tecnolab_2t, v_school_verdaguer, 3, 'PUBLISHED')
    RETURNING id INTO v_alloc_verdaguer_tecnolab;
    
    -- Polvorí -> Serigrafia 2T (2 plazas)
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) 
    VALUES (v_edition_serigrafia_2t, v_school_polvorin, 2, 'PUBLISHED')
    RETURNING id INTO v_alloc_polvorin_serigrafia;
    
    -- Can Clos -> Cuina 2T (3 plazas)
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) 
    VALUES (v_edition_cuina_2t, v_school_canclos, 3, 'PUBLISHED')
    RETURNING id INTO v_alloc_canclos_cuina;
    
    -- Más asignaciones para otros centros
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_jardineria_2t, v_school_verdaguer, 2, 'PUBLISHED'),
        (v_edition_jardineria_2t, v_school_polvorin, 2, 'PUBLISHED'),
        (v_edition_tecnolab_2t, v_school_baixeras, 2, 'PUBLISHED'),
        (v_edition_tecnolab_2t, v_school_ciutadella, 2, 'PUBLISHED'),
        (v_edition_serigrafia_2t, v_school_baixeras, 2, 'PUBLISHED'),
        (v_edition_serigrafia_2t, v_school_canclos, 2, 'PUBLISHED'),
        (v_edition_cuina_2t, v_school_baixeras, 2, 'PUBLISHED'),
        (v_edition_bici_2t, v_school_verdaguer, 3, 'PUBLISHED'),
        (v_edition_bici_2t, v_school_polvorin, 3, 'PUBLISHED');

    RAISE NOTICE 'Asignaciones creadas';

    -- ==================================================================
    -- 8. VINCULAR ALUMNOS A ASIGNACIONES (Confirmación nominal)
    -- ==================================================================
    -- Baixeras -> Jardineria: Marc García y Laia Puig
    INSERT INTO allocation_students (allocation_id, student_id, status)
    SELECT v_alloc_baixeras_jardineria, id, 'ACTIVE'
    FROM students WHERE nombre_completo IN ('Marc García Martínez', 'Laia Puig Costa')
    AND school_id = v_school_baixeras;
    
    -- Ciutadella -> Jardineria: Júlia Mas y Oriol Camps
    INSERT INTO allocation_students (allocation_id, student_id, status)
    SELECT v_alloc_ciutadella_jardineria, id, 'ACTIVE'
    FROM students WHERE nombre_completo IN ('Júlia Mas Font', 'Oriol Camps Pla')
    AND school_id = v_school_ciutadella;
    
    -- Verdaguer -> Tecnolab: Arnau, Martina, Jan
    INSERT INTO allocation_students (allocation_id, student_id, status)
    SELECT v_alloc_verdaguer_tecnolab, id, 'ACTIVE'
    FROM students WHERE nombre_completo IN ('Arnau Ferrer Gil', 'Martina Sala Bosch', 'Jan Torres Gómez')
    AND school_id = v_school_verdaguer;
    
    -- Polvorí -> Serigrafia: Eric y Clàudia
    INSERT INTO allocation_students (allocation_id, student_id, status)
    SELECT v_alloc_polvorin_serigrafia, id, 'ACTIVE'
    FROM students WHERE nombre_completo IN ('Eric Muñoz López', 'Clàudia Ruiz Pérez')
    AND school_id = v_school_polvorin;
    
    -- Can Clos -> Cuina: Noa, Leo, Emma
    INSERT INTO allocation_students (allocation_id, student_id, status)
    SELECT v_alloc_canclos_cuina, id, 'ACTIVE'
    FROM students WHERE nombre_completo IN ('Noa Sánchez Riera', 'Leo Navarro Pons', 'Emma Giménez Blanco')
    AND school_id = v_school_canclos;

    RAISE NOTICE 'Alumnos vinculados a asignaciones';

    -- ==================================================================
    -- 9. ASIGNAR PROFESORES REFERENTES A TALLERES
    -- ==================================================================
    INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_id, is_main_referent) VALUES
        (v_edition_jardineria_2t, v_teacher_baixeras_1, true),
        (v_edition_jardineria_2t, v_teacher_ciutadella_1, false),
        (v_edition_tecnolab_2t, v_teacher_verdaguer_1, true),
        (v_edition_serigrafia_2t, v_teacher_polvorin_1, true),
        (v_edition_cuina_2t, v_teacher_canclos_1, true),
        (v_edition_cuina_2t, v_teacher_baixeras_2, false);

    RAISE NOTICE 'Profesores referentes asignados';

    -- ==================================================================
    -- 10. CREAR SESIONES DE TALLER (10 sesiones por edición)
    -- ==================================================================
    -- Jardineria 2T - 10 sesiones empezando el 9 de enero 2026 (jueves)
    INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled) VALUES
        (v_edition_jardineria_2t, 1, '2026-01-15', false),
        (v_edition_jardineria_2t, 2, '2026-01-22', false),
        (v_edition_jardineria_2t, 3, '2026-01-29', false),
        (v_edition_jardineria_2t, 4, '2026-02-05', false),
        (v_edition_jardineria_2t, 5, '2026-02-12', false),
        (v_edition_jardineria_2t, 6, '2026-02-19', false),
        (v_edition_jardineria_2t, 7, '2026-02-26', false),
        (v_edition_jardineria_2t, 8, '2026-03-05', false),
        (v_edition_jardineria_2t, 9, '2026-03-12', false),
        (v_edition_jardineria_2t, 10, '2026-03-19', false);
    
    -- Tecnolab 2T - 10 sesiones
    INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled) VALUES
        (v_edition_tecnolab_2t, 1, '2026-01-15', false),
        (v_edition_tecnolab_2t, 2, '2026-01-22', false),
        (v_edition_tecnolab_2t, 3, '2026-01-29', false),
        (v_edition_tecnolab_2t, 4, '2026-02-05', false),
        (v_edition_tecnolab_2t, 5, '2026-02-12', false),
        (v_edition_tecnolab_2t, 6, '2026-02-19', false),
        (v_edition_tecnolab_2t, 7, '2026-02-26', false),
        (v_edition_tecnolab_2t, 8, '2026-03-05', false),
        (v_edition_tecnolab_2t, 9, '2026-03-12', false),
        (v_edition_tecnolab_2t, 10, '2026-03-19', false);
    
    -- Serigrafia 2T - 10 sesiones
    INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled) VALUES
        (v_edition_serigrafia_2t, 1, '2026-01-15', false),
        (v_edition_serigrafia_2t, 2, '2026-01-22', false),
        (v_edition_serigrafia_2t, 3, '2026-01-29', false),
        (v_edition_serigrafia_2t, 4, '2026-02-05', false),
        (v_edition_serigrafia_2t, 5, '2026-02-12', false),
        (v_edition_serigrafia_2t, 6, '2026-02-19', false),
        (v_edition_serigrafia_2t, 7, '2026-02-26', false),
        (v_edition_serigrafia_2t, 8, '2026-03-05', false),
        (v_edition_serigrafia_2t, 9, '2026-03-12', false),
        (v_edition_serigrafia_2t, 10, '2026-03-19', false);
    
    -- Cuina 2T - 10 sesiones
    INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled) VALUES
        (v_edition_cuina_2t, 1, '2026-01-15', false),
        (v_edition_cuina_2t, 2, '2026-01-22', false),
        (v_edition_cuina_2t, 3, '2026-01-29', false),
        (v_edition_cuina_2t, 4, '2026-02-05', false),
        (v_edition_cuina_2t, 5, '2026-02-12', false),
        (v_edition_cuina_2t, 6, '2026-02-19', false),
        (v_edition_cuina_2t, 7, '2026-02-26', false),
        (v_edition_cuina_2t, 8, '2026-03-05', false),
        (v_edition_cuina_2t, 9, '2026-03-12', false),
        (v_edition_cuina_2t, 10, '2026-03-19', false);
    
    -- Bici 2T - 10 sesiones (martes)
    INSERT INTO workshop_sessions (workshop_edition_id, session_number, date, is_cancelled) VALUES
        (v_edition_bici_2t, 1, '2026-01-13', false),
        (v_edition_bici_2t, 2, '2026-01-20', false),
        (v_edition_bici_2t, 3, '2026-01-27', false),
        (v_edition_bici_2t, 4, '2026-02-03', false),
        (v_edition_bici_2t, 5, '2026-02-10', false),
        (v_edition_bici_2t, 6, '2026-02-17', false),
        (v_edition_bici_2t, 7, '2026-02-24', false),
        (v_edition_bici_2t, 8, '2026-03-03', false),
        (v_edition_bici_2t, 9, '2026-03-10', false),
        (v_edition_bici_2t, 10, '2026-03-17', false);

    RAISE NOTICE 'Sesiones de taller creadas';

    -- ==================================================================
    -- 11. INSERTAR ALGUNOS REGISTROS DE ASISTENCIA (Para testing)
    -- ==================================================================
    -- Obtener primera sesión de Jardineria
    SELECT id INTO v_session_id FROM workshop_sessions 
    WHERE workshop_edition_id = v_edition_jardineria_2t AND session_number = 1;
    
    -- Registrar asistencia de la primera sesión
    FOR v_student_id IN 
        SELECT s.id FROM students s
        JOIN allocation_students als ON s.id = als.student_id
        WHERE als.allocation_id = v_alloc_baixeras_jardineria
    LOOP
        INSERT INTO attendance_logs (session_id, student_id, status, observation)
        VALUES (v_session_id, v_student_id, 'PRESENT', 'Primera sessió - Assistència correcta');
    END LOOP;
    
    FOR v_student_id IN 
        SELECT s.id FROM students s
        JOIN allocation_students als ON s.id = als.student_id
        WHERE als.allocation_id = v_alloc_ciutadella_jardineria
    LOOP
        INSERT INTO attendance_logs (session_id, student_id, status, observation)
        VALUES (v_session_id, v_student_id, 'PRESENT', NULL);
    END LOOP;

    RAISE NOTICE 'Registros de asistencia creados';

    -- ==================================================================
    -- 12. CREAR DOCUMENTOS DE EJEMPLO (Autorizaciones)
    -- ==================================================================
    -- Documentos para Marc García
    INSERT INTO student_documents (student_id, document_type, file_url, is_verified)
    SELECT id, 'AUTORITZACIO_IMATGE', '/uploads/documents/marc_garcia_img.pdf', true
    FROM students WHERE nombre_completo = 'Marc García Martínez';
    
    INSERT INTO student_documents (student_id, document_type, file_url, is_verified)
    SELECT id, 'AUTORITZACIO_SORTIDA', '/uploads/documents/marc_garcia_sortida.pdf', true
    FROM students WHERE nombre_completo = 'Marc García Martínez';
    
    -- Documentos para Laia Puig (parcial)
    INSERT INTO student_documents (student_id, document_type, file_url, is_verified)
    SELECT id, 'AUTORITZACIO_IMATGE', '/uploads/documents/laia_puig_img.pdf', false
    FROM students WHERE nombre_completo = 'Laia Puig Costa';

    RAISE NOTICE 'Documentos de ejemplo creados';

    -- ==================================================================
    -- 13. CREAR SOLICITUDES DE EJEMPLO (Para testing fase SOLICITUDES)
    -- ==================================================================
    -- Solicitud de Baixeras (ya enviada)
    INSERT INTO requests (enrollment_period_id, school_id, is_first_time_participation, 
                         available_for_tuesdays, teacher_comments, submitted_at, status)
    VALUES (v_period_id, v_school_baixeras, false, true, 
            'Interesados especialmente en talleres tecnológicos y medioambientales',
            NOW(), 'SUBMITTED');
    
    -- Solicitud de Ciutadella (borrador)
    INSERT INTO requests (enrollment_period_id, school_id, is_first_time_participation, 
                         available_for_tuesdays, status)
    VALUES (v_period_id, v_school_ciutadella, true, false, 'DRAFT');

    RAISE NOTICE 'Solicitudes de ejemplo creadas';

    RAISE NOTICE '====================================';
    RAISE NOTICE 'DATOS DE TESTING INSERTADOS CORRECTAMENTE';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'USUARIOS DISPONIBLES:';
    RAISE NOTICE '  - admin@enginy.cat (ADMIN)';
    RAISE NOTICE '  - coord1@baixeras.cat (CENTER_COORD)';
    RAISE NOTICE '  - coord2@ciutadella.cat (CENTER_COORD)';
    RAISE NOTICE '  - coord3@verdaguer.cat (CENTER_COORD)';
    RAISE NOTICE '  - coord4@polvorin.cat (CENTER_COORD)';
    RAISE NOTICE '  - coord5@canclos.cat (CENTER_COORD)';
    RAISE NOTICE 'PASSWORD: admin123 (para todos)';
    RAISE NOTICE '====================================';
    RAISE NOTICE 'FASE ACTUAL: SOLICITUDES';
    RAISE NOTICE 'Para cambiar fase: PUT /api/enrollment/periods/:id/advance-phase';
    RAISE NOTICE '====================================';

END $$;

-- ==================================================================
-- CONSULTAS DE VERIFICACIÓN (ejecutar después para comprobar datos)
-- ==================================================================
-- SELECT 'Períodos' as tabla, count(*) as total FROM enrollment_periods;
-- SELECT 'Usuarios' as tabla, count(*) as total FROM users;
-- SELECT 'Centros' as tabla, count(*) as total FROM schools;
-- SELECT 'Profesores' as tabla, count(*) as total FROM teachers;
-- SELECT 'Alumnos' as tabla, count(*) as total FROM students;
-- SELECT 'Talleres' as tabla, count(*) as total FROM workshops;
-- SELECT 'Ediciones' as tabla, count(*) as total FROM workshop_editions;
-- SELECT 'Asignaciones' as tabla, count(*) as total FROM allocations;
-- SELECT 'Sesiones' as tabla, count(*) as total FROM workshop_sessions;
