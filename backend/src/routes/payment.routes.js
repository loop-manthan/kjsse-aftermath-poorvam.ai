import express from 'express';
import {
  createPaymentOrder,
  verifyPayment,
  confirmOfflinePayment,
  getTransactionHistory
} from '../controllers/payment.controller.js';
import { authenticate } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/create-order', authenticate, createPaymentOrder);
router.post('/verify', authenticate, verifyPayment);
router.post('/offline-confirm', authenticate, confirmOfflinePayment);
router.get('/history/:userId', authenticate, getTransactionHistory);

export default router;
