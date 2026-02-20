const APP_NAME = 'Boosted Flow';

const STATIC_PAGE_LABELS: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/analytics': 'Analytics',
  '/activities': 'Activities',
  '/login': 'Login',
  '/register': 'Register',
  '/forgot-password': 'Forgot Password',
  '/reset-password': 'Reset Password',
  '/auth/callback': 'Auth Callback',
  '/legal': 'Legal & Policies',
};

export function formatAppTitle(pageLabel?: string): string {
  if (!pageLabel) {
    return APP_NAME;
  }

  return `${APP_NAME} - ${pageLabel}`;
}

function normalizePath(pathname: string): string {
  if (pathname.length > 1 && pathname.endsWith('/')) {
    return pathname.slice(0, -1);
  }

  return pathname;
}

export function getPageLabelFromPath(pathname: string): string | undefined {
  const normalizedPath = normalizePath(pathname);

  if (/^\/activities\/[^/]+$/.test(normalizedPath)) {
    return 'Activity';
  }

  return STATIC_PAGE_LABELS[normalizedPath];
}

export function getDocumentTitleForPath(pathname: string): string {
  const pageLabel = getPageLabelFromPath(pathname);

  return formatAppTitle(pageLabel);
}

export function setAppTitle(pageLabel?: string): void {
  document.title = formatAppTitle(pageLabel);
}