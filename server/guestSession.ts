/**
 * Guest Session Management
 * Handles temporary guest sessions
 * NOTE: In Cloudflare Workers, global Map state is ephemeral and may be lost between requests.
 */

interface GuestSession {
  sessionId: string;
  createdAt: Date;
  lastActivity: Date;
}

// In-memory store for guest sessions (ephemeral in Workers)
const guestSessions = new Map<string, GuestSession>();

// Session timeout: 30 minutes
const SESSION_TIMEOUT = 30 * 60 * 1000;

/**
 * Create a new guest session
 */
export function createGuestSession(): string {
  const sessionId = crypto.randomUUID();
  const now = new Date();

  guestSessions.set(sessionId, {
    sessionId,
    createdAt: now,
    lastActivity: now,
  });

  return sessionId;
}

/**
 * Validate and update guest session
 */
export function validateGuestSession(sessionId: string): boolean {
  const session = guestSessions.get(sessionId);

  if (!session) {
    return false;
  }

  const now = new Date();
  const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

  // Check if session has timed out
  if (timeSinceLastActivity > SESSION_TIMEOUT) {
    guestSessions.delete(sessionId);
    return false;
  }

  // Update last activity
  session.lastActivity = now;
  return true;
}

/**
 * Delete guest session
 */
export function deleteGuestSession(sessionId: string): void {
  guestSessions.delete(sessionId);
}

/**
 * Check if a session is a guest session
 */
export function isGuestSession(sessionId: string): boolean {
  return guestSessions.has(sessionId);
}

/**
 * Cleanup expired sessions
 */
export function cleanupExpiredSessions(): void {
  const now = new Date();
  const sessionsToDelete: string[] = [];

  guestSessions.forEach((session, sessionId) => {
    const timeSinceLastActivity = now.getTime() - session.lastActivity.getTime();

    if (timeSinceLastActivity > SESSION_TIMEOUT) {
      sessionsToDelete.push(sessionId);
    }
  });

  sessionsToDelete.forEach(sessionId => guestSessions.delete(sessionId));
}
