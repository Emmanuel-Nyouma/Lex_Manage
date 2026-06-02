import DOMPurify from 'dompurify';

export const sanitize = (dirty) => {
  return DOMPurify.sanitize(dirty);
};
