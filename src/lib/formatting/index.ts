export const formatCurrency = (
  amount: number,
  currency: string = 'PEN',
  locale: string = 'es-PE'
): string => {
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency: currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const formatDate = (
  dateString?: string | Date | null,
  options?: Intl.DateTimeFormatOptions
): string => {
  if (!dateString) return '-';
  try {
    const date = typeof dateString === 'string' ? new Date(dateString) : dateString;
    if (isNaN(date.getTime())) {
      // Handles YYYY-MM-DD or DD/MM/YYYY string fallbacks
      return String(dateString);
    }
    const defaultOptions: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      timeZone: 'America/Lima',
      ...options,
    };
    return new Intl.DateTimeFormat('es-PE', defaultOptions).format(date);
  } catch (err) {
    return String(dateString);
  }
};

export const formatDateTime = (
  dateString?: string | Date | null
): string => {
  return formatDate(dateString, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
};

export const formatNumber = (value: number): string => {
  return new Intl.NumberFormat('es-PE').format(value);
};
