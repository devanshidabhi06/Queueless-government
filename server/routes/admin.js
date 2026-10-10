const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/admin/queue
router.get('/queue', async (req, res) => {
  const { officeId, serviceId } = req.query;
  try {
    const queue = await prisma.token.findMany({
      where: { officeId, serviceId, status: { in: ['ISSUED', 'CALLED'] } },
      orderBy: { createdAt: 'asc' }
    });
    res.json(queue);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/queue/call-next
router.post('/queue/call-next', async (req, res) => {
  const { officeId, serviceId, counterId } = req.body;
  try {
    const nextToken = await prisma.token.findFirst({
      where: { officeId, serviceId, status: 'ISSUED' },
      orderBy: { createdAt: 'asc' }
    });
    
    if (!nextToken) return res.status(404).json({ message: 'Queue is empty' });
    
    const updated = await prisma.token.update({
      where: { id: nextToken.id },
      data: { status: 'CALLED', calledAt: new Date() }
    });
    
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/tokens/:tokenId/serve
router.post('/tokens/:tokenId/serve', async (req, res) => {
  try {
    const token = await prisma.token.update({
      where: { id: req.params.tokenId },
      data: { status: 'DONE', servedAt: new Date() }
    });
    res.json(token);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/admin/tokens/:tokenId/no-show
router.post('/tokens/:tokenId/no-show', async (req, res) => {
  try {
    const token = await prisma.token.update({
      where: { id: req.params.tokenId },
      data: { status: 'NO_SHOW' }
    });
    res.json(token);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
