import React from 'react';
import {
  Bell,
  CheckCircle2,
  Clock,
  AlertTriangle,
  AlertCircle,
  FileText,
  ShieldCheck,
  CreditCard,
  FileCheck2
} from 'lucide-react';

/**
 * Format timestamp into human-readable relative time string
 * e.g., 'Just now', '5m ago', '2h ago', 'Yesterday', 'Oct 14'
 */
export const formatRelativeTime = (timestamp, lang = 'en') => {
  if (!timestamp) return '';
  const date = new Date(timestamp);
  if (isNaN(date.getTime())) return String(timestamp);

  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  const isFil = lang === 'fil';

  if (diffSec < 60) {
    return isFil ? 'Kani-kanina lang' : 'Just now';
  }
  if (diffMin < 60) {
    return isFil ? `${diffMin}m ang nakalipas` : `${diffMin}m ago`;
  }
  if (diffHr < 24) {
    return isFil ? `${diffHr}o ang nakalipas` : `${diffHr}h ago`;
  }
  if (diffDay === 1) {
    return isFil ? 'Kahapon' : 'Yesterday';
  }
  if (diffDay < 7) {
    return isFil ? `${diffDay} araw nakalipas` : `${diffDay}d ago`;
  }

  return date.toLocaleDateString(isFil ? 'tl-PH' : 'en-US', {
    month: 'short',
    day: 'numeric'
  });
};

/**
 * Categorize notification to determine icon, badge chip, and high-contrast color accents
 */
export const getNotificationVisuals = (notif) => {
  const title = (notif?.title || '').toLowerCase();
  const message = (notif?.message || notif?.desc || '').toLowerCase();
  const type = (notif?.type || '').toLowerCase();
  const text = `${title} ${message} ${type}`;

  // 1. Ready for pickup / Claim stub / Approved
  if (
    text.includes('ready for pickup') ||
    text.includes('handa nang kunin') ||
    text.includes('claim stub') ||
    text.includes('approved') ||
    text.includes('naaprubahan') ||
    type === 'approval'
  ) {
    return {
      icon: CheckCircle2,
      badgeText: 'Ready for Pickup',
      badgeClass: 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300 border-emerald-300 dark:border-emerald-700/80',
      iconBg: 'bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400',
      accentBorder: 'border-l-4 border-l-emerald-600'
    };
  }

  // 2. Action Required / Returned / Revisions / Cancelled / Expired
  if (
    text.includes('action required') ||
    text.includes('needs revision') ||
    text.includes('returned') ||
    text.includes('kailangang ayusin') ||
    text.includes('ibinalik') ||
    text.includes('cancelled') ||
    text.includes('kinansela') ||
    text.includes('expired') ||
    text.includes('paso na') ||
    type === 'reminder'
  ) {
    return {
      icon: AlertTriangle,
      badgeText: text.includes('expired') ? 'Expired' : 'Action Required',
      badgeClass: 'bg-rose-100 dark:bg-rose-950/70 text-rose-800 dark:text-rose-300 border-rose-300 dark:border-rose-700/80',
      iconBg: 'bg-rose-100 dark:bg-rose-900/40 text-rose-600 dark:text-rose-400',
      accentBorder: 'border-l-4 border-l-rose-600'
    };
  }

  // 3. For Signing / Endorsement / In Review
  if (
    text.includes('for signing') ||
    text.includes('pagpirma') ||
    text.includes('signatures') ||
    text.includes('in review') ||
    text.includes('sinusuri') ||
    type === 'pending'
  ) {
    return {
      icon: Clock,
      badgeText: text.includes('for signing') ? 'For Signing' : 'In Review',
      badgeClass: 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300 border-amber-300 dark:border-amber-700/80',
      iconBg: 'bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400',
      accentBorder: 'border-l-4 border-l-amber-500'
    };
  }

  // 4. Active / Verified Permit
  if (
    text.includes('active') ||
    text.includes('aktibo') ||
    text.includes('verified') ||
    text.includes('napatunayan')
  ) {
    return {
      icon: ShieldCheck,
      badgeText: 'Active Permit',
      badgeClass: 'bg-blue-100 dark:bg-blue-950/70 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700/80',
      iconBg: 'bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400',
      accentBorder: 'border-l-4 border-l-blue-600'
    };
  }

  // 5. Payment / Fees
  if (text.includes('payment') || text.includes('bayad') || text.includes('treasury')) {
    return {
      icon: CreditCard,
      badgeText: 'Treasury / Fee',
      badgeClass: 'bg-purple-100 dark:bg-purple-950/70 text-purple-800 dark:text-purple-300 border-purple-300 dark:border-purple-700/80',
      iconBg: 'bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400',
      accentBorder: 'border-l-4 border-l-purple-600'
    };
  }

  // Default: System Notice / Update
  return {
    icon: Bell,
    badgeText: 'Update',
    badgeClass: 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-slate-700',
    iconBg: 'bg-[#7A1B22]/10 dark:bg-[#D4AF37]/15 text-[#7A1B22] dark:text-[#D4AF37]',
    accentBorder: 'border-l-4 border-l-[#7A1B22] dark:border-l-[#D4AF37]'
  };
};

/**
 * Rich message parser: parses **markdown bold** and highlights critical keywords
 * like Approved, Ready for Pickup, For Signing, Return/Revision notes, and LGU Remarks.
 */
export const renderRichNotificationMessage = (text) => {
  if (!text) return null;

  // Regex to split by markdown bold **text**
  const boldRegex = /(\*\*[^*]+\*\*)/g;
  const parts = text.split(boldRegex);

  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={index} className="font-bold text-slate-900 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    // Secondary keyword matching for unformatted text
    // Keywords to highlight: Approved, Ready for Pickup, For Signing, Action Required, etc.
    const keywordRegex = /\b(Approved|Ready for Pickup|For Signing|In Review|Active Permit|Action Required|Expired|Cancelled|Returned|LGU Note:|Remarks:)\b/gi;
    const subParts = part.split(keywordRegex);

    if (subParts.length === 1) {
      return <React.Fragment key={index}>{part}</React.Fragment>;
    }

    return (
      <React.Fragment key={index}>
        {subParts.map((sub, subIdx) => {
          if (keywordRegex.test(sub)) {
            return (
              <strong key={subIdx} className="font-bold text-slate-900 dark:text-white">
                {sub}
              </strong>
            );
          }
          return <span key={subIdx}>{sub}</span>;
        })}
      </React.Fragment>
    );
  });
};
