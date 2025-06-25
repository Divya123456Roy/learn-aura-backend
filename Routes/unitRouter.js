// unitRoutes.js
const express = require('express');
const unitRouter = express.Router();
const unitController = require('../Controllers/unitController');
const { protect } = require('../Middlewares/authMiddleware');
const upload = require('../Middlewares/imageUpload');

// Public Routes
unitRouter.get('/',protect, unitController.getAllUnits);
unitRouter.get('/:id',protect, unitController.getUnitById);
unitRouter.get('/module/:moduleId',protect, unitController.getUnitsByModuleId);

// Protected Routes
unitRouter.post('/', protect, upload('units').array("files"), unitController.createUnit);
unitRouter.put('/:unitId', protect, upload('units').array("files"), unitController.updateUnit);
unitRouter.delete('/:id', protect, unitController.deleteUnit);

module.exports = unitRouter;