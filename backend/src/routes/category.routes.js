import express from 'express';
import { getAllCategories, getCategoryStats, createCategory } from '../controllers/category.controller.js';

const router = express.Router();

router.get('/', getAllCategories);
router.get('/stats', getCategoryStats);
router.post('/create', createCategory);

export default router;
