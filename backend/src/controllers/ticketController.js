const Ticket = require('../models/ticketModel');
const Notification = require('../models/notificationModel');
const User = require('../models/userModel');
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

        try {
            const sysAdmins = await User.find({ role: { $in: ['system_admin', 'admin', 'administrator', 'Administrator'] } }).select('_id');
            for (const adm of sysAdmins) {
                const notif = await Notification.create({
                    recipient: adm._id,
                    type: 'system',
                    title: 'New Support Ticket Submitted',
                    message: `${req.user?.name || 'An operator'} submitted a support ticket: "${subject}".`
                });
                emitToUser(String(adm._id), 'notification', notif);
            }
        } catch (notifErr) {
            console.error('Error notifying system_admin of new ticket:', notifErr.message);
        }

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
        const recipientId = ticket.user || ticket.operator;
        if (recipientId && (adminResponse || status === 'Resolved')) {
            const notifTitle = status === 'Resolved' ? 'Support Ticket Resolved' : 'Support Ticket Updated';
            const notifMessage = status === 'Resolved'
                ? `Your support ticket regarding "${ticket.subject}" has been marked as Resolved.${adminResponse ? ` Response: ${adminResponse}` : ''}`
                : `Your ticket regarding "${ticket.subject}" has been updated by an admin.`;

            const notification = await Notification.create({
                recipient: recipientId,
                type: 'status_change',
                title: notifTitle,
                message: notifMessage
            });
            emitToUser(String(recipientId), 'notification', notification);
        }

        res.status(200).json({ message: 'Ticket updated', ticket });
    } catch (error) {
        next(error);
    }
};

module.exports = { createTicket, getMyTickets, getAllTickets, updateTicketStatus };

