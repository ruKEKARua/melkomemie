/**
 * ============================================================================
 * GOOGLE APPS SCRIPT БЭКЕНД ДЛЯ ПРОЕКТА «МЕЛКОМЕМЬЕ»
 * ============================================================================
 * Инструкция по установке / обновлению:
 * 1. Открой https://script.google.com/ и перейди в свой проект бэкенда.
 * 2. Полностью замени код в файле Code.gs на этот скрипт.
 * 3. Нажми кнопку «Развернуть» (Deploy) -> «Управление развертываниями» (Manage deployments)
 *    -> выбери активное развертывание -> нажми значок карандаша (Edit)
 *    -> выбери Версия: «Новая версия» (New version) -> нажми «Развернуть» (Deploy).
 * 4. Для автоматического исправления уже добавленного фильма «Синистер»:
 *    - Либо в редакторе Google Apps Script выбери функцию `repairMovieSinister` и нажми «Выполнить» (Run).
 *    - Либо открой ссылку в браузере: <ТВОЙ_GAS_URL>?action=repair-sinister
 * ============================================================================
 */

// ID таблицы «Мелкомемья»
var SPREADSHEET_ID = '1SAwGMbF583ESfiVsaWA_XSqx947bBc13ipgvQCD5sws';

// Прокси для TMDB
var TMDB_PROXY_BASE = 'https://movies-tmdb-proxy.kekar.workers.dev/tmdb';

// Имена листов
var SHEET_NAME_MOVIES = 'Киноклуб';
var SHEET_NAME_SUMMARY = 'Сводная киноклуба';
var SHEET_NAME_PARTICIPANTS_FALLBACK = 'Список участников';

// Цветовые константы
var COLOR_SEPARATOR = '#434343';
var COLOR_WHITE = '#ffffff';
var COLOR_BLACK = '#000000';
var COLOR_DIMA_TEXT = '#f3f3f3';
var DIMA_WATERMARK_TEXT = 'ДИМА НЕ СМОТРЕЛ :(((((((((((((((((((((((((((((((((((((';

/**
 * Вспомогательная функция для формирования JSON-ответа с CORS
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
  var num = typeof val === 'number' ? val : parseFloat(String(val).replace(',', '.'));
  if (isNaN(num)) return String(val).trim();
  return String(Math.round((num + 1e-9) * 100) / 100);
}

/**
 * Форматирование даты в DD.MM.YYYY
 */
function formatDate(date) {
  if (!date) return '';
  if (/^\d{1,2}\.\d{1,2}\.\d{4}$/.test(date)) {
    return date;
  }
  var parts = String(date).split('-');
  if (parts.length === 3) {
    return parts[2] + '.' + parts[1] + '.' + parts[0];
  }
  return date;
}

/**
 * Нормализация даты в YYYY-MM-DD для сравнения
 */
function normalizeDate(date) {
  if (!date) return '';
  if (date instanceof Date) {
    var y = date.getFullYear();
    var m = ('0' + (date.getMonth() + 1)).slice(-2);
    var d = ('0' + date.getDate()).slice(-2);
    return y + '-' + m + '-' + d;
  }
  var str = String(date).trim();
  var iso = str.match(/^(\d{4})[./-](\d{1,2})[./-](\d{1,2})$/);
  if (iso) {
    return iso[1] + '-' + ('0' + iso[2]).slice(-2) + '-' + ('0' + iso[3]).slice(-2);
  }
  var loc = str.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})$/);
  if (loc) {
    var year = loc[3].length === 2 ? '20' + loc[3] : loc[3];
    return year + '-' + ('0' + loc[2]).slice(-2) + '-' + ('0' + loc[1]).slice(-2);
  }
  return str;
}

/**
 * Находит последнюю строку с фактическими данными фильмов/участников в колонке D
 */
function findLastMovieDataRow(sheet, lastRow) {
  if (lastRow < 5) return 4;
  var colD = sheet.getRange(5, 4, lastRow - 4, 1).getValues();
  for (var r = colD.length - 1; r >= 0; r--) {
    if (colD[r][0] && String(colD[r][0]).trim() !== '') {
      return 5 + r;
    }
  }
  return lastRow;
}

/**
 * Форматирует строку как темно-серую разделительную полосу (#434343)
 */
function formatSeparatorRow(sheet, rowIndex, maxCols) {
  var range = sheet.getRange(rowIndex, 1, 1, maxCols);
  range.breakApart();
  range.clearContent();
  range.clearNote();
  range.setBackground(COLOR_SEPARATOR);
  range.setBorder(true, true, true, true, true, true, COLOR_SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
}

/**
 * Применяет или очищает водяной знак «ДИМА НЕ СМОТРЕЛ» в столбцах H:O (8:15)
 */
function applyDimaWatermark(sheet, startRow, rowCount, maxCols, participants) {
  if (maxCols < 8) return;
  var restCols = maxCols - 7;
  var dimaColSpan = Math.min(8, restCols);
  var dimaRange = sheet.getRange(startRow, 8, rowCount, dimaColSpan);

  var isDimaPresent = false;
  if (participants && participants.length) {
    for (var i = 0; i < participants.length; i++) {
      var p = participants[i];
      var name = (p && p.name) ? String(p.name).trim().toLowerCase() : '';
      if (name === 'дима') {
        isDimaPresent = true;
        break;
      }
    }
  }

  if (!isDimaPresent) {
    dimaRange.breakApart();
    dimaRange.merge();
    dimaRange.setValue(DIMA_WATERMARK_TEXT);
    dimaRange.setFontFamily('Pacifico');
    dimaRange.setFontSize(29);
    dimaRange.setFontWeight('bold');
    dimaRange.setFontStyle('italic');
    dimaRange.setFontColor(COLOR_DIMA_TEXT);
    dimaRange.setVerticalAlignment('middle');
    dimaRange.setHorizontalAlignment('left');
  } else {
    dimaRange.breakApart();
    dimaRange.clearContent();
    dimaRange.clearNote();
  }
}

/**
 * ОБРАБОТКА GET-ЗАПРОСОВ (Получение списка фильмов, комментариев, рейтингов, прокси TMDB и авто-восстановление)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'movies';

    // 0. Восстановление / исправление оформления фильма «Синистер»
    if (action === 'repair-sinister' || action === 'repair-last-movie') {
      var ssRepair = SpreadsheetApp.openById(SPREADSHEET_ID);
      var repairRes = repairMovieSinister(ssRepair);
      return createJsonResponse(repairRes);
    }

    // 1. Проксирование запросов к TMDB
    if (action === 'tmdb') {
      var subPath = e.parameter.path || '';
      var targetUrl = TMDB_PROXY_BASE + (subPath.startsWith('/') ? subPath : '/' + subPath);

      // Пробрасываем все параметры (query, language, page и т.д.)
      var queryParts = [];
      if (e && e.parameter) {
        for (var param in e.parameter) {
          if (param !== 'action' && param !== 'path') {
            queryParts.push(encodeURIComponent(param) + '=' + encodeURIComponent(e.parameter[param]));
          }
        }
      }
      if (queryParts.length > 0) {
        targetUrl += (targetUrl.indexOf('?') === -1 ? '?' : '&') + queryParts.join('&');
      }

      var tmdbResponse = UrlFetchApp.fetch(targetUrl, { muteHttpExceptions: true });
      return createJsonResponse(JSON.parse(tmdbResponse.getContentText()));
    }

    // 2. Получение данных фильмов, комментариев и оценок из Google Таблицы
    if (action === 'movies' || action === 'session') {
      var ss = SpreadsheetApp.openById(SPREADSHEET_ID);
      var movieSheet = ss.getSheetByName(SHEET_NAME_MOVIES);
      if (!movieSheet) {
        return createJsonResponse({ error: 'Лист "' + SHEET_NAME_MOVIES + '" не найден' });
      }

      var summarySheet = ss.getSheetByName(SHEET_NAME_SUMMARY) || ss.getSheetByName(SHEET_NAME_PARTICIPANTS_FALLBACK);
      var lastRow = movieSheet.getLastRow();

      var movies = [];
      var movieComments = [];
      var ratings = [];

      if (lastRow >= 5) {
        // Чтение столбца C (названия фильмов и заметки/комментарии)
        var rangeC = movieSheet.getRange(5, 3, lastRow - 4, 1);
        var valuesC = rangeC.getValues();
        var notesC = rangeC.getNotes();

        for (var i = 0; i < valuesC.length; i++) {
          movies.push(valuesC[i][0] !== null && valuesC[i][0] !== undefined ? String(valuesC[i][0]) : '');
          movieComments.push(notesC[i][0] ? String(notesC[i][0]) : '');
        }

        // Чтение столбцов B:F (Дата, Фильм, Участник, Оценка, Среднее)
        var rangeB_F = movieSheet.getRange(5, 2, lastRow - 4, 5);
        var rawRatings = rangeB_F.getValues();
        for (var r = 0; r < rawRatings.length; r++) {
          ratings.push(rawRatings[r].map(function(val, colIndex) {
            if (val instanceof Date) {
              return normalizeDate(val);
            }
            if (val !== null && val !== undefined && val !== '') {
              // Столбец F (colIndex === 4) — средняя оценка фильма, округляем до 2 знаков
              if (colIndex === 4) {
                return roundScore(val);
              }
              return String(val);
            }
            return '';
          }));
        }
      }

      // Чтение списка участников (Сводная киноклуба!B3:B50)
      var participants = [];
      if (summarySheet) {
        var partValues = summarySheet.getRange('B3:B50').getValues();
        for (var p = 0; p < partValues.length; p++) {
          var pVal = partValues[p][0];
          if (pVal && String(pVal).trim()) {
            participants.push(String(pVal).trim());
          }
        }
      }

      return createJsonResponse({
        movies: movies,
        movieComments: movieComments,
        ratings: ratings,
        participants: participants
      });
    }

    return createJsonResponse({ error: 'unknown_action' });
  } catch (err) {
    return createJsonResponse({ error: err.message || String(err) });
  }
}

/**
 * ОБРАБОТКА POST-ЗАПРОСОВ (Добавление и обновление фильмов, восстановление)
 * Запросы отправляются с Content-Type: text/plain;charset=utf-8, чтобы избежать CORS preflight OPTIONS!
 */
function doPost(e) {
  try {
    var data = {};
    if (e && e.postData && e.postData.contents) {
      data = JSON.parse(e.postData.contents);
    }

    var action = data.action || (e && e.parameter && e.parameter.action);
    var ss = SpreadsheetApp.openById(SPREADSHEET_ID);

    if (action === 'save-movie') {
      var resSave = appendMovie(ss, data.entry);
      return createJsonResponse(resSave);
    }

    if (action === 'update-movie') {
      var resUpdate = updateMovie(ss, data.entry);
      return createJsonResponse(resUpdate);
    }

    if (action === 'repair-sinister' || action === 'repair-last-movie') {
      var resRepair = repairMovieSinister(ss);
      return createJsonResponse(resRepair);
    }

    return createJsonResponse({ error: 'unknown_action' });
  } catch (err) {
    return createJsonResponse({ error: err.message || String(err) });
  }
}

/**
 * Добавление нового фильма в таблицу «Киноклуб»
 * Полностью реализует структуру:
 * 1. Верхняя разделительная полоса (#434343) на всю ширину таблицы
 * 2. Основные информативные ячейки (A:F) с белым фоном и черными границами
 * 3. Вертикальная разделительная полоска (Столбец G) с фоном и границами #434343
 * 4. Белая сетка для остальных ячеек (Столбцы H+)
 * 5. Проверка на участие Димы: если не смотрел — добавляется водяной знак «ДИМА НЕ СМОТРЕЛ»
 * 6. Нижняя разделительная полоса (#434343) на всю ширину таблицы («Полоса — Фильм — Полоса»)
 */
function appendMovie(ss, entry) {
  if (!entry || !entry.title || !entry.date || !entry.participants || !entry.participants.length) {
    throw new Error('Некорректные данные фильма');
  }

  var sheet = ss.getSheetByName(SHEET_NAME_MOVIES);
  var maxCols = sheet.getMaxColumns();
  var lastRow = sheet.getLastRow();

  // Определение следующего порядкового номера фильма
  var nextNumber = 1;
  if (lastRow >= 5) {
    var colA = sheet.getRange(5, 1, lastRow - 4, 1).getValues();
    var colC = sheet.getRange(5, 3, lastRow - 4, 1).getValues();
    var nums = [];
    for (var i = 0; i < colA.length; i++) {
      var title = colC[i][0] ? String(colC[i][0]).trim() : '';
      var val = Number(colA[i][0]);
      if (title && isNaN(Number(title)) && !isNaN(val) && val > 0 && val < 1900) {
        nums.push(val);
      }
    }
    if (nums.length > 0) {
      nextNumber = Math.max.apply(null, nums) + 1;
    }
  }

  var participants = entry.participants.filter(function(p) {
    return p && p.name && String(p.name).trim() !== '';
  });
  if (participants.length === 0) {
    throw new Error('У фильма должен быть хотя бы один участник');
  }
  var participantCount = participants.length;

  // Расчёт средней оценки (округление до 2 знаков после запятой)
  var scores = [];
  for (var p = 0; p < participantCount; p++) {
    var scoreNum = parseFloat(String(participants[p].score).replace(',', '.'));
    if (!isNaN(scoreNum)) {
      scores.push(scoreNum);
    }
  }
  var avg = scores.length > 0 ? (Math.round(((scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) + 1e-9) * 100) / 100) : '';

  // Находим последнюю строку с данными участников
  var lastDataRow = findLastMovieDataRow(sheet, lastRow);

  // Структура строк:
  // topSeparatorRow    = lastDataRow + 1 -> серая линия перед фильмом
  // movieStartRow      = topSeparatorRow + 1 -> первая строка фильма
  // movieEndRow        = movieStartRow + participantCount - 1 -> последняя строка фильма
  // bottomSeparatorRow = movieEndRow + 1 -> серая линия после фильма
  var topSeparatorRow = lastDataRow + 1;
  var movieStartRow = topSeparatorRow + 1;
  var movieEndRow = movieStartRow + participantCount - 1;
  var bottomSeparatorRow = movieEndRow + 1;

  // Гарантируем достаточное количество строк в листе
  if (bottomSeparatorRow > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), bottomSeparatorRow - sheet.getMaxRows() + 10);
  }

  // 1. Верхняя разделительная полоса (#434343) на всю ширину экселя
  formatSeparatorRow(sheet, topSeparatorRow, maxCols);

  // 2. Подготовка и запись данных фильма (A:F)
  var rows = [];
  for (var k = 0; k < participantCount; k++) {
    var part = participants[k];
    var scoreVal = parseFloat(String(part.score).replace(',', '.'));
    rows.push([
      k === 0 ? nextNumber : '',
      k === 0 ? formatDate(entry.date) : '',
      k === 0 ? entry.title.trim() : '',
      part.name ? part.name.trim() : '',
      !isNaN(scoreVal) ? scoreVal : '',
      k === 0 && avg !== '' ? Number(avg) : ''
    ]);
  }

  // Очищаем и форматируем ячейки данных A:F с гарантированным белым фоном
  var dataRange = sheet.getRange(movieStartRow, 1, participantCount, 6);
  dataRange.breakApart();
  dataRange.setBackground(COLOR_WHITE);
  dataRange.setFontColor(COLOR_BLACK);
  dataRange.setFontWeight('normal');
  dataRange.setFontStyle('normal');
  dataRange.setValues(rows);
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');

  // Объединение ячеек в столбцах Номер (A), Дата (B), Название (C), Среднее (F)
  if (participantCount > 1) {
    sheet.getRange(movieStartRow, 1, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 2, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 3, participantCount, 1).merge();
    sheet.getRange(movieStartRow, 6, participantCount, 1).merge();
  }

  // Границы для колонок A-F (черные границы SOLID)
  sheet.getRange(movieStartRow, 1, participantCount, 3)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 4, participantCount, 2)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 6, participantCount, 1)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);

  // 3. Колонка G (Столбец 7) — темно-серая разделительная полоска (#434343)
  if (maxCols >= 7) {
    var colGRange = sheet.getRange(movieStartRow, 7, participantCount, 1);
    colGRange.breakApart();
    colGRange.clearContent();
    colGRange.clearNote();
    colGRange.setBackground(COLOR_SEPARATOR);
    colGRange.setBorder(true, true, true, true, true, true, COLOR_SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
  }

  // 4. Колонки H:MAXCOLS (Столбцы 8+) — белая сетка
  if (maxCols >= 8) {
    var restCols = maxCols - 7;
    var restRange = sheet.getRange(movieStartRow, 8, participantCount, restCols);
    restRange.breakApart();
    restRange.clearContent();
    restRange.clearNote();
    restRange.setBackground(COLOR_WHITE);
    restRange.setBorder(true, true, true, true, true, true, COLOR_WHITE, SpreadsheetApp.BorderStyle.SOLID);

    // 5. Проверка на «ДИМА НЕ СМОТРЕЛ»
    applyDimaWatermark(sheet, movieStartRow, participantCount, maxCols, participants);
  }

  // 6. Нижняя разделительная полоса (#434343) на всю ширину экселя
  formatSeparatorRow(sheet, bottomSeparatorRow, maxCols);

  return { ok: true, number: nextNumber };
}

/**
 * Обновление существующего фильма в таблице «Киноклуб»
 */
function updateMovie(ss, entry) {
  if (!entry || !entry.title || !entry.date || !entry.participants || !entry.participants.length) {
    throw new Error('Некорректные данные для обновления фильма');
  }

  var sheet = ss.getSheetByName(SHEET_NAME_MOVIES);
  var lastRow = sheet.getLastRow();
  if (lastRow < 5) {
    throw new Error('Таблица пуста');
  }

  var maxCols = sheet.getMaxColumns();
  var range = sheet.getRange(5, 1, lastRow - 4, 4);
  var values = range.getValues();
  var targetTitle = entry.title.trim().toLowerCase();
  var targetDate = normalizeDate(entry.date);

  var movieRowIndex = -1;
  for (var i = 0; i < values.length; i++) {
    var rowDate = normalizeDate(values[i][1]);
    var rowTitle = String(values[i][2]).trim().toLowerCase();
    if (rowTitle === targetTitle && rowDate === targetDate) {
      movieRowIndex = i;
      break;
    }
  }

  if (movieRowIndex === -1) {
    throw new Error('Фильм "' + entry.title + '" не найден в таблице');
  }

  var movieStartRow = 5 + movieRowIndex;
  var existingMovieNumber = values[movieRowIndex][0];

  // Считаем текущее количество строк участников
  var existingCount = 0;
  for (var j = movieRowIndex; j < values.length; j++) {
    var pName = String(values[j][3]).trim();
    if (pName) {
      existingCount++;
    } else {
      break;
    }
  }
  if (existingCount === 0) existingCount = 1;

  var participants = entry.participants.filter(function(p) {
    return p && p.name && String(p.name).trim() !== '';
  });
  if (participants.length === 0) {
    throw new Error('У фильма должен остаться хотя бы один участник');
  }
  var newCount = participants.length;

  // Разъединяем объединенные ячейки перед изменением структуры строк
  if (existingCount > 1) {
    sheet.getRange(movieStartRow, 1, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 2, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 3, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 6, existingCount, 1).breakApart();
  }
  if (maxCols >= 8) {
    var restColsInit = maxCols - 7;
    var dimaColSpanInit = Math.min(8, restColsInit);
    sheet.getRange(movieStartRow, 8, existingCount, dimaColSpanInit).breakApart();
  }

  // Добавляем или удаляем строки, если число участников изменилось
  if (newCount > existingCount) {
    sheet.insertRowsAfter(movieStartRow + existingCount - 1, newCount - existingCount);
  } else if (newCount < existingCount) {
    sheet.deleteRows(movieStartRow + newCount, existingCount - newCount);
  }

  // Расчёт среднего балла (округление до 2 знаков после запятой)
  var scores = [];
  for (var p = 0; p < newCount; p++) {
    var scoreNum = parseFloat(String(participants[p].score).replace(',', '.'));
    if (!isNaN(scoreNum)) scores.push(scoreNum);
  }
  var avg = scores.length > 0 ? (Math.round(((scores.reduce(function(a, b) { return a + b; }, 0) / scores.length) + 1e-9) * 100) / 100) : '';

  // Формирование обновленных строк
  var rows = [];
  for (var k = 0; k < newCount; k++) {
    var part = participants[k];
    var scoreVal = parseFloat(String(part.score).replace(',', '.'));
    rows.push([
      k === 0 ? existingMovieNumber : '',
      k === 0 ? formatDate(entry.date) : '',
      k === 0 ? entry.title.trim() : '',
      part.name ? part.name.trim() : '',
      !isNaN(scoreVal) ? scoreVal : '',
      k === 0 && avg !== '' ? Number(avg) : ''
    ]);
  }

  var dataRange = sheet.getRange(movieStartRow, 1, newCount, 6);
  dataRange.setBackground(COLOR_WHITE);
  dataRange.setFontColor(COLOR_BLACK);
  dataRange.setValues(rows);
  dataRange.setHorizontalAlignment('center');
  dataRange.setVerticalAlignment('middle');

  if (newCount > 1) {
    sheet.getRange(movieStartRow, 1, newCount, 1).merge();
    sheet.getRange(movieStartRow, 2, newCount, 1).merge();
    sheet.getRange(movieStartRow, 3, newCount, 1).merge();
    sheet.getRange(movieStartRow, 6, newCount, 1).merge();
  }

  // Границы для колонок A-F (черные границы)
  sheet.getRange(movieStartRow, 1, newCount, 3)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 4, newCount, 2)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 6, newCount, 1)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);

  // Колонка G (Столбец 7) — темно-серая разделительная полоса (#434343)
  if (maxCols >= 7) {
    var colGRange = sheet.getRange(movieStartRow, 7, newCount, 1);
    colGRange.breakApart();
    colGRange.clearContent();
    colGRange.clearNote();
    colGRange.setBackground(COLOR_SEPARATOR);
    colGRange.setBorder(true, true, true, true, true, true, COLOR_SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
  }

  // Колонки H:MAXCOLS (Столбцы 8+) — белая сетка
  if (maxCols >= 8) {
    var restColsUpdate = maxCols - 7;
    var restRange = sheet.getRange(movieStartRow, 8, newCount, restColsUpdate);
    restRange.setBackground(COLOR_WHITE);
    restRange.setBorder(true, true, true, true, true, true, COLOR_WHITE, SpreadsheetApp.BorderStyle.SOLID);

    // Проверка водяного знака
    applyDimaWatermark(sheet, movieStartRow, newCount, maxCols, participants);
  }

  // Гарантируем наличие разделительных полос сверху и снизу
  if (movieStartRow > 1) {
    formatSeparatorRow(sheet, movieStartRow - 1, maxCols);
  }
  formatSeparatorRow(sheet, movieStartRow + newCount, maxCols);

  return { ok: true };
}

/**
 * Восстановление / исправление фильма «Синистер» после некорректного добавления.
 * Исправляет:
 * 1. Вставляет серую полосу перед Синистером (#434343) на всю ширину экселя.
 * 2. Убирает темно-серую заливку основных ячеек (A:F) и ставит белый фон с черными границами.
 * 3. Оформляет колонку G с заливкой и границами #434343.
 * 4. Устанавливает белые границы колонкам H+ и добавляет водяной знак «ДИМА НЕ СМОТРЕЛ».
 * 5. Создает нижнюю серую полосу #434343 после Синистера на всю ширину экселя.
 */
function repairMovieSinister(ss) {
  var sheet = ss.getSheetByName(SHEET_NAME_MOVIES);
  var maxCols = sheet.getMaxColumns();
  var lastRow = sheet.getLastRow();

  if (lastRow < 5) {
    return { ok: false, error: 'Таблица пуста' };
  }

  // Ищем строку с фильмом «Синистер»
  var colC = sheet.getRange(5, 3, lastRow - 4, 1).getValues();
  var sinisterRowIndex = -1;
  for (var i = 0; i < colC.length; i++) {
    var title = String(colC[i][0]).trim().toLowerCase();
    if (title === 'синистер') {
      sinisterRowIndex = 5 + i;
      break;
    }
  }

  if (sinisterRowIndex === -1) {
    return { ok: false, error: 'Фильм «Синистер» не найден в таблице' };
  }

  // Проверяем строку перед Синистером
  var prevRow = sinisterRowIndex - 1;
  var isPrevSeparator = false;
  if (prevRow >= 5) {
    var prevBg = sheet.getRange(prevRow, 1, 1, 1).getBackground();
    if (prevBg === COLOR_SEPARATOR) {
      isPrevSeparator = true;
    }
  }

  // Если перед Синистером нет серой полосы-разделителя, вставляем строку
  if (!isPrevSeparator) {
    sheet.insertRowBefore(sinisterRowIndex);
    // Теперь sinisterRowIndex указывает на новую пустую строку
    formatSeparatorRow(sheet, sinisterRowIndex, maxCols);
    sinisterRowIndex = sinisterRowIndex + 1; // Синистер сдвинулся на 1 строку вниз
  } else {
    formatSeparatorRow(sheet, prevRow, maxCols);
  }

  // Считаем количество участников Синистера
  var pCount = 0;
  var colD = sheet.getRange(sinisterRowIndex, 4, Math.min(20, sheet.getLastRow() - sinisterRowIndex + 1), 1).getValues();
  for (var p = 0; p < colD.length; p++) {
    var pName = String(colD[p][0]).trim();
    if (pName) {
      pCount++;
    } else {
      break;
    }
  }
  if (pCount === 0) pCount = 6;

  var movieStartRow = sinisterRowIndex;
  var movieEndRow = movieStartRow + pCount - 1;
  var bottomSeparatorRow = movieEndRow + 1;

  // 1. Очищаем форматирование и объединения колонок A:F
  sheet.getRange(movieStartRow, 1, pCount, 6).breakApart();
  sheet.getRange(movieStartRow, 1, pCount, 6)
    .setBackground(COLOR_WHITE)
    .setFontColor(COLOR_BLACK)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Повторно объединяем A, B, C, F
  if (pCount > 1) {
    sheet.getRange(movieStartRow, 1, pCount, 1).merge();
    sheet.getRange(movieStartRow, 2, pCount, 1).merge();
    sheet.getRange(movieStartRow, 3, pCount, 1).merge();
    sheet.getRange(movieStartRow, 6, pCount, 1).merge();
  }

  // Границы для колонок A-F (черные границы)
  sheet.getRange(movieStartRow, 1, pCount, 3)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 4, pCount, 2)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);
  sheet.getRange(movieStartRow, 6, pCount, 1)
    .setBorder(true, true, true, true, true, true, COLOR_BLACK, SpreadsheetApp.BorderStyle.SOLID);

  // 2. Колонка G (Столбец 7) — разделительная полоска #434343
  if (maxCols >= 7) {
    var colGRange = sheet.getRange(movieStartRow, 7, pCount, 1);
    colGRange.breakApart();
    colGRange.clearContent();
    colGRange.clearNote();
    colGRange.setBackground(COLOR_SEPARATOR);
    colGRange.setBorder(true, true, true, true, true, true, COLOR_SEPARATOR, SpreadsheetApp.BorderStyle.SOLID);
  }

  // 3. Колонки H:MAXCOLS (Столбцы 8+)
  if (maxCols >= 8) {
    var restColsRepair = maxCols - 7;
    var restRange = sheet.getRange(movieStartRow, 8, pCount, restColsRepair);
    restRange.breakApart();
    restRange.clearContent();
    restRange.clearNote();
    restRange.setBackground(COLOR_WHITE);
    restRange.setBorder(true, true, true, true, true, true, COLOR_WHITE, SpreadsheetApp.BorderStyle.SOLID);

    // Читаем имена участников Синистера, чтобы проверить Диму
    var partValues = sheet.getRange(movieStartRow, 4, pCount, 1).getValues();
    var participantsList = [];
    for (var k = 0; k < partValues.length; k++) {
      participantsList.push({ name: String(partValues[k][0]).trim() });
    }

    applyDimaWatermark(sheet, movieStartRow, pCount, maxCols, participantsList);
  }

  // 4. Нижняя разделительная полоса (#434343)
  if (bottomSeparatorRow > sheet.getMaxRows()) {
    sheet.insertRowsAfter(sheet.getMaxRows(), bottomSeparatorRow - sheet.getMaxRows() + 10);
  }
  formatSeparatorRow(sheet, bottomSeparatorRow, maxCols);

  return {
    ok: true,
    message: 'Фильм «Синистер» успешно восстановлен и оформлен в таблице!',
    startRow: movieStartRow,
    endRow: movieEndRow,
    topSeparatorRow: movieStartRow - 1,
    bottomSeparatorRow: bottomSeparatorRow
  };
}
