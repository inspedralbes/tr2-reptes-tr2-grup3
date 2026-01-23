const nodemailer = require("nodemailer");
const db = require("../../config/db");

/**
 * Servicio para envío de correos electrónicos
 * 
 * FUNCIONALIDADES:
 * 1. Envío de credenciales a profesores
 * 2. Notificación de inicio de período a todos los usuarios
 * 3. Notificación de cambio de fase a coordinadores
 * 4. Notificación de ausencia al tutor del alumno
 * 
 * MODO TESTING: Las funciones de envío masivo están desactivadas por defecto.
 * Para activarlas, establecer EMAIL_ENABLED=true en las variables de entorno.
 */
class EmailService {
    constructor() {
        // Flag para activar/desactivar envío de emails (DESACTIVADO en testing)
        this.enabled = process.env.EMAIL_ENABLED === 'true';
        
        if (!this.enabled) {
            console.log("📧 EmailService: MODO TESTING - Los emails NO se enviarán realmente");
        }

        const transportOptions = {
            host: process.env.SMTP_HOST || "187.33.146.183",
            port: process.env.SMTP_PORT || 587,
            secure: false,
            tls: {
                rejectUnauthorized: false
            }
        };

        if (process.env.SMTP_USER && process.env.SMTP_PASS) {
            transportOptions.auth = {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            };
        }

        this.transporter = nodemailer.createTransport(transportOptions);
        this.fromEmail = process.env.SMTP_USER || "noreply@enginy.cat";
        this.appUrl = process.env.APP_URL || "http://enginy.daw.inspedralbes.cat";

        // Solo verificar conexión si está habilitado
        if (this.enabled) {
            this.transporter.verify((error, success) => {
                if (error) {
                    console.error("❌ SMTP Connection Error:", error);
                } else {
                    console.log("✅ SMTP Server is ready to take our messages");
                }
            });
        }
    }

    /**
     * Método interno para enviar email (respeta el flag enabled)
     */
    async _sendEmail(to, subject, html) {
        if (!this.enabled) {
            console.log(`📧 [TESTING] Email NO enviado a ${to}`);
            console.log(`   Asunto: ${subject}`);
            return { success: true, testing: true };
        }

        try {
            const info = await this.transporter.sendMail({
                from: `"Enginy" <${this.fromEmail}>`,
                to,
                subject,
                html,
            });
            console.log(`📧 Email enviado a ${to}: ${info.messageId}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error(`❌ Error enviando email a ${to}:`, error.message);
            return { success: false, error: error.message };
        }
    }

    // ========================================
    // 1. CREDENCIALES DE PROFESOR
    // ========================================
    async sendTeacherCredentials(email, password, teacherName) {
        const subject = "Benvingut a Enginy - Credencials d'accés";
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #2563eb;">Benvingut/da ${teacherName}</h2>
                <p>Has estat assignat/da com a professor/a acompanyant a un taller del projecte Enginy.</p>
                
                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #4b5563;">Les teves credencials:</h3>
                    <p><strong>Usuari/Email:</strong> ${email}</p>
                    <p><strong>Contrasenya:</strong> ${password}</p>
                </div>

                <a href="${this.appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    Et recomanem canviar la contrasenya un cop hagis iniciat sessió.
                </p>
            </div>
        `;

        return this._sendEmail(email, subject, html);
    }

    // ========================================
    // 1.5. CREDENCIALES DE COORDINADOR (NUEVO AÑO)
    // ========================================
    /**
     * Envía credenciales a un coordinador cuando se crea un nuevo período
     * @param {string} email - Email del coordinador
     * @param {string} password - Contraseña generada
     * @param {string} coordinatorName - Nombre del coordinador
     * @param {string} schoolName - Nombre del centro educativo
     * @param {string} periodName - Nombre del nuevo período
     */
    async sendCoordinatorCredentials(email, password, coordinatorName, schoolName, periodName) {
        const subject = `Enginy ${periodName} - Credencials d'accés per a coordinadors`;
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #2563eb;">Benvingut/da ${coordinatorName}!</h2>
                <p>S'ha iniciat un nou any escolar al projecte <strong>Enginy</strong>.</p>
                
                ${schoolName ? `<p>Com a coordinador/a de <strong>${schoolName}</strong>, ja pots accedir a la plataforma per gestionar les sol·licituds de tallers del teu centre.</p>` : '<p>Ja pots accedir a la plataforma per gestionar les sol·licituds de tallers.</p>'}
                
                <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                    <h3 style="margin-top: 0; color: #1e40af;">Període: ${periodName}</h3>
                </div>

                <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
                    <h3 style="margin-top: 0; color: #4b5563;">Les teves credencials:</h3>
                    <p><strong>Usuari/Email:</strong> ${email}</p>
                    <p><strong>Contrasenya:</strong> ${password}</p>
                </div>

                <a href="${this.appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    Et recomanem canviar la contrasenya un cop hagis iniciat sessió.<br>
                    Si tens qualsevol dubte, contacta amb l'administració d'Enginy.
                </p>
            </div>
        `;

        return this._sendEmail(email, subject, html);
    }

    /**
     * Envía credenciales a TODOS los coordinadores de centros al crear un nuevo período
     * Genera nueva contraseña para cada uno y la actualiza en la BD
     * @param {Object} period - Datos del período creado
     * @returns {Object} Resultados del envío
     */
    async sendCredentialsToAllCoordinators(period) {
        const bcrypt = require('bcrypt');
        
        console.log(`📧 Enviando credenciales a coordinadores para período: ${period.name}`);

        // Obtener todos los coordinadores con su centro
        const coordsQuery = await db.query(`
            SELECT u.id, u.email, u.full_name, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON s.coordinator_user_id = u.id
            WHERE u.role = 'CENTER_COORD' AND u.email IS NOT NULL
        `);

        const coordinators = coordsQuery.rows;
        console.log(`📧 Total coordinadores encontrados: ${coordinators.length}`);

        let sentCount = 0;
        let errorCount = 0;
        const results = [];

        for (const coord of coordinators) {
            try {
                // Generar nueva contraseña
                const newPassword = this._generatePassword();
                const hashedPassword = await bcrypt.hash(newPassword, 10);

                // Actualizar contraseña en la BD
                await db.query(
                    'UPDATE users SET password_hash = $1 WHERE id = $2',
                    [hashedPassword, coord.id]
                );

                // Enviar email
                const emailResult = await this.sendCoordinatorCredentials(
                    coord.email,
                    newPassword,
                    coord.full_name,
                    coord.school_name,
                    period.name
                );

                if (emailResult.success) {
                    sentCount++;
                    results.push({ email: coord.email, success: true });
                } else {
                    errorCount++;
                    results.push({ email: coord.email, success: false, error: emailResult.error });
                }
            } catch (error) {
                errorCount++;
                results.push({ email: coord.email, success: false, error: error.message });
                console.error(`❌ Error con coordinador ${coord.email}:`, error.message);
            }
        }

        console.log(`📧 Credenciales coordinadores completado: ${sentCount} enviados, ${errorCount} errores`);
        return { sent: sentCount, errors: errorCount, total: coordinators.length, details: results };
    }

    /**
     * Genera una contraseña aleatoria segura
     */
    _generatePassword(length = 10) {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
        let password = '';
        for (let i = 0; i < length; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    // ========================================
    // 2. INICIO DE PERÍODO - EMAIL A TODOS
    // ========================================
    /**
     * Envía email a todos los usuarios cuando se activa un nuevo período
     * @param {Object} period - Datos del período activado
     */
    async sendPeriodStartNotification(period) {
        console.log(`📧 Preparando notificación de inicio de período: ${period.name}`);

        // Obtener todos los emails únicos (users + teachers)
        const emailsQuery = await db.query(`
            SELECT DISTINCT email, full_name, 'user' as type FROM users WHERE email IS NOT NULL
            UNION
            SELECT DISTINCT email, full_name, 'teacher' as type FROM teachers WHERE email IS NOT NULL
        `);

        const recipients = emailsQuery.rows;
        console.log(`📧 Total destinatarios: ${recipients.length}`);

        const subject = `Enginy - Nou període obert: ${period.name}`;

        let sentCount = 0;
        let errorCount = 0;

        for (const recipient of recipients) {
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #2563eb;">Hola ${recipient.full_name}!</h2>
                    <p>T'informem que s'ha obert un nou període d'inscripció al projecte Enginy.</p>
                    
                    <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
                        <h3 style="margin-top: 0; color: #1e40af;">${period.name}</h3>
                        <p><strong>Fase actual:</strong> ${this._getPhaseLabel(period.current_phase)}</p>
                        ${period.phase_solicitudes_end ? `<p><strong>Data límit sol·licituds:</strong> ${new Date(period.phase_solicitudes_end).toLocaleDateString('ca-ES')}</p>` : ''}
                    </div>

                    <a href="${this.appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a la plataforma</a>

                    <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                        Si tens qualsevol dubte, contacta amb l'administració d'Enginy.
                    </p>
                </div>
            `;

            const result = await this._sendEmail(recipient.email, subject, html);
            if (result.success) sentCount++;
            else errorCount++;
        }

        console.log(`📧 Notificació inici període completada: ${sentCount} enviats, ${errorCount} errors`);
        return { sent: sentCount, errors: errorCount, total: recipients.length };
    }

    // ========================================
    // 3. CAMBIO DE FASE - EMAIL A COORDINADORES
    // ========================================
    /**
     * Envía email a coordinadores cuando cambia la fase del período
     * @param {Object} period - Datos del período con nueva fase
     * @param {string} previousPhase - Fase anterior
     */
    async sendPhaseChangeNotification(period, previousPhase) {
        console.log(`📧 Notificando cambio de fase: ${previousPhase} → ${period.current_phase}`);

        // Obtener todos los coordinadores
        const coordsQuery = await db.query(`
            SELECT u.email, u.full_name, s.name as school_name
            FROM users u
            LEFT JOIN schools s ON s.coordinator_user_id = u.id
            WHERE u.role = 'CENTER_COORD' AND u.email IS NOT NULL
        `);

        const coordinators = coordsQuery.rows;
        console.log(`📧 Total coordinadores: ${coordinators.length}`);

        const subject = `Enginy - Canvi de fase: ${this._getPhaseLabel(period.current_phase)}`;

        const phaseInfo = this._getPhaseInfo(period.current_phase);

        let sentCount = 0;
        let errorCount = 0;

        for (const coord of coordinators) {
            const html = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                    <h2 style="color: #2563eb;">Hola ${coord.full_name}!</h2>
                    
                    <div style="background-color: ${phaseInfo.bgColor}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${phaseInfo.borderColor};">
                        <h3 style="margin-top: 0; color: ${phaseInfo.textColor};">
                            Nova fase: ${this._getPhaseLabel(period.current_phase)}
                        </h3>
                        <p>${phaseInfo.description}</p>
                    </div>

                    ${coord.school_name ? `<p><strong>El teu centre:</strong> ${coord.school_name}</p>` : ''}

                    <h4>Què pots fer ara?</h4>
                    <ul>
                        ${phaseInfo.actions.map(a => `<li>${a}</li>`).join('')}
                    </ul>

                    <a href="${this.appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>
                </div>
            `;

            const result = await this._sendEmail(coord.email, subject, html);
            if (result.success) sentCount++;
            else errorCount++;
        }

        console.log(`📧 Notificació canvi fase completada: ${sentCount} enviats, ${errorCount} errors`);
        return { sent: sentCount, errors: errorCount, total: coordinators.length };
    }

    // ========================================
    // 4. AUSENCIA DE ALUMNO - EMAIL AL TUTOR
    // ========================================
    /**
     * Envía email al tutor cuando un alumno es marcado como ausente
     * @param {Object} studentData - Datos del alumno (id, nombre, tutor_email, etc.)
     * @param {Object} sessionData - Datos de la sesión (taller, fecha, etc.)
     * @param {string} status - Estado de asistencia (ABSENT, LATE, EXCUSED)
     * @param {string} observation - Observación del profesor (opcional)
     */
    async sendAbsenceNotification(studentData, sessionData, status, observation = null) {
        if (!studentData.tutor_email) {
            console.log(`📧 Alumno ${studentData.nombre_completo} no tiene email de tutor configurado`);
            return { success: false, reason: 'no_tutor_email' };
        }

        const statusLabels = {
            'ABSENT': 'No ha assistit',
            'LATE': 'Ha arribat tard',
            'EXCUSED': 'Falta justificada'
        };

        const statusColors = {
            'ABSENT': { bg: '#fef2f2', border: '#ef4444', text: '#b91c1c' },
            'LATE': { bg: '#fffbeb', border: '#f59e0b', text: '#b45309' },
            'EXCUSED': { bg: '#f0fdf4', border: '#22c55e', text: '#15803d' }
        };

        const color = statusColors[status] || statusColors['ABSENT'];
        const statusLabel = statusLabels[status] || status;

        const subject = `Enginy - Notificació d'assistència: ${studentData.nombre_completo}`;

        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
                <h2 style="color: #2563eb;">Notificació d'assistència</h2>
                
                <p>Benvolgut/da ${studentData.tutor_nombre || 'tutor/a'},</p>
                
                <p>Us informem sobre l'assistència del vostre fill/a al taller del projecte Enginy:</p>
                
                <div style="background-color: ${color.bg}; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid ${color.border};">
                    <h3 style="margin-top: 0; color: ${color.text};">${statusLabel}</h3>
                    <p><strong>Alumne/a:</strong> ${studentData.nombre_completo}</p>
                    <p><strong>Taller:</strong> ${sessionData.workshop_title}</p>
                    <p><strong>Data:</strong> ${new Date(sessionData.date).toLocaleDateString('ca-ES', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                    ${observation ? `<p><strong>Observació:</strong> ${observation}</p>` : ''}
                </div>

                ${status === 'ABSENT' ? `
                <p style="color: #b91c1c;">
                    <strong>Important:</strong> L'assistència als tallers és important per al seguiment i avaluació de l'alumne/a.
                    Si la falta ha estat justificada, poseu-vos en contacte amb el centre educatiu.
                </p>
                ` : ''}

                <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                    Atentament,<br>
                    Equip Enginy
                </p>
            </div>
        `;

        console.log(`📧 Enviando notificación de ${status} de ${studentData.nombre_completo} a tutor: ${studentData.tutor_email}`);
        return this._sendEmail(studentData.tutor_email, subject, html);
    }

    // ========================================
    // HELPERS
    // ========================================
    _getPhaseLabel(phase) {
        const labels = {
            'SOLICITUDES': 'Enviament de Sol·licituds',
            'ASIGNACION': 'Assignació de Places',
            'PUBLICACION': 'Publicació de Resultats',
            'EJECUCION': 'Execució de Tallers'
        };
        return labels[phase] || phase;
    }

    _getPhaseInfo(phase) {
        const info = {
            'SOLICITUDES': {
                bgColor: '#dbeafe',
                borderColor: '#2563eb',
                textColor: '#1e40af',
                description: 'El període de sol·licituds està obert. Podeu enviar les vostres peticions de tallers.',
                actions: ['Crear sol·licituds de tallers', 'Afegir alumnes a les sol·licituds', 'Indicar preferències de professors']
            },
            'ASIGNACION': {
                bgColor: '#fef3c7',
                borderColor: '#f59e0b',
                textColor: '#b45309',
                description: "S'està processant l'assignació de places. Properament rebreu els resultats.",
                actions: ['Esperar resultats', 'Preparar documentació dels alumnes']
            },
            'PUBLICACION': {
                bgColor: '#dcfce7',
                borderColor: '#22c55e',
                textColor: '#15803d',
                description: 'Ja podeu veure les assignacions! Confirmeu els alumnes que assistiran.',
                actions: ['Veure assignacions', 'Confirmar alumnes', 'Preparar documentació', 'Assignar professors acompanyants']
            },
            'EJECUCION': {
                bgColor: '#f3e8ff',
                borderColor: '#a855f7',
                textColor: '#7e22ce',
                description: 'Els tallers estan en marxa. Els professors ja poden passar llista.',
                actions: ['Passar llista dels alumnes', 'Registrar avaluacions', 'Gestionar incidències']
            }
        };
        return info[phase] || info['SOLICITUDES'];
    }

    /**
     * Activa o desactiva el envío de emails (para testing)
     */
    setEnabled(enabled) {
        this.enabled = enabled;
        console.log(`📧 EmailService: ${enabled ? 'ACTIVAT' : 'DESACTIVAT'}`);
    }
}

module.exports = new EmailService();
