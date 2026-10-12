import { spreadsheetId } from '../../shared/googleSheets';

// Previous spreadsheet ID: '1DD6U6fawOirU61-ZuP4GYpoK2p2eLUV2PbJe26uB7A8'
const sheetName = 'Киноклуб';
const columnCount = 6;

type GoogleSheetProperties = {
  sheetId: number;
  title: string;
  gridProperties?: {
    columnCount?: number;
  };
};

type GoogleSpreadsheetResponse = {
  sheets?: Array<{ properties: GoogleSheetProperties }>;
};

type GoogleSheetsResponse = {
  values?: string[][];
};

export type MovieSheetEntry = {
  date: string;
  title: string;
  participants: Array<{ name: string; score: string }>;
};

const getHeaders = (accessToken: string): HeadersInit => ({
  Authorization: `Bearer ${accessToken}`,
  'Content-Type': 'application/json',
});

const getSpreadsheetUrl = (path = '') =>
  `https://sheets.googleapis.com/v4/spreadsheets/${spreadsheetId}${path}`;

const requestJson = async <T>(url: string, accessToken: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, {
    ...init,
    headers: {
      ...getHeaders(accessToken),
      ...init?.headers,
    },
  });

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Не удалось сохранить запись в Google Sheets');
  }

  return response.json() as Promise<T>;
};

const formatDate = (date: string) => {
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date)) {
    return date;
  }

  const [year, month, day] = date.split('-');
  return `${day}.${month}.${year}`;
};

const normalizeDate = (date: string) => {
  const isoDate = date.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (isoDate) {
    return `${isoDate[1]}-${isoDate[2].padStart(2, '0')}-${isoDate[3].padStart(2, '0')}`;
  }

  const localizedDate = date.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (localizedDate) {
    const year = localizedDate[3].length === 2 ? `20${localizedDate[3]}` : localizedDate[3];
    return `${year}-${localizedDate[2].padStart(2, '0')}-${localizedDate[1].padStart(2, '0')}`;
  }

  return date.trim();
};

const getAverage = (participants: MovieSheetEntry['participants']) => {
  const scores = participants
    .map((participant) => Number(participant.score.replace(',', '.')))
    .filter((score) => Number.isFinite(score));
  const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;

  return average.toFixed(1).replace('.', ',');
};

const getNextMovieNumber = (rows: string[][]) => {
  const movieNumbers = rows
    .filter((row) => row[2]?.trim() && !Number.isFinite(Number(row[2])))
    .map((row) => Number(row[0]))
    .filter((number) => Number.isInteger(number) && number > 0 && number < 1900);

  return (movieNumbers.length > 0 ? Math.max(...movieNumbers) : 0) + 1;
};

const getStandardBordersRequest = (
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
  sheetColumnCount: number,
) => ({
  updateBorders: {
    range: {
      sheetId,
      startRowIndex,
      endRowIndex,
      startColumnIndex: 7,
      endColumnIndex: sheetColumnCount,
    },
    top: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
    bottom: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
    left: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
    right: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
    innerHorizontal: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
    innerVertical: { style: 'SOLID', color: { red: 1, green: 1, blue: 1 } },
  },
});

const getParticipantBordersRequest = (
  sheetId: number,
  startRowIndex: number,
  endRowIndex: number,
) => ({
  updateBorders: {
    range: {
      sheetId,
      startRowIndex,
      endRowIndex,
      startColumnIndex: 3,
      endColumnIndex: 5,
    },
    top: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
    bottom: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
    left: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
    right: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
    innerHorizontal: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
    innerVertical: { style: 'SOLID', color: { red: 0, green: 0, blue: 0 } },
  },
});

export async function appendMovieToSheet(accessToken: string, entry: MovieSheetEntry) {
  const [spreadsheet, sheetValues] = await Promise.all([
    requestJson<GoogleSpreadsheetResponse>(getSpreadsheetUrl('?fields=sheets.properties'), accessToken),
    requestJson<GoogleSheetsResponse>(
      getSpreadsheetUrl(`/values/${encodeURIComponent(`${sheetName}!A:F`)}?majorDimension=ROWS`),
      accessToken,
    ),
  ]);

  const sheet = spreadsheet.sheets?.find(({ properties }) => properties.title === sheetName)?.properties;
  if (!sheet) {
    throw new Error(`Лист «${sheetName}» не найден`);
  }

  const sheetColumnCount = sheet.gridProperties?.columnCount ?? columnCount;
  const participants = entry.participants.filter((participant) => participant.name.trim() !== '');
  const isDimaSelected = participants.some(
    (participant) => participant.name.trim().toLocaleLowerCase('ru-RU') === 'дима',
  );
  const firstMovieRow = (sheetValues.values?.length ?? 0) + 2;
  const lastMovieRow = firstMovieRow + participants.length - 1;
  const lastRow = lastMovieRow + 1;
  const movieNumber = getNextMovieNumber(sheetValues.values ?? []);
  const average = getAverage(participants);
  const rows = [
    Array<string>(columnCount).fill(''),
    ...participants.map((participant, index) => [
      index === 0 ? String(movieNumber) : '',
      index === 0 ? formatDate(entry.date) : '',
      index === 0 ? entry.title.trim() : '',
      participant.name.trim(),
      participant.score.trim().replace('.', ','),
      index === 0 ? average : '',
    ]),
    Array<string>(columnCount).fill(''),
  ];

  await requestJson(
    getSpreadsheetUrl(`/values/${encodeURIComponent(`${sheetName}!A${firstMovieRow - 1}:F${lastRow}`)}?valueInputOption=USER_ENTERED`),
    accessToken,
    {
      method: 'PUT',
      body: JSON.stringify({ range: `${sheetName}!A${firstMovieRow - 1}:F${lastRow}`, majorDimension: 'ROWS', values: rows }),
    },
  );

  const separatorRows = [firstMovieRow - 2, lastRow - 1];
  await requestJson(getSpreadsheetUrl(':batchUpdate'), accessToken, {
    method: 'POST',
    body: JSON.stringify({
      requests: [
        ...separatorRows.map((rowIndex) => ({
          repeatCell: {
            range: {
              sheetId: sheet.sheetId,
              startRowIndex: rowIndex,
              endRowIndex: rowIndex + 1,
              startColumnIndex: 0,
              endColumnIndex: sheetColumnCount,
            },
            cell: {
              userEnteredFormat: {
                backgroundColor: { red: 67 / 255, green: 67 / 255, blue: 67 / 255 },
                borders: {
                  top: { style: 'SOLID', color: { red: 67 / 255, green: 67 / 255, blue: 67 / 255 } },
                  bottom: { style: 'SOLID', color: { red: 67 / 255, green: 67 / 255, blue: 67 / 255 } },
                  left: { style: 'SOLID', color: { red: 67 / 255, green: 67 / 255, blue: 67 / 255 } },
                  right: { style: 'SOLID', color: { red: 67 / 255, green: 67 / 255, blue: 67 / 255 } },
                },
              },
            },
            fields: 'userEnteredFormat.backgroundColor,userEnteredFormat.borders',
          },
        })),
        ...[
          [0, 1],
          [1, 2],
          [2, 3],
          [5, 6],
        ].map(([startColumnIndex, endColumnIndex]) => ({
          mergeCells: {
            range: {
              sheetId: sheet.sheetId,
              startRowIndex: firstMovieRow - 1,
              endRowIndex: lastMovieRow,
              startColumnIndex,
              endColumnIndex,
            },
            mergeType: 'MERGE_ALL',
          },
        })),
        ...(!isDimaSelected
          ? [
            {
              mergeCells: {
                range: {
                  sheetId: sheet.sheetId,
                  startRowIndex: firstMovieRow - 1,
                  endRowIndex: lastMovieRow,
                  startColumnIndex: 7,
                  endColumnIndex: 15,
                },
                mergeType: 'MERGE_ALL',
              },
            },
            {
              updateCells: {
                range: {
                  sheetId: sheet.sheetId,
                  startRowIndex: firstMovieRow - 1,
                  endRowIndex: firstMovieRow,
                  startColumnIndex: 7,
                  endColumnIndex: 8,
                },
                rows: [{
                  values: [{
                    userEnteredValue: {
                      stringValue: 'ДИМА НЕ СМОТРЕЛ :(((((((((((((((((((((((((((((((((((((',
                    },
                  }],
                }],
                fields: 'userEnteredValue',
              },
            },
            {
              repeatCell: {
                range: {
                  sheetId: sheet.sheetId,
                  startRowIndex: firstMovieRow - 1,
                  endRowIndex: lastMovieRow,
                  startColumnIndex: 7,
                  endColumnIndex: 15,
                },
                cell: {
                  userEnteredFormat: {
                    verticalAlignment: 'MIDDLE',
                    textFormat: {
                      bold: true,
                      italic: true,
                      fontFamily: 'Pacifico',
                      fontSize: 29,
                      foregroundColor: {
                        red: 243 / 255,
                        green: 243 / 255,
                        blue: 243 / 255,
                      },
                    },
                  },
                },
                fields: 'userEnteredFormat.verticalAlignment,userEnteredFormat.textFormat',
              },
            },
          ]
          : []),
        ...[0, 1, 2, 5].map((columnIndex) => ({
          repeatCell: {
            range: {
              sheetId: sheet.sheetId,
              startRowIndex: firstMovieRow - 1,
              endRowIndex: lastMovieRow,
              startColumnIndex: columnIndex,
              endColumnIndex: columnIndex + 1,
            },
            cell: {
              userEnteredFormat: {
                horizontalAlignment: 'CENTER',
                verticalAlignment: 'MIDDLE',
              },
            },
            fields: 'userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
          },
        })),
        getStandardBordersRequest(
          sheet.sheetId,
          firstMovieRow - 1,
          lastMovieRow,
          sheetColumnCount,
        ),
        getParticipantBordersRequest(
          sheet.sheetId,
          firstMovieRow - 1,
          lastMovieRow,
        ),
      ],
    }),
  });
}

export async function updateMovieInSheet(accessToken: string, entry: MovieSheetEntry) {
  const [spreadsheet, sheetValues] = await Promise.all([
    requestJson<GoogleSpreadsheetResponse>(getSpreadsheetUrl('?fields=sheets.properties'), accessToken),
    requestJson<GoogleSheetsResponse>(
      getSpreadsheetUrl(`/values/${encodeURIComponent(`${sheetName}!A:F`)}?majorDimension=ROWS`),
      accessToken,
    ),
  ]);

  const sheet = spreadsheet.sheets?.find(({ properties }) => properties.title === sheetName)?.properties;
  if (!sheet) {
    throw new Error(`Лист «${sheetName}» не найден`);
  }

  const sheetColumnCount = sheet.gridProperties?.columnCount ?? columnCount;
  const participants = entry.participants.filter(
    (participant) => participant.name.trim() !== '',
  );
  if (participants.length === 0) {
    throw new Error('У фильма должен остаться хотя бы один участник');
  }

  const rows = sheetValues.values ?? [];
  const targetDate = normalizeDate(entry.date);
  const movieRowIndex = rows.findIndex((row) =>
    row[2]?.trim().toLocaleLowerCase('ru-RU') === entry.title.trim().toLocaleLowerCase('ru-RU')
    && normalizeDate(row[1] ?? '') === targetDate,
  );
  if (movieRowIndex === -1) {
    throw new Error(`Фильм «${entry.title}» не найден в таблице`);
  }

  const existingMovieNumber = rows[movieRowIndex]?.[0] ?? '';
  let existingParticipantCount = 0;
  while (rows[movieRowIndex + existingParticipantCount]?.[3]?.trim()) {
    existingParticipantCount += 1;
  }
  if (existingParticipantCount === 0) {
    throw new Error(`Не удалось определить участников фильма «${entry.title}»`);
  }

  const movieEndRowIndex = movieRowIndex + existingParticipantCount;
  const newMovieEndRowIndex = movieRowIndex + participants.length;
  const scoreValues = participants.map((participant) =>
    Number(participant.score.trim().replace(',', '.')),
  );
  if (scoreValues.some((score) => !Number.isFinite(score))) {
    throw new Error('Оценки участников должны быть числами');
  }
  const average = scoreValues.reduce((sum, score) => sum + score, 0) / scoreValues.length;

  const emptyCell = { userEnteredValue: { stringValue: '' } };
  const participantRows = participants.map((participant, index) => {
    const score = scoreValues[index];
    return [
      index === 0
        ? (Number.isFinite(Number(existingMovieNumber))
          ? { userEnteredValue: { numberValue: Number(existingMovieNumber) } }
          : { userEnteredValue: { stringValue: existingMovieNumber } })
        : emptyCell,
      index === 0
        ? { userEnteredValue: { stringValue: formatDate(entry.date) } }
        : emptyCell,
      index === 0
        ? { userEnteredValue: { stringValue: entry.title.trim() } }
        : emptyCell,
      { userEnteredValue: { stringValue: participant.name.trim() } },
      { userEnteredValue: { numberValue: score } },
      index === 0
        ? { userEnteredValue: { numberValue: Number(average.toFixed(1)) } }
        : emptyCell,
    ];
  });

  const requests: Array<Record<string, unknown>> = [
    ...[0, 1, 2, 5].map((columnIndex) => ({
      unmergeCells: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: movieRowIndex,
          endRowIndex: movieEndRowIndex,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        },
      },
    })),
  ];

  if (participants.length > existingParticipantCount) {
    requests.push({
      insertDimension: {
        range: {
          sheetId: sheet.sheetId,
          dimension: 'ROWS',
          startIndex: movieEndRowIndex,
          endIndex: newMovieEndRowIndex,
        },
        inheritFromBefore: true,
      },
    });
  } else if (participants.length < existingParticipantCount) {
    requests.push({
      deleteDimension: {
        range: {
          sheetId: sheet.sheetId,
          dimension: 'ROWS',
          startIndex: newMovieEndRowIndex,
          endIndex: movieEndRowIndex,
        },
      },
    });
  }

  requests.push(
    {
      updateCells: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: movieRowIndex,
          endRowIndex: newMovieEndRowIndex,
          startColumnIndex: 0,
          endColumnIndex: columnCount,
        },
        rows: participantRows.map((values) => ({ values })),
        fields: 'userEnteredValue',
      },
    },
    ...[0, 1, 2, 5].map((columnIndex) => ({
      mergeCells: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: movieRowIndex,
          endRowIndex: newMovieEndRowIndex,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        },
        mergeType: 'MERGE_ALL',
      },
    })),
    ...[0, 1, 2, 5].map((columnIndex) => ({
      repeatCell: {
        range: {
          sheetId: sheet.sheetId,
          startRowIndex: movieRowIndex,
          endRowIndex: newMovieEndRowIndex,
          startColumnIndex: columnIndex,
          endColumnIndex: columnIndex + 1,
        },
        cell: {
          userEnteredFormat: {
            horizontalAlignment: 'CENTER',
            verticalAlignment: 'MIDDLE',
          },
        },
        fields: 'userEnteredFormat.horizontalAlignment,userEnteredFormat.verticalAlignment',
      },
    })),
    getStandardBordersRequest(
      sheet.sheetId,
      movieRowIndex,
      newMovieEndRowIndex,
      sheetColumnCount,
    ),
    getParticipantBordersRequest(
      sheet.sheetId,
      movieRowIndex,
      newMovieEndRowIndex,
    ),
  );

  await requestJson(getSpreadsheetUrl(':batchUpdate'), accessToken, {
    method: 'POST',
    body: JSON.stringify({ requests }),
  });
}
