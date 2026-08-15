import * as Sentry from '@sentry/react';

let errorTrackingEnabled = false;

export const redactSensitiveText = (value) => {
  if (typeof value !== 'string') return value;
  return value
    .replace(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi, '[REDACTED_EMAIL]')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi, '[REDACTED_ID]')
    .replace(/\b(Bearer|token|secret|password)\s*[:=]?\s*[^\s,;]+/gi, '$1=[REDACTED]')
    .slice(0, 1000);
};

const sanitizeUrl = (value) => {
  if (!value) return value;
  try {
    const url = new URL(value, window.location.origin);
    const safePath = url.pathname.replace(
      /\b[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\b/gi,
      '[REDACTED_ID]',
    );
    return `${url.origin}${safePath}`;
  } catch {
    return redactSensitiveText(value);
  }
};

export const sanitizeSentryEvent = (event) => ({
  ...event,
  message: redactSensitiveText(event.message),
  user: undefined,
  extra: undefined,
  request: event.request
    ? {
        method: event.request.method,
        url: sanitizeUrl(event.request.url),
      }
    : undefined,
  exception: event.exception
    ? {
        ...event.exception,
        values: event.exception.values?.map((exception) => ({
          ...exception,
          value: redactSensitiveText(exception.value),
        })),
      }
    : undefined,
});

const sanitizeBreadcrumb = (breadcrumb) => {
  if (breadcrumb.category === 'console') return null;
  if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
    return {
      category: breadcrumb.category,
      level: breadcrumb.level,
      type: breadcrumb.type,
      timestamp: breadcrumb.timestamp,
      data: {
        method: breadcrumb.data?.method,
        status_code: breadcrumb.data?.status_code,
        url: sanitizeUrl(breadcrumb.data?.url),
      },
    };
  }
  return {
    ...breadcrumb,
    message: redactSensitiveText(breadcrumb.message),
    data: undefined,
  };
};

export const initErrorTracking = () => {
  const dsn = import.meta.env.VITE_SENTRY_DSN?.trim();
  if (!dsn) return false;

  Sentry.init({
    dsn,
    environment: import.meta.env.MODE,
    sendDefaultPii: false,
    maxBreadcrumbs: 20,
    tracesSampleRate: 0,
    beforeBreadcrumb: sanitizeBreadcrumb,
    beforeSend: sanitizeSentryEvent,
  });
  errorTrackingEnabled = true;
  return true;
};

export const captureFrontendError = (error, context = {}) => {
  if (!errorTrackingEnabled) return;
  Sentry.withScope((scope) => {
    scope.setTag('source', context.source || 'frontend');
    if (context.componentStack) {
      scope.setContext('react', {
        componentStack: redactSensitiveText(context.componentStack),
      });
    }
    Sentry.captureException(error);
  });
};
