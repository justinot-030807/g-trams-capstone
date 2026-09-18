const Ticket = require('../models/ticketModel');
const Notification = require('../models/notificationModel');
const { emitToUser } = require('../config/socket');

const createTicket = async (req, res, next) => {
    try {
        const { subject, contactNumber, message } = req.body;
        
        const ticket = await Ticket.create({
            operator: req.user._id,
            subject,
            contactNumber,
            message
        });

        res.status(201).json({ message: 'Ticket submitted successfully', ticket });
    } catch (error) {
        next(error);
    }
};

const getMyTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find({ operator: req.user._id }).sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        next(error);
    }
};

const getAllTickets = async (req, res, next) => {
    try {
        const tickets = await Ticket.find().populate('operator', 'name email contact').sort({ createdAt: -1 });
        res.status(200).json(tickets);
    } catch (error) {
        next(error);
    }
};

const updateTicketStatus = async (req, res, next) => {
    try {
        const { status, adminResponse } = req.body;
        const ticket = await Ticket.findById(req.params.id);
        
        if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

        ticket.status = status || ticket.status;
        if (adminResponse !== undefined) ticket.adminResponse = adminResponse;
        
        await ticket.save();

        // Notify operator if resolved or responded to
        if (adminResponse || status === 'Resolved') {
            const notification = await Notification.create({
                recipient: ticket.operator,
                type: 'status_change',
                title: `Support Ticket Updated`,
                message: `Your ticket regarding "${ticket.subject}" has been updated by an admin.`
            });
            emitToUser(String(ticket.operator), 'notification', notification);
        }

        res.status(200).json({ message: 'Ticket updated', ticket });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicketStatus };
