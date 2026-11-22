/**
 * ============================================================================
 * GOOGLE APPS SCRIPT БЭКЕНД ДЛЯ ПРОЕКТА «МЕЛКОМЕМЬЕ» (V8 Runtime)
 * ============================================================================
 * Инструкция по установке / обновлению:
 * 1. Открой https://script.google.com/ и перейди в проект бэкенда «Мелкомемья».
 * 2. Полностью замени код в файле Code.gs на этот скрипт.
 * 3. Нажми кнопку «Развернуть» (Deploy) -> «Управление развертываниями» (Manage deployments)
 *    -> выбери активное развертывание -> нажми значок карандаша (Edit)
 *    -> выбери Версия: «Новая версия» (New version) -> нажми «Развернуть» (Deploy).
 * ============================================================================
 */

const CONFIG = {
  SPREADSHEET_ID: '1SAwGMbF583ESfiVsaWA_XSqx947bBc13ipgvQCD5sws',
  TMDB_PROXY_BASE: 'https://movies-tmdb-proxy.kekar.workers.dev/tmdb',
  SHEETS: {
    MOVIES: 'Киноклуб',
    SUMMARY: 'Сводная киноклуба',
  },
  DATA_START_ROW: 5,
  PARTICIPANTS_RANGE: 'B3:B50',
  COLORS: {
    SEPARATOR: '#434343',
    WHITE: '#ffffff',
    BLACK: '#000000',
    DIMA_TEXT: '#f3f3f3',
    CINEMA_PURPLE: '#B4A7D6',
  },
  DIMA_WATERMARK: {
    TEXT: 'ДИМА НЕ СМОТРЕЛ :((((((((((((((((((((((((((((((((((((((',
    FONT_FAMILY: 'Pacifico',
    FONT_SIZE: 29,
    START_COL: 8, // Столбец H
    SPAN_COLS: 8, // Столбцы H:O (8 столбцов)
  },
  COLS: {
    NUMBER: 1,    // A
    DATE: 2,      // B
    TITLE: 3,     // C
    NAME: 4,      // D
    SCORE: 5,     // E
    AVG: 6,       // F
    SEPARATOR: 7, // G
    GRID_START: 8,// H
  },
  LOCK_TIMEOUT_MS: 30000,
};

/**
 * Формирование JSON-ответа
 */
function createJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

/**
 * Округление оценки до максимум 2 знаков после запятой
 */
function roundScore(val) {
  if (val === null || val === undefined || val === '') return '';
  const num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return String(val).trim();
  return String(Math.round((num + 1e-9) * 100) / 100);
}

/**
 * Определение разделителя аргументов функций Google Таблиц.
 * В русской локали (ru_RU) разделителем аргументов является точка с запятой (;),
 * так как запятая (,) зарезервирована для десятичных дробей.
 */
function getFormulaArgSeparator(ss) {
  try {
    const locale = (ss && ss.getSpreadsheetLocale && ss.getSpreadsheetLocale()) || '';
    if (/^(en_US|en_CA|en_GB|en_AU|ja_JP|zh_CN|ko_KR)/i.test(locale)) {
      return ',';
    }
  } catch (e) {}
  return ';';
}

/**
 * Построение формулы средней оценки.
 * Используется простая формула: =AVERAGE(E{startRow}:E{endRow})
 * (в русскоязычном интерфейсе Google Таблиц она автоматически отображается как =СРЗНАЧ(E{startRow}:E{endRow})).
 */
function buildAverageFormula(startRow, endRow) {
  return `=AVERAGE(E${startRow}:E${endRow})`;
}

/**
 * Форматирование даты в DD.MM.YYYY
 */
function formatDate(date) {
  if (!date) return '';
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date)) {
    return date;
  }
  const parts = String(date).split('-');
  if (parts.length === 3) {
    return `${parts[2]}.${parts[1]}.${parts[0]}`;
  }
  return String(date);
}

/**
 * Нормализация даты в YYYY-MM-DD для сравнения
 */
function normalizeDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    const y = date.getFullYear();
    const m = ('0' + (date.getMonth() + 1)).slice(-2);
    const d = ('0' + date.getDate()).slice(-2);
    return `${y}-${m}-${d}`;
  }
  const str = String(date).trim();
  const iso = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (iso) {
    return `${iso[1]}-${('0' + iso[2]).slice(-2)}-${('0' + iso[3]).slice(-2)}`;
  }
  const loc = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (loc) {
    const year = loc[3].length === 2 ? '20' + loc[3] : loc[3];
    return `${year}-${('0' + loc[2]).slice(-2)}-${('0' + loc[1]).slice(-2)}`;
  }
  return str;
}

/**
 * Находит последнюю строку с фактическими данными фильмов/участников в колонке D
 */
function findLastMovieDataRow(sheet, lastRow) {
  if (lastRow < CONFIG.DATA_START_ROW) return CONFIG.DATA_START_ROW - 1;
  const colD = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLS.NAME, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
  for (let r = colD.length - 1; r >= 0; r--) {
    if (colD[r][0] && String(colD[r][0]).trim() !== '') {
      return CONFIG.DATA_START_ROW + r;
    }
  }
  return lastRow;
}

/**
 * Форматирует строку как темно-серую разделительную полосу (#434343)
 */
function formatSeparatorRow(sheet, rowIndex, maxCols) {
  const range = sheet.getRange(rowIndex, 1, 1, maxCols);
  range.breakApart();
  range.clearContent();
  range.clearNote();
  range.setBackground(CONFIG.COLORS.SEPARATOR);
  range.setBorder(true, true, true, true, true, true, CONFIG.COLORS.SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Проверяет, является ли строка пустой или уже разделителем (#434343)
 */
function isRowEmptyOrSeparator(sheet, rowIndex, maxCols) {
  if (rowIndex < 1 || rowIndex > sheet.getMaxRows()) return false;
  const bg = sheet.getRange(rowIndex, 1).getBackground().toLowerCase();
  if (bg === CONFIG.COLORS.SEPARATOR.toLowerCase()) {
    return true;
  }
  const values = sheet.getRange(rowIndex, 1, 1, Math.min(maxCols, 6)).getValues()[0];
  const hasContent = values.some(val => val !== null && val !== undefined && String(val).trim() !== '');
  return !hasContent;
}

/**
 * Безопасное форматирование разделительной полосы (не затирает соседний фильм)
 */
function safeFormatSeparatorRow(sheet, rowIndex, maxCols) {
  if (rowIndex < 1) return;
  if (rowIndex > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), rowIndex - sheet.getMaxRows());
  }
  if (isRowEmptyOrSeparator(sheet, rowIndex, maxCols)) {
    formatSeparatorRow(sheet, rowIndex, maxCols);
  }
}

/**
 * Форматирует колонку G (Столбец 7) как темно-серый разделитель
 */
function formatColumnG(sheet, startRow, rowCount) {
  const colGRange = sheet.getRange(startRow, CONFIG.COLS.SEPARATOR, rowCount, 1);
  colGRange.breakApart();
  colGRange.clearContent();
  colGRange.clearNote();
  colGRange.setBackground(CONFIG.COLORS.SEPARATOR);
  colGRange.setBorder(true, true, true, true, true, true, CONFIG.COLORS.SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Форматирует столбцы H+ как белую сетку
 */
function formatColumnsHPlus(sheet, startRow, rowCount, maxCols) {
  if (maxCols < CONFIG.COLS.GRID_START) return;
  const restCols = maxCols - (CONFIG.COLS.GRID_START - 1);
  const restRange = sheet.getRange(startRow, CONFIG.COLS.GRID_START, rowCount, restCols);
  restRange.breakApart();
  restRange.clearContent();
  restRange.clearNote();
  restRange.setBackground(CONFIG.COLORS.WHITE);
  restRange.setBorder(true, true, true, true, true, true, CONFIG.COLORS.WHITE, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Применяет или очищает водяной знак «ДИМА НЕ СМОТРЕЛ» в столбцах H:O
 */
function applyDimaWatermark(sheet, startRow, rowCount, maxCols, participants) {
  if (maxCols < CONFIG.COLS.GRID_START) return;
  const restCols = maxCols - (CONFIG.COLS.GRID_START - 1);
  const dimaColSpan = Math.min(CONFIG.DIMA_WATERMARK.SPAN_COLS, restCols);
  const dimaRange = sheet.getRange(startRow, CONFIG.COLS.GRID_START, rowCount, dimaColSpan);

  const isDimaPresent = Boolean(
    participants && participants.some(p => {
      const name = (p && p.name) ? String(p.name).trim().toLowerCase() : '';
      return name === 'дима';
    })
  );

  if (!isDimaPresent) {
    dimaRange.breakApart();
    dimaRange.merge();
    dimaRange.setValue(CONFIG.DIMA_WATERMARK.TEXT);
    dimaRange.setFontFamily(CONFIG.DIMA_WATERMARK.FONT_FAMILY);
    dimaRange.setFontSize(CONFIG.DIMA_WATERMARK.FONT_SIZE);
    dimaRange.setFontWeight('bold');
    dimaRange.setFontStyle('italic');
    dimaRange.setFontColor(CONFIG.COLORS.DIMA_TEXT);
    dimaRange.setVerticalAlignment('middle');
    dimaRange.setHorizontalAlignment('left');
  } else {
    dimaRange.breakApart();
    dimaRange.clearContent();
    dimaRange.clearNote();
  }
}

/**
 * ОБРАБОТКА GET-ЗАПРОСОВ (Получение списка фильмов, комментариев, рейтингов, прокси TMDB)
 */
function doGet(e) {
  try {
    const action = (e && e.parameter && e.parameter.action) || 'movies';

    // 1. Проксирование запросов к TMDB с безопасной обработкой ошибок
    if (action === 'tmdb') {
      const subPath = (e && e.parameter && e.parameter.path) || '';
      let targetUrl = CONFIG.TMDB_PROXY_BASE + (subPath.startsWith('/') ? subPath : '/' + subPath);

      const queryParts = [];
      if (e && e.parameter) {
        for (const param in e.parameter) {
          if (param !== 'action' && param !== 'path') {
            queryParts.push(encodeURIComponent(param) + '=' + encodeURIComponent(e.parameter[param]));
          }
        }
      }
      if (queryParts.length > 0) {
        targetUrl += (targetUrl.indexOf('?') === -1 ? '?' : '&') + queryParts.join('&');
      }

      let tmdbResponse;
      try {
        tmdbResponse = UrlFetchApp.fetch(targetUrl, { muteHttpExceptions: true });
      } catch (fetchErr) {
        return createJsonResponse({
          error: 'tmdb_proxy_fetch_failed',
          details: fetchErr.message || String(fetchErr),
        });
      }

      const responseCode = tmdbResponse.getResponseCode();
      const contentText = tmdbResponse.getContentText();

      try {
        const parsed = JSON.parse(contentText);
        return createJsonResponse(parsed);
      } catch (parseErr) {
        return createJsonResponse({
          error: 'tmdb_proxy_invalid_response',
          status: responseCode,
          details: contentText.substring(0, 500),
        });
      }
    }

    // 2. Получение данных фильмов, комментариев и оценок (action === 'movies')
    if (action === 'movies') {
      const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
      const movieSheet = ss.getSheetByName(CONFIG.SHEETS.MOVIES);
      if (!movieSheet) {
        return createJsonResponse({ error: 'Лист "' + CONFIG.SHEETS.MOVIES + '" не найден' });
      }

      const summarySheet = ss.getSheetByName(CONFIG.SHEETS.SUMMARY);
      const lastRow = movieSheet.getLastRow();

      const movies = [];
      const movieComments = [];
      const movieColors = [];
      const ratings = [];

      if (lastRow >= CONFIG.DATA_START_ROW) {
        const numRows = lastRow - CONFIG.DATA_START_ROW + 1;
        // Однократное чтение диапазона A5:F
        const range = movieSheet.getRange(CONFIG.DATA_START_ROW, 1, numRows, 6);
        const values = range.getValues();
        const notes = range.getNotes();
        const backgrounds = range.getBackgrounds();

        const whiteLower = CONFIG.COLORS.WHITE.toLowerCase();
        const sepLower = CONFIG.COLORS.SEPARATOR.toLowerCase();

        for (let i = 0; i < numRows; i++) {
          const valC = values[i][2]; // Колонка C (название фильма)
          movies.push(valC !== null && valC !== undefined ? String(valC) : '');
          movieComments.push(notes[i][2] ? String(notes[i][2]) : '');

          const rowBgs = backgrounds[i];
          let cellColor = CONFIG.COLORS.WHITE;

          if (rowBgs) {
            // Приоритет цвета: колонка C (индекс 2), затем B (индекс 1), затем любая из A:F
            const colC = rowBgs[2] ? String(rowBgs[2]).trim() : '';
            const colB = rowBgs[1] ? String(rowBgs[1]).trim() : '';

            if (colC && colC.toLowerCase() !== whiteLower && colC.toLowerCase() !== sepLower) {
              cellColor = colC;
            } else if (colB && colB.toLowerCase() !== whiteLower && colB.toLowerCase() !== sepLower) {
              cellColor = colB;
            } else {
              for (let c = 0; c < rowBgs.length; c++) {
                const bg = rowBgs[c] ? String(rowBgs[c]).trim() : '';
                if (bg && bg.toLowerCase() !== whiteLower && bg.toLowerCase() !== sepLower) {
                  cellColor = bg;
                  break;
                }
              }
            }
          }
          movieColors.push(cellColor);

          // Рейтинги: столбцы B:F (индексы 1..5)
          const rowRatings = [];
          for (let colIdx = 1; colIdx <= 5; colIdx++) {
            const cellVal = values[i][colIdx];
            if (cellVal instanceof Date) {
              rowRatings.push(normalizeDate(cellVal));
            } else if (cellVal !== null && cellVal !== undefined && cellVal !== '') {
              if (colIdx === 5) {
                // Столбец F — средняя оценка
                if (String(cellVal).startsWith('#')) {
                  // Fallback при ошибке формулы в таблице (#ERROR! и т.п.):
                  // вычисляем среднее по фактическим оценкам участников из столбца E
                  let sum = 0;
                  let count = 0;
                  for (let k = 0; i + k < numRows; k++) {
                    if (k > 0 && (values[i + k][2] || (values[i + k][0] && !isNaN(Number(values[i + k][0]))))) {
                      break;
                    }
                    const sVal = parseFloat(String(values[i + k][4]).replace(',', '.'));
                    if (!isNaN(sVal)) {
                      sum += sVal;
                      count++;
                    }
                  }
                  rowRatings.push(count > 0 ? roundScore(sum / count) : '');
                } else {
                  rowRatings.push(roundScore(cellVal));
                }
              } else {
                rowRatings.push(String(cellVal));
              }
            } else {
              rowRatings.push('');
            }
          }
          ratings.push(rowRatings);
        }
      }

      // Чтение участников (Сводная киноклуба!B3:B50)
      const participants = [];
      if (summarySheet) {
        const partValues = summarySheet.getRange(CONFIG.PARTICIPANTS_RANGE).getValues();
        for (let p = 0; p < partValues.length; p++) {
          const pVal = partValues[p][0];
          if (pVal && String(pVal).trim()) {
            participants.push(String(pVal).trim());
          }
        }
      }

      return createJsonResponse({
        movies: movies,
        movieComments: movieComments,
        movieColors: movieColors,
        ratings: ratings,
        participants: participants,
      });
    }

    if (action === 'repair-formulas') {
      const lock = LockService.getScriptLock();
      const hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
      if (!hasLock) return createJsonResponse({ error: 'Сервер занят другим запросом' });
      try {
        const res = repairBrokenFormulas(ss);
        return createJsonResponse(res);
      } finally {
        lock.releaseLock();
      }
    }

    return createJsonResponse({ error: 'unknown_action' });
  } catch (err) {
    return createJsonResponse({ error: err.message || String(err) });
  }
}

/**
 * ОБРАБОТКА POST-ЗАПРОСОВ (Добавление и обновление фильмов с блокировкой ScriptLock)
 * Content-Type: text/plain;charset=utf-8
 */
function doPost(e) {
  const lock = LockService.getScriptLock();
  const hasLock = lock.tryLock(CONFIG.LOCK_TIMEOUT_MS);
  if (!hasLock) {
    return createJsonResponse({ error: 'Сервер занят другим запросом. Попробуйте еще раз через несколько секунд.' });
  }

  try {
    let data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    const action = data.action || (e && e.parameter && e.parameter.action);
    const ss = SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);

    let result;
    if (action === 'save-movie') {
      result = appendMovie(ss, data.entry);
    } else if (action === 'update-movie') {
      result = updateMovie(ss, data.entry);
    } else if (action === 'repair-formulas') {
      result = repairBrokenFormulas(ss);
    } else {
      result = { error: 'unknown_action' };
    }

    SpreadsheetApp.flush();
    return createJsonResponse(result);
  } catch (err) {
    return createJsonResponse({ error: err.message || String(err) });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Добавление нового фильма в таблицу «Киноклуб»
 */
function appendMovie(ss, entry) {
  if (!entry || !entry.title || !entry.date || !entry.participants || !entry.participants.length) {
    throw new Error('Некорректные данные фильма');
  }

  const sheet = ss.getSheetByName(CONFIG.SHEETS.MOVIES);
  const maxCols = sheet.getMaxColumns();
  const lastRow = sheet.getLastRow();

  // Определение следующего порядкового номера фильма
  let nextNumber = 1;
  if (lastRow >= CONFIG.DATA_START_ROW) {
    const colA = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLS.NUMBER, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
    const colC = sheet.getRange(CONFIG.DATA_START_ROW, CONFIG.COLS.TITLE, lastRow - CONFIG.DATA_START_ROW + 1, 1).getValues();
    const nums = [];
    for (let i = 0; i < colA.length; i++) {
      const title = colC[i][0] ? String(colC[i][0]).trim() : '';
      const val = Number(colA[i][0]);
      if (title && isNaN(Number(title)) && !isNaN(val) && val > 0 && val < 1900) {
        nums.push(val);
      }
    }
    if (nums.length > 0) {
      nextNumber = Math.max.apply(null, nums) + 1;
    }
  }

  const participants = entry.participants.filter(p => p && p.name && String(p.name).trim() !== '');
  if (participants.length === 0) {
    throw new Error('У фильма должен быть хотя бы один участник');
  }
  const participantCount = participants.length;

  const lastDataRow = findLastMovieDataRow(sheet, lastRow);
  const topSeparatorRow = lastDataRow + 1;
  const movieStartRow = topSeparatorRow + 1;
  const movieEndRow = movieStartRow + participantCount - 1;
  const bottomSeparatorRow = movieEndRow + 1;

  if (bottomSeparatorRow > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), bottomSeparatorRow - sheet.getMaxRows() + 10);
  }

  // 1. Верхняя разделительная полоса (#434343)
  safeFormatSeparatorRow(sheet, topSeparatorRow, maxCols);

  // 2. Подготовка и запись данных в A:E
  const rowsAE = [];
  for (let k = 0; k < participantCount; k++) {
    const part = participants[k];
    const scoreVal = parseFloat(String(part.score).replace(',', '.'));
    if (!isNaN(scoreVal) && (scoreVal < 1 || scoreVal > 10)) {
      throw new Error(`Оценка участника "${part.name || k + 1}" должна быть в диапазоне от 1 до 10`);
    }
    rowsAE.push([
      k === 0 ? nextNumber : '',
      k === 0 ? formatDate(entry.date) : '',
      k === 0 ? entry.title.trim() : '',
      part.name ? part.name.trim() : '',
      !isNaN(scoreVal) ? scoreVal : '',
    ]);
  }

  const rangeAE = sheet.getRange(movieStartRow, 1, participantCount, 5);
  rangeAE.breakApart();
  rangeAE.setValues(rowsAE);

  // 3. Формула средней оценки в F (верхняя ячейка блока)
  const rangeF = sheet.getRange(movieStartRow, 6, participantCount, 1);
  rangeF.breakApart();
  rangeF.clearContent();
  sheet.getRange(movieStartRow, 6).setFormula(buildAverageFormula(movieStartRow, movieEndRow, ss));

  // Оформление A:F (белый фон или кастомный цвет, для кинотеатра — #B4A7D6)
  const isCinema = Boolean(
    entry.isCinema === true ||
    entry.isCinema === 'true' ||
    entry.isCinemaViewing ||
    entry.inCinema ||
    (entry.color && String(entry.color).toUpperCase() === '#B4A7D6')
  );
  const blockColor = isCinema
    ? CONFIG.COLORS.CINEMA_PURPLE
    : ((entry.color && entry.color.trim()) || CONFIG.COLORS.WHITE);
  const dataRange = sheet.getRange(movieStartRow, 1, participantCount, 6);
  dataRange.setBackground(blockColor);
  dataRange.setFontColor(CONFIG.COLORS.BLACK);
  dataRange.setFontWeight('normal');
  dataRange.setFontStyle('normal');
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');

  // Имена участников (D) выравниваются по левому краю, оценки (E) — по правому краю
  sheet.getRange(movieStartRow, CONFIG.COLS.NAME, participantCount, 1).setHorizontalAlignment('left');
  sheet.getRange(movieStartRow, CONFIG.COLS.SCORE, participantCount, 1).setHorizontalAlignment('right');

  // Объединение ячеек A, B, C, F при participantCount > 1
  if (participantCount > 1) {
    sheet.getRange(movieStartRow, 1, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 2, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 3, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 6, participantCount, 1).merge();
  }

  // Чёрные границы A:F одним вызовом
  dataRange.setBorder(true, true, true, true, true, true, CONFIG.COLORS.BLACK, SpreadsheetApp.BorderStyle.SOLID);

  // 4. Колонка G (#434343)
  if (maxCols >= 7) {
    formatColumnG(sheet, movieStartRow, participantCount);
  }

  // 5. Колонки H+ (белая сетка) и водяной знак Димы
  if (maxCols >= 8) {
    formatColumnsHPlus(sheet, movieStartRow, participantCount, maxCols);
    applyDimaWatermark(sheet, movieStartRow, participantCount, maxCols, participants);
  }

  // 6. Нижняя разделительная полоса (#434343)
  safeFormatSeparatorRow(sheet, bottomSeparatorRow, maxCols);

  return { ok: true, number: nextNumber };
}

/**
 * Обновление существующего фильма в таблице «Киноклуб»
 */
function updateMovie(ss, entry) {
  if (!entry || !entry.title || !entry.date || !entry.participants || !entry.participants.length) {
    throw new Error('Некорректные данные для обновления фильма');
  }

  const sheet = ss.getSheetByName(CONFIG.SHEETS.MOVIES);
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) {
    throw new Error('Таблица пуста');
  }

  const maxCols = sheet.getMaxColumns();
  const range = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, 4);
  const values = range.getValues();

  // Поиск: сначала по originalTitle + originalDate (или number), затем fallback на title + date
  const targetNum = entry.number ? Number(entry.number) : null;
  const targetOrigTitle = (entry.originalTitle || entry.title).trim().toLowerCase();
  const targetOrigDate = normalizeDate(entry.originalDate || entry.date);

  let movieRowIndex = -1;
  for (let i = 0; i < values.length; i++) {
    const rowNum = Number(values[i][0]);
    const rowDate = normalizeDate(values[i][1]);
    const rowTitle = String(values[i][2] ?? '').trim().toLowerCase();

    if (targetNum !== null && !isNaN(targetNum) && rowNum === targetNum) {
      movieRowIndex = i;
      break;
    }
    if (rowTitle === targetOrigTitle && (!targetOrigDate || rowDate === targetOrigDate)) {
      movieRowIndex = i;
      break;
    }
  }

  // Обратная совместимость: если не найден, ищем по entry.title и entry.date
  if (movieRowIndex === -1 && (entry.originalTitle || entry.originalDate)) {
    const fallbackTitle = entry.title.trim().toLowerCase();
    const fallbackDate = normalizeDate(entry.date);
    for (let i = 0; i < values.length; i++) {
      const rowDate = normalizeDate(values[i][1]);
      const rowTitle = String(values[i][2] ?? '').trim().toLowerCase();
      if (rowTitle === fallbackTitle && (!fallbackDate || rowDate === fallbackDate)) {
        movieRowIndex = i;
        break;
      }
    }
  }

  if (movieRowIndex === -1) {
    throw new Error('Фильм "' + (entry.originalTitle || entry.title) + '" не найден в таблице');
  }

  const movieStartRow = CONFIG.DATA_START_ROW + movieRowIndex;
  const existingMovieNumber = values[movieRowIndex][0];

  // Считаем текущее количество строк участников в блоке
  let existingCount = 0;
  for (let j = movieRowIndex; j < values.length; j++) {
    const pName = String(values[j][3] ?? '').trim();
    if (pName) {
      existingCount++;
    } else {
      break;
    }
  }
  if (existingCount === 0) existingCount = 1;

  const participants = entry.participants.filter(p => p && p.name && String(p.name).trim() !== '');
  if (participants.length === 0) {
    throw new Error('У фильма должен остаться хотя бы один участник');
  }
  const newCount = participants.length;

  // =========================================================================
  // СЦЕНАРИЙ А: Число участников НЕ изменилось (newCount === existingCount)
  // Бережное обновление содержимого без перерисовки ячеек, границ и фонов
  // =========================================================================
  if (newCount === existingCount) {
    // 1. Дата и название в B{start}:C{start}
    sheet.getRange(movieStartRow, 2, 1, 2).setValues([[formatDate(entry.date), entry.title.trim()]]);

    // 2. Участники и оценки в D{start}:E{end}
    const deRows = participants.map(p => {
      const scoreVal = parseFloat(String(partScore(p)).replace(',', '.'));
      if (!isNaN(scoreVal) && (scoreVal < 1 || scoreVal > 10)) {
        throw new Error(`Оценка участника "${p.name || ''}" должна быть в диапазоне от 1 до 10`);
      }
      return [p.name.trim(), !isNaN(scoreVal) ? scoreVal : ''];
    });
    sheet.getRange(movieStartRow, 4, newCount, 2).setValues(deRows);

    // Выравнивание имён по левому краю (D) и оценок по правому краю (E)
    sheet.getRange(movieStartRow, CONFIG.COLS.NAME, newCount, 1).setHorizontalAlignment('left');
    sheet.getRange(movieStartRow, CONFIG.COLS.SCORE, newCount, 1).setHorizontalAlignment('right');

    // 3. Формула среднего балла в F{start}
    sheet.getRange(movieStartRow, 6).setFormula(buildAverageFormula(movieStartRow, movieStartRow + newCount - 1, ss));

    // 4. Обновление водяного знака Димы в H:O
    if (maxCols >= 8) {
      applyDimaWatermark(sheet, movieStartRow, newCount, maxCols, participants);
    }

    // 5. Проверка разделителей сверху и снизу
    if (movieStartRow > 1) {
      safeFormatSeparatorRow(sheet, movieStartRow - 1, maxCols);
    }
    safeFormatSeparatorRow(sheet, movieStartRow + newCount, maxCols);

    return { ok: true };
  }

  // =========================================================================
  // СЦЕНАРИЙ Б: Число участников изменилось (newCount !== existingCount)
  // =========================================================================
  // 1. Считываем заметку ячейки C{start} и цвета первой строки A:F перед разъединением
  const existingNoteC = sheet.getRange(movieStartRow, 3).getNote();
  const existingColorsAF = sheet.getRange(movieStartRow, 1, 1, 6).getBackgrounds()[0];

  // 2. Разъединяем объединенные ячейки A, B, C, F
  if (existingCount > 1) {
    sheet.getRange(movieStartRow, 1, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 2, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 3, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 6, existingCount, 1).breakApart();
  }
  if (maxCols >= 8) {
    const restColsInit = maxCols - 7;
    const dimaColSpanInit = Math.min(8, restColsInit);
    sheet.getRange(movieStartRow, 8, existingCount, dimaColSpanInit).breakApart();
  }

  // 3. Добавляем или удаляем строки
  if (newCount > existingCount) {
    sheet.insertRowsAfter(movieStartRow + existingCount - 1, newCount - existingCount);
  } else if (newCount < existingCount) {
    sheet.deleteRows(movieStartRow + newCount, existingCount - newCount);
  }

  // 4. Подготовка и запись данных в A:E
  const rowsAE = [];
  for (let k = 0; k < newCount; k++) {
    const part = participants[k];
    const scoreVal = parseFloat(String(partScore(part)).replace(',', '.'));
    rowsAE.push([
      k === 0 ? existingMovieNumber : '',
      k === 0 ? formatDate(entry.date) : '',
      k === 0 ? entry.title.trim() : '',
      part.name ? part.name.trim() : '',
      !isNaN(scoreVal) ? scoreVal : '',
    ]);
  }
  sheet.getRange(movieStartRow, 1, newCount, 5).setValues(rowsAE);

  // 5. Очищаем колонку F для блока и ставим формулу среднего балла в верхнюю ячейку
  sheet.getRange(movieStartRow, 6, newCount, 1).clearContent();
  sheet.getRange(movieStartRow, 6).setFormula(buildAverageFormula(movieStartRow, movieStartRow + newCount - 1, ss));

  // 6. Восстанавливаем цвета фона поколоночно на весь блок A:F (или обновляем при смене isCinema)
  let updateBlockColor = null;
  if (entry.isCinema !== undefined) {
    updateBlockColor = (entry.isCinema === true || entry.isCinema === 'true')
      ? CONFIG.COLORS.CINEMA_PURPLE
      : CONFIG.COLORS.WHITE;
  } else if (entry.color) {
    updateBlockColor = entry.color;
  }

  for (let c = 1; c <= 6; c++) {
    const colBg = updateBlockColor || existingColorsAF[c - 1] || CONFIG.COLORS.WHITE;
    sheet.getRange(movieStartRow, c, newCount, 1).setBackground(colBg);
  }

  // 7. Восстанавливаем заметку в C{start}
  if (existingNoteC) {
    sheet.getRange(movieStartRow, 3).setNote(existingNoteC);
  }

  // 8. Настраиваем выравнивание и шрифт A:F
  const dataRange = sheet.getRange(movieStartRow, 1, newCount, 6);
  dataRange.setFontColor(CONFIG.COLORS.BLACK);
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');

  // Имена участников (D) выравниваются по левому краю, оценки (E) — по правому краю
  sheet.getRange(movieStartRow, CONFIG.COLS.NAME, newCount, 1).setHorizontalAlignment('left');
  sheet.getRange(movieStartRow, CONFIG.COLS.SCORE, newCount, 1).setHorizontalAlignment('right');

  // 9. Объединяем ячейки A, B, C, F при newCount > 1
  if (newCount > 1) {
    sheet.getRange(movieStartRow, 1, newCount, 1).merge();
    sheet.getRange(movieStartRow, 2, newCount, 1).merge();
    sheet.getRange(movieStartRow, 3, newCount, 1).merge();
    sheet.getRange(movieStartRow, 6, newCount, 1).merge();
  }

  // 10. Чёрные границы A:F одним вызовом на 1..6
  dataRange.setBorder(true, true, true, true, true, true, CONFIG.COLORS.BLACK, SpreadsheetApp.BorderStyle.SOLID);

  // 11. Колонка G (#434343)
  if (maxCols >= 7) {
    formatColumnG(sheet, movieStartRow, newCount);
  }

  // 12. Колонки H+ и водяной знак Димы
  if (maxCols >= 8) {
    formatColumnsHPlus(sheet, movieStartRow, newCount, maxCols);
    applyDimaWatermark(sheet, movieStartRow, newCount, maxCols, participants);
  }

  // 13. Проверка и форматирование разделителей сверху и снизу
  if (movieStartRow > 1) {
    safeFormatSeparatorRow(sheet, movieStartRow - 1, maxCols);
  }
  safeFormatSeparatorRow(sheet, movieStartRow + newCount, maxCols);

  return { ok: true };
}

/**
 * Хелпер для безопасного извлечения оценки участника
 */
function partScore(p) {
  return p && (p.score !== undefined && p.score !== null) ? p.score : '';
}

/**
 * Автоматическое исправление формул с ошибкой #ERROR! или запятыми в столбце F (средняя оценка).
 * Можно вызывать прямо из редактора Google Apps Script или через GET/POST с action: 'repair-formulas'.
 */
function repairBrokenFormulas(ss) {
  const targetSs = ss || SpreadsheetApp.openById(CONFIG.SPREADSHEET_ID);
  const sheet = targetSs.getSheetByName(CONFIG.SHEETS.MOVIES);
  const lastRow = sheet.getLastRow();
  if (lastRow < CONFIG.DATA_START_ROW) return { ok: true, repairedCount: 0 };

  const range = sheet.getRange(CONFIG.DATA_START_ROW, 1, lastRow - CONFIG.DATA_START_ROW + 1, 6);
  const values = range.getValues();
  const formulas = range.getFormulas();
  let repairedCount = 0;

  for (let i = 0; i < values.length; i++) {
    const rowIdx = CONFIG.DATA_START_ROW + i;
    const title = values[i][2] ? String(values[i][2]).trim() : '';
    const formulaF = formulas[i][5] || '';
    const valF = values[i][5];

    // Начало блока фильма (есть название и это не разделитель)
    if (title && isNaN(Number(title))) {
      let count = 1;
      while (i + count < values.length) {
        const nextTitle = values[i + count][2] ? String(values[i + count][2]).trim() : '';
        const nextNum = values[i + count][0];
        if (nextTitle || (nextNum && !isNaN(Number(nextNum)))) break;
        count++;
      }

      const startRow = rowIdx;
      const endRow = rowIdx + count - 1;
      const hasError = String(valF).startsWith('#') || formulaF.includes('ROUND') || formulaF.includes('IFERROR') || (formulaF.includes('AVERAGE') && formulaF.includes(','));

      if (hasError || !formulaF) {
        sheet.getRange(startRow, 6).setFormula(buildAverageFormula(startRow, endRow));
        repairedCount++;
      }
    }
  }

  SpreadsheetApp.flush();
  return { ok: true, repairedCount: repairedCount };
}
