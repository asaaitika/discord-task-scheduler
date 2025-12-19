import { Router } from 'express';
import taskController from '../controllers/taskController';
import { requireApiKey } from '../middleware/auth.middleware';

const router = Router();

// Apply API key middleware to ALL task routes
router.use(requireApiKey);

router.post('/tasks', taskController.createTask);
router.get('/tasks', taskController.getAllTasks);
router.get('/tasks/active', taskController.getActiveTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

export default router;
