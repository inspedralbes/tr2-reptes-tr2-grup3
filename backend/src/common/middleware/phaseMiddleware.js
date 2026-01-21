/**
 * phaseMiddleware.js
 * 
 * Middleware para validar que las acciones se ejecutan en la fase correcta del período.
 * 
 * FASES Y PERMISOS:
 * - SOLICITUDES: Centros pueden crear/editar solicitudes
 * - ASIGNACION: Admin puede ejecutar algoritmo (interno)
 * - PUBLICACION: Centros pueden ver resultados
 * - EJECUCION: Talleres en marcha, se pasa lista
 */

const db = require('../../config/db');

/**
 * Obtiene el período activo y su fase actual
 */
const getActivePeriodPhase = async () => {
  const result = await db.query(
    `SELECT id, current_phase, status FROM enrollment_periods WHERE status = 'ACTIVE' LIMIT 1`
  );
  return result.rows[0] || null;
};

/**
 * Middleware factory que valida si estamos en una de las fases permitidas
 * @param {string[]} allowedPhases - Array de fases permitidas
 * @param {object} options - Opciones adicionales
 * @param {boolean} options.adminBypass - Si true, admins pueden saltarse la restricción
 */
const requirePhase = (allowedPhases, options = {}) => {
  return async (req, res, next) => {
    try {
      // Admins pueden saltarse si está configurado
      if (options.adminBypass && req.user?.role === 'ADMIN') {
        return next();
      }

      const period = await getActivePeriodPhase();

      if (!period) {
        return res.status(400).json({
          error: 'No hi ha cap període actiu',
          code: 'NO_ACTIVE_PERIOD'
        });
      }

      if (!allowedPhases.includes(period.current_phase)) {
        const phaseNames = {
          SOLICITUDES: 'Sol·licituds',
          ASIGNACION: 'Assignació',
          PUBLICACION: 'Publicació',
          EJECUCION: 'Execució'
        };

        return res.status(403).json({
          error: `Aquesta acció no està disponible en la fase actual (${phaseNames[period.current_phase]})`,
          code: 'INVALID_PHASE',
          current_phase: period.current_phase,
          allowed_phases: allowedPhases
        });
      }

      // Añadir info del período al request para uso posterior
      req.activePeriod = period;
      next();
    } catch (error) {
      console.error('Error en phaseMiddleware:', error);
      res.status(500).json({ error: 'Error validant la fase del període' });
    }
  };
};

/**
 * Middleware específicos para cada acción
 */

// Solo en fase SOLICITUDES: crear/editar solicitudes
const canCreateRequests = requirePhase(['SOLICITUDES']);

// Solo en fase ASIGNACION: ejecutar algoritmo (solo admin)
const canRunAllocation = requirePhase(['ASIGNACION'], { adminBypass: false });

// En PUBLICACION o EJECUCION: ver resultados de asignación
const canViewAllocations = requirePhase(['PUBLICACION', 'EJECUCION'], { adminBypass: true });

// Solo en EJECUCION: pasar lista, gestionar asistencia
const canManageAttendance = requirePhase(['EJECUCION'], { adminBypass: true });

// Admin siempre puede ver demanda (para monitoreo)
const canViewDemand = requirePhase(['SOLICITUDES', 'ASIGNACION', 'PUBLICACION', 'EJECUCION'], { adminBypass: true });

module.exports = {
  requirePhase,
  getActivePeriodPhase,
  canCreateRequests,
  canRunAllocation,
  canViewAllocations,
  canManageAttendance,
  canViewDemand
};
