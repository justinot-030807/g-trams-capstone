import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

/**
 * Standard StatusBadge Component for G-TRAMS
 * Strictly adheres to the 4 semantic status states with WCAG AA compliance:
 * 1. Active: Green
 * 2. In-Progress (Pending, Pending for Approval, For Signing, Ready for Pickup): Amber
 * 3. Danger (Expired, Revoked): Red
 * 4. Neutral (Cancelled, Draft, Empty, None): Gray
 */
const StatusBadge = ({ status = '', customLabel = null, className = '' }) => {
  const { t } = useLanguage() || { t: (_, def) => def };
  const rawStatus = String(status || '').trim();
  const normalized = rawStatus.toLowerCase();

  let state = 'neutral';
  let defaultLabel = rawStatus || 'Unknown';

  if (normalized === 'active' || normalized === 'operational') {
    state = 'active';
    defaultLabel = t('status.active', 'Active');
  } else if (
    normalized === 'pending' ||
    normalized === 'pending for approval' ||
    normalized === 'for review' ||
    normalized === 'for signing' ||
    normalized === 'ready for pickup' ||
    normalized === 'payment pending' ||
    normalized === 'in review'
  ) {
    state = 'progress';
    if (normalized === 'for signing') {
      defaultLabel = t('status.forSigning', 'For Signing');
    } else if (normalized === 'ready for pickup') {
      defaultLabel = t('status.readyForPickup', 'Ready for Pickup');
    } else {
      defaultLabel = t('status.pending', 'Pending');
    }
  } else if (
    normalized === 'expired' ||
    normalized === 'revoked' ||
    normalized === 'rejected' ||
    normalized === 'failed'
  ) {
    state = 'danger';
    if (normalized === 'revoked') {
      defaultLabel = t('status.revoked', 'Revoked');
    } else if (normalized === 'expired') {
      defaultLabel = t('status.expired', 'Expired');
    } else {
      defaultLabel = t('status.rejected', 'Rejected');
    }
  } else if (
    normalized === 'cancelled' ||
    normalized === 'canceled' ||
    normalized === 'draft' ||
    normalized === 'none' ||
    normalized === 'archived'
  ) {
    state = 'neutral';
    if (normalized === 'cancelled' || normalized === 'canceled') {
      defaultLabel = t('status.cancelled', 'Cancelled');
    } else {
      defaultLabel = rawStatus || t('status.none', 'None');
    }
  }

  const label = customLabel || defaultLabel;

  // Exact 4 semantic styling tokens
  const styles = {
    active: {
      container: 'bg-[#F0FDF4] text-[#15803D] border-[#BBF7D0] dark:bg-[#052E16]/60 dark:text-[#4ADE80] dark:border-[#166534]',
      dot: 'bg-[#15803D] dark:bg-[#4ADE80]',
    },
    progress: {
      container: 'bg-[#FFFBEB] text-[#B45309] border-[#FDE68A] dark:bg-[#451A03]/60 dark:text-[#FBBF24] dark:border-[#92400E]',
      dot: 'bg-[#B45309] dark:bg-[#FBBF24]',
    },
    danger: {
      container: 'bg-[#FEF2F2] text-[#B91C1C] border-[#FECACA] dark:bg-[#450A0A]/60 dark:text-[#F87171] dark:border-[#991B1B]',
      dot: 'bg-[#B91C1C] dark:bg-[#F87171]',
    },
    neutral: {
      container: 'bg-[#F3F4F6] text-[#4B5563] border-[#E5E7EB] dark:bg-[#1F2937]/60 dark:text-[#9CA3AF] dark:border-[#374151]',
      dot: 'bg-[#6B7280] dark:bg-[#9CA3AF]',
    },
  }[state];

  return (
    <span
      role="status"
      aria-label={`Status: ${label}`}
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md border text-xs font-medium select-none ${styles.container} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${styles.dot}`} aria-hidden="true" />
      <span>{label}</span>
    </span>
  );
};

export default StatusBadge;
