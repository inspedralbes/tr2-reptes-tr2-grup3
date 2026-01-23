/**
 * emails/routes.js
 * 
 * Rutas para el módulo de emails con streaming SSE
 */
const express = require('express');
const jwt = require('jsonwebtoken');
const { sendEmailsStream, testConnection } = require('./controller');
const { authenticate } = require('../../common/middleware/authMiddleware');

const router = express.Router();

/**
 * Middleware especial para SSE que autentica por query param
 * (EventSource no soporta headers personalizados)
 * Envía errores como eventos SSE para que el frontend los maneje correctamente
 */
const authenticateSSE = (req, res, next) => {
  const token = req.query.token;
  
  // Configurar SSE headers primero para poder enviar eventos de error
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('Access-Control-Allow-Origin', '*');
  
  const sendErrorEvent = (message) => {
    res.write(`data: ${JSON.stringify({ event: 'auth-error', message })}\n\n`);
    res.end();
  };
  
  if (!token) {
    return sendErrorEvent('Sessió no vàlida. Torna a iniciar sessió.');
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'development_secret');
    req.user = decoded;
    
    // Verificar que sea admin
    if (decoded.role !== 'ADMIN') {
      return sendErrorEvent('Només els administradors poden enviar correus massius.');
    }
    
    next();
  } catch (error) {
    return sendErrorEvent('Sessió expirada. Torna a iniciar sessió.');
  }
};

// GET - Stream de envío de emails (SSE)
router.get('/send-stream', authenticateSSE, sendEmailsStream);

// GET - Test de conexión SMTP
router.get('/test-connection', authenticate, testConnection);

module.exports = router;
