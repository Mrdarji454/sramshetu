import { Router } from 'express';
import * as serviceController from '../controllers/service.controller.js';

const router = Router();

// Public catalog endpoints
router.get('/', serviceController.getServices);
router.get('/:id', serviceController.getServiceById);

export default router;

