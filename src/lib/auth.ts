export interface User {
  login: string;
  password: string;
}

const USERS_KEY = 'speedread_users';
const CURRENT_USER_KEY = 'speedread_current_user';

function getUsers(): User[] {
  const data = localStorage.getItem(USERS_KEY);
  return data ? JSON.parse(data) : [];
}

export function register(login: string, password: string): { success: boolean; error?: string } {
  if (!login.trim() || !password.trim()) {
    return { success: false, error: 'Логін та пароль не можуть бути порожніми' };
  }
  if (password.length < 4) {
    return { success: false, error: 'Пароль має містити щонайменше 4 символи' };
  }
  const users = getUsers();
  if (users.find(u => u.login === login)) {
    return { success: false, error: 'Користувач з таким логіном вже існує' };
  }
  users.push({ login, password });
  localStorage.setItem(USERS_KEY, JSON.stringify(users));
  localStorage.setItem(CURRENT_USER_KEY, login);
  return { success: true };
}

export function loginUser(login: string, password: string): { success: boolean; error?: string } {
  if (!login.trim() || !password.trim()) {
    return { success: false, error: 'Введіть логін та пароль' };
  }
  const users = getUsers();
  const user = users.find(u => u.login === login && u.password === password);
  if (!user) {
    return { success: false, error: 'Невірний логін або пароль' };
  }
  localStorage.setItem(CURRENT_USER_KEY, login);
  return { success: true };
}

export function getCurrentUser(): string | null {
  return localStorage.getItem(CURRENT_USER_KEY);
}

export function logout(): void {
  localStorage.removeItem(CURRENT_USER_KEY);
}
