/**
 * Formats a number or numeric string to Uzbek Som (UZS) with space separators every 3 digits.
 * Example: 1500000 -> "1 500 000 UZS"
 */
export function formatUZS(val: number | string | null | undefined): string {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return '0 UZS';
  }
  const num = Math.round(Number(val));
  const formattedStr = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formattedStr} UZS`;
}
