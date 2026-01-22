const nodemailer = require("nodemailer");

/**
 * Servicio para envío de correos electrónicos
 */
class EmailService {
    constructor() {
        const transportOptions = {
            host: process.env.SMTP_HOST || "187.33.146.183", // Hardcoded IP to avoid DNS issues inside Docker
            port: process.env.SMTP_PORT || 587,
            secure: false, // true para 465, false para otros puertos
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

        this.transporter.verify((error, success) => {
            if (error) {
                console.error("❌ SMTP Connection Error:", error);
                console.error("Config used:", {
                    host: transportOptions.host,
                    port: transportOptions.port,
                    user: transportOptions.auth?.user,
                    pass: transportOptions.auth?.pass ? "****" : "missing"
                });
            } else {
                console.log("✅ SMTP Server is ready to take our messages");
                console.log("Config used:", {
                    host: transportOptions.host,
                    port: transportOptions.port,
                    user: transportOptions.auth?.user
                });
            }
        });
    }

    /**
     * Enviar credenciales de acceso a un nuevo profesor
     * @param {string} email
     * @param {string} password
     * @param {string} teacherName
     */
    async sendTeacherCredentials(email, password, teacherName) {
        const subject = "Benvingut a Enginy - Credencials d'accés";
        const appUrl = process.env.APP_URL || "http://enginy.daw.inspedralbes.cat"; // Ajustar según entorno

        const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
        <h2 style="color: #2563eb;">Benvingut/da ${teacherName}</h2>
        <p>Has estat assignat/da com a referent a un taller del projecte Enginy.</p>
        <p>S'ha creat un compte d'usuari perquè puguis accedir a la plataforma i gestionar l'assistència i avaluacions.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0; color: #4b5563;">Les teves credencials:</h3>
          <p><strong>Usuari/Email:</strong> ${email}</p>
          <p><strong>Contrasenya:</strong> ${password}</p>
        </div>

        <p>Pots accedir a la plataforma aquí:</p>
        <a href="${appUrl}" style="display: inline-block; background-color: #2563eb; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Accedir a Enginy</a>

        <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
          Et recomanem canviar la contrasenya un cop hagis iniciat sessió (funcionalitat pendent d'implementar).
        </p>
      </div>
    `;

        try {
            const info = await this.transporter.sendMail({
                from: `"Enginy Admin" <${process.env.SMTP_USER}>`,
                to: email,
                subject,
                html,
            });

            console.log(`📧 Correo enviado a ${email}: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error("❌ Error enviando correo:", error);
            // No lanzamos error para no bloquear la asignación, pero lo logueamos
            return false;
        }
    }
}

module.exports = new EmailService();
