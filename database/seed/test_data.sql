-- =====================================================
-- DATOS DE PRUEBA PARA ENGINY
-- Script para poblar la base de datos con datos realistas
-- =====================================================

-- Primero limpiar todo en orden correcto de dependencias
DELETE FROM attendance_logs;
DELETE FROM workshop_sessions;
DELETE FROM allocation_students;
DELETE FROM allocations;
DELETE FROM workshop_assigned_teachers;
DELETE FROM student_grades;
DELETE FROM survey_responses;
DELETE FROM request_teacher_preferences;
DELETE FROM request_item_students;
DELETE FROM request_items;
DELETE FROM requests;
DELETE FROM workshop_editions;
DELETE FROM teachers;
DELETE FROM students;
DELETE FROM schools;
DELETE FROM workshops;
DELETE FROM providers;
DELETE FROM enrollment_periods;
DELETE FROM users WHERE role != 'ADMIN';

-- =====================================================
-- 1. USUARIOS ADMIN (aseguramos que existe)
-- =====================================================
INSERT INTO users (id, email, full_name, role, password_hash) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@enginy.cat', 'Administrador Enginy', 'ADMIN', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG')
ON CONFLICT (email) DO NOTHING;

-- =====================================================
-- 2. COORDINADORES DE CENTROS
-- =====================================================
INSERT INTO users (id, email, full_name, role, password_hash) VALUES
('c0000001-0001-0001-0001-000000000001', 'coord@elroure.cat', 'Maria Garcia Puig', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('c0000002-0002-0002-0002-000000000002', 'coord@mediterrani.cat', 'Joan Martinez Serra', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('c0000003-0003-0003-0003-000000000003', 'coord@lamarina.cat', 'Anna Soler Vidal', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('c0000004-0004-0004-0004-000000000004', 'coord@lescorts.cat', 'Pere Rovira Mas', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('c0000005-0005-0005-0005-000000000005', 'coord@santjordi.cat', 'Laura Ferrer Costa', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('c0000006-0006-0006-0006-000000000006', 'coord@gaudi.cat', 'Marc Puig Roca', 'CENTER_COORD', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG');

-- =====================================================
-- 3. CENTROS EDUCATIVOS (6 centros)
-- =====================================================
INSERT INTO schools (id, code, name, address, municipality, email, phone, coordinator_user_id) VALUES
('50000001-0001-0001-0001-000000000001', 'SCH001', 'Escola El Roure', 'Carrer de Balmes, 150', 'Barcelona', 'info@elroure.cat', '934567890', 'c0000001-0001-0001-0001-000000000001'),
('50000002-0002-0002-0002-000000000002', 'SCH002', 'Institut Mediterrani', 'Avinguda Diagonal, 420', 'Barcelona', 'info@mediterrani.cat', '934567891', 'c0000002-0002-0002-0002-000000000002'),
('50000003-0003-0003-0003-000000000003', 'SCH003', 'Escola La Marina', 'Passeig de Joan de Borbo, 80', 'Barcelona', 'info@lamarina.cat', '934567892', 'c0000003-0003-0003-0003-000000000003'),
('50000004-0004-0004-0004-000000000004', 'SCH004', 'Institut Les Corts', 'Carrer de Numancia, 125', 'Barcelona', 'info@lescorts.cat', '934567893', 'c0000004-0004-0004-0004-000000000004'),
('50000005-0005-0005-0005-000000000005', 'SCH005', 'Escola Sant Jordi', 'Carrer Gran de Gracia, 200', 'Barcelona', 'info@santjordi.cat', '934567894', 'c0000005-0005-0005-0005-000000000005'),
('50000006-0006-0006-0006-000000000006', 'SCH006', 'Institut Gaudi', 'Passeig de Gracia, 92', 'Barcelona', 'info@gaudi.cat', '934567895', 'c0000006-0006-0006-0006-000000000006');

-- =====================================================
-- 4. PROFESORES ACOMPANYANTS (2-3 por centro, pueden pasar lista)
-- Password: admin123
-- =====================================================
INSERT INTO teachers (id, school_id, full_name, email, phone_number, password_hash) VALUES
('70000001-0001-0001-0001-000000000001', '50000001-0001-0001-0001-000000000001', 'Jordi Lopez Fernandez', 'jordi.lopez@elroure.cat', '612345001', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000002-0002-0002-0002-000000000002', '50000001-0001-0001-0001-000000000001', 'Marta Sanchez Gil', 'marta.sanchez@elroure.cat', '612345002', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000003-0003-0003-0003-000000000003', '50000002-0002-0002-0002-000000000002', 'Carles Prat Molina', 'carles.prat@mediterrani.cat', '612345003', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000004-0004-0004-0004-000000000004', '50000002-0002-0002-0002-000000000002', 'Nuria Camps Bosch', 'nuria.camps@mediterrani.cat', '612345004', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000005-0005-0005-0005-000000000005', '50000002-0002-0002-0002-000000000002', 'Albert Riera Font', 'albert.riera@mediterrani.cat', '612345005', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000006-0006-0006-0006-000000000006', '50000003-0003-0003-0003-000000000003', 'Elena Ruiz Torres', 'elena.ruiz@lamarina.cat', '612345006', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000007-0007-0007-0007-000000000007', '50000003-0003-0003-0003-000000000003', 'David Moreno Sala', 'david.moreno@lamarina.cat', '612345007', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000008-0008-0008-0008-000000000008', '50000004-0004-0004-0004-000000000004', 'Cristina Valls Puig', 'cristina.valls@lescorts.cat', '612345008', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('70000009-0009-0009-0009-000000000009', '50000004-0004-0004-0004-000000000004', 'Sergi Mas Comas', 'sergi.mas@lescorts.cat', '612345009', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('7000000a-000a-000a-000a-00000000000a', '50000005-0005-0005-0005-000000000005', 'Rosa Blanc Marin', 'rosa.blanc@santjordi.cat', '612345010', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('7000000b-000b-000b-000b-00000000000b', '50000005-0005-0005-0005-000000000005', 'Pau Vilar Soler', 'pau.vilar@santjordi.cat', '612345011', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('7000000c-000c-000c-000c-00000000000c', '50000005-0005-0005-0005-000000000005', 'Gemma Rius Pons', 'gemma.rius@santjordi.cat', '612345012', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('7000000d-000d-000d-000d-00000000000d', '50000006-0006-0006-0006-000000000006', 'Xavier Costa Mir', 'xavier.costa@gaudi.cat', '612345013', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG'),
('7000000e-000e-000e-000e-00000000000e', '50000006-0006-0006-0006-000000000006', 'Laia Pujol Vives', 'laia.pujol@gaudi.cat', '612345014', '$2b$10$DpFC.WbzTSxl4KNdvAMfIerUCxoNk/QrhRwdWL51UBEF5t61My7DG');

-- =====================================================
-- 5. ALUMNOS (8-12 por centro = ~60 alumnos total)
-- =====================================================
INSERT INTO students (id, school_id, nombre_completo, email, curso) VALUES
('a0000001-0001-0001-0001-000000000001', '50000001-0001-0001-0001-000000000001', 'Marc Fernandez Vila', 'marc.fernandez@elroure.cat', '3 ESO'),
('a0000002-0002-0002-0002-000000000002', '50000001-0001-0001-0001-000000000001', 'Laia Marti Roca', 'laia.marti@elroure.cat', '3 ESO'),
('a0000003-0003-0003-0003-000000000003', '50000001-0001-0001-0001-000000000001', 'Pol Serra Garcia', 'pol.serra@elroure.cat', '3 ESO'),
('a0000004-0004-0004-0004-000000000004', '50000001-0001-0001-0001-000000000001', 'Anna Bosch Puig', 'anna.bosch@elroure.cat', '3 ESO'),
('a0000005-0005-0005-0005-000000000005', '50000001-0001-0001-0001-000000000001', 'Oriol Camps Sala', 'oriol.camps@elroure.cat', '4 ESO'),
('a0000006-0006-0006-0006-000000000006', '50000001-0001-0001-0001-000000000001', 'Marina Costa Vidal', 'marina.costa@elroure.cat', '4 ESO'),
('a0000007-0007-0007-0007-000000000007', '50000001-0001-0001-0001-000000000001', 'Biel Ruiz Font', 'biel.ruiz@elroure.cat', '4 ESO'),
('a0000008-0008-0008-0008-000000000008', '50000001-0001-0001-0001-000000000001', 'Clara Prat Molina', 'clara.prat@elroure.cat', '4 ESO'),
('a0000009-0009-0009-0009-000000000009', '50000001-0001-0001-0001-000000000001', 'Arnau Valls Torres', 'arnau.valls@elroure.cat', '3 ESO'),
('a000000a-000a-000a-000a-00000000000a', '50000001-0001-0001-0001-000000000001', 'Julia Mas Soler', 'julia.mas@elroure.cat', '3 ESO'),
('a000000b-000b-000b-000b-00000000000b', '50000002-0002-0002-0002-000000000002', 'Eric Blanc Ferrer', 'eric.blanc@mediterrani.cat', '3 ESO'),
('a000000c-000c-000c-000c-00000000000c', '50000002-0002-0002-0002-000000000002', 'Aina Riera Comas', 'aina.riera@mediterrani.cat', '3 ESO'),
('a000000d-000d-000d-000d-00000000000d', '50000002-0002-0002-0002-000000000002', 'Nil Moreno Gil', 'nil.moreno@mediterrani.cat', '3 ESO'),
('a000000e-000e-000e-000e-00000000000e', '50000002-0002-0002-0002-000000000002', 'Mia Vilar Puig', 'mia.vilar@mediterrani.cat', '3 ESO'),
('a000000f-000f-000f-000f-00000000000f', '50000002-0002-0002-0002-000000000002', 'Jan Pujol Roca', 'jan.pujol@mediterrani.cat', '4 ESO'),
('a0000010-0010-0010-0010-000000000010', '50000002-0002-0002-0002-000000000002', 'Ona Costa Mir', 'ona.costa@mediterrani.cat', '4 ESO'),
('a0000011-0011-0011-0011-000000000011', '50000002-0002-0002-0002-000000000002', 'Pau Rius Bosch', 'pau.rius@mediterrani.cat', '4 ESO'),
('a0000012-0012-0012-0012-000000000012', '50000002-0002-0002-0002-000000000002', 'Carla Serra Vives', 'carla.serra@mediterrani.cat', '4 ESO'),
('a0000013-0013-0013-0013-000000000013', '50000002-0002-0002-0002-000000000002', 'Marti Camps Torres', 'marti.camps@mediterrani.cat', '3 ESO'),
('a0000014-0014-0014-0014-000000000014', '50000002-0002-0002-0002-000000000002', 'Lola Fernandez Mas', 'lola.fernandez@mediterrani.cat', '3 ESO'),
('a0000015-0015-0015-0015-000000000015', '50000002-0002-0002-0002-000000000002', 'Hugo Marti Pons', 'hugo.marti@mediterrani.cat', '4 ESO'),
('a0000016-0016-0016-0016-000000000016', '50000002-0002-0002-0002-000000000002', 'Nora Bosch Sala', 'nora.bosch@mediterrani.cat', '4 ESO'),
('a0000017-0017-0017-0017-000000000017', '50000003-0003-0003-0003-000000000003', 'Alex Ruiz Vila', 'alex.ruiz@lamarina.cat', '3 ESO'),
('a0000018-0018-0018-0018-000000000018', '50000003-0003-0003-0003-000000000003', 'Emma Prat Garcia', 'emma.prat@lamarina.cat', '3 ESO'),
('a0000019-0019-0019-0019-000000000019', '50000003-0003-0003-0003-000000000003', 'Leo Valls Ferrer', 'leo.valls@lamarina.cat', '3 ESO'),
('a000001a-001a-001a-001a-00000000001a', '50000003-0003-0003-0003-000000000003', 'Sara Mas Puig', 'sara.mas@lamarina.cat', '3 ESO'),
('a000001b-001b-001b-001b-00000000001b', '50000003-0003-0003-0003-000000000003', 'Max Costa Roca', 'max.costa@lamarina.cat', '4 ESO'),
('a000001c-001c-001c-001c-00000000001c', '50000003-0003-0003-0003-000000000003', 'Gina Riera Soler', 'gina.riera@lamarina.cat', '4 ESO'),
('a000001d-001d-001d-001d-00000000001d', '50000003-0003-0003-0003-000000000003', 'Izan Moreno Vidal', 'izan.moreno@lamarina.cat', '4 ESO'),
('a000001e-001e-001e-001e-00000000001e', '50000003-0003-0003-0003-000000000003', 'Abril Vilar Font', 'abril.vilar@lamarina.cat', '4 ESO'),
('a000001f-001f-001f-001f-00000000001f', '50000004-0004-0004-0004-000000000004', 'Dani Pujol Comas', 'dani.pujol@lescorts.cat', '3 ESO'),
('a0000020-0020-0020-0020-000000000020', '50000004-0004-0004-0004-000000000004', 'Blanca Rius Torres', 'blanca.rius@lescorts.cat', '3 ESO'),
('a0000021-0021-0021-0021-000000000021', '50000004-0004-0004-0004-000000000004', 'Adria Costa Molina', 'adria.costa@lescorts.cat', '3 ESO'),
('a0000022-0022-0022-0022-000000000022', '50000004-0004-0004-0004-000000000004', 'Vera Serra Bosch', 'vera.serra@lescorts.cat', '3 ESO'),
('a0000023-0023-0023-0023-000000000023', '50000004-0004-0004-0004-000000000004', 'Joel Camps Vives', 'joel.camps@lescorts.cat', '4 ESO'),
('a0000024-0024-0024-0024-000000000024', '50000004-0004-0004-0004-000000000004', 'Ariadna Fernandez Mir', 'ariadna.fernandez@lescorts.cat', '4 ESO'),
('a0000025-0025-0025-0025-000000000025', '50000004-0004-0004-0004-000000000004', 'Iker Marti Pons', 'iker.marti@lescorts.cat', '4 ESO'),
('a0000026-0026-0026-0026-000000000026', '50000004-0004-0004-0004-000000000004', 'Mireia Bosch Sala', 'mireia.bosch@lescorts.cat', '4 ESO'),
('a0000027-0027-0027-0027-000000000027', '50000004-0004-0004-0004-000000000004', 'Bruno Ruiz Garcia', 'bruno.ruiz@lescorts.cat', '3 ESO'),
('a0000028-0028-0028-0028-000000000028', '50000004-0004-0004-0004-000000000004', 'Luna Prat Roca', 'luna.prat@lescorts.cat', '3 ESO'),
('a0000029-0029-0029-0029-000000000029', '50000005-0005-0005-0005-000000000005', 'Alvar Valls Puig', 'alvar.valls@santjordi.cat', '3 ESO'),
('a000002a-002a-002a-002a-00000000002a', '50000005-0005-0005-0005-000000000005', 'Claudia Mas Ferrer', 'claudia.mas@santjordi.cat', '3 ESO'),
('a000002b-002b-002b-002b-00000000002b', '50000005-0005-0005-0005-000000000005', 'Roc Costa Soler', 'roc.costa@santjordi.cat', '3 ESO'),
('a000002c-002c-002c-002c-00000000002c', '50000005-0005-0005-0005-000000000005', 'Elsa Riera Vidal', 'elsa.riera@santjordi.cat', '3 ESO'),
('a000002d-002d-002d-002d-00000000002d', '50000005-0005-0005-0005-000000000005', 'Cesc Moreno Font', 'cesc.moreno@santjordi.cat', '4 ESO'),
('a000002e-002e-002e-002e-00000000002e', '50000005-0005-0005-0005-000000000005', 'Txell Vilar Comas', 'txell.vilar@santjordi.cat', '4 ESO'),
('a000002f-002f-002f-002f-00000000002f', '50000005-0005-0005-0005-000000000005', 'Bru Pujol Torres', 'bru.pujol@santjordi.cat', '4 ESO'),
('a0000030-0030-0030-0030-000000000030', '50000005-0005-0005-0005-000000000005', 'Neus Rius Molina', 'neus.rius@santjordi.cat', '4 ESO'),
('a0000031-0031-0031-0031-000000000031', '50000005-0005-0005-0005-000000000005', 'Gerard Costa Bosch', 'gerard.costa@santjordi.cat', '3 ESO'),
('a0000032-0032-0032-0032-000000000032', '50000005-0005-0005-0005-000000000005', 'Paula Serra Vives', 'paula.serra@santjordi.cat', '3 ESO'),
('a0000033-0033-0033-0033-000000000033', '50000006-0006-0006-0006-000000000006', 'Roger Camps Mir', 'roger.camps@gaudi.cat', '3 ESO'),
('a0000034-0034-0034-0034-000000000034', '50000006-0006-0006-0006-000000000006', 'Irene Fernandez Pons', 'irene.fernandez@gaudi.cat', '3 ESO'),
('a0000035-0035-0035-0035-000000000035', '50000006-0006-0006-0006-000000000006', 'Quim Marti Sala', 'quim.marti@gaudi.cat', '3 ESO'),
('a0000036-0036-0036-0036-000000000036', '50000006-0006-0006-0006-000000000006', 'Alba Bosch Garcia', 'alba.bosch@gaudi.cat', '3 ESO'),
('a0000037-0037-0037-0037-000000000037', '50000006-0006-0006-0006-000000000006', 'Ivan Ruiz Roca', 'ivan.ruiz@gaudi.cat', '4 ESO'),
('a0000038-0038-0038-0038-000000000038', '50000006-0006-0006-0006-000000000006', 'Mariona Prat Puig', 'mariona.prat@gaudi.cat', '4 ESO'),
('a0000039-0039-0039-0039-000000000039', '50000006-0006-0006-0006-000000000006', 'Toni Valls Ferrer', 'toni.valls@gaudi.cat', '4 ESO'),
('a000003a-003a-003a-003a-00000000003a', '50000006-0006-0006-0006-000000000006', 'Judit Mas Soler', 'judit.mas@gaudi.cat', '4 ESO'),
('a000003b-003b-003b-003b-00000000003b', '50000006-0006-0006-0006-000000000006', 'Enric Costa Vidal', 'enric.costa@gaudi.cat', '3 ESO'),
('a000003c-003c-003c-003c-00000000003c', '50000006-0006-0006-0006-000000000006', 'Berta Riera Font', 'berta.riera@gaudi.cat', '3 ESO');

-- =====================================================
-- 6. PROVEEDORES DE TALLERES
-- =====================================================
INSERT INTO providers (id, name, address, contact_email) VALUES
('d0000001-0001-0001-0001-000000000001', 'Fundacio Cuina Solidaria', 'Carrer de la Cuina, 15', 'info@cuinasolidaria.cat'),
('d0000002-0002-0002-0002-000000000002', 'Associacio Horts Urbans BCN', 'Carrer del Jardi, 22', 'contacte@hortsurbans.cat'),
('d0000003-0003-0003-0003-000000000003', 'Biciclot Cooperativa', 'Carrer de la Bici, 8', 'hola@biciclot.coop'),
('d0000004-0004-0004-0004-000000000004', 'Taller Estampa', 'Carrer de lArt, 45', 'info@tallerestampa.cat'),
('d0000005-0005-0005-0005-000000000005', 'FabLab Barcelona', 'Carrer de la Tecnologia, 100', 'contacte@fablabbcn.org'),
('d0000006-0006-0006-0006-000000000006', 'Club Nautic Barceloneta', 'Passeig Maritim, 1', 'info@cnbarceloneta.cat');

-- =====================================================
-- 7. TALLERES (6 talleres)
-- =====================================================
INSERT INTO workshops (id, title, description, ambit, is_new, provider_id) VALUES
('10000001-0001-0001-0001-000000000001', 'Cuina Comunitaria', 'Apren a cuinar plats saludables i sostenibles amb productes de proximitat.', 'Hoteleria-Industries alimentaries', false, 'd0000001-0001-0001-0001-000000000001'),
('10000002-0002-0002-0002-000000000002', 'Jardineria', 'Descobreix el mon de les plantes i els horts urbans.', 'Medi ambient i sostenibilitat', false, 'd0000002-0002-0002-0002-000000000002'),
('10000003-0003-0003-0003-000000000003', 'Mecanica de la Bicicleta', 'Coneix les parts de la bicicleta i apren a fer reparacions basiques.', 'Industria 4.0', false, 'd0000003-0003-0003-0003-000000000003'),
('10000004-0004-0004-0004-000000000004', 'Serigrafia', 'Crea els teus propis dissenys i estampa-los en samarretes.', 'Industria-manufactura', false, 'd0000004-0004-0004-0004-000000000004'),
('10000005-0005-0005-0005-000000000005', 'Tecnolab Makers', 'Experimenta amb impressio 3D, tall laser i electronica basica.', 'Tecnologic', true, 'd0000005-0005-0005-0005-000000000005'),
('10000006-0006-0006-0006-000000000006', 'Vela', 'Navega pel litoral barceloni i apren els fonaments de la navegacio a vela.', 'Esportiu, oci i benestar', false, 'd0000006-0006-0006-0006-000000000006');

-- =====================================================
-- 8. PERIODO DE INSCRIPCION
-- =====================================================
INSERT INTO enrollment_periods (id, name, status, current_phase, phase_solicitudes_start, phase_solicitudes_end) VALUES
('e0000001-0001-0001-0001-000000000001', 'Curs 2025-2026 - 2n Trimestre', 'ACTIVE', 'SOLICITUDES', '2026-01-15 00:00:00+01', '2026-03-31 23:59:59+01');

-- =====================================================
-- 9. EDICIONES DE TALLERES (para el periodo activo)
-- =====================================================
INSERT INTO workshop_editions (id, workshop_id, enrollment_period_id, term, day_of_week, start_time, end_time, capacity_total, max_per_school) VALUES
('20000001-0001-0001-0001-000000000001', '10000001-0001-0001-0001-000000000001', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'TUESDAY', '10:00', '12:00', 16, 4),
('20000002-0002-0002-0002-000000000002', '10000001-0001-0001-0001-000000000001', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '10:00', '12:00', 16, 4),
('20000003-0003-0003-0003-000000000003', '10000002-0002-0002-0002-000000000002', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '09:00', '11:00', 16, 4),
('20000004-0004-0004-0004-000000000004', '10000002-0002-0002-0002-000000000002', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '11:30', '13:30', 16, 4),
('20000005-0005-0005-0005-000000000005', '10000003-0003-0003-0003-000000000003', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'TUESDAY', '09:00', '11:00', 12, 3),
('20000006-0006-0006-0006-000000000006', '10000004-0004-0004-0004-000000000004', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'TUESDAY', '10:00', '12:00', 14, 4),
('20000007-0007-0007-0007-000000000007', '10000004-0004-0004-0004-000000000004', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '09:00', '11:00', 14, 4),
('20000008-0008-0008-0008-000000000008', '10000005-0005-0005-0005-000000000005', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '10:00', '12:00', 12, 3),
('20000009-0009-0009-0009-000000000009', '10000006-0006-0006-0006-000000000006', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'TUESDAY', '10:00', '13:00', 8, 2),
('2000000a-000a-000a-000a-00000000000a', '10000006-0006-0006-0006-000000000006', 'e0000001-0001-0001-0001-000000000001', '2N_TRIMESTRE', 'THURSDAY', '10:00', '13:00', 8, 2);

-- =====================================================
-- 10. SOLICITUDES DE LOS CENTROS
-- =====================================================

-- SOLICITUD 1: Escola El Roure
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000001-0001-0001-0001-000000000001', 'e0000001-0001-0001-0001-000000000001', '50000001-0001-0001-0001-000000000001', 'SUBMITTED', false, true, '2026-01-18 09:30:00', 
 '[{"id": "70000001-0001-0001-0001-000000000001", "full_name": "Jordi Lopez Fernandez"}, {"id": "70000002-0002-0002-0002-000000000002", "full_name": "Marta Sanchez Gil"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('40000001-0001-0001-0001-000000000001', '30000001-0001-0001-0001-000000000001', '20000005-0005-0005-0005-000000000005', 3, 1),
('40000002-0002-0002-0002-000000000002', '30000001-0001-0001-0001-000000000001', '20000008-0008-0008-0008-000000000008', 3, 2);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('40000001-0001-0001-0001-000000000001', 'a0000001-0001-0001-0001-000000000001'),
('40000001-0001-0001-0001-000000000001', 'a0000002-0002-0002-0002-000000000002'),
('40000001-0001-0001-0001-000000000001', 'a0000003-0003-0003-0003-000000000003'),
('40000002-0002-0002-0002-000000000002', 'a0000004-0004-0004-0004-000000000004'),
('40000002-0002-0002-0002-000000000002', 'a0000005-0005-0005-0005-000000000005'),
('40000002-0002-0002-0002-000000000002', 'a0000006-0006-0006-0006-000000000006');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('60000001-0001-0001-0001-000000000001', '30000001-0001-0001-0001-000000000001', '70000001-0001-0001-0001-000000000001', '20000005-0005-0005-0005-000000000005', 1),
('60000002-0002-0002-0002-000000000002', '30000001-0001-0001-0001-000000000001', '70000002-0002-0002-0002-000000000002', '20000008-0008-0008-0008-000000000008', 1);

-- SOLICITUD 2: Institut Mediterrani
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000002-0002-0002-0002-000000000002', 'e0000001-0001-0001-0001-000000000001', '50000002-0002-0002-0002-000000000002', 'SUBMITTED', false, true, '2026-01-18 10:15:00',
 '[{"id": "70000003-0003-0003-0003-000000000003", "full_name": "Carles Prat Molina"}, {"id": "70000004-0004-0004-0004-000000000004", "full_name": "Nuria Camps Bosch"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('40000003-0003-0003-0003-000000000003', '30000002-0002-0002-0002-000000000002', '20000009-0009-0009-0009-000000000009', 2, 1),
('40000004-0004-0004-0004-000000000004', '30000002-0002-0002-0002-000000000002', '20000001-0001-0001-0001-000000000001', 4, 2),
('40000005-0005-0005-0005-000000000005', '30000002-0002-0002-0002-000000000002', '20000003-0003-0003-0003-000000000003', 3, 3);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('40000003-0003-0003-0003-000000000003', 'a000000b-000b-000b-000b-00000000000b'),
('40000003-0003-0003-0003-000000000003', 'a000000c-000c-000c-000c-00000000000c'),
('40000004-0004-0004-0004-000000000004', 'a000000d-000d-000d-000d-00000000000d'),
('40000004-0004-0004-0004-000000000004', 'a000000e-000e-000e-000e-00000000000e'),
('40000004-0004-0004-0004-000000000004', 'a000000f-000f-000f-000f-00000000000f'),
('40000004-0004-0004-0004-000000000004', 'a0000010-0010-0010-0010-000000000010'),
('40000005-0005-0005-0005-000000000005', 'a0000011-0011-0011-0011-000000000011'),
('40000005-0005-0005-0005-000000000005', 'a0000012-0012-0012-0012-000000000012'),
('40000005-0005-0005-0005-000000000005', 'a0000013-0013-0013-0013-000000000013');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('60000003-0003-0003-0003-000000000003', '30000002-0002-0002-0002-000000000002', '70000003-0003-0003-0003-000000000003', '20000009-0009-0009-0009-000000000009', 1),
('60000004-0004-0004-0004-000000000004', '30000002-0002-0002-0002-000000000002', '70000004-0004-0004-0004-000000000004', '20000001-0001-0001-0001-000000000001', 1);

-- SOLICITUD 3: Escola La Marina
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000003-0003-0003-0003-000000000003', 'e0000001-0001-0001-0001-000000000001', '50000003-0003-0003-0003-000000000003', 'SUBMITTED', true, false, '2026-01-19 11:00:00',
 '[{"id": "70000006-0006-0006-0006-000000000006", "full_name": "Elena Ruiz Torres"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('40000006-0006-0006-0006-000000000006', '30000003-0003-0003-0003-000000000003', '2000000a-000a-000a-000a-00000000000a', 2, 1),
('40000007-0007-0007-0007-000000000007', '30000003-0003-0003-0003-000000000003', '20000007-0007-0007-0007-000000000007', 4, 2);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('40000006-0006-0006-0006-000000000006', 'a0000017-0017-0017-0017-000000000017'),
('40000006-0006-0006-0006-000000000006', 'a0000018-0018-0018-0018-000000000018'),
('40000007-0007-0007-0007-000000000007', 'a0000019-0019-0019-0019-000000000019'),
('40000007-0007-0007-0007-000000000007', 'a000001a-001a-001a-001a-00000000001a'),
('40000007-0007-0007-0007-000000000007', 'a000001b-001b-001b-001b-00000000001b'),
('40000007-0007-0007-0007-000000000007', 'a000001c-001c-001c-001c-00000000001c');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('60000005-0005-0005-0005-000000000005', '30000003-0003-0003-0003-000000000003', '70000006-0006-0006-0006-000000000006', '2000000a-000a-000a-000a-00000000000a', 1);

-- SOLICITUD 4: Institut Les Corts
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000004-0004-0004-0004-000000000004', 'e0000001-0001-0001-0001-000000000001', '50000004-0004-0004-0004-000000000004', 'SUBMITTED', false, true, '2026-01-19 14:30:00',
 '[{"id": "70000008-0008-0008-0008-000000000008", "full_name": "Cristina Valls Puig"}, {"id": "70000009-0009-0009-0009-000000000009", "full_name": "Sergi Mas Comas"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('40000008-0008-0008-0008-000000000008', '30000004-0004-0004-0004-000000000004', '20000006-0006-0006-0006-000000000006', 3, 1),
('40000009-0009-0009-0009-000000000009', '30000004-0004-0004-0004-000000000004', '20000005-0005-0005-0005-000000000005', 3, 2),
('4000000a-000a-000a-000a-00000000000a', '30000004-0004-0004-0004-000000000004', '20000004-0004-0004-0004-000000000004', 2, 3);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('40000008-0008-0008-0008-000000000008', 'a000001f-001f-001f-001f-00000000001f'),
('40000008-0008-0008-0008-000000000008', 'a0000020-0020-0020-0020-000000000020'),
('40000008-0008-0008-0008-000000000008', 'a0000021-0021-0021-0021-000000000021'),
('40000009-0009-0009-0009-000000000009', 'a0000022-0022-0022-0022-000000000022'),
('40000009-0009-0009-0009-000000000009', 'a0000023-0023-0023-0023-000000000023'),
('40000009-0009-0009-0009-000000000009', 'a0000024-0024-0024-0024-000000000024'),
('4000000a-000a-000a-000a-00000000000a', 'a0000025-0025-0025-0025-000000000025'),
('4000000a-000a-000a-000a-00000000000a', 'a0000026-0026-0026-0026-000000000026');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('60000006-0006-0006-0006-000000000006', '30000004-0004-0004-0004-000000000004', '70000008-0008-0008-0008-000000000008', '20000006-0006-0006-0006-000000000006', 1),
('60000007-0007-0007-0007-000000000007', '30000004-0004-0004-0004-000000000004', '70000009-0009-0009-0009-000000000009', '20000005-0005-0005-0005-000000000005', 1);

-- SOLICITUD 5: Escola Sant Jordi
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000005-0005-0005-0005-000000000005', 'e0000001-0001-0001-0001-000000000001', '50000005-0005-0005-0005-000000000005', 'SUBMITTED', true, true, '2026-01-20 09:00:00',
 '[{"id": "7000000a-000a-000a-000a-00000000000a", "full_name": "Rosa Blanc Marin"}, {"id": "7000000b-000b-000b-000b-00000000000b", "full_name": "Pau Vilar Soler"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('4000000b-000b-000b-000b-00000000000b', '30000005-0005-0005-0005-000000000005', '20000008-0008-0008-0008-000000000008', 3, 1),
('4000000c-000c-000c-000c-00000000000c', '30000005-0005-0005-0005-000000000005', '20000002-0002-0002-0002-000000000002', 4, 2),
('4000000d-000d-000d-000d-00000000000d', '30000005-0005-0005-0005-000000000005', '20000003-0003-0003-0003-000000000003', 3, 3);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('4000000b-000b-000b-000b-00000000000b', 'a0000029-0029-0029-0029-000000000029'),
('4000000b-000b-000b-000b-00000000000b', 'a000002a-002a-002a-002a-00000000002a'),
('4000000b-000b-000b-000b-00000000000b', 'a000002b-002b-002b-002b-00000000002b'),
('4000000c-000c-000c-000c-00000000000c', 'a000002c-002c-002c-002c-00000000002c'),
('4000000c-000c-000c-000c-00000000000c', 'a000002d-002d-002d-002d-00000000002d'),
('4000000c-000c-000c-000c-00000000000c', 'a000002e-002e-002e-002e-00000000002e'),
('4000000c-000c-000c-000c-00000000000c', 'a000002f-002f-002f-002f-00000000002f'),
('4000000d-000d-000d-000d-00000000000d', 'a0000030-0030-0030-0030-000000000030'),
('4000000d-000d-000d-000d-00000000000d', 'a0000031-0031-0031-0031-000000000031'),
('4000000d-000d-000d-000d-00000000000d', 'a0000032-0032-0032-0032-000000000032');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('60000008-0008-0008-0008-000000000008', '30000005-0005-0005-0005-000000000005', '7000000a-000a-000a-000a-00000000000a', '20000008-0008-0008-0008-000000000008', 1),
('60000009-0009-0009-0009-000000000009', '30000005-0005-0005-0005-000000000005', '7000000b-000b-000b-000b-00000000000b', '20000002-0002-0002-0002-000000000002', 1);

-- SOLICITUD 6: Institut Gaudi
INSERT INTO requests (id, enrollment_period_id, school_id, status, is_first_time_participation, available_for_tuesdays, submitted_at, request_teachers) VALUES
('30000006-0006-0006-0006-000000000006', 'e0000001-0001-0001-0001-000000000001', '50000006-0006-0006-0006-000000000006', 'SUBMITTED', false, true, '2026-01-20 11:45:00',
 '[{"id": "7000000d-000d-000d-000d-00000000000d", "full_name": "Xavier Costa Mir"}, {"id": "7000000e-000e-000e-000e-00000000000e", "full_name": "Laia Pujol Vives"}]');

INSERT INTO request_items (id, request_id, workshop_edition_id, requested_students, priority) VALUES
('4000000e-000e-000e-000e-00000000000e', '30000006-0006-0006-0006-000000000006', '20000009-0009-0009-0009-000000000009', 2, 1),
('4000000f-000f-000f-000f-00000000000f', '30000006-0006-0006-0006-000000000006', '20000001-0001-0001-0001-000000000001', 4, 2),
('40000010-0010-0010-0010-000000000010', '30000006-0006-0006-0006-000000000006', '20000007-0007-0007-0007-000000000007', 2, 3);

INSERT INTO request_item_students (request_item_id, student_id) VALUES
('4000000e-000e-000e-000e-00000000000e', 'a0000033-0033-0033-0033-000000000033'),
('4000000e-000e-000e-000e-00000000000e', 'a0000034-0034-0034-0034-000000000034'),
('4000000f-000f-000f-000f-00000000000f', 'a0000035-0035-0035-0035-000000000035'),
('4000000f-000f-000f-000f-00000000000f', 'a0000036-0036-0036-0036-000000000036'),
('4000000f-000f-000f-000f-00000000000f', 'a0000037-0037-0037-0037-000000000037'),
('4000000f-000f-000f-000f-00000000000f', 'a0000038-0038-0038-0038-000000000038'),
('40000010-0010-0010-0010-000000000010', 'a0000039-0039-0039-0039-000000000039'),
('40000010-0010-0010-0010-000000000010', 'a000003a-003a-003a-003a-00000000003a');

INSERT INTO request_teacher_preferences (id, request_id, teacher_id, workshop_edition_id, preference_order) VALUES
('6000000a-000a-000a-000a-00000000000a', '30000006-0006-0006-0006-000000000006', '7000000d-000d-000d-000d-00000000000d', '20000009-0009-0009-0009-000000000009', 1),
('6000000b-000b-000b-000b-00000000000b', '30000006-0006-0006-0006-000000000006', '7000000e-000e-000e-000e-00000000000e', '20000001-0001-0001-0001-000000000001', 1);

-- =====================================================
-- CREDENCIALES (password: admin123)
-- =====================================================
-- ADMIN: admin@enginy.cat
-- COORDINADORES: coord@elroure.cat, coord@mediterrani.cat, coord@lamarina.cat, coord@lescorts.cat, coord@santjordi.cat, coord@gaudi.cat
-- PROFESORES: jordi.lopez@elroure.cat, marta.sanchez@elroure.cat, carles.prat@mediterrani.cat, etc.
