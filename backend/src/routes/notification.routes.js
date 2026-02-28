import express from 'express';
import {
  getNotifications,
  markNotificationAsRead,
  deleteNotification as deleteNotif,
  getUnreadCount as getCount
} from '../controllers/notification.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/', authenticate, getNotifications);
router.get('/unread-count', authenticate, getCount);
router.patch('/:id/read', authenticate, markNotificationAsRead);
router.delete('/:id', authenticate, deleteNotif);

export default router;
