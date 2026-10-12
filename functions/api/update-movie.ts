import {
  AuthEnv,
  PagesFunctionContext,
  createCookie,
  expiredCookie,
  getOAuthConfig,
  getStoredSession,
  jsonResponse,
  refreshGoogleAccessToken,
  sessionCookieName,
  sessionTtlSeconds,
} from '../_shared/auth';
import { updateMovieInSheet, type MovieSheetEntry } from '../../src/api/googleSheets';

export const onRequestPost = async ({ request, env }: PagesFunctionContext) => {
  if (request.headers.get('Origin') !== new URL(request.url).origin) {
    return jsonResponse({ error: 'invalid_origin' }, 403);
  }

  const stored = await getStoredSession(request, env as AuthEnv);
  if (!stored) {
    return jsonResponse({ error: 'not_authenticated' }, 401, {
      'Set-Cookie': expiredCookie(sessionCookieName),
    });
  }

  let entry: MovieSheetEntry;
  try {
    const body = await request.json() as MovieSheetEntry;
    if (
      typeof body.date !== 'string'
      || typeof body.title !== 'string'
      || !Array.isArray(body.participants)
      || body.participants.length === 0
      || body.participants.some((participant) =>
        typeof participant?.name !== 'string'
        || !participant.name.trim()
        || typeof participant.score !== 'string'
        || !participant.score.trim())
    ) {
      return jsonResponse({ error: 'invalid_entry' }, 400);
    }
    entry = body;
  } catch {
    return jsonResponse({ error: 'invalid_entry' }, 400);
  }

  try {
    const { sessions } = getOAuthConfig(env as AuthEnv);
    const accessToken = await refreshGoogleAccessToken(stored.session.refreshToken, env as AuthEnv);
    await updateMovieInSheet(accessToken, entry);
    await sessions.put(stored.sessionId, JSON.stringify(stored.session), {
      expirationTtl: sessionTtlSeconds,
    });

    return jsonResponse({ ok: true }, 200, {
      'Set-Cookie': createCookie(sessionCookieName, stored.sessionId, sessionTtlSeconds),
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      const { sessions } = getOAuthConfig(env as AuthEnv);
      await sessions.delete(stored.sessionId);
      return jsonResponse({ error: 'session_expired' }, 401, {
        'Set-Cookie': expiredCookie(sessionCookieName),
      });
    }

    console.error('Не удалось обновить фильм в Google Sheets:', error);
    return jsonResponse({ error: 'update_failed' }, 502);
  }
};
