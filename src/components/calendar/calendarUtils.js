import { parseLegalDate } from '../../utils/dateOnly';

export const DAYS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
export const DAYS_FULL = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
export const MONTHS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre',
];

export const getEventsForDate = (events = [], year, month, day) =>
  events.filter((event) => {
    const date = parseLegalDate(event.dueAt);
    return date.getDate() === day && date.getMonth() === month && date.getFullYear() === year;
  });

export const searchCalendarEvents = (events = [], query = '') => {
  const normalizedQuery = query.trim().toLowerCase();
  if (!normalizedQuery) return [];
  return events
    .filter((event) =>
      (event.title || '').toLowerCase().includes(normalizedQuery)
      || (event.case?.title || '').toLowerCase().includes(normalizedQuery),
    )
    .sort((left, right) => parseLegalDate(left.dueAt) - parseLegalDate(right.dueAt));
};

export const groupEventsByMonth = (events = [], year, month) => {
  const grouped = new Map();
  events
    .filter((event) => {
      const date = parseLegalDate(event.dueAt);
      return date.getMonth() === month && date.getFullYear() === year;
    })
    .sort((left, right) => parseLegalDate(left.dueAt) - parseLegalDate(right.dueAt))
    .forEach((event) => {
      const day = parseLegalDate(event.dueAt).getDate();
      if (!grouped.has(day)) grouped.set(day, []);
      grouped.get(day).push(event);
    });
  return Array.from(grouped, ([day, groupedEvents]) => ({ day, events: groupedEvents }));
};

export const formatEventDate = (iso) => {
  const date = parseLegalDate(iso);
  return `${date.getDate()} ${MONTHS[date.getMonth()]} ${date.getFullYear()}`;
};
