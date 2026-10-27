const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/authMiddleware');
const { createTicket, getMyTickets, getAllTickets, updateTicketStatus } = require('../controllers/ticketController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Operator Routes
router.post('/', protect, apiLimiter, createTicket);
router.get('/my-tickets', protect, getMyTickets);

// Administrative Support Routes (BPLO Staff & System Admin)
router.get('/', protect, authorize('bplo_staff', 'system_admin', 'admin'), getAllTickets);
router.put('/:id/status', protect, authorize('bplo_staff', 'system_admin', 'admin'), updateTicketStatus);

module.exports = router;
