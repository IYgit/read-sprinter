const BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

const ACCESS_TOKEN_KEY = 'rs_access_token';
const REFRESH_TOKEN_KEY = 'rs_refresh_token';

// ─── Token helpers ───────────────────────────────────────────────────────────

export function getAccessToken(): string | null {
  return localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

export function setTokens(accessToken: string, refreshToken: string): void {
  localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
  localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
}

export function clearTokens(): void {
  localStorage.removeItem(ACCESS_TOKEN_KEY);
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

// ─── Core fetch wrapper ───────────────────────────────────────────────────────

async function apiFetch<T>(path: string, options: RequestInit = {}, retry = true): Promise<T> {
  const accessToken = getAccessToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (accessToken) {
    headers['Authorization'] = `Bearer ${accessToken}`;
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers });

  // Try to refresh on 401
  if (response.status === 401 && retry) {
    const refreshed = await tryRefresh();
    if (refreshed) {
      return apiFetch<T>(path, options, false);
    }
    clearTokens();
    window.location.href = '/auth';
    throw new Error('Session expired');
  }

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({ message: response.statusText }));
    throw new ApiError(response.status, errorBody?.message ?? response.statusText, errorBody);
  }

  if (response.status === 204) return undefined as T;
  return response.json();
}

async function tryRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;
  try {
    const data = await apiFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }, false);
    setTokens(data.accessToken, data.refreshToken);
    return true;
  } catch {
    return false;
  }
}

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
    public readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// ─── Auth ────────────────────────────────────────────────────────────────────

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: number;
  username: string;
  email: string;
  role: string;
}

export const authApi = {
  register: (username: string, email: string, password: string) =>
    apiFetch<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ username, email, password }),
    }),

  login: (email: string, password: string) =>
    apiFetch<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),

  refresh: (refreshToken: string) =>
    apiFetch<AuthResponse>('/api/auth/refresh', {
      method: 'POST',
      body: JSON.stringify({ refreshToken }),
    }),
};

// ─── Texts ───────────────────────────────────────────────────────────────────

export interface QuestionDto {
  id: number;
  text: string;
  options: string[];
  correctIndex: number;
}

export interface TextDto {
  id: number;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  questions: QuestionDto[];
}

export const textsApi = {
  getAll: () => apiFetch<TextDto[]>('/api/texts'),
  getById: (id: number) => apiFetch<TextDto>(`/api/texts/${id}`),
};

// ─── Exercise Results ────────────────────────────────────────────────────────

export interface SaveResultRequest {
  exerciseType: string;
  textId?: number;
  score?: number;
  durationSec?: number;
  wpm?: number;
  correctCount?: number;
  totalCount?: number;
  extraData?: Record<string, unknown>;
}

export interface ResultDto {
  id: number;
  exerciseType: string;
  textId?: number;
  textTitle?: string;
  score?: number;
  durationSec?: number;
  wpm?: number;
  correctCount?: number;
  totalCount?: number;
  extraData?: Record<string, unknown>;
  completedAt: string;
}

export interface SummaryDto {
  exerciseType: string;
  totalCount: number;
  avgScore?: number;
  avgWpm?: number;
  avgDurationSec?: number;
}

export const resultsApi = {
  save: (req: SaveResultRequest) =>
    apiFetch<ResultDto>('/api/results', { method: 'POST', body: JSON.stringify(req) }),

  getMyResults: () => apiFetch<ResultDto[]>('/api/results/me'),

  getMyResultsByType: (exerciseType: string) =>
    apiFetch<ResultDto[]>(`/api/results/me/type/${exerciseType}`),

  getMySummary: () => apiFetch<SummaryDto[]>('/api/results/me/summary'),
};

// ─── Duel / Matchmaking ──────────────────────────────────────────────────────

export interface JoinQueueRequest {
  exerciseType: string;
  // Schulte Table
  gridSize: number;
  fontSize: number;
  // Numbers exercise
  digitCount: number;
  displayTime: number;
  // Word Pairs exercise
  wpRows: number;
  wpCols: number;
  wpTimeLimit: number;
  wpFontSize: number;
  // RSVP exercise
  rsvpSyntagmWidth: number;
  rsvpDisplayTime: number;
}

export interface JoinQueueResponse {
  status: 'matched' | 'waiting';
  sessionId?: number;
}

export const duelApi = {
  joinQueue: (req: JoinQueueRequest) =>
    apiFetch<JoinQueueResponse>('/api/duels/queue', { method: 'POST', body: JSON.stringify(req) }),

  leaveQueue: () =>
    apiFetch<void>('/api/duels/queue', { method: 'DELETE' }),
};

export interface WordPairItem {
  w1: string;
  w2: string;
  diff: boolean;
}

export const wordPairsApi = {
  getGrid: (rows: number, cols: number) =>
    apiFetch<WordPairItem[]>(`/api/word-pairs?rows=${rows}&cols=${cols}`),
};

