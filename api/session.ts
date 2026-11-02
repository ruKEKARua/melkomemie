import {
  createCookie,
  expiredCookie,
  getStoredSession,
  jsonResponse,
  refreshGoogleAccessToken,
  sessionCookieName,
  sessionTtlSeconds,
} from './_shared/auth';
import { spreadsheetId } from '../shared/googleSheets';

export const config = {
  runtime: 'edge',
};

type GoogleSheetsResponse = {
  values?: string[][];
};

type GoogleSheetsNotesResponse = {
  sheets?: Array<{
    data?: Array<{
      rowData?: Array<{
        values?: Array<{ note?: string }>;
      }>;
    }>;
  }>;
};

async function fetchRange(accessToken: string, range: string, majorDimension: 'ROWS' | 'COLUMNS' = 'COLUMNS') {
  const query = new URLSearchParams({ majorDimension: majorDimension.toLowerCase() });
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}/values/${encodeURIComponent(range)}?${query}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error('Не удалось загрузить данные Google Sheets');
  }

  return (await response.json()) as GoogleSheetsResponse;
}

async function fetchMovieComments(accessToken: string) {
  const query = new URLSearchParams({
    includeGridData: 'true',
    ranges: 'Киноклуб!C5:C',
    fields: 'sheets(data(rowData(values(note))))',
  });
  const response = await fetch(
    `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}?${query}`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );

  if (!response.ok) {
    throw new Error('Не удалось загрузить комментарии Google Sheets');
  }

  const spreadsheet = (await response.json()) as GoogleSheetsNotesResponse;
  return (
    spreadsheet.sheets?.[0]?.data?.[0]?.rowData?.map(
      (row) => row.values?.[0]?.note ?? '',
    ) ?? []
  );
}

export default async function handler(request: Request) {
  const stored = await getStoredSession(request);
  if (!stored) {
    return jsonResponse({ error: 'not_authenticated' }, 401, {
      'Set-Cookie': expiredCookie(sessionCookieName, request),
    });
  }

  try {
    const accessToken = await refreshGoogleAccessToken(stored.session.refreshToken);
    const [moviesResponse, movieComments, ratingsResponse, participantsResponse] = await Promise.all([
      fetchRange(accessToken, 'Киноклуб!C5:C'),
      fetchMovieComments(accessToken).catch((error: unknown) => {
        console.error('Не удалось загрузить комментарии Google Sheets:', error);
        return [];
      }),
      fetchRange(accessToken, 'Киноклуб!B5:F', 'ROWS'),
      fetchRange(accessToken, 'Сводная киноклуба!B3:B50'),
    ]);

    return jsonResponse(
      {
        userName: stored.session.userName,
        userPicture: stored.session.userPicture,
        movies: moviesResponse.values?.[0] ?? [],
        movieComments,
        ratings: ratingsResponse.values ?? [],
        participants: participantsResponse.values?.[0] ?? [],
      },
      200,
      {
        'Set-Cookie': createCookie(sessionCookieName, stored.sessionId, sessionTtlSeconds, request),
      },
    );
  } catch (error) {
    if (error instanceof Error && error.message.includes('invalid_grant')) {
      return jsonResponse({ error: 'session_expired' }, 401, {
        'Set-Cookie': expiredCookie(sessionCookieName, request),
      });
    }

    console.error('Не удалось обновить сессию Google:', error);
    return jsonResponse({ error: 'google_request_failed' }, 502);
  }
}

export { handler as GET };
