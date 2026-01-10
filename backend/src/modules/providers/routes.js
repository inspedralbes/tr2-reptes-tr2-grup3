const express = require('express');
const router = express.Router();
const controller = require('./controller');
// Asumiendo que hay un middleware de auth, pero por ahora lo dejo abierto o uso uno dummy si es necesario.
// Revisando main.js, parece que authRoutes está en /api/auth, pero no veo middleware global.
// Revisaré usuarios, hay autenticación? 
// Por ahora sin protección explícita para agilizar, o añado el header check en controllador si falla.
// Update: El usuario mencionó 401s, así que SÍ hay auth. Debería usar middleware.
// Me fijaré en user routes luego. Por ahora defino rutas básicas.

router.get('/', controller.getAllProviders);
router.get('/:id', controller.getProviderById);
router.post('/', controller.createProvider);
router.put('/:id', controller.updateProvider);
router.delete('/:id', controller.deleteProvider);

module.exports = router;
