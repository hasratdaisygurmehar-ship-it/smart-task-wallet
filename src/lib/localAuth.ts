import type { AppUser, LocalAccountRecord } from '../types';

const LOCAL_ACCOUNTS_KEY = 'localAccounts';

const normalizeEmail = (email: string) => email.trim().toLowerCase();

const getLocalAccounts = (): Record<string, LocalAccountRecord> => {
  const raw = localStorage.getItem(LOCAL_ACCOUNTS_KEY);
  return raw ? JSON.parse(raw) : {};
};

const saveLocalAccounts = (accounts: Record<string, LocalAccountRecord>) => {
  localStorage.setItem(LOCAL_ACCOUNTS_KEY, JSON.stringify(accounts));
};

const hashPassword = async (password: string) => {
  const encoded = new TextEncoder().encode(password);
  const digest = await crypto.subtle.digest('SHA-256', encoded);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
};

export const registerLocalUser = async (email: string, password: string, name?: string): Promise<AppUser> => {
  const normalizedEmail = normalizeEmail(email);
  const accounts = getLocalAccounts();

  if (accounts[normalizedEmail]) {
    throw new Error('An account with this email already exists. Please log in instead.');
  }

  const account: LocalAccountRecord = {
    id: normalizedEmail,
    email: normalizedEmail,
    name: name?.trim() || normalizedEmail.split('@')[0],
    avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${normalizedEmail}`,
    passwordHash: await hashPassword(password),
  };

  accounts[normalizedEmail] = account;
  saveLocalAccounts(accounts);

  const { passwordHash: _passwordHash, ...user } = account;
  return user;
};

export const loginLocalUser = async (email: string, password: string): Promise<AppUser> => {
  const normalizedEmail = normalizeEmail(email);
  const accounts = getLocalAccounts();
  const account = accounts[normalizedEmail];

  if (!account) {
    throw new Error('No account found for this email. Please sign up first.');
  }

  const passwordHash = await hashPassword(password);
  if (account.passwordHash !== passwordHash) {
    throw new Error('Incorrect password.');
  }

  const { passwordHash: _passwordHash, ...user } = account;
  return user;
};
