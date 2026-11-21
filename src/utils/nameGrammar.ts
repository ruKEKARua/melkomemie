/**
 * Система грамматики и склонения имен и никнеймов киноклуба Мелкомемье.
 * Поддерживает:
 * - Произвольные роды и склонения для никнеймов (Монетка, Лысый, Блендор, Тлен, Поварёнок и др.)
 * - Корректное согласование глаголов (оценил / оценила, посмотрел / посмотрела)
 * - Корректное согласование кратких и полных прилагательных (беспощаден / беспощадна)
 * - Склонение по 6 падежам русского языка (Именительный, Родительный, Дательный, Винительный, Творительный, Предложный)
 * - Автоматический морфологический fallback для любых новых стандартных русских имен
 */

export type Gender = 'male' | 'female';

export type RussianCase =
  | 'nom' // Именительный (кто?)
  | 'gen' // Родительный (кого?)
  | 'dat' // Дательный (кому?)
  | 'acc' // Винительный (кого?)
  | 'ins' // Творительный (кем?)
  | 'prep'; // Предложный (о ком?)

export interface ParticipantGrammar {
  name: string;
  gender: Gender;
  cases: {
    nom: string;
    gen: string;
    dat: string;
    acc: string;
    ins: string;
    prep: string;
  };
}

/**
 * Словарь участников киноклуба с кастомными правилами рода и склонений.
 */
export const PARTICIPANTS_GRAMMAR: Record<string, ParticipantGrammar> = {
  // 1. Дима — мужской род
  дима: {
    name: 'Дима',
    gender: 'male',
    cases: {
      nom: 'Дима',
      gen: 'Димы',
      dat: 'Диме',
      acc: 'Диму',
      ins: 'Димой',
      prep: 'Диме',
    },
  },

  // 2. Монетка — МУЖСКОЙ род (склоняется как обычное слово на -ка, но "Монетка оценил")
  монетка: {
    name: 'Монетка',
    gender: 'male',
    cases: {
      nom: 'Монетка',
      gen: 'Монетки',
      dat: 'Монетке',
      acc: 'Монетку',
      ins: 'Монеткой',
      prep: 'Монетке',
    },
  },

  // 3. Гоша — мужской род
  гоша: {
    name: 'Гоша',
    gender: 'male',
    cases: {
      nom: 'Гоша',
      gen: 'Гоши',
      dat: 'Гоше',
      acc: 'Гошу',
      ins: 'Гошей',
      prep: 'Гоше',
    },
  },

  // 4. Лысый — МУЖСКОЙ род (склоняется как субстантивированное прилагательное)
  лысый: {
    name: 'Лысый',
    gender: 'male',
    cases: {
      nom: 'Лысый',
      gen: 'Лысого',
      dat: 'Лысому',
      acc: 'Лысого',
      ins: 'Лысым',
      prep: 'Лысом',
    },
  },

  // 5. Олег — мужской род
  олег: {
    name: 'Олег',
    gender: 'male',
    cases: {
      nom: 'Олег',
      gen: 'Олега',
      dat: 'Олегу',
      acc: 'Олега',
      ins: 'Олегом',
      prep: 'Олеге',
    },
  },

  // 6. Артемка / Артёмка — мужской род
  артемка: {
    name: 'Артемка',
    gender: 'male',
    cases: {
      nom: 'Артемка',
      gen: 'Артемки',
      dat: 'Артемке',
      acc: 'Артемку',
      ins: 'Артемкой',
      prep: 'Артемке',
    },
  },
  артёмка: {
    name: 'Артёмка',
    gender: 'male',
    cases: {
      nom: 'Артёмка',
      gen: 'Артёмки',
      dat: 'Артёмке',
      acc: 'Артёмку',
      ins: 'Артёмкой',
      prep: 'Артёмке',
    },
  },

  // 7. Никита — мужской род
  никита: {
    name: 'Никита',
    gender: 'male',
    cases: {
      nom: 'Никита',
      gen: 'Никиты',
      dat: 'Никите',
      acc: 'Никиту',
      ins: 'Никитой',
      prep: 'Никите',
    },
  },

  // 8. Лина — ЖЕНСКИЙ род
  лина: {
    name: 'Лина',
    gender: 'female',
    cases: {
      nom: 'Лина',
      gen: 'Лины',
      dat: 'Лине',
      acc: 'Лину',
      ins: 'Линой',
      prep: 'Лине',
    },
  },

  // 9. Наташа — ЖЕНСКИЙ род
  наташа: {
    name: 'Наташа',
    gender: 'female',
    cases: {
      nom: 'Наташа',
      gen: 'Наташи',
      dat: 'Наташе',
      acc: 'Наташу',
      ins: 'Наташей',
      prep: 'Наташе',
    },
  },

  // 10. Блендор — МУЖСКОЙ род
  блендор: {
    name: 'Блендор',
    gender: 'male',
    cases: {
      nom: 'Блендор',
      gen: 'Блендора',
      dat: 'Блендору',
      acc: 'Блендора',
      ins: 'Блендором',
      prep: 'Блендоре',
    },
  },
  // Синоним / опечатка Блендер
  блендер: {
    name: 'Блендер',
    gender: 'male',
    cases: {
      nom: 'Блендер',
      gen: 'Блендера',
      dat: 'Блендеру',
      acc: 'Блендера',
      ins: 'Блендером',
      prep: 'Блендере',
    },
  },

  // 11. Тлен — ЖЕНСКИЙ род (не склоняется: "между Тлен", "нет Тлен", но согласуется в женском роде: "Тлен оценила", "Тлен беспощадна")
  тлен: {
    name: 'Тлен',
    gender: 'female',
    cases: {
      nom: 'Тлен',
      gen: 'Тлен',
      dat: 'Тлен',
      acc: 'Тлен',
      ins: 'Тлен',
      prep: 'Тлен',
    },
  },

  // 12. Поварёнок / Поваренок — МУЖСКОЙ род (с беглой гласной в суффиксе)
  поварёнок: {
    name: 'Поварёнок',
    gender: 'male',
    cases: {
      nom: 'Поварёнок',
      gen: 'Поварёнка',
      dat: 'Поварёнку',
      acc: 'Поварёнка',
      ins: 'Поварёнком',
      prep: 'Поварёнке',
    },
  },
  поваренок: {
    name: 'Поваренок',
    gender: 'male',
    cases: {
      nom: 'Поваренок',
      gen: 'Поваренка',
      dat: 'Поваренку',
      acc: 'Поваренка',
      ins: 'Поваренком',
      prep: 'Поваренке',
    },
  },

  // 13. Катя — ЖЕНСКИЙ род
  катя: {
    name: 'Катя',
    gender: 'female',
    cases: {
      nom: 'Катя',
      gen: 'Кати',
      dat: 'Кате',
      acc: 'Катю',
      ins: 'Катей',
      prep: 'Кате',
    },
  },

  // 14. Иван — МУЖСКОЙ род
  иван: {
    name: 'Иван',
    gender: 'male',
    cases: {
      nom: 'Иван',
      gen: 'Ивана',
      dat: 'Ивану',
      acc: 'Ивана',
      ins: 'Иваном',
      prep: 'Иване',
    },
  },

  // 15. Женя — МУЖСКОЙ род
  женя: {
    name: 'Женя',
    gender: 'male',
    cases: {
      nom: 'Женя',
      gen: 'Жени',
      dat: 'Жене',
      acc: 'Женю',
      ins: 'Женей',
      prep: 'Жене',
    },
  },
};

/**
 * Нормализует имя для поиска в словаре
 */
function normalizeNameKey(name?: string): string {
  if (!name) return '';
  return name.trim().toLowerCase();
}

/**
 * Возвращает грамматический род участника: 'male' или 'female'.
 * Сначала проверяет словарь кастомных никнеймов, затем применяет правила русского языка.
 */
export function getParticipantGender(name?: string): Gender {
  if (!name) return 'male';
  const key = normalizeNameKey(name);

  if (PARTICIPANTS_GRAMMAR[key]) {
    return PARTICIPANTS_GRAMMAR[key].gender;
  }

  // Общие правила для стандартных русских имен:
  // Если оканчивается на согласный или -й, -ь — мужской
  if (/[бвгджзклмнпрстфхцчшщй]$/i.test(key)) {
    return 'male';
  }

  // Известные мужские имена на -а/-я
  const maleEndingsA = ['дима', 'гоша', 'никита', 'артемка', 'артёмка', 'ваня', 'леша', 'лёша', 'миша', 'саша', 'женя', 'илья', 'паша', 'сережа', 'серёжа', 'коля', 'даня'];
  if (maleEndingsA.includes(key)) {
    return 'male';
  }

  // Имена на -а, -я по умолчанию считаются женскими (Аня, Оля, Катя, Лина, Маша и т.д.)
  if (/[ая]$/i.test(key)) {
    return 'female';
  }

  return 'male';
}

/**
 * Проверяет, является ли участник девушкой
 */
export function isFemaleParticipant(name?: string): boolean {
  return getParticipantGender(name) === 'female';
}

/**
 * Склоняет имя участника по заданному падежу.
 */
export function declineParticipant(name?: string, targetCase: RussianCase = 'nom'): string {
  if (!name) return '';
  const trimmed = name.trim();
  const key = normalizeNameKey(trimmed);

  // 1. Поиск в словаре киноклуба
  if (PARTICIPANTS_GRAMMAR[key]) {
    const entry = PARTICIPANTS_GRAMMAR[key];
    const declined = entry.cases[targetCase];
    if (declined) {
      // Сохраняем исходный регистр первой буквы
      if (trimmed[0] === trimmed[0].toUpperCase()) {
        return declined.charAt(0).toUpperCase() + declined.slice(1);
      }
      return declined;
    }
  }

  // 2. Морфологический fallback для любых стандартных русских имен
  return autoDeclineRussianName(trimmed, targetCase);
}

/**
 * Автоматическое склонение стандартных русских имен, не входящих в фиксированный словарь.
 */
function autoDeclineRussianName(name: string, c: RussianCase): string {
  if (c === 'nom') return name;

  const len = name.length;
  if (len < 2) return name;

  const last = name[len - 1].toLowerCase();
  const last2 = name.slice(-2).toLowerCase();
  const stem = name.slice(0, -1);

  // Адъективные имена на -ый, -ий (например, Лысый, Грозный)
  if (last2 === 'ый' || last2 === 'ий') {
    const adjStem = name.slice(0, -2);
    const soft = last2 === 'ий';
    switch (c) {
      case 'gen':
      case 'acc':
        return adjStem + (soft ? 'его' : 'ого');
      case 'dat':
        return adjStem + (soft ? 'ему' : 'ому');
      case 'ins':
        return adjStem + (soft ? 'им' : 'ым');
      case 'prep':
        return adjStem + (soft ? 'ем' : 'ом');
    }
  }

  // 1-е склонение: на -а (Дима, Никита, Лина, Наташа)
  if (last === 'а') {
    const isHushingOrG = /[гкхжчшщ]$/i.test(stem[stem.length - 1] || '');
    switch (c) {
      case 'gen':
        return stem + (isHushingOrG ? 'и' : 'ы');
      case 'dat':
      case 'prep':
        return stem + 'е';
      case 'acc':
        return stem + 'у';
      case 'ins':
        return stem + (/[жчшщц]$/i.test(stem[stem.length - 1] || '') ? 'ей' : 'ой');
    }
  }

  // 1-е склонение: на -я (Катя, Ваня, Женя)
  if (last === 'я') {
    switch (c) {
      case 'gen':
        return stem + 'и';
      case 'dat':
      case 'prep':
        return stem + 'е';
      case 'acc':
        return stem + 'ю';
      case 'ins':
        return stem + 'ей';
    }
  }

  // 2-е склонение: мужские имена на твердый согласный (Олег, Иван)
  if (/[бвгджзклмнпрстфхцчшщ]$/i.test(last)) {
    switch (c) {
      case 'gen':
      case 'acc':
        return name + 'а';
      case 'dat':
        return name + 'у';
      case 'ins':
        return name + 'ом';
      case 'prep':
        return name + 'е';
    }
  }

  // 2-е склонение: на -й (Тимофей, Андрей)
  if (last === 'й') {
    switch (c) {
      case 'gen':
      case 'acc':
        return stem + 'я';
      case 'dat':
        return stem + 'ю';
      case 'ins':
        return stem + 'ем';
      case 'prep':
        return stem + 'е';
    }
  }

  return name;
}

/**
 * Согласовывает глагол в прошедшем времени с полом участника.
 * Примеры:
 * agreeVerb('Монетка', 'оценил') -> 'оценил'
 * agreeVerb('Тлен', 'оценил') -> 'оценила'
 * agreeVerb('Лина', 'посмотрел') -> 'посмотрела'
 * agreeVerb('Лысый', 'видел') -> 'видел'
 */
export function agreeVerb(
  name: string,
  verbOrOptions: string | { male: string; female: string }
): string {
  const gender = getParticipantGender(name);

  if (typeof verbOrOptions === 'object') {
    return gender === 'female' ? verbOrOptions.female : verbOrOptions.male;
  }

  const verb = verbOrOptions.trim();

  // Если имя мужского пола — возвращаем форму мужского рода как есть
  if (gender === 'male') {
    return verb;
  }

  // Для женского рода:
  // Возвратные глаголы на -лся (ошибся -> ошиблась)
  if (verb.endsWith('лся')) {
    return verb.slice(0, -3) + 'лась';
  }

  // Глаголы на -ёл (провёл -> провела)
  if (verb.endsWith('ёл') || verb.endsWith('ел')) {
    if (verb === 'провёл' || verb === 'провел') return 'провела';
    if (verb === 'нашёл' || verb === 'нашел') return 'нашла';
  }

  // Стандартные глаголы прошедшего времени на -л (оценил -> оценила, видел -> видела)
  if (verb.endsWith('л')) {
    return verb + 'а';
  }

  return verb;
}

/**
 * Согласовывает краткое или полное прилагательное с полом участника.
 * Пример: agreeAdjective('Тлен', 'беспощаден', 'беспощадна') -> 'беспощадна'
 * Пример: agreeAdjective('Монетка', 'беспощаден', 'беспощадна') -> 'беспощадна' ? Нет! -> 'беспощаден'
 */
export function agreeAdjective(name: string, maleForm: string, femaleForm: string): string {
  const gender = getParticipantGender(name);
  return gender === 'female' ? femaleForm : maleForm;
}

/**
 * Удобный шаблонизатор фраз с участниками.
 * Поддерживает:
 * - {name} — Именительный падеж
 * - {name:gen} / {name:род} — Родительный
 * - {name:dat} / {name:дат} — Дательный
 * - {name:acc} / {name:вин} — Винительный
 * - {name:ins} / {name:твор} — Творительный ("между {name1:ins} и {name2:ins}")
 * - {name:prep} / {name:пред} — Предложный
 * - {мужской_вариант|женский_вариант} — согласование глаголов/прилагательных по полу участника
 *
 * Пример:
 * formatParticipantPhrase('{name} {оценил|оценила} этот фильм и {стал|стала} лидером', 'Тлен')
 * -> 'Тлен оценила этот фильм и стала лидером'
 *
 * formatParticipantPhrase('{name} {оценил|оценила} этот фильм и {стал|стала} лидером', 'Монетка')
 * -> 'Монетка оценил этот фильм и стал лидером'
 */
export function formatParticipantPhrase(template: string, name: string): string {
  const gender = getParticipantGender(name);

  let result = template;

  // 1. Падежи
  result = result.replace(/\{name(?::(nom|gen|dat|acc|ins|prep|им|род|дат|вин|твор|пред))?\}/gi, (_, caseTag) => {
    let c: RussianCase = 'nom';
    const tag = (caseTag || '').toLowerCase();
    if (tag === 'gen' || tag === 'род') c = 'gen';
    else if (tag === 'dat' || tag === 'дат') c = 'dat';
    else if (tag === 'acc' || tag === 'вин') c = 'acc';
    else if (tag === 'ins' || tag === 'твор') c = 'ins';
    else if (tag === 'prep' || tag === 'пред') c = 'prep';

    return declineParticipant(name, c);
  });

  // 2. Выбор формы {мужская|женская}
  result = result.replace(/\{([^}|]+)\|([^}]+)\}/g, (_, maleOption, femaleOption) => {
    return gender === 'female' ? femaleOption : maleOption;
  });

  return result;
}
