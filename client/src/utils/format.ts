/**
 * Formats a number to Uzbek Som string with space grouping.
 * Example: 1500000 -> "1 500 000 UZS"
 */
export function formatUZS(amount: number | string | null | undefined): string {
  if (amount === null || amount === undefined || isNaN(Number(amount))) {
    return '0 UZS';
  }
  const num = Math.round(Number(amount));
  const formattedStr = num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  return `${formattedStr} UZS`;
}

/**
 * Formats ISO date string to YYYY-MM-DD or readable Uzbek date.
 */
export function formatDate(dateString: string | null | undefined): string {
  if (!dateString) return '-';
  const d = new Date(dateString);
  if (isNaN(d.getTime())) return '-';
  return d.toISOString().split('T')[0];
}

export function getMonthName(monthNumber: number): string {
  const months = [
    'Yanvar', 'Fevral', 'Mart', 'Aprel', 'May', 'Iyun',
    'Iyul', 'Avgust', 'Sentabr', 'Oktabr', 'Noyabr', 'Dekabr'
  ];
  return months[monthNumber - 1] || `${monthNumber}-oy`;
}
