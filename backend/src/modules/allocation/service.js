const db = require('../../config/db');

/**
 * ALGORITMO DE ASIGNACIÓN INTELIGENTE v3.0
 * 
 * Modalidad C - Enginy Barcelona
 * 
 * FILOSOFÍA: Distribución EQUITATIVA entre todos los centros
 * El plazo de envío no importa - todos los que envían dentro del plazo tienen las mismas oportunidades.
 * 
 * CRITERIOS DE PRIORIZACIÓN:
 * 1. Prioridad de la solicitud (1 = máxima, 2, 3...)
 * 2. Primera participación del centro (bonus)
 * 3. Nivel de absentismo de los alumnos (mayor = más prioridad, es el objetivo del programa)
 * 4. Equilibrio: Centros con menos asignaciones previas tienen preferencia
 * 5. Aleatoriedad controlada para desempates (seed fijo para reproducibilidad)
 * 
 * RESTRICCIONES:
 * - Máximo 4 alumnos por centro, por taller
 * - Total 16 alumnos por edición de taller
 * - No asignar martes a centros que no pueden
 * - Intentar que cada centro tenga al menos 1 asignación antes de dar segundas
 */

/**
 * Genera un número pseudoaleatorio basado en un seed (para reproducibilidad)
 */
const seededRandom = (seed) => {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
};

/**
 * Baraja un array usando Fisher-Yates con seed fijo
 */
const shuffleWithSeed = (array, seed) => {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(seededRandom(seed + i) * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
};

const runAllocationAlgorithm = async (periodId) => {
  const client = await db.getClient();

  try {
    await client.query('BEGIN');

    // 1. OBTENER SOLICITUDES CON INFORMACIÓN COMPLETA
    const requestsQuery = await client.query(
      `SELECT 
        r.id as request_id,
        r.school_id, 
        r.available_for_tuesdays, 
        r.is_first_time_participation,
        r.request_teachers,
        ri.id as item_id,
        ri.workshop_edition_id, 
        ri.requested_students, 
        ri.priority,
        s.name as school_name,
        s.code as school_code,
        COALESCE(
          (SELECT AVG(st.nivel_absentismo) 
           FROM request_item_students ris 
           JOIN students st ON ris.student_id = st.id 
           WHERE ris.request_item_id = ri.id),
          0
        ) as avg_absenteeism
       FROM requests r
       JOIN request_items ri ON r.id = ri.request_id
       JOIN schools s ON r.school_id = s.id
       WHERE r.enrollment_period_id = $1 AND r.status = 'SUBMITTED'`,
      [periodId]
    );

    if (requestsQuery.rows.length === 0) {
      await client.query('COMMIT');
      return {
        success: true,
        message: 'No hi ha sol·licituds per assignar',
        allocations_created: 0,
        total_students_allocated: 0
      };
    }

    // 2. OBTENER INFORMACIÓN DE EDICIONES
    const editionsQuery = await client.query(
      `SELECT 
        we.id, 
        we.workshop_id, 
        we.day_of_week, 
        we.capacity_total, 
        we.max_per_school,
        w.title as workshop_title
       FROM workshop_editions we
       JOIN workshops w ON we.workshop_id = w.id
       WHERE we.enrollment_period_id = $1`,
      [periodId]
    );

    // 3. ESTRUCTURAS DE SEGUIMIENTO
    const editionState = {};
    for (const edition of editionsQuery.rows) {
      editionState[edition.id] = {
        totalCapacity: edition.capacity_total,
        currentOccupancy: 0,
        maxPerSchool: edition.max_per_school,
        perSchool: {},
        dayOfWeek: edition.day_of_week,
        workshopTitle: edition.workshop_title
      };
    }

    // Estado global por centro (para equilibrio)
    const schoolState = {};
    const allSchools = [...new Set(requestsQuery.rows.map(r => r.school_id))];
    for (const schoolId of allSchools) {
      const schoolData = requestsQuery.rows.find(r => r.school_id === schoolId);
      schoolState[schoolId] = {
        name: schoolData.school_name,
        code: schoolData.school_code,
        isFirstTime: schoolData.is_first_time_participation,
        totalAssigned: 0,
        workshopsAssigned: 0,
        pendingRequests: []
      };
    }

    // 4. AGRUPAR SOLICITUDES POR PRIORIDAD
    const requestsByPriority = {};
    for (const req of requestsQuery.rows) {
      const priority = req.priority || 99;
      if (!requestsByPriority[priority]) {
        requestsByPriority[priority] = [];
      }
      requestsByPriority[priority].push(req);
      schoolState[req.school_id].pendingRequests.push(req);
    }

    const priorities = Object.keys(requestsByPriority).map(Number).sort((a, b) => a - b);

    console.log('\n🎯 ALGORITME D\'ASSIGNACIÓ v3.0 - Distribució Equitativa');
    console.log(`📊 Centres participants: ${allSchools.length}`);
    console.log(`📋 Sol·licituds totals: ${requestsQuery.rows.length}`);
    console.log(`🎪 Edicions de tallers: ${editionsQuery.rows.length}`);

    const allocations = [];
    const rejections = [];

    // 5. PROCESAR POR RONDAS DE PRIORIDAD
    for (const priority of priorities) {
      console.log(`\n--- Processant Prioritat ${priority} ---`);

      const requestsInPriority = requestsByPriority[priority];

      // 5.1 ORDENAR SOLICITUDES DE ESTA PRIORIDAD
      // Criterio: Primera vez > Absentismo alto > Menos asignaciones previas > Aleatorio
      const scoredRequests = requestsInPriority.map(req => {
        let score = 0;

        // Bonus primera participación (+100)
        if (req.is_first_time_participation) score += 100;

        // Bonus absentismo (+10 por nivel, máx +50)
        score += (req.avg_absenteeism || 0) * 10;

        // Penalización por asignaciones previas (-20 por cada una)
        score -= schoolState[req.school_id].workshopsAssigned * 20;

        // Componente aleatorio para desempate (0-10)
        // Usamos el hash del school_id + priority como seed para reproducibilidad
        const seed = req.school_id.charCodeAt(0) + priority * 1000;
        score += seededRandom(seed) * 10;

        return { ...req, _score: score };
      });

      // Ordenar de mayor a menor score
      scoredRequests.sort((a, b) => b._score - a._score);

      // 5.2 PROCESAR CADA SOLICITUD
      for (const request of scoredRequests) {
        const result = tryAssignRequest(request, editionState, schoolState);

        if (result.success) {
          allocations.push(result.allocation);
          console.log(`  ✅ ${request.school_name} → ${editionState[request.workshop_edition_id].workshopTitle}: ${result.allocation.assigned_seats} places (score: ${request._score.toFixed(1)})`);
        } else {
          rejections.push({
            school: request.school_name,
            workshop: editionState[request.workshop_edition_id]?.workshopTitle || 'Desconegut',
            reason: result.reason,
            item_id: request.item_id
          });
        }
      }
    }

    // 6. SEGUNDA PASADA: Rellenar huecos si quedan plazas
    console.log('\n--- Segona passada: omplir buits ---');
    const unfilledEditions = Object.entries(editionState)
      .filter(([_, state]) => state.currentOccupancy < state.totalCapacity)
      .map(([id, state]) => ({ id, ...state }));

    if (unfilledEditions.length > 0) {
      // Buscar centros que pidieron estos talleres pero no les tocó
      for (const edition of unfilledEditions) {
        const remainingCapacity = edition.totalCapacity - edition.currentOccupancy;
        if (remainingCapacity <= 0) continue;

        // Buscar solicitudes rechazadas para este taller
        const rejectedForThis = rejections.filter(r =>
          r.workshop === edition.workshopTitle &&
          r.reason.includes('equilibri')
        );

        for (const rejected of rejectedForThis) {
          const originalRequest = requestsQuery.rows.find(r => r.item_id === rejected.item_id);
          if (!originalRequest) continue;

          const result = tryAssignRequest(originalRequest, editionState, schoolState, true);
          if (result.success) {
            allocations.push(result.allocation);
            // Quitar de rechazados
            const idx = rejections.findIndex(r => r.item_id === rejected.item_id);
            if (idx >= 0) rejections.splice(idx, 1);
            console.log(`  🔄 Reassignat: ${originalRequest.school_name} → ${edition.workshopTitle}: ${result.allocation.assigned_seats} places`);
          }
        }
      }
    }

    // 7. INSERTAR ASIGNACIONES EN BD
    for (const alloc of allocations) {
      const allocResult = await client.query(
        `INSERT INTO allocations (workshop_edition_id, school_id, assigned_seats, status)
         VALUES ($1, $2, $3, $4)
         RETURNING id`,
        [alloc.workshop_edition_id, alloc.school_id, alloc.assigned_seats, alloc.status]
      );

      const allocationId = allocResult.rows[0].id;

      // 7.1 INSERTAR ALUMNOS ASOCIADOS A ESTA ASIGNACIÓN
      // Obtenemos los alumnos de la solicitud original (request_item_students)
      // LOGICA CAMBIADA: Priorizar alumnos con mayor absentismo
      const studentsQuery = await client.query(
        `SELECT ris.student_id 
         FROM request_item_students ris
         JOIN students s ON ris.student_id = s.id
         WHERE ris.request_item_id = $1
         ORDER BY s.nivel_absentismo DESC, s.created_at ASC
         LIMIT $2`, // Quedarnos con los N alumnos con más absentismo
        [alloc.item_id, alloc.assigned_seats]
      );

      for (const student of studentsQuery.rows) {
        await client.query(
          `INSERT INTO allocation_students (allocation_id, student_id, status)
           VALUES ($1, $2, 'ACTIVE')`,
          [allocationId, student.student_id]
        );
      }
    }

    // 8. ASIGNAR PROFESORES REFERENTES
    const teacherAssignments = await assignTeacherReferents(client, periodId, allocations);

    await client.query('COMMIT');

    // 9. GENERAR INFORME
    const report = generateReport(allocations, rejections, editionState, schoolState, teacherAssignments);

    return report;

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error en algoritme:', error);
    throw error;
  } finally {
    client.release();
  }
};

/**
 * Intenta asignar una solicitud respetando todas las restricciones
 */
const tryAssignRequest = (request, editionState, schoolState, isSecondPass = false) => {
  const editionId = request.workshop_edition_id;
  const schoolId = request.school_id;
  const requested = request.requested_students;

  // Verificar que la edición existe
  if (!editionState[editionId]) {
    return { success: false, reason: 'Edició de taller no trobada' };
  }

  const edition = editionState[editionId];
  const school = schoolState[schoolId];

  // RESTRICCIÓN 1: No asignar martes si el centro no puede
  if (!request.available_for_tuesdays && edition.dayOfWeek === 'TUESDAY') {
    return { success: false, reason: 'Centre no disponible els dimarts' };
  }

  // RESTRICCIÓN 2: Capacidad total del taller
  const remainingTotal = edition.totalCapacity - edition.currentOccupancy;
  if (remainingTotal <= 0) {
    return { success: false, reason: 'Taller sense places disponibles' };
  }

  // RESTRICCIÓN 3: Límite por centro (máx 4)
  const currentForSchool = edition.perSchool[schoolId] || 0;
  const remainingForSchool = edition.maxPerSchool - currentForSchool;
  if (remainingForSchool <= 0) {
    return { success: false, reason: `Centre ja té ${edition.maxPerSchool} places en aquest taller` };
  }

  // RESTRICCIÓN 4: Equilibrio - En primera pasada, limitar si ya tiene muchas asignaciones
  if (!isSecondPass && school.workshopsAssigned >= 2 && remainingTotal > edition.maxPerSchool) {
    // Solo aplicar si hay suficientes plazas para otros
    return { success: false, reason: 'Esperant equilibri amb altres centres' };
  }

  // CALCULAR ASIGNACIÓN
  const canAssign = Math.min(requested, remainingTotal, remainingForSchool);

  if (canAssign > 0) {
    const allocation = {
      workshop_edition_id: editionId,
      item_id: request.item_id, // Añadimos item_id para poder rescatar los alumnos después
      school_id: schoolId,
      assigned_seats: canAssign,
      status: 'PROVISIONAL'
    };

    // Actualizar estados
    edition.currentOccupancy += canAssign;
    edition.perSchool[schoolId] = currentForSchool + canAssign;
    school.totalAssigned += canAssign;
    school.workshopsAssigned += 1;

    return { success: true, allocation };
  }

  return { success: false, reason: 'No s\'han pogut assignar places' };
};

/**
 * ASIGNACIÓN DE PROFESORES ACOMPAÑANTES
 * 
 * LÓGICA: Cada taller donde el centro tiene alumnos DEBE tener un profesor acompañante.
 * Cada profesor va a UN taller diferente donde hay alumnos de su centro.
 * El profesor acompaña a los alumnos y pasa lista.
 * 
 * Criterios:
 * 1. Solo asignar profesor a taller donde el centro tiene alumnos asignados
 * 2. Cada profesor va a un taller diferente (no puede estar en 2 a la vez)
 * 3. Respetar las preferencias declaradas por el centro
 * 4. TODOS los talleres con alumnos deben tener un profesor acompañante
 */
const assignTeacherReferents = async (client, periodId, allocations) => {
  const assignments = [];

  // 1. Obtener los profesores acompañantes declarados por cada centro
  const requestsQuery = await client.query(
    `SELECT 
      r.id as request_id,
      r.school_id,
      r.request_teachers,
      s.name as school_name
     FROM requests r
     JOIN schools s ON r.school_id = s.id
     WHERE r.enrollment_period_id = $1 AND r.status = 'SUBMITTED'`,
    [periodId]
  );

  // 2. Agrupar asignaciones por centro (qué talleres tiene cada centro)
  const workshopsBySchool = {};
  for (const alloc of allocations) {
    if (!workshopsBySchool[alloc.school_id]) {
      workshopsBySchool[alloc.school_id] = [];
    }
    workshopsBySchool[alloc.school_id].push(alloc.workshop_edition_id);
  }

  // 3. Obtener preferencias de profesores para talleres específicos
  const preferencesQuery = await client.query(
    `SELECT 
      rtp.request_id,
      rtp.workshop_edition_id,
      rtp.teacher_id,
      rtp.preference_order,
      t.full_name as teacher_name,
      t.school_id
     FROM request_teacher_preferences rtp
     JOIN teachers t ON rtp.teacher_id = t.id
     JOIN requests r ON rtp.request_id = r.id
     WHERE r.enrollment_period_id = $1 AND r.status = 'SUBMITTED'
     ORDER BY rtp.preference_order ASC`,
    [periodId]
  );

  // 4. Procesar cada centro
  for (const request of requestsQuery.rows) {
    const schoolId = request.school_id;
    const schoolName = request.school_name;
    const schoolWorkshops = workshopsBySchool[schoolId] || [];

    if (schoolWorkshops.length === 0) {
      continue;
    }

    // Obtener profesores del centro (de request_teachers JSON)
    let schoolTeachers = [];
    try {
      schoolTeachers = request.request_teachers ?
        (typeof request.request_teachers === 'string' ?
          JSON.parse(request.request_teachers) : request.request_teachers)
        : [];
    } catch (e) {
      console.log(`⚠️ Error parsing teachers for ${schoolName}:`, e.message);
    }

    // Obtener preferencias específicas del centro
    const schoolPreferences = preferencesQuery.rows.filter(p => p.school_id === schoolId);

    // Track de asignaciones para este centro
    const assignedTeacherIds = new Set();
    const assignedWorkshopIds = new Set();

    // 4.1 Primero, asignar según preferencias declaradas
    for (const pref of schoolPreferences) {
      // Solo asignar si el centro tiene alumnos en ese taller
      if (!schoolWorkshops.includes(pref.workshop_edition_id)) continue;
      // No repetir profesor (un profe no puede estar en 2 talleres simultáneos)
      if (assignedTeacherIds.has(pref.teacher_id)) continue;
      // No repetir taller (cada taller tiene 1 profe acompañante del centro)
      if (assignedWorkshopIds.has(pref.workshop_edition_id)) continue;

      await client.query(
        `INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_id, is_main_referent)
         VALUES ($1, $2, false)
         ON CONFLICT (workshop_edition_id, teacher_id) DO NOTHING`,
        [pref.workshop_edition_id, pref.teacher_id]
      );

      assignments.push({
        workshop_edition_id: pref.workshop_edition_id,
        teacher_id: pref.teacher_id,
        teacher_name: pref.teacher_name,
        school_name: schoolName,
        role: 'Acompanyant'
      });

      assignedTeacherIds.add(pref.teacher_id);
      assignedWorkshopIds.add(pref.workshop_edition_id);

      console.log(`👨‍🏫 ${pref.teacher_name} (${schoolName}) → Taller preferit com a acompanyant`);
    }

    // 4.2 Asignar profesores restantes a talleres sin profesor
    const remainingWorkshops = schoolWorkshops.filter(w => !assignedWorkshopIds.has(w));
    const remainingTeachers = schoolTeachers.filter(t => !assignedTeacherIds.has(t.id));

    for (let i = 0; i < remainingWorkshops.length; i++) {
      const workshopId = remainingWorkshops[i];
      const teacher = remainingTeachers[i];

      if (teacher && teacher.id) {
        await client.query(
          `INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_id, is_main_referent)
           VALUES ($1, $2, false)
           ON CONFLICT (workshop_edition_id, teacher_id) DO NOTHING`,
          [workshopId, teacher.id]
        );

        assignments.push({
          workshop_edition_id: workshopId,
          teacher_id: teacher.id,
          teacher_name: teacher.name || teacher.full_name || 'Professor',
          school_name: schoolName,
          role: 'Acompanyant'
        });

        assignedTeacherIds.add(teacher.id);
        assignedWorkshopIds.add(workshopId);

        console.log(`👨‍🏫 ${teacher.name || teacher.full_name} (${schoolName}) → Taller auto-assignat com a acompanyant`);
      } else {
        console.log(`⚠️ ${schoolName}: Taller sense professor disponible (falten professors declarats)`);
      }
    }
  }

  // 5. VERIFICAR que cada edición de taller con alumnos tenga al menos 1 profesor
  // Obtener todas las ediciones que tienen asignaciones (alumnos)
  const editionsWithStudents = [...new Set(allocations.map(a => a.workshop_edition_id))];

  for (const editionId of editionsWithStudents) {
    // Verificar si ya tiene profesor asignado
    const hasTeacher = await client.query(
      `SELECT COUNT(*) as count FROM workshop_assigned_teachers WHERE workshop_edition_id = $1`,
      [editionId]
    );

    if (parseInt(hasTeacher.rows[0].count) === 0) {
      // No tiene profesor! Buscar uno de los centros que tienen alumnos en este taller
      const schoolsInEdition = allocations
        .filter(a => a.workshop_edition_id === editionId)
        .map(a => a.school_id);

      // Buscar un profesor disponible de cualquiera de estos centros
      const availableTeacher = await client.query(
        `SELECT t.id, t.full_name, t.school_id, s.name as school_name
         FROM teachers t
         JOIN schools s ON t.school_id = s.id
         WHERE t.school_id = ANY($1)
         AND t.id NOT IN (
           SELECT teacher_id FROM workshop_assigned_teachers 
           WHERE workshop_edition_id = $2
         )
         LIMIT 1`,
        [schoolsInEdition, editionId]
      );

      if (availableTeacher.rows.length > 0) {
        const teacher = availableTeacher.rows[0];
        await client.query(
          `INSERT INTO workshop_assigned_teachers (workshop_edition_id, teacher_id, is_main_referent)
           VALUES ($1, $2, false)
           ON CONFLICT (workshop_edition_id, teacher_id) DO NOTHING`,
          [editionId, teacher.id]
        );

        assignments.push({
          workshop_edition_id: editionId,
          teacher_id: teacher.id,
          teacher_name: teacher.full_name,
          school_name: teacher.school_name,
          role: 'Acompanyant (auto-assignat per cobertura)'
        });

        console.log(`✅ Cobertura: ${teacher.full_name} (${teacher.school_name}) assignat a taller sense professor`);
      } else {
        console.log(`❌ ALERTA: Taller ${editionId} sense professor i sense candidats disponibles!`);
      }
    }
  }

  return assignments;
};

/**
 * Genera el informe final
 */
const generateReport = (allocations, rejections, editionState, schoolState, teacherAssignments) => {
  // Resumen por taller
  const workshopSummary = {};
  for (const [editionId, state] of Object.entries(editionState)) {
    workshopSummary[state.workshopTitle] = {
      capacitat: state.totalCapacity,
      assignats: state.currentOccupancy,
      disponibles: state.totalCapacity - state.currentOccupancy,
      centres: Object.keys(state.perSchool).length,
      ocupacio: ((state.currentOccupancy / state.totalCapacity) * 100).toFixed(0) + '%'
    };
  }

  // Resumen por centro
  const schoolSummary = {};
  for (const [schoolId, state] of Object.entries(schoolState)) {
    if (state.totalAssigned > 0) {
      schoolSummary[state.name] = {
        alumnes_assignats: state.totalAssigned,
        tallers: state.workshopsAssigned,
        primera_vegada: state.isFirstTime ? 'Sí' : 'No'
      };
    }
  }

  const report = {
    success: true,
    allocations_created: allocations.length,
    total_students_allocated: allocations.reduce((sum, a) => sum + a.assigned_seats, 0),
    centers_with_allocations: Object.keys(schoolSummary).length,
    rejections_count: rejections.length,
    teacher_assignments: teacherAssignments.length,
    summary: {
      per_taller: workshopSummary,
      per_centre: schoolSummary,
      rebutjats: rejections.slice(0, 15)
    }
  };

  console.log('\n════════════════════════════════════════');
  console.log('📋 RESUM FINAL ASSIGNACIÓ');
  console.log('════════════════════════════════════════');
  console.log(`✅ Assignacions creades: ${report.allocations_created}`);
  console.log(`👥 Alumnes assignats: ${report.total_students_allocated}`);
  console.log(`🏫 Centres amb places: ${report.centers_with_allocations}`);
  console.log(`❌ Sol·licituds rebutjades: ${report.rejections_count}`);
  console.log(`👨‍🏫 Professors assignats: ${report.teacher_assignments}`);
  console.log('════════════════════════════════════════\n');

  return report;
};

/**
 * Obtiene el resumen de demanda
 */
const getDemandSummary = async (periodId) => {
  try {
    const result = await db.query(
      `SELECT
        s.code as school_code,
        s.name as school_name,
        r.is_first_time_participation,
        w.title as workshop_title,
        we.day_of_week,
        ri.priority,
        SUM(ri.requested_students) as total_requested,
        COALESCE(
          (SELECT AVG(st.nivel_absentismo)::numeric(3,1)
           FROM request_item_students ris 
           JOIN students st ON ris.student_id = st.id 
           WHERE ris.request_item_id = ri.id),
          0
        ) as avg_absenteeism
       FROM requests r
       JOIN schools s ON r.school_id = s.id
       JOIN request_items ri ON ri.request_id = r.id
       JOIN workshop_editions we ON ri.workshop_edition_id = we.id
       JOIN workshops w ON we.workshop_id = w.id
       WHERE r.enrollment_period_id = $1 AND r.status = 'SUBMITTED'
       GROUP BY s.code, s.name, r.is_first_time_participation, w.title, we.day_of_week, ri.priority, ri.id
       ORDER BY ri.priority ASC, r.is_first_time_participation DESC, s.name`,
      [periodId]
    );

    return result.rows;
  } catch (error) {
    throw new Error(`Failed to fetch demand summary: ${error.message}`);
  }
};

module.exports = {
  runAllocationAlgorithm,
  getDemandSummary,
};
