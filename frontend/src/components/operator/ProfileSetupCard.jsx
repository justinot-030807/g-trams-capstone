import React, { useMemo, useState } from 'react';
import {
  CheckCircle2,
  ShieldCheck,
  Phone,
  Camera,
  UserCheck,
  ArrowRight,
  X
} from 'lucide-react';

/**
 * Progressive "Setup Your Profile" checklist for Operators & TODA Presidents.
 * Strictly aligned with Gasan Heritage palette (Warm Alabaster, Maroon, Gold) and WCAG AA.
 */
const ProfileSetupCard = ({
  user = {},
  profilePicUrl = '',
  variant = 'dashboard', // 'dashboard' | 'settings'
  onAction,
  dismissible = false
}) => {
  const userId = user?._id || user?.id || 'default';
  const dismissKey = `gtrams_profile_setup_dismissed_${userId}`;

  const [dismissed, setDismissed] = useState(() => {
    if (!dismissible) return false;
    try {
      return sessionStorage.getItem(dismissKey) === '1';
    } catch {
      return false;
    }
  });

  const hasRecovery = Boolean(
    (user?.recoveryEmail && String(user.recoveryEmail).trim()) ||
    (user?.recoveryPhone && String(user.recoveryPhone).trim()) ||
    (user?.backupContact && String(user.backupContact).trim())
  );
  const hasEmergency = Boolean(user?.emergencyContact && String(user.emergencyContact).trim());
  const hasPhoto = Boolean(profilePicUrl || (user?.profilePic && String(user.profilePic).trim()));
  const hasVerifiedIdentity = Boolean(user?.name || user?.fullName);

  const steps = useMemo(
    () => [
      {
        id: 'identity',
        title: 'Official operator identity verified',
        description: user?.todaAssociation && user.todaAssociation !== 'NON-TODA'
          ? `Registered under ${user.todaAssociation}`
          : 'Primary contact and account verified',
        completed: hasVerifiedIdentity,
        icon: UserCheck,
        cta: 'Review',
        priority: false
      },
      {
        id: 'recovery',
        title: 'Add account recovery phone or email',
        description: hasRecovery
          ? 'Backup recovery contact is active for Forgot Password'
          : 'Protects your account if you lose access to your SIM or primary email',
        completed: hasRecovery,
        icon: ShieldCheck,
        cta: 'Add recovery',
        priority: !hasRecovery
      },
      {
        id: 'emergency',
        title: 'Set emergency contact number',
        description: hasEmergency
          ? 'Emergency roadside & municipal contact saved'
          : 'Used by LGU Gasan in case of urgent roadside or franchise notices',
        completed: hasEmergency,
        icon: Phone,
        cta: 'Add number',
        priority: false
      },
      {
        id: 'photo',
        title: 'Upload operator ID photo',
        description: hasPhoto
          ? 'Displayed on your official Digital Operator ID Card'
          : 'Adds your headshot to your verifiable QR Operator ID Card',
        completed: hasPhoto,
        icon: Camera,
        cta: 'Upload photo',
        priority: false
      }
    ],
    [user?.todaAssociation, hasVerifiedIdentity, hasRecovery, hasEmergency, hasPhoto]
  );

  const completedCount = steps.filter((s) => s.completed).length;
  const totalCount = steps.length;
  const percent = Math.round((completedCount / totalCount) * 100);
  const isComplete = completedCount === totalCount;

  // Hide on dashboard once complete or dismissed for this session
  if (variant === 'dashboard' && (isComplete || dismissed)) {
    return null;
  }

  // On settings, once complete render a single calm readiness strip
  if (variant === 'settings' && isComplete) {
    return (
      <div className="bg-[#F0FDF4] dark:bg-[#052E16]/40 border border-[#BBF7D0] dark:border-[#166534] rounded-xl px-4 py-3.5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-9 h-9 rounded-lg bg-[#15803D]/15 dark:bg-[#4ADE80]/15 text-[#15803D] dark:text-[#4ADE80] flex items-center justify-center shrink-0">
            <CheckCircle2 size={18} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[#15803D] dark:text-[#4ADE80] leading-snug">
              Profile setup complete
            </p>
            <p className="text-xs text-[#1F1D1B]/80 dark:text-[#F6F5F3]/80 mt-0.5">
              Recovery contact, emergency number, and ID photo are all configured.
            </p>
          </div>
        </div>
        <span className="font-mono tabular-nums text-xs font-semibold text-[#15803D] dark:text-[#4ADE80] bg-white/80 dark:bg-[#14110F]/60 border border-[#BBF7D0] dark:border-[#166534] px-2.5 py-1 rounded-full shrink-0">
          100%
        </span>
      </div>
    );
  }

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(dismissKey, '1');
    } catch {
      // ignore storage failure
    }
  };

  return (
    <section
      aria-label="Setup your profile"
      className="bg-white dark:bg-[#1C1917] rounded-xl border border-[#E4E1DC] dark:border-[#2E2A27] shadow-sm overflow-hidden transition-colors"
    >
      {/* Header + Progress Bar */}
      <div className="px-5 pt-5 pb-4 border-b border-[#E4E1DC] dark:border-[#2E2A27]">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base font-bold text-[#1F1D1B] dark:text-[#F6F5F3] tracking-tight">
                Setup your profile
              </h2>
              <span className="font-mono tabular-nums text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FDF2F4] dark:bg-[#9E2A2B]/20 text-[#9E2A2B] dark:text-[#F5E6B3] border border-[#F8C5CA] dark:border-[#9E2A2B]/40">
                {completedCount}/{totalCount} done
              </span>
            </div>
            <p className="text-xs sm:text-sm text-[#6B6761] dark:text-[#A8A29E] mt-1 leading-relaxed">
              {!hasRecovery
                ? 'Add a recovery phone or email so you can always recover your account.'
                : 'Complete the remaining items to keep your municipal operator record ready.'}
            </p>
          </div>

          {dismissible && (
            <button
              type="button"
              onClick={handleDismiss}
              aria-label="Dismiss profile setup reminder"
              className="w-9 h-9 rounded-lg text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] flex items-center justify-center shrink-0 transition-colors cursor-pointer"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Crisp Segmented / Smooth Progress Track */}
        <div className="mt-3.5 flex items-center gap-3">
          <div
            role="progressbar"
            aria-valuenow={percent}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Profile setup completion"
            className="flex-1 h-2 rounded-full bg-[#F6F5F3] dark:bg-[#14110F] border border-[#E4E1DC] dark:border-[#2E2A27] overflow-hidden"
          >
            <div
              className="h-full rounded-full bg-[#9E2A2B] dark:bg-[#D4AF37] transition-all duration-300 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
          <span className="font-mono tabular-nums text-xs font-semibold text-[#1F1D1B] dark:text-[#F6F5F3] w-9 text-right">
            {percent}%
          </span>
        </div>
      </div>

      {/* Checklist Rows (Flat dividers, no nested cards) */}
      <div className="divide-y divide-[#E4E1DC] dark:divide-[#2E2A27]">
        {steps.map((step) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`px-5 py-3.5 flex items-center justify-between gap-3 transition-colors ${
                step.completed
                  ? 'bg-[#FAF9F7]/60 dark:bg-[#14110F]/30'
                  : 'hover:bg-[#FAF9F7] dark:hover:bg-[#25211E]/70'
              }`}
            >
              <div className="flex items-start sm:items-center gap-3.5 min-w-0 flex-1">
                <div
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border transition-colors ${
                    step.completed
                      ? 'bg-[#F0FDF4] dark:bg-[#052E16]/60 border-[#BBF7D0] dark:border-[#166534] text-[#15803D] dark:text-[#4ADE80]'
                      : step.priority
                        ? 'bg-[#FDF2F4] dark:bg-[#9E2A2B]/20 border-[#F8C5CA] dark:border-[#9E2A2B]/40 text-[#9E2A2B] dark:text-[#F5E6B3]'
                        : 'bg-[#F6F5F3] dark:bg-[#14110F] border-[#E4E1DC] dark:border-[#2E2A27] text-[#6B6761] dark:text-[#A8A29E]'
                  }`}
                >
                  {step.completed ? <CheckCircle2 size={17} /> : <Icon size={17} />}
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <p
                      className={`text-sm font-semibold leading-snug ${
                        step.completed
                          ? 'text-[#6B6761] dark:text-[#A8A29E] line-through decoration-[#6B6761]/50'
                          : 'text-[#1F1D1B] dark:text-[#F6F5F3]'
                      }`}
                    >
                      {step.title}
                    </p>
                    {step.priority && !step.completed && (
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-[#FFFBEB] dark:bg-[#451A03]/60 text-[#B45309] dark:text-[#FBBF24] border border-[#FDE68A] dark:border-[#92400E]">
                        Recommended
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#6B6761] dark:text-[#A8A29E] mt-0.5 leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              {step.completed ? (
                <span className="text-xs font-semibold text-[#15803D] dark:text-[#4ADE80] shrink-0 hidden sm:inline">
                  Done
                </span>
              ) : (
                <button
                  type="button"
                  onClick={() => onAction && onAction(step.id)}
                  className={`inline-flex items-center gap-1.5 px-3.5 py-2 min-h-[40px] rounded-lg text-xs font-semibold shrink-0 transition-colors cursor-pointer ${
                    step.priority
                      ? 'bg-[#9E2A2B] hover:bg-[#7A1B22] text-white dark:bg-[#D4AF37] dark:hover:bg-[#C29E2F] dark:text-[#14110F] shadow-sm'
                      : 'bg-[#F6F5F3] hover:bg-[#EAE7E1] dark:bg-[#14110F] dark:hover:bg-[#2E2A27] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27]'
                  }`}
                >
                  <span>{step.cta}</span>
                  <ArrowRight size={13} />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};

export default ProfileSetupCard;
