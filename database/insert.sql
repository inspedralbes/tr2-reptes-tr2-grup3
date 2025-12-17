-- ==================================================================
-- SCRIPT LIMPIO: POBLADO DE DATOS REALES (Modalitat C)
-- ==================================================================

-- 0. INSERTAR USUARIOS PARA AUTENTICACIÓN (fuera del bloque DO)
-- Password hash para 'admin123' usando bcrypt
INSERT INTO users (email, password_hash, full_name, role) VALUES 
    ('admin@enginy.cat', '$2b$10$4YzRJfMt.qJvE9RAMjVnUeqbY7gJ4FZH2dEK3C8vhqGPkXoZvMOYO', 'Admin Enginy', 'ADMIN'),
    ('coord1@escola1.cat', '$2b$10$4YzRJfMt.qJvE9RAMjVnUeqbY7gJ4FZH2dEK3C8vhqGPkXoZvMOYO', 'Coordinador Escola 1', 'CENTER_COORD'),
    ('coord2@escola2.cat', '$2b$10$4YzRJfMt.qJvE9RAMjVnUeqbY7gJ4FZH2dEK3C8vhqGPkXoZvMOYO', 'Coordinador Escola 2', 'CENTER_COORD'),
    ('teacher@enginy.cat', '$2b$10$4YzRJfMt.qJvE9RAMjVnUeqbY7gJ4FZH2dEK3C8vhqGPkXoZvMOYO', 'Professor Referent', 'TEACHER')
ON CONFLICT (email) DO NOTHING;

DO $$
DECLARE
    -- Variables para guardar los IDs generados
    v_period_id UUID;
    v_prov_ismab UUID; v_prov_impulsem UUID; v_prov_santpere UUID;
    v_prov_biciclot UUID; v_prov_colomer UUID; v_prov_vela UUID;
    v_prov_ugt UUID; v_prov_sinai UUID; v_prov_ferrantallada UUID;
    v_prov_mundet UUID; v_prov_escolatreball UUID; v_prov_picasso UUID;
    v_prov_tmb UUID; v_prov_abaoaqu UUID; v_prov_artixoc UUID;
    
    v_workshop_id UUID;
    v_edition_id UUID;
BEGIN

    -- 1. INSERTAR EL PERIODO DE INSCRIPCIÓN
    INSERT INTO enrollment_periods (name, start_date_requests, end_date_requests, publication_date, status)
    VALUES ('Enginy 2025-2026 - Modalitat C', '2024-09-30 13:00:00', '2024-10-10 23:59:59', '2024-10-20 10:00:00', 'PUBLISHED')
    RETURNING id INTO v_period_id;

    -- 2. INSERTAR PROVEEDORES
    INSERT INTO providers (name, address) VALUES 
        ('ISMAB (Institut de Sostenibilitat i Medi Ambient)', 'C/ Mollerussa, 71') RETURNING id INTO v_prov_ismab;
    INSERT INTO providers (name, address) VALUES 
        ('Impulsem', 'C/ Tàpies, 6') RETURNING id INTO v_prov_impulsem;
    INSERT INTO providers (name, address) VALUES 
        ('Centre Sant Pere 1892', 'Carrer de Sant Pere Més Alt, 25') RETURNING id INTO v_prov_santpere;
    INSERT INTO providers (name, address) VALUES 
        ('Biciclot', 'C/ de la Verneda, 16-18') RETURNING id INTO v_prov_biciclot;
    INSERT INTO providers (name, address) VALUES 
        ('Centre Formació Colomer', 'C/ Leiva, 17-19') RETURNING id INTO v_prov_colomer;
    INSERT INTO providers (name, address) VALUES 
        ('Centre Municipal de Vela', 'Port Olímpic, Molí de Gregal, 33') RETURNING id INTO v_prov_vela;
    INSERT INTO providers (name, address) VALUES 
        ('Jaume Fargas (UGT)', 'Rambla de Santa Mònica, 10') RETURNING id INTO v_prov_ugt;
    INSERT INTO providers (name, address) VALUES 
        ('Granja escola Sinai', 'C/ de la Indústria, 137') RETURNING id INTO v_prov_sinai;
    INSERT INTO providers (name, address) VALUES 
        ('INS Ferran Tallada', 'C/ Gran Vista, 54') RETURNING id INTO v_prov_ferrantallada;
    INSERT INTO providers (name, address) VALUES 
        ('INS Anna Gironella de Mundet', 'C/ d''Olympe de Gouges, s/n') RETURNING id INTO v_prov_mundet;
    INSERT INTO providers (name, address) VALUES 
        ('INS Escola de Treball', 'C/ Urgell') RETURNING id INTO v_prov_escolatreball;
    INSERT INTO providers (name, address) VALUES 
        ('Museu Picasso', 'C/ Montcada, 15-23') RETURNING id INTO v_prov_picasso;
    INSERT INTO providers (name, address) VALUES 
        ('TMB', 'La Sagrera / Confluència Felip II') RETURNING id INTO v_prov_tmb;
    INSERT INTO providers (name, address) VALUES 
        ('Abaoaqu', 'A determinar') RETURNING id INTO v_prov_abaoaqu;
    INSERT INTO providers (name, address) VALUES 
        ('Artixoc', 'Rambla de Badal, 53') RETURNING id INTO v_prov_artixoc;

    -- 3. INSERTAR CENTROS EDUCATIVOS
    INSERT INTO schools (name, code) VALUES 
        ('CEE Josep Pla', 'UNK-001'), ('INS Puigverd', 'UNK-002'), ('INS Poeta Maragall', 'UNK-003'), 
        ('IE El Til·ler', 'UNK-004'), ('Escola Fasià Sarrià', 'UNK-005'), ('IE Tramuntana', 'UNK-006'),
        ('INS Maria Espinalt', 'UNK-007'), ('Escola Faisà Eixample', 'UNK-008'), ('IE Rec Comtal', 'UNK-009'),
        ('IE Trinitat Nova', 'UNK-010'), ('INS L''Alzina', 'UNK-011'), ('INS Sants', 'UNK-012'),
        ('INS Joan Salvat Papasseit', 'UNK-013'), ('INS Coves d''en Cimany', 'UNK-014'), ('INS Jaume Balmes', 'UNK-015'),
        ('INS Milà i Fontanals', 'UNK-016'), ('INS Salvador Espriu', 'UNK-017'), ('INS Pau Claris', 'UNK-018'),
        ('Escola Lexia', 'UNK-019'), ('IE Eixample', 'UNK-020'), ('INS Consell de Cent', 'UNK-021'),
        ('IE Arts', 'UNK-022'), ('INS Angeleta Ferrer', 'UNK-023'), ('IE Mirades', 'UNK-024'),
        ('CEE La Ginesta', 'UNK-025'), ('INS Joan Brossa', 'UNK-026'), ('INS Flos i Calcat', 'UNK-027'),
        ('INS Anna Gironella de Mundet', 'UNK-028'), ('INS Bernat Metge', 'UNK-029'), ('INS Fort Pius', 'UNK-030'),
        ('INS El Joncar', 'UNK-031'), ('INS Eixample', 'UNK-032'), ('INS J. Serrat i Bonastre', 'UNK-033'),
        ('INS Vila de Gràcia', 'UNK-034'), ('INS Nou Barris', 'UNK-035'), ('INS Caterina Albert', 'UNK-036'),
        ('INS Montserrat', 'UNK-037'), ('Reprèn Pro', 'UNK-038')
    ON CONFLICT (code) DO NOTHING;

    -- =======================================================================
    -- 4. INSERTAR TALLERES (WORKSHOPS) Y EDICIONES
    -- =======================================================================

    -- TALLER: JARDINERIA
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Jardineria', 'Medi ambient i sostenibilitat', v_prov_ismab) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;

    -- Asignaciones Jardineria 2n Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE Josep Pla'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Fasià Sarrià'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Faisà Eixample'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Rec Comtal'), 4, 'PUBLISHED');

    -- Edición 3r Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    
    -- Asignaciones Jardineria 3r Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Caterina Albert'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 2, 'PUBLISHED');


    -- TALLER: TECNOLAB MAKERS
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Tecnolab Makers', 'Tecnològic', v_prov_ismab) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    
    -- Asignaciones Tecnolab 2n Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Jaume Balmes'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 2, 'PUBLISHED');

    -- Edición 3r Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;

    -- Asignaciones Tecnolab 3r Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED');


    -- TALLER: SERIGRAFIA
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Serigrafia', 'Indústria-manufactura', v_prov_impulsem) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;

    -- Asignaciones Serigrafia 2n Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Lexia'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED');


    -- TALLER: TEATRE (SABER PARLAR EN PUBLIC)
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Saber parlar en públic - Tècniques bàsiques', 'Arts escèniques', v_prov_santpere) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves, Horario a determinar, ponemos 09:00 default)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;

    -- Asignaciones Teatre 2n Trim
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 1, 'PUBLISHED');


    -- TALLER: OFICIS GASTRONOMICS
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Oficis Gastronòmics', 'Oci i benestar-Restauració', v_prov_impulsem) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Flos i Calcat'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 2, 'PUBLISHED');

    -- Edición 2n Trimestre (Jueves 11:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '11:30', '14:30') RETURNING id INTO v_edition_id;

    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE La Ginesta'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Fasià Sarrià'), 2, 'PUBLISHED');

    -- Edición 3r Trimestre (MARTES 9:00)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'TUESDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;

    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Vila de Gràcia'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Jaume Balmes'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED');

    -- Edición 3r Trimestre (Jueves - Turnos mezclados en tabla "Oficis Gastronòmics 2")
    -- Turno 8:30
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 3, 'PUBLISHED');

    -- Turno 11:30
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '11:30', '14:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Caterina Albert'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Fort Pius'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 1, 'PUBLISHED');


    -- TALLER: MECANICA DE BICICLETA
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Mecànica bàsica de la bicicleta', 'Indústria 4.0', v_prov_biciclot) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 2, 'PUBLISHED');

    -- Edición 2n Trimestre (Jueves 11:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '11:30', '14:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Faisà Eixample'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE Josep Pla'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Fort Pius'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 3, 'PUBLISHED');

    -- Edición 3r Trimestre (Jueves 9:00)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Montserrat'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED');


    -- TALLER: OFICIS DE LA MAR
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Oficis de la mar', 'Medi ambient i sostenibilitat', v_prov_vela) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Faisà Eixample'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Eixample'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS El Joncar'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED');


    -- TALLER: VELA
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Vela', 'Esportiu, oci i benestar', v_prov_vela) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS El Joncar'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Rec Comtal'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS J. Serrat i Bonastre'), 3, 'PUBLISHED');

    -- Edición 2n Trimestre (MARTES)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'TUESDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Jaume Balmes'), 4, 'PUBLISHED');


    -- TALLER: PERRUQUERIA (2N TRIMESTRE)
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Perruqueria', 'Oci i benestar-Imatge personal', v_prov_colomer) RETURNING id INTO v_workshop_id;

    -- Edición 2n Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Flos i Calcat'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 2, 'PUBLISHED');

    -- Edición 2n Trimestre (Jueves 11:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '11:30', '14:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Fort Pius'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 4, 'PUBLISHED');


    -- TALLER: ESTETICA (3R TRIMESTRE)
    INSERT INTO workshops (title, ambit, provider_id) 
    VALUES ('Estètica', 'Oci i benestar-Imatge personal', v_prov_colomer) RETURNING id INTO v_workshop_id;

    -- Edición 3r Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 5, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS El Joncar'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 3, 'PUBLISHED');

    -- Edición 3r Trimestre (Jueves 11:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '11:30', '14:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE Josep Pla'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Caterina Albert'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE La Ginesta'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 3, 'PUBLISHED');


    -- FEM CINE (2N TRIMESTRE)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Fem cine', 'Indústries creatives-social', v_prov_ugt) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Vila de Gràcia'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Flos i Calcat'), 1, 'PUBLISHED');

    -- CUINA COMUNITARIA (2N TRIMESTRE)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Cuina comunitària', 'Hoteleria-Indústries alimentàries', v_prov_sinai) RETURNING id INTO v_workshop_id;
    
    -- Turno 9:00
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Montserrat'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Vila de Gràcia'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Eixample'), 1, 'PUBLISHED');
    
    -- Turno 10:00
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '10:00', '13:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Flos i Calcat'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 2, 'PUBLISHED');

    -- ACOMPANYAMENT A LES PERSONES (2N TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Acompanyament a les persones', 'Sanitari-Serveis a la comuitat', v_prov_ferrantallada) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 3, 'PUBLISHED');

    -- INSTAL·LACIONS DOMESTIQUES
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Instal·lacions domèstiques', 'Indústria avançada', v_prov_mundet) RETURNING id INTO v_workshop_id;

    -- 2n Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '2N_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED');
    
    -- 3r Trimestre (Jueves 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Anna Gironella de Mundet'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Poeta Maragall'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 1, 'PUBLISHED');

    -- 3r Trimestre (MARTES 8:30)
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'TUESDAY', '08:30', '11:30') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Fort Pius'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Jaume Balmes'), 3, 'PUBLISHED'), 
        (v_edition_id, (SELECT id FROM schools WHERE name = 'CEE Josep Pla'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS J. Serrat i Bonastre'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'), 
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 4, 'PUBLISHED');

    -- SABER QUÈ FER: METALL I ARTESANIA (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Saber què fer: metall i artesania', 'Indústria-Artesania', v_prov_impulsem) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Fasià Sarrià'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED');

    -- INFORMATICA MIXTA (3R TRIM - MARTES)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Informàtica mixta', 'Digital', v_prov_escolatreball) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'TUESDAY', '10:00', '13:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Arts'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Flos i Calcat'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Fasià Sarrià'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Lexia'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE El Til·ler'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 3, 'PUBLISHED');

    -- MOUTE EN BICI (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Moute en bici', 'Esportiu-social', v_prov_biciclot) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Nou Barris'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Salvat Papasseit'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Puigverd'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Caterina Albert'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 3, 'PUBLISHED');

    -- FUSTA (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Fusta', 'Indústria-manufactura', v_prov_impulsem) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Pau Claris'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Sants'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED');

    -- PICASSO AL MANGA (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Picasso al Manga', 'Artístic', v_prov_picasso) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Milà i Fontanals'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Salvador Espriu'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Coves d''en Cimany'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Fasià Sarrià'), 1, 'PUBLISHED'), 
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Tramuntana'), 1, 'PUBLISHED');

    -- TMB (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('TMB', 'Indústria 4.0 - Mobilitat', v_prov_tmb) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Montserrat'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Consell de Cent'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Escola Lexia'), 4, 'PUBLISHED');

    -- RETRATISTES DE LA CIUTAT (3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Retratistes de la ciutat', 'Digital-artístic-social', v_prov_abaoaqu) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'THURSDAY', '09:00', '12:00') RETURNING id INTO v_edition_id;
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'Reprèn Pro'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Joan Brossa'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Caterina Albert'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Mirades'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS L''Alzina'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 4, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED');

    -- IMATGE PERSONAL (MARTES - 3R TRIM)
    INSERT INTO workshops (title, ambit, provider_id) VALUES ('Imatge personal', 'Oci i benestar', v_prov_colomer) RETURNING id INTO v_workshop_id;
    INSERT INTO workshop_editions (workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time)
    VALUES (v_workshop_id, v_period_id, '3R_TRIMESTRE', 'TUESDAY', '09:00', '12:00') RETURNING id INTO v_edition_id; -- Hora inferida
    INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status) VALUES
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Fort Pius'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Bernat Metge'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Trinitat Nova'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Angeleta Ferrer'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Jaume Balmes'), 2, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Maria Espinalt'), 3, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'IE Eixample'), 1, 'PUBLISHED'),
        (v_edition_id, (SELECT id FROM schools WHERE name = 'INS Vila de Gràcia'), 4, 'PUBLISHED');

END $$;