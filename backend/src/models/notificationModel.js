const mongoose = require('mongoose');
const sendEmail = require('../utils/sendEmail');
const sendSms = require('../utils/sendSms');

const notificationSchema = new mongoose.Schema({
  recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['status_change', 'approval', 'renewal_reminder', 'system', 'chat', 'general', 'info'], default: 'general', lowercase: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  relatedFranchise: { type: mongoose.Schema.Types.ObjectId, ref: 'Franchise' },
  isRead: { type: Boolean, default: false },
}, { timestamps: true });

notificationSchema.index({ recipient: 1, createdAt: -1 });
notificationSchema.index({ recipient: 1, isRead: 1 });

function extractRecipientEmail(user, franchise) {
  const candidates = [
    user?.email,
    user?.recoveryEmail,
    user?.contact,
    user?.backupContact,
    franchise?.email,
    franchise?.contact
  ];
  for (const raw of candidates) {
    if (raw && typeof raw === 'string') {
      const trimmed = raw.trim().toLowerCase();
      if (trimmed.includes('@') && trimmed.includes('.') && !trimmed.includes(' ')) {
        return trimmed;
      }
    }
  }
  return null;
}

function buildNotificationEmailHtml({ recipientName, title, message, type, plateNo }) {
  const badgeMap = {
    approval: { label: 'Franchise Approval', bg: '#ECFDF5', text: '#047857', border: '#A7F3D0' },
    status_change: { label: 'Application Status Update', bg: '#FEF3C7', text: '#B45309', border: '#FDE68A' },
    renewal_reminder: { label: 'Renewal Reminder', bg: '#FEF2F2', text: '#B91C1C', border: '#FECACA' },
    chat: { label: 'Official Message / Advisory', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' },
    system: { label: 'System Notification', bg: '#F3F4F6', text: '#374151', border: '#E5E7EB' },
    general: { label: 'Official Notice', bg: '#FDF2F2', text: '#9E2A2B', border: '#F5D0D0' },
    info: { label: 'Information Notice', bg: '#EFF6FF', text: '#1D4ED8', border: '#BFDBFE' }
  };
  const badge = badgeMap[String(type || 'general').toLowerCase()] || badgeMap.general;
  const dateStr = new Date().toLocaleString('en-PH', {
    timeZone: 'Asia/Manila',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const safeMessage = String(message || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '<br/>');

  return `
  <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #F6F5F3; padding: 24px 12px; color: #1F1D1B;">
    <div style="max-width: 580px; margin: 0 auto; background-color: #FFFFFF; border-radius: 12px; overflow: hidden; border: 1px solid #E4E1DC; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
      <div style="background-color: #9E2A2B; border-bottom: 4px solid #D4AF37; padding: 20px 24px; color: #FFFFFF;">
        <div style="font-size: 11px; text-transform: uppercase; letter-spacing: 1.5px; color: #D4AF37; font-weight: 700;">
          Republic of the Philippines • Municipality of Gasan, Marinduque
        </div>
        <div style="font-size: 18px; font-weight: 700; margin-top: 4px;">
          G-TRAMS Official Notification
        </div>
      </div>
      <div style="padding: 24px;">
        <div style="margin-bottom: 16px;">
          <span style="display: inline-block; padding: 4px 10px; border-radius: 6px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; background-color: ${badge.bg}; color: ${badge.text}; border: 1px solid ${badge.border};">
            ${badge.label}${plateNo ? ` • Unit ${plateNo}` : ''}
          </span>
        </div>
        <p style="font-size: 14px; color: #4B5563; margin: 0 0 12px 0;">
          Magandang araw, <strong style="color: #1F1D1B;">${recipientName || 'Ka-Gasan Operator'}</strong>,
        </p>
        <h2 style="font-size: 17px; font-weight: 700; color: #1F1D1B; margin: 0 0 12px 0;">
          ${title}
        </h2>
        <div style="background-color: #F6F5F3; border-left: 4px solid #9E2A2B; padding: 14px 16px; border-radius: 6px; font-size: 14px; line-height: 1.6; color: #1F1D1B; margin-bottom: 20px;">
          ${safeMessage}
        </div>
        <div style="margin-top: 20px; text-align: center;">
          <a href="https://g-trams-official.vercel.app" style="display: inline-block; background-color: #9E2A2B; color: #FFFFFF; text-decoration: none; font-weight: 700; font-size: 13px; padding: 10px 22px; border-radius: 8px;">
            Buksan ang G-TRAMS Portal
          </a>
        </div>
        <p style="font-size: 11px; color: #6B6761; margin-top: 22px; border-top: 1px solid #E4E1DC; padding-top: 12px;">
          Date &amp; Time (PST): ${dateStr}<br/>
          Sangguniang Bayan / Tricycle Franchising Office — Municipality of Gasan, Marinduque
        </p>
      </div>
    </div>
  </div>`;
}

function extractRecipientPhone(user, franchise) {
  const candidates = [
    user?.contact,
    user?.recoveryPhone,
    user?.backupContact,
    franchise?.contact
  ];
  for (const raw of candidates) {
    if (raw && typeof raw === 'string' && !raw.includes('@')) {
      const formatted = sendSms.formatPhoneE164(raw);
      if (formatted && formatted.length >= 12) {
        return formatted;
      }
    }
  }
  return null;
}

async function dispatchNotificationEmail(doc) {
  try {
    if (!doc || !doc.recipient) return;
    if (process.env.NODE_ENV === 'test') return;

    const hasEmailConfig = Boolean(process.env.SMTP_API_KEY);
    const hasSmsConfig = Boolean(process.env.TEXTBEE_API_KEY || process.env.SEMAPHORE_API_KEY);
    if (!hasEmailConfig && !hasSmsConfig) return;

    const User = mongoose.models.User || require('./userModel');
    const user = await User.findById(doc.recipient)
      .select('name email recoveryEmail contact recoveryPhone backupContact')
      .lean();

    let franchise = null;
    if (doc.relatedFranchise) {
      const Franchise = mongoose.models.Franchise || require('./franchiseModel');
      franchise = await Franchise.findById(doc.relatedFranchise)
        .select('email contact fullName plateNo')
        .lean()
        .catch(() => null);
    }

    const recipientName = user?.name || franchise?.fullName || 'G-TRAMS User';

    // 1. Dispatch Email (Brevo) if configured and recipient has email
    if (hasEmailConfig) {
      const email = extractRecipientEmail(user, franchise);
      if (email) {
        const html = buildNotificationEmailHtml({
          recipientName,
          title: doc.title,
          message: doc.message,
          type: doc.type,
          plateNo: franchise?.plateNo
        });

        await sendEmail({
          email,
          subject: `[G-TRAMS LGU Gasan] ${doc.title}`,
          message: `Magandang araw ${recipientName},\n\n${doc.title}\n${doc.message}\n\nBuksan ang G-TRAMS Portal: https://g-trams-official.vercel.app`,
          html
        }).catch(err => console.warn('[Notification Email] Warning:', err.message));
      }
    }

    // 2. Dispatch SMS (TextBee / Semaphore) if configured and recipient has phone number
    if (hasSmsConfig) {
      const phone = extractRecipientPhone(user, franchise);
      if (phone) {
        const smsText = `[G-TRAMS LGU Gasan] ${doc.title}: ${doc.message}`;
        await sendSms({
          phone,
          message: smsText
        }).catch(err => console.warn('[Notification SMS] Warning:', err.message));
      }
    }
  } catch (err) {
    console.warn('[Notification Dispatch] Non-critical dispatch warning:', err.message);
  }
}

notificationSchema.pre('save', function () {
  this.$locals = this.$locals || {};
  this.$locals.wasNew = this.isNew;
});

notificationSchema.post('save', function (doc) {
  if (this.$locals && this.$locals.wasNew) {
    setImmediate(() => {
      dispatchNotificationEmail(doc);
    });
  }
});

notificationSchema.post('insertMany', function (docs) {
  if (Array.isArray(docs) && docs.length > 0) {
    setImmediate(async () => {
      for (const doc of docs) {
        await dispatchNotificationEmail(doc);
      }
    });
  }
});

module.exports = mongoose.model('Notification', notificationSchema);
