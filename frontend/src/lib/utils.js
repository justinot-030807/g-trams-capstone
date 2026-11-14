import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merges Tailwind utility classes while deduplicating conflicting variants.
 */
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
