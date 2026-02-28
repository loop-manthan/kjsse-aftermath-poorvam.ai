import express from 'express';

const router = express.Router();

router.post('/authenticate', (req, res) => {
  res.json({ message: 'Voice authentication endpoint - to be implemented in Phase 3' });
});

router.post('/register', (req, res) => {
  res.json({ message: 'Voice registration endpoint - to be implemented in Phase 3' });
});

export default router;
