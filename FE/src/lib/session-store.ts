export interface LocalSessionData {
  sessionId: string;
  token: string;
  name: string;
  phone: string;
  email?: string;
  consent: boolean;
  newsletter: boolean;
  createdAt: Date;
  answerIds?: string[];
  resultCode?: string;
  resultTitle?: string;
  recipeSubtitle?: string;
  queueNumber?: number;
  isPrinted?: boolean;
  printedAt?: Date;
}

// Global in-memory map to survive hot-reloads in Next.js development
const globalSessions = globalThis as unknown as {
  __localSessions?: Map<string, LocalSessionData>;
};

if (!globalSessions.__localSessions) {
  globalSessions.__localSessions = new Map<string, LocalSessionData>();
}

export const sessionsMap = globalSessions.__localSessions;

export function generateToken(length = 8): string {
  const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

export function createSession(data: Omit<LocalSessionData, 'createdAt'>): LocalSessionData {
  const session: LocalSessionData = {
    ...data,
    createdAt: new Date(),
    isPrinted: false,
  };
  sessionsMap.set(session.sessionId, session);
  sessionsMap.set(session.token, session);
  return session;
}

export function getSession(idOrToken: string): LocalSessionData | undefined {
  return sessionsMap.get(idOrToken);
}

export function updateSession(idOrToken: string, partial: Partial<LocalSessionData>): LocalSessionData | undefined {
  const session = sessionsMap.get(idOrToken);
  if (!session) return undefined;

  Object.assign(session, partial);
  sessionsMap.set(session.sessionId, session);
  sessionsMap.set(session.token, session);
  return session;
}
