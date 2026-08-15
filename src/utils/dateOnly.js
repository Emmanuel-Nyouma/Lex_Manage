export const parseLegalDate = (value) => {
  const text = String(value || '');
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(text);
  if (match) {
    return new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
  }
  return new Date(value);
};

export const formatLegalDate = (value, locale = 'fr-FR', options) =>
  parseLegalDate(value).toLocaleDateString(locale, options);
