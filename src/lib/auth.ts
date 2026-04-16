import { authApi, setTokens, clearTokens, getAccessToken, ApiError, type UserInfo } from './api';

export type { UserInfo } from './api';

const CURRENT_USER_KEY = 'rs_current_user';

// ─── Email validation ────────────────────────────────────────────────────────

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value);
}

// ─── Error classifier ────────────────────────────────────────────────────────

function classifyError(err: unknown): string {
  if (err instanceof TypeError) {
    // network error / server unreachable
    return 'auth.errors.serverUnavailable';
  }
  if (err instanceof ApiError) {
    if (err.status === 401) return 'auth.errors.invalidCredentials';
    if (err.status === 409) return 'auth.errors.emailTaken';
  }
  return 'auth.errors.unknown';
}

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
    return { success: false, error: 'auth.errors.emptyFields' };
  }
  if (password.length < 6) {
    return { success: false, error: 'auth.errors.passwordTooShort' };
  }
  if (login.includes('@') && !isValidEmail(login)) {
    return { success: false, error: 'auth.errors.invalidEmail' };
  }

  const email = login.includes('@') ? login : `${login}@speedread.local`;
  const username = login.includes('@') ? login.split('@')[0] : login;

  try {
    const data = await authApi.register(username, email, password);
    setTokens(data.accessToken, data.refreshToken);
    saveCurrentUser(data.user);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: classifyError(err) };
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
    return { success: false, error: 'auth.errors.emptyFields' };
  }
  if (login.includes('@') && !isValidEmail(login)) {
    return { success: false, error: 'auth.errors.invalidEmail' };
  }

  const email = login.includes('@') ? login : `${login}@speedread.local`;

  try {
    const data = await authApi.login(email, password);
    setTokens(data.accessToken, data.refreshToken);
    saveCurrentUser(data.user);
    return { success: true };
  } catch (err: unknown) {
    return { success: false, error: classifyError(err) };
  }
}
