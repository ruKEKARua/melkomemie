/**
 * ============================================================================
 * GOOGLE APPS SCRIPT БЭКЕНД ДЛЯ ПРОЕКТА «МЕЛКОМЕМЬЕ»
 * ============================================================================
 * Инструкция по установке:
 * 1. Открой https://script.google.com/ и создай «Новый проект» на своём личном Google Диске.
 * 2. Назови проект, например, «Melkomemie Backend».
 * 3. Полностью замени код в файле Code.gs на этот скрипт.
 * 4. Нажми кнопку «Развернуть» (Deploy) -> «Новое развертывание» (New deployment).
 * 5. Тип: «Веб-приложение» (Web app).
 * 6. Описание: «v1».
 * 7. Выполнять от имени: «Я (мой аккаунт)» (Me / user@gmail.com).
 * 8. У кого есть доступ: «Все» (Anyone) — это необходимо, чтобы фронтенд мог слать запросы.
 * 9. Нажми «Развернуть» (Deploy) и скопируй полученный Web App URL:
 *    (он выглядит как https://script.google.com/macros/s/AKfycb.../exec).
 * 10. Вставь этот URL в .env.local и секреты GitHub Pages как VITE_GAS_URL.
 * ============================================================================
 */

// ID таблицы «Мелкомемья»
var SPREADSHEET_ID = '1SAwGMbF583ESfiVsaWA_XSqx947bBc13ipgvQCD5sws';

// Прокси для TMDB
var TMDB_PROXY_BASE = 'https://movies-tmdb-proxy.kekar.workers.dev/tmdb';

// Имя листа с фильмами
var SHEET_NAME_MOVIES = 'Киноклуб';
var SHEET_NAME_SUMMARY = 'Сводная киноклуба';
var SHEET_NAME_PARTICIPANTS_FALLBACK = 'Список участников';

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
 * ОБРАБОТКА GET-ЗАПРОСОВ (Получение списка фильмов, комментариев, рейтингов и прокси TMDB)
 */
function doGet(e) {
  try {
    var action = (e && e.parameter && e.parameter.action) || 'movies';

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
 * ОБРАБОТКА POST-ЗАПРОСОВ (Добавление и обновление фильмов)
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

    return createJsonResponse({ error: 'unknown_action' });
  } catch (err) {
    return createJsonResponse({ error: err.message || String(err) });
  }
}

/**
 * Добавление нового фильма в таблицу «Киноклуб»
 */
function appendMovie(ss, entry) {
  if (!entry || !entry.title || !entry.date || !entry.participants || !entry.participants.length) {
    throw new Error('Некорректные данные фильма');
  }

  var sheet = ss.getSheetByName(SHEET_NAME_MOVIES);
  var lastRow = sheet.getLastRow();
  var startRow = lastRow + 1;

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

  var participants = entry.participants;
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

  // Подготовка строк [Номер, Дата, Название, Участник, Оценка, Среднее]
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

  // Запись в таблицу
  sheet.getRange(startRow, 1, participantCount, 6).setValues(rows);

  // Объединение ячеек в столбцах Номер (A), Дата (B), Название (C), Среднее (F)
  if (participantCount > 1) {
    sheet.getRange(startRow, 1, participantCount, 1).merge();
    sheet.getRange(startRow, 2, participantCount, 1).merge();
    sheet.getRange(startRow, 3, participantCount, 1).merge();
    sheet.getRange(startRow, 6, participantCount, 1).merge();
  }

  // Выравнивание по центру
  sheet.getRange(startRow, 1, participantCount, 6)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  // Черные границы для участников и оценок (столбцы D и E)
  sheet.getRange(startRow, 4, participantCount, 2)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  // Стандартные белые границы для остальных столбцов
  var maxCols = sheet.getMaxColumns();
  if (maxCols >= 7) {
    sheet.getRange(startRow, 7, participantCount, maxCols - 6)
      .setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID);
  }

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

  var participants = entry.participants;
  var newCount = participants.length;

  // Разъединяем объединенные ячейки перед изменением структуры строк
  if (existingCount > 1) {
    sheet.getRange(movieStartRow, 1, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 2, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 3, existingCount, 1).breakApart();
    sheet.getRange(movieStartRow, 6, existingCount, 1).breakApart();
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

  sheet.getRange(movieStartRow, 1, newCount, 6).setValues(rows);

  if (newCount > 1) {
    sheet.getRange(movieStartRow, 1, newCount, 1).merge();
    sheet.getRange(movieStartRow, 2, newCount, 1).merge();
    sheet.getRange(movieStartRow, 3, newCount, 1).merge();
    sheet.getRange(movieStartRow, 6, newCount, 1).merge();
  }

  sheet.getRange(movieStartRow, 1, newCount, 6)
    .setHorizontalAlignment('center')
    .setVerticalAlignment('middle');

  sheet.getRange(movieStartRow, 4, newCount, 2)
    .setBorder(true, true, true, true, true, true, '#000000', SpreadsheetApp.BorderStyle.SOLID);

  var maxCols = sheet.getMaxColumns();
  if (maxCols >= 7) {
    sheet.getRange(movieStartRow, 7, newCount, maxCols - 6)
      .setBorder(true, true, true, true, true, true, '#ffffff', SpreadsheetApp.BorderStyle.SOLID);
  }

  return { ok: true };
}
