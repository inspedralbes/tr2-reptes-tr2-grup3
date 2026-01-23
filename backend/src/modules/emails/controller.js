/**
 * emails/controller.js
 * 
 * Controlador para envío de emails con streaming SSE
 * Permite visualizar el progreso en tiempo real
 */
const db = require('../../config/db');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');

// Configuración de transporter
const getTransporter = () => {
  const transportOptions = {
    host: process.env.SMTP_HOST || "187.33.146.183",
    port: process.env.SMTP_PORT || 587,
    secure: false,
    tls: { rejectUnauthorized: false }
  };

  if (process.env.SMTP_USER && process.env.SMTP_PASS) {
    transportOptions.auth = {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    };
  }

  return nodemailer.createTransport(transportOptions);
};

const fromEmail = process.env.SMTP_USER || "noreply@enginy.cat";
const appUrl = process.env.APP_URL || "http://enginy.daw.inspedralbes.cat";
const emailEnabled = process.env.EMAIL_ENABLED === 'true';

/**
 * Genera contraseña aleatoria
 */
const generatePassword = (length = 10) => {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return password;
};

/**
 * GET /api/emails/send-stream
 * Server-Sent Events endpoint para envío de emails con progreso en tiempo real
 * Query params: type=coordinators|teachers, periodId, token
 */
const sendEmailsStream = async (req, res) => {
  // Configurar SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.flushHeaders();

  const { type, periodId } = req.query;

  // Helper para enviar evento SSE
  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    let recipients = [];
    let periodData = null;

    // Obtener período si se proporciona
    if (periodId && periodId !== 'null' && periodId !== 'undefined' && periodId !== '') {
      const periodResult = await db.query(
        'SELECT * FROM enrollment_periods WHERE id = $1',
        [periodId]
      );
      if (periodResult.rows.length > 0) {
        periodData = periodResult.rows[0];
      }
    }

    // Obtener destinatarios según el tipo
    if (type === 'coordinators') {
      const result = await db.query(`
        SELECT u.id, u.email, u.full_name, s.name as school_name
        FROM users u
        LEFT JOIN schools s ON s.coordinator_user_id = u.id
        WHERE u.role = 'CENTER_COORD' AND u.email IS NOT NULL AND u.email != ''
      `);
      recipients = result.rows;
    } else if (type === 'teachers') {
      // Profesores asignados al período actual
      if (!periodId || periodId === 'null' || periodId === 'undefined' || periodId === '') {
        sendEvent({ event: 'no-recipients', message: 'Cal seleccionar un període per enviar a professors' });
        res.end();
        return;
      }
      const result = await db.query(`
        SELECT DISTINCT t.id, t.email, t.full_name, s.name as school_name
        FROM teachers t
        JOIN workshop_assigned_teachers wat ON t.id = wat.teacher_id
        JOIN workshop_editions we ON wat.workshop_edition_id = we.id
        LEFT JOIN schools s ON t.school_id = s.id
        WHERE we.enrollment_period_id = $1 AND t.email IS NOT NULL AND t.email != ''
      `, [periodId]);
      recipients = result.rows;
    }

    if (recipients.length === 0) {
      sendEvent({ event: 'no-recipients' });
      res.end();
      return;
    }

    // Enviar evento de inicio
    sendEvent({ event: 'start', total: recipients.length });

    const transporter = getTransporter();
    let sent = 0;
    let errors = 0;

    // Procesar cada destinatario
    for (const recipient of recipients) {
      // Pequeña pausa para visualizar mejor el progreso
      await new Promise(resolve => setTimeout(resolve, 300));

      sendEvent({ 
        event: 'sending', 
        email: recipient.email, 
        name: recipient.full_name 
      });

      try {
        // Generar nueva contraseña
        const newPassword = generatePassword();
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Determinar si actualizar users o teachers
        if (type === 'coordinators') {
          await db.query(
            'UPDATE users SET password_hash = $1 WHERE id = $2',
            [hashedPassword, recipient.id]
          );
        } else if (type === 'teachers') {
          // Verificar si tiene usuario vinculado
          const teacherCheck = await db.query(
            'SELECT user_id FROM teachers WHERE id = $1',
            [recipient.id]
          );
          
          if (teacherCheck.rows[0]?.user_id) {
            await db.query(
              'UPDATE users SET password_hash = $1 WHERE id = $2',
              [hashedPassword, teacherCheck.rows[0].user_id]
            );
          } else {
            // Crear usuario para el profesor
            const newUser = await db.query(
              `INSERT INTO users (full_name, email, password_hash, role) 
               VALUES ($1, $2, $3, 'TEACHER') RETURNING id`,
              [recipient.full_name, recipient.email, hashedPassword]
            );
            await db.query(
              'UPDATE teachers SET user_id = $1 WHERE id = $2',
              [newUser.rows[0].id, recipient.id]
            );
          }
        }

        // Generar HTML del email
        const subject = type === 'coordinators' 
          ? `Enginy ${periodData?.name || ''} - Credencials d'accés per a coordinadors`
          : `Benvingut a Enginy - Credencials d'accés`;

        const html = type === 'coordinators' 
          ? generateCoordinatorEmailHtml(recipient, newPassword, periodData)
          : generateTeacherEmailHtml(recipient, newPassword);

        // Enviar email (si está habilitado)
        if (emailEnabled) {
          await transporter.sendMail({
            from: `"Enginy" <${fromEmail}>`,
            to: recipient.email,
            subject,
            html
          });
        }

        sent++;
        sendEvent({ 
          event: 'sent', 
          email: recipient.email, 
          name: recipient.full_name 
        });

      } catch (error) {
        console.error(`Error enviando a ${recipient.email}:`, error.message);
        errors++;
        sendEvent({ 
          event: 'error', 
          email: recipient.email, 
          error: error.message 
        });
      }
    }

    // Enviar evento de completado
    sendEvent({ event: 'complete', sent, errors, total: recipients.length });
    res.end();

  } catch (error) {
    console.error('Error en sendEmailsStream:', error);
    sendEvent({ event: 'error', email: 'sistema', error: error.message });
    res.end();
  }
};

/**
 * Genera HTML para email de coordinador
 */
const generateCoordinatorEmailHtml = (recipient, password, period) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Benvingut/da ${recipient.full_name}!</h2>
      <p>S'ha iniciat un nou any escolar al projecte <strong>Enginy</strong>.</p>
      
      ${recipient.school_name 
        ? `<p>Com a coordinador/a de <strong>${recipient.school_name}</strong>, ja pots accedir a la plataforma.</p>` 
        : '<p>Ja pots accedir a la plataforma per gestionar les sol·licituds de tallers.</p>'}
      
      ${period ? `
      <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #2563eb;">
        <h3 style="margin-top: 0; color: #1e40af;">Període: ${period.name}</h3>
      </div>
      ` : ''}

      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4b5563;">Les teves credencials:</h3>
        <p><strong>Usuari/Email:</strong> ${recipient.email}</p>
        <p><strong>Contrasenya:</strong> ${password}</p>
      </div>

      <a href="${appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Et recomanem canviar la contrasenya un cop hagis iniciat sessió.
      </p>
    </div>
  `;
};

/**
 * Genera HTML para email de profesor
 */
const generateTeacherEmailHtml = (recipient, password) => {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #2563eb;">Benvingut/da ${recipient.full_name}</h2>
      <p>Has estat assignat/da com a professor/a acompanyant a un taller del projecte Enginy.</p>
      
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0; color: #4b5563;">Les teves credencials:</h3>
        <p><strong>Usuari/Email:</strong> ${recipient.email}</p>
        <p><strong>Contrasenya:</strong> ${password}</p>
      </div>

      <a href="${appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>

      <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
        Et recomanem canviar la contrasenya un cop hagis iniciat sessió.
      </p>
    </div>
  `;
};

/**
 * GET /api/emails/test-connection
 * Prueba la conexión SMTP
 */
const testConnection = async (req, res) => {
  if (req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Only admins can test email connection' });
  }

  try {
    const transporter = getTransporter();
    await transporter.verify();
    res.json({ 
      success: true, 
      message: 'Connexió SMTP correcta',
      emailEnabled 
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: error.message,
      emailEnabled 
    });
  }
};

module.exports = {
  sendEmailsStream,
  testConnection
};
