const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  thread: { type: mongoose.Schema.Types.ObjectId, ref: 'ChatThread', required: true, index: true },
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  message: { type: String, required: true, maxlength: 1000 },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

const chatThreadSchema = new mongoose.Schema({
  participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  lastMessage: { type: String, default: '' },
  lastMessageAt: { type: Date, default: Date.now },
}, { timestamps: true });

chatThreadSchema.index({ participants: 1 });
chatMessageSchema.index({ thread: 1, createdAt: 1 });

const ChatMessage = mongoose.model('ChatMessage', chatMessageSchema);
const ChatThread = mongoose.model('ChatThread', chatThreadSchema);

module.exports = { ChatMessage, ChatThread };
