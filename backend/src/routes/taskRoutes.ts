import { Router } from 'express';
import taskController from '../controllers/taskController';
import taskLogController from '../controllers/taskLogController';
import dashboardController from '../controllers/dashboardController';
import { requireApiKey } from '../middleware/auth.middleware';

const router = Router();

// Apply API key middleware to ALL routes
router.use(requireApiKey);

// Dashboard routes (must be before /tasks/:id to avoid conflicts)
router.get('/dashboard/stats', dashboardController.getStats);

// Recent logs route
router.get('/logs/recent', taskLogController.getRecentLogs);

// Task routes
router.post('/tasks', taskController.createTask);
router.get('/tasks', taskController.getAllTasks);
router.get('/tasks/active', taskController.getActiveTasks);
router.get('/tasks/:id', taskController.getTaskById);
router.put('/tasks/:id', taskController.updateTask);
router.delete('/tasks/:id', taskController.deleteTask);

// Task logs routes
router.get('/tasks/:id/logs', taskLogController.getLogsByTaskId);

export default router;
