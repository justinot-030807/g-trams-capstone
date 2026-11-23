# Notifications, Real-Time Chat & Cron Engine

Links: [[00-index]] · [[architecture]] · [[decisions]]
Tags: #core #realtime #api

## Scope & Responsibilities
- Coordinates real-time WebSocket updates, staff-operator live chat, targeted announcements, multi-channel notifications (Email, SMS, Web Push), and scheduled maintenance jobs.
- Enforces thread-owner isolation on support chats, email masking in delivery logs, and Render keepalive pings.

## Key Files
- `backend/src/config/socket.js` — JWT-authenticated Socket.IO rooms, forced `session_revoked` disconnect, and origin allowlist.
- `backend/src/routes/chatRoutes.js` & `backend/src/models/chatModel.js` (`ChatThread`, `ChatMessage`) — Staff replies, announcements, thread-scoped unread clearing.
- `backend/src/models/notificationModel.js`, `backend/src/routes/notificationRoutes.js`, `backend/src/services/notificationService.js`.
- `backend/src/utils/sendEmail.js` (Brevo API), `backend/src/utils/sendSms.js` (TextBee + Semaphore fallback), `backend/src/models/smsLogModel.js`.
- `backend/src/config/webPush.js`, `backend/src/routes/pushRoutes.js`, `backend/src/services/pushService.js`, `backend/src/models/pushSubscriptionModel.js`.
- `backend/src/services/cronService.js` & `backend/src/jobs/cleanupJobs.js` — `Asia/Manila` midnight expiry sync, 30-day reminders, 1-year auto-archive, weekly backup, 10-min keepalive, hourly unverified-user cleanup.
- `frontend/src/context/SocketContext.jsx`, `NotificationContext.jsx`, `frontend/src/components/admin/AdminLiveChat.jsx`, `AdminBroadcastCenter.jsx`, `frontend/src/components/operator/ChatWidget.jsx`.
