const ACTIVE_USER_KEY = 'studyquest_active_user_v1';

export function getActiveUserId(): string {
  if (typeof window === 'undefined') return 'guest';
  return localStorage.getItem(ACTIVE_USER_KEY) || 'guest';
}

export function setActiveUserId(userId: string | null): void {
  if (typeof window === 'undefined') return;
  if (userId) localStorage.setItem(ACTIVE_USER_KEY, userId);
  else localStorage.setItem(ACTIVE_USER_KEY, 'guest');
}

export function getUserStorageKey(baseKey: string, userId = getActiveUserId()): string {
  const safeId = userId || 'guest';
  return `${baseKey}_${safeId}`;
}
