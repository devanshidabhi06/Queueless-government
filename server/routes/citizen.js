const express = require('express');
const router = express.Router();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

// GET /api/citizen/meta/offices
router.get('/meta/offices', async (req, res) => {
  try {
    const offices = await prisma.office.findMany();
    res.json(offices);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/citizen/meta/services
router.get('/meta/services', async (req, res) => {
  const { officeId } = req.query;
  try {
    const services = await prisma.service.findMany({ where: { officeId } });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/citizen/tokens
router.post('/tokens', async (req, res) => {
  const { officeId, serviceId, name, phone, notifyWhatsApp, consentGiven } = req.body;
  try {
    const count = await prisma.token.count({ where: { serviceId, status: 'ISSUED' } });
    const tokenNumber = `TW-${(count + 1).toString().padStart(4, '0')}`;
    
    const token = await prisma.token.create({
      data: {
        officeId, serviceId, name, phone, notifyWhatsApp, consentGiven, tokenNumber
      }
    });
    res.json(token);
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate token' });
  }
});

// GET /api/citizen/tokens/:tokenId
router.get('/tokens/:tokenId', async (req, res) => {
  try {
    const token = await prisma.token.findUnique({ where: { id: req.params.tokenId } });
    if (!token) return res.status(404).json({ error: 'Token not found' });
    
    res.json({ ...token, etaSeconds: 1200, tokensAhead: 4 });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/citizen/tokens/:tokenId/cancel
router.post('/tokens/:tokenId/cancel', async (req, res) => {
  try {
    const token = await prisma.token.update({
      where: { id: req.params.tokenId },
      data: { status: 'CANCELLED' }
    });
    res.json(token);
  } catch (err) {
    res.status(500).json({ error: 'Failed to cancel token' });
  }
});

module.exports = router;
