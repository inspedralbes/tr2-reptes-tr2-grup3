const express = require('express');
const router = express.Router();
const controller = require('./controller');

router.get('/', controller.getAllCenters);
router.get('/:id', controller.getCenterById);
router.post('/', controller.createCenter);
router.put('/:id', controller.updateCenter);
router.delete('/:id', controller.deleteCenter);

module.exports = router;
