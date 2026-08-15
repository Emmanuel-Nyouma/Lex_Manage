const getStatus = (error) => error?.response?.status ?? error?.status;

export const getErrorPresentation = (error, fallback = 'Something went wrong. Please try again.') => {
  const status = getStatus(error);
  const message = typeof error === 'string' ? error : error?.message || '';
  const isChunkError = /chunk|dynamically imported module|failed to fetch/i.test(message);

  if (isChunkError) {
    return {
      title: 'Page could not load',
      message: 'This page is out of date or temporarily unavailable. Refresh the app and try again.',
      action: 'Refresh page',
      category: 'chunk',
    };
  }

  if (!status && /network|timeout|fetch/i.test(message)) {
    return {
      title: 'Connection problem',
      message: 'We could not reach LexManage. Check your internet connection and try again.',
      action: 'Try again',
      category: 'network',
    };
  }

  const byStatus = {
    400: ['Invalid request', 'Some information was not accepted. Review the form and try again.'],
    401: ['Session expired', 'Your session has expired. Sign in again to continue securely.'],
    403: ['Access denied', 'You do not have permission to perform this action.'],
    404: ['Not found', 'The requested record could not be found. It may have been removed.'],
    409: ['Conflict detected', 'This record changed elsewhere. Refresh the page before trying again.'],
    422: ['Validation error', 'Some information needs attention before this action can continue.'],
    429: ['Too many requests', 'Please wait a moment before trying again.'],
  };

  if (byStatus[status]) {
    const [title, friendlyMessage] = byStatus[status];
    return { title, message: friendlyMessage, action: 'Try again', category: `http-${status}` };
  }

  if (status >= 500) {
    return {
      title: 'Service temporarily unavailable',
      message: 'Impossible de confirmer cette opération. Actualisez les données avant de réessayer.',
      action: 'Try again',
      category: 'server',
    };
  }

  return {
    title: error?.name || 'Unexpected error',
    message: fallback,
    action: 'Try again',
    category: 'unknown',
  };
};

export const getErrorMessage = (error, fallback) => getErrorPresentation(error, fallback).message;
