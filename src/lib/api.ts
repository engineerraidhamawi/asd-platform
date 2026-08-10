/**
 * Authenticated API fetch helper.
 * Automatically attaches x-user-id and x-user-role headers from localStorage.
 */

export function apiFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const userId = typeof localStorage !== 'undefined' ? localStorage.getItem('userId') : null;
  const userRole = typeof localStorage !== 'undefined' ? localStorage.getItem('userRole') : null;

  const headers = new Headers(options.headers || {});

  if (userId) {
    headers.set('x-user-id', userId);
  }
  if (userRole) {
    headers.set('x-user-role', userRole);
  }

  return fetch(url, { ...options, headers });
}