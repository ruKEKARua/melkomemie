export type ViewingMonth = {
  key: string;
  year: number;
  month: number;
};

export const monthNames = {
  nominative: [
    'январь', 'февраль', 'март', 'апрель', 'май', 'июнь',
    'июль', 'август', 'сентябрь', 'октябрь', 'ноябрь', 'декабрь',
  ],
  genitive: [
    'января', 'февраля', 'марта', 'апреля', 'мая', 'июня',
    'июля', 'августа', 'сентября', 'октября', 'ноября', 'декабря',
  ],
  locative: [
    'январе', 'феврале', 'марте', 'апреле', 'мае', 'июне',
    'июле', 'августе', 'сентябре', 'октябре', 'ноябре', 'декабре',
  ],
} as const;

export const parseViewingMonth = (date?: string): ViewingMonth | undefined => {
  if (!date) return undefined;

  const normalizedDate = date.trim();
  const isoDate = normalizedDate.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  const localizedDate = normalizedDate.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  const year = Number(isoDate?.[1] ?? localizedDate?.[3]);
  const month = Number(isoDate?.[2] ?? localizedDate?.[2]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
    return undefined;
  }

  return {
    key: `${year}-${String(month).padStart(2, '0')}`,
    year,
    month,
  };
};

export const formatViewingMonth = (month: ViewingMonth, form: keyof typeof monthNames): string => {
  const name = monthNames[form][month.month - 1];
  return `${name[0].toLocaleUpperCase('ru-RU')}${name.slice(1)} ${month.year}`;
};

export function formatDate(dateStr?: string): string {
  if (!dateStr) return '';
  const [year, month, day] = dateStr.split('-');
  if (!year || !month) return dateStr;

  const months = monthNames.genitive;
  const monthIdx = Number(month) - 1;
  const monthName = months[monthIdx] ?? month;
  return day ? `${Number(day)} ${monthName} ${year}` : `${monthName} ${year}`;
}

export function formatDateFromExcel(date: string): string {
  const normalizedDate = date.trim();
  const match = normalizedDate.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/)
    || normalizedDate.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);

  if (!match) {
    return normalizedDate;
  }

  const [, first, second, third] = match;
  const day = Number(first.length === 4 ? third : first);
  const month = Number(first.length === 4 ? second : second);
  const year = Number(first.length === 4 ? first : third);

  const months = monthNames.genitive;
  return `${day} ${months[month - 1] ?? month} ${year}`;
}

export const parseDateInput = (date: string): string => {
  const isoDate = date.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2].padStart(2, '0')}-${isoDate[3].padStart(2, '0')}`;
  }

  const localizedDate = date.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (!localizedDate) {
    return '';
  }

  const year = localizedDate[3].length === 2 ? `20${localizedDate[3]}` : localizedDate[3];
  return `${year}-${localizedDate[2].padStart(2, '0')}-${localizedDate[1].padStart(2, '0')}`;
};
