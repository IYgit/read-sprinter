import { authApi, setTokens, clearTokens, getAccessToken, type UserInfo } from './api';

export type { UserInfo };

const CURRENT_USER_KEY = 'rs_current_user';

// ─── Persist / read current user ─────────────────────────────────────────────

function saveCurrentUser(user: UserInfo): void {
  localStorage.setItem(CURRENT_USER_KEY, JSON.stringify(user));
}

export function getCurrentUserInfo(): UserInfo | null {
  const raw = localStorage.getItem(CURRENT_USER_KEY);
  return raw ? JSON.parse(raw) : null;
}

/** Returns username string (used throughout the app) */
export function getCurrentUser(): string | null {
  return getCurrentUserInfo()?.username ?? null;
}

export function isAuthenticated(): boolean {
  return !!getAccessToken() && !!getCurrentUserInfo();
}

export function logout(): void {
  clearTokens();
  localStorage.removeItem(CURRENT_USER_KEY);
}

// ─── Register ─────────────────────────────────────────────────────────────────

/**
 * Register: login field is used as both username and as the local part of a
 * generated email so the existing AuthPage UI (single "login" field) keeps working.
 * If the value looks like an email we use it directly.
 */
export async function register(
  login: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!login.trim() || !password.trim()) {
    return { success: false, error: 'Логін та пароль не можуть бути порожніми' };
  }
  if (password.length < 6) {
    return { success: false, error: 'Пароль має містити щонайменше 6 символів' };
  }

  const email = login.includes('@') ? login : `${login}@speedread.local`;
  const username = login.includes('@') ? login.split('@')[0] : login;

  try {
    const data = await authApi.register(username, email, password);
    setTokens(data.accessToken, data.refreshToken);
    saveCurrentUser(data.user);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Помилка реєстрації';
    return { success: false, error: message };
  }
}

// ─── Login ────────────────────────────────────────────────────────────────────

/**
 * Login: accepts email or username.
 * The backend expects an email; if user enters just a username we append the
 * same synthetic domain used during registration.
 */
export async function loginUser(
  login: string,
  password: string,
): Promise<{ success: boolean; error?: string }> {
  if (!login.trim() || !password.trim()) {
    return { success: false, error: 'Введіть логін та пароль' };
  }

  const email = login.includes('@') ? login : `${login}@speedread.local`;

  try {
    const data = await authApi.login(email, password);
    setTokens(data.accessToken, data.refreshToken);
    saveCurrentUser(data.user);
    return { success: true };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Невірний логін або пароль';
    return { success: false, error: message };
  }
}
