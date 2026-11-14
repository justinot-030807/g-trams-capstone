import React from 'react';
import { cn } from '@/lib/utils';

const VARIANT_STYLES = {
  primary:
    'bg-[#9E2A2B] hover:bg-[#7A1B22] text-white border border-[#9E2A2B] hover:border-[#7A1B22]',
  secondary:
    'bg-white dark:bg-[#1C1917] text-[#1F1D1B] dark:text-[#F6F5F3] border border-[#E4E1DC] dark:border-[#2E2A27] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27]',
  ghost:
    'bg-transparent text-[#6B6761] dark:text-[#A8A29E] hover:bg-[#F6F5F3] dark:hover:bg-[#2E2A27] hover:text-[#1F1D1B] dark:hover:text-[#F6F5F3] border border-transparent',
  danger:
    'bg-[#B91C1C] hover:bg-[#991B1B] text-white border border-[#B91C1C]',
};

/**
 * Shared accessible G-TRAMS button with standardized height and focus ring.
 */
const Button = React.forwardRef(({ className, variant = 'primary', type = 'button', ...props }, ref) => (
  <button
    ref={ref}
    type={type}
    className={cn(
      'inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 min-h-[42px] text-xs sm:text-sm font-semibold transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#9E2A2B] dark:focus-visible:ring-[#D4AF37] focus-visible:ring-offset-1',
      VARIANT_STYLES[variant] || VARIANT_STYLES.primary,
      className
    )}
    {...props}
  />
));
Button.displayName = 'Button';

export { Button };
