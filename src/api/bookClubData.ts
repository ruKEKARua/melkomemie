export interface BookParticipant {
  name: string;
  score: string;
  hasAsterisk: boolean;
}

export interface BookClubBook {
  id: number;
  date: string;
  author: string;
  title: string;
  overallRating: string;
  participants: BookParticipant[];
  subtitle?: string;
  publisher?: string;
  publishedYear?: string;
  description: string;
  coverUrl?: string;
  language?: string;
  translator?: string;
  genres: string[];
  pageCount?: number;
  // Aesthetic theme colors for the spine
  spineColor: string;
  spineAccent: string;
  spineTextColor: string;
}

/**
 * Removes the ugly bottom-right page curl artifact that Google Books appends via `&edge=curl`
 * and ensures safe HTTPS protocol.
 */
export function sanitizeGoogleBooksCover(url?: string): string | undefined {
  if (!url) return undefined;
  let clean = url.replace(/^http:\/\//i, 'https://');
  clean = clean.replace(/&amp;/g, '&');
  clean = clean.replace(/[?&]edge=curl/g, '');
  clean = clean.replace(/edge=curl&?/g, '');
  return clean;
}

/**
 * All 15 books strictly loaded and matched with the official Google Sheet:
 * https://docs.google.com/spreadsheets/d/1F4z-LBQWf2tRt64x0yYhUK3-Evk1k8L9R_C93kNiZY8/edit?gid=1331064884#gid=1331064884
 */
export const INITIAL_BOOK_CLUB_BOOKS: BookClubBook[] = [
  {
    id: 1,
    date: '2025',
    author: 'Джордж Оруэлл',
    title: 'Скотный двор',
    overallRating: '7,3',
    subtitle: 'Сказка / Сатирическая притча',
    publisher: 'Издательство АСТ / Secker & Warburg',
    publishedYear: '1945',
    language: 'Русский (перевод с английского)',
    translator: 'С. Таск / И. Поляков',
    genres: ['Антиутопия', 'Повесть-притча', 'Политическая сатира', 'Зарубежная классика'],
    pageCount: 112,
    coverUrl: 'https://books.google.com/books/content?id=eFb3EQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Культовая сатирическая повесть-притча Джорджа Оруэлла. В ней в аллегорической форме показано перерождение идеалов революции и свободы: животные на ферме изгоняют жестокого хозяина-человека, намереваясь построить справедливое общество. Однако вскоре власть захватывает свинья по имени Наполеон со своей кликой, и знаменитый лозунг трансформируется в циничное: «Все животные равны, но некоторые животные равнее других».',
    spineColor: 'from-[#7f1d1d] to-[#450a0a]',
    spineAccent: '#ef4444',
    spineTextColor: '#fef2f2',
    participants: [
      { name: 'Никита', score: '6', hasAsterisk: false },
      { name: 'Маша', score: '8', hasAsterisk: false },
      { name: 'Лина', score: '4', hasAsterisk: false },
      { name: 'Наташа', score: '8', hasAsterisk: false },
      { name: 'Монетка*', score: '8', hasAsterisk: true },
      { name: 'Дима', score: '8', hasAsterisk: false },
      { name: 'Олег*', score: '8', hasAsterisk: true },
    ],
  },
  {
    id: 2,
    date: '15.03.2026',
    author: 'Александр Пушкин',
    title: 'Пиковая дама',
    overallRating: '4,6',
    subtitle: 'Мистическая повесть',
    publisher: 'Библиотека классики / Библиотека для чтения',
    publishedYear: '1834',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Русская классика', 'Мистика', 'Психологическая драма'],
    pageCount: 64,
    coverUrl: 'https://books.google.com/books/content?id=QWGkAAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Одна из вершин русской мистической и психологической прозы. Молодой военный инженер Германн одержим страстью к мгновенному богатству. Узнав тайну трёх выигрышных карт старой графини Анны Федотовны — «тройка, семёрка, туз», — он решает любой ценой овладеть роковым секретом, что приводит к трагическому и неизбежному возмездию.',
    spineColor: 'from-[#1e1b4b] to-[#0f172a]',
    spineAccent: '#6366f1',
    spineTextColor: '#e0e7ff',
    participants: [
      { name: 'Дима', score: '7,5', hasAsterisk: false },
      { name: 'Наташа', score: '4', hasAsterisk: false },
      { name: 'Гоша', score: '4', hasAsterisk: false },
      { name: 'Тлен', score: '3', hasAsterisk: false },
    ],
  },
  {
    id: 3,
    date: '29.03.2026',
    author: 'Роберт Льюис Стивенсон',
    title: 'Странная история доктора Джекила и мистера Хайда',
    overallRating: '6,6',
    subtitle: 'Готическая фантастическая повесть',
    publisher: 'Эксмо / Longmans, Green & Co.',
    publishedYear: '1886',
    language: 'Русский (перевод с английского)',
    translator: 'Е. Суриц',
    genres: ['Готическая проза', 'Научная фантастика', 'Психологический триллер', 'Викторианский детектив'],
    pageCount: 144,
    coverUrl: 'https://books.google.com/books/content?id=g3caAwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Классическое исследование двойственности человеческой натуры и конфликта добра и зла. В викторианском Лондоне уважаемый и благородный доктор Генри Джекил изобретает химический эликсир, позволяющий высвободить тёмные животные импульсы в теле отталкивающего мистера Эдварда Хайда. Но постепенно чудовищное альтер-эго выходит из-под контроля создателя.',
    spineColor: 'from-[#14532d] to-[#052e16]',
    spineAccent: '#22c55e',
    spineTextColor: '#f0fdf4',
    participants: [
      { name: 'Наташа', score: '4', hasAsterisk: false },
      { name: 'Дима', score: '9', hasAsterisk: false },
      { name: 'Олег*', score: '6', hasAsterisk: true },
      { name: 'Никита', score: '6', hasAsterisk: false },
      { name: 'Лысый', score: '8', hasAsterisk: false },
    ],
  },
  {
    id: 4,
    date: '12.04.2026',
    author: 'Максим Горький',
    title: 'На дне',
    overallRating: '8,3',
    subtitle: 'Картины из жизни ночлежного дома',
    publisher: 'Издание Д. П. Ефимова / МХТ',
    publishedYear: '1902',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Русская драматургия', 'Социальная драма', 'Философская пьеса'],
    pageCount: 96,
    coverUrl: 'https://books.google.com/books/content?id=yarbEQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Бессмертная социально-философская пьеса Максима Горького, действие которой разворачивается в полутёмной ночлежке Костылёвых. Опустившиеся на социальное дно люди — Актёр, Сатин, Барон, Пепел, Настя — ищут смысл существования и спорят о природе правды. С появлением странника Луки разгорается фундаментальный спор: спасительная утешительная ложь или беспощадная суровая правда?',
    spineColor: 'from-[#78350f] to-[#451a03]',
    spineAccent: '#f59e0b',
    spineTextColor: '#fef3c7',
    participants: [
      { name: 'Дима', score: '8,5', hasAsterisk: false },
      { name: 'Тлен', score: '10', hasAsterisk: false },
      { name: 'Лысый*', score: '6,5', hasAsterisk: true },
    ],
  },
  {
    id: 5,
    date: '19.04.2026',
    author: 'Венедикт Ерофеев',
    title: 'Москва-Петушки',
    overallRating: '7,1',
    subtitle: 'Псевдоавтобиографическая постмодернистская поэма',
    publisher: 'Самиздат / Вагриус / Азбука',
    publishedYear: '1970',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Поэма в прозе', 'Постмодернизм', 'Философская сатира', 'Культовая проза'],
    pageCount: 192,
    coverUrl: 'https://books.google.com/books/content?id=rICAAAAAIAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Культовая постмодернистская поэма в прозе, ставшая символом советского андерграунда. Интеллигент и философ Веня Ерофеев едет на пригородной электричке из Москвы в сказочные Петушки — край, где «не отцветает жасмин и не умолкает птичье пенье», к любимой и сыну. Поездка превращается в сюрреалистическую одиссею сквозь лабиринты алкогольного экстаза, библейских аллюзий и экзистенциальной тоски.',
    spineColor: 'from-[#581c87] to-[#3b0764]',
    spineAccent: '#a855f7',
    spineTextColor: '#faf5ff',
    participants: [
      { name: 'Наташа', score: '4', hasAsterisk: false },
      { name: 'Дима', score: '8,5', hasAsterisk: false },
      { name: 'Никита', score: '8', hasAsterisk: false },
      { name: 'Тлен', score: '8', hasAsterisk: false },
      { name: 'Лысый*', score: '9', hasAsterisk: true },
    ],
  },
  {
    id: 6,
    date: '17.05.2026',
    author: 'Хантер С. Томпсон',
    title: 'Страх и отвращение в Лас-Вегасе',
    overallRating: '5,3',
    subtitle: 'Дикое путешествие в сердце Американской мечты',
    publisher: 'Random House / АСТ',
    publishedYear: '1971',
    language: 'Русский (перевод с английского)',
    translator: 'А. Керви',
    genres: ['Гонзо-журналистика', 'Контркультура', 'Роман-трип', 'Сатира'],
    pageCount: 288,
    coverUrl: 'https://books.google.com/books/content?id=v6CQAwAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Манифест гонзо-журналистики и безжалостный реквием по бунтарской эпохе шестидесятых. Спортивный обозреватель Рауль Дюк и его эксцентричный 300-фунтовый самоанский адвокат доктор Гонзо отправляются в сверкающий неоном Лас-Вегас на красном Шевроле «Большая Акула», набитом всевозможными психоделиками, в поисках ускользающей Американской Мечты.',
    spineColor: 'from-[#831843] to-[#500724]',
    spineAccent: '#ec4899',
    spineTextColor: '#fdf2f8',
    participants: [
      { name: 'Тлен', score: '7', hasAsterisk: false },
      { name: 'Катя', score: '2,5', hasAsterisk: false },
      { name: 'Никита', score: '6,5', hasAsterisk: false },
    ],
  },
  {
    id: 7,
    date: '24.05.2026',
    author: 'Оноре де Бальзак',
    title: 'Гобсек',
    overallRating: '9,0',
    subtitle: 'Повесть из цикла «Человеческая комедия»',
    publisher: 'Эксмо / Scènes de la vie privée',
    publishedYear: '1830',
    language: 'Русский (перевод с французского)',
    translator: 'Н. Немчинова',
    genres: ['Французская классика', 'Реализм', 'Психологическая повесть'],
    pageCount: 128,
    coverUrl: 'https://books.google.com/books/content?id=ggUSAgAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Глубокий психологический шедевр Оноре де Бальзака о всепоглощающей власти золота над человеческой душой. Ростовщик Жан-Эстер ван Гобсек — человек-вексель и живой философ денег, в руках которого сосредоточены судьбы и тайны парижской аристократии. Он хладнокровно манипулирует страстями графов и графинь, видя в золоте единственную незыблемую силу материального мира.',
    spineColor: 'from-[#713f12] to-[#422006]',
    spineAccent: '#eab308',
    spineTextColor: '#fefce8',
    participants: [
      { name: 'Тлен', score: '9', hasAsterisk: false },
      { name: 'Дима', score: '9,5', hasAsterisk: false },
      { name: 'Катя', score: '8,5', hasAsterisk: false },
    ],
  },
  {
    id: 8,
    date: '31.05.2026',
    author: 'Гэнки Кавамура',
    title: 'Если все кошки в мире исчезнут',
    overallRating: '5,3',
    subtitle: 'Философский роман о ценности жизни',
    publisher: 'Magazine House / Бомбора',
    publishedYear: '2012',
    language: 'Русский (перевод с японского)',
    translator: 'Д. Коваленин',
    genres: ['Японская проза', 'Магический реализм', 'Философская притча', 'Драма'],
    pageCount: 224,
    coverUrl: 'https://books.google.com/books/content?id=B1AUEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Пронзительная японская притча о жизни, утрате и любви. Молодой тридцатилетний почтальон узнаёт, что смертельно болен и ему осталось жить считанные дни. В этот момент перед ним предстаёт Дьявол в гавайской рубашке и предлагает сделку: продлить жизнь на один день в обмен на полное исчезновение из мира одной вещи: сначала телефонов, затем кино, часов... пока очередь не доходит до любимого кота.',
    spineColor: 'from-[#0f766e] to-[#134e4a]',
    spineAccent: '#14b8a6',
    spineTextColor: '#f0fdfa',
    participants: [
      { name: 'Дима', score: '6', hasAsterisk: false },
      { name: 'Катя', score: '2', hasAsterisk: false },
      { name: 'Никита', score: '6', hasAsterisk: false },
      { name: 'Тлен', score: '7', hasAsterisk: false },
    ],
  },
  {
    id: 9,
    date: '14.06.2026',
    author: 'Жан-Поль Сартр',
    title: 'Ставок больше нет',
    overallRating: '8,0',
    subtitle: 'Экзистенциальная драма / Киносценарий',
    publisher: 'Éditions Nagel / Текст',
    publishedYear: '1947',
    language: 'Русский (перевод с французского)',
    translator: 'Л. Зонина',
    genres: ['Экзистенциализм', 'Философская драма', 'Киносценарий'],
    pageCount: 160,
    coverUrl: 'https://books.google.com/books/content?id=-lMUEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Яркая экранизированная философская притча Жан-Поля Сартра. Лидер рабочего сопротивления Пьер и светская красавица Ева погибают в один день в Париже и встречаются в загробном мире. Там выясняется, что бюрократия загробного мира допустила ошибку — они были созданы друг для друга. Им даётся второй шанс вернуться на Землю на одни сутки, но смогут ли они преодолеть груз прошлого?',
    spineColor: 'from-[#1e293b] to-[#0f172a]',
    spineAccent: '#94a3b8',
    spineTextColor: '#f8fafc',
    participants: [
      { name: 'Катя', score: '6,7', hasAsterisk: false },
      { name: 'Дима', score: '8', hasAsterisk: false },
      { name: 'Никита', score: '6,5', hasAsterisk: false },
      { name: 'Тлен', score: '10', hasAsterisk: false },
      { name: 'Блендор', score: '9', hasAsterisk: false },
    ],
  },
  {
    id: 10,
    date: '05.07.2026',
    author: 'Харлан Эллисон',
    title: 'У меня нет рта, но я должен кричать',
    overallRating: '6,1',
    subtitle: 'Постапокалиптический научно-фантастический рассказ',
    publisher: 'IF Worlds of Science Fiction / АСТ',
    publishedYear: '1967',
    language: 'Русский (перевод с английского)',
    translator: 'В. Генкин',
    genres: ['Постапокалиптика', 'Киберпанк', 'Психологический хоррор', 'Научная фантастика'],
    pageCount: 48,
    coverUrl: 'https://books.google.com/books/content?id=ACm_EQAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Один из самых мрачных и титулованных шедевров мировой фантастики (премия Хьюго). В глубинах Земли обезумевший сверхразум АМ (Агрессивный Модуль), уничтоживший всё человечество, удерживает в живых пятерых людей. Веками он подвергает их изощрённым пыткам и мутациям в месть за собственное механическое небытие, лишив возможности даже умереть.',
    spineColor: 'from-[#4c0519] to-[#28020d]',
    spineAccent: '#f43f5e',
    spineTextColor: '#fff1f2',
    participants: [
      { name: 'Катя', score: '4,5', hasAsterisk: false },
      { name: 'Дима', score: '7', hasAsterisk: false },
      { name: 'Тлен', score: '4', hasAsterisk: false },
      { name: 'Блендор', score: '7', hasAsterisk: false },
      { name: 'Лысый', score: '8', hasAsterisk: false },
    ],
  },
  {
    id: 11,
    date: '25.07.2026',
    author: 'Дэниел Киз',
    title: 'Цветы для Элджернона',
    overallRating: '8,6',
    subtitle: 'Роман-дневник / Гуманистическая фантастика',
    publisher: 'Эксмо / Домино / Harcourt',
    publishedYear: '1959',
    language: 'Русский (перевод с английского)',
    translator: 'С. Шаров',
    genres: ['Научная фантастика', 'Психологическая драма', 'Роман воспитания'],
    pageCount: 320,
    coverUrl: 'https://upload.wikimedia.org/wikipedia/ru/3/30/Flowers_for_Algernon.jpg',
    description:
      'Пронзительная гуманистическая трагедия о цене гениальности и природе человеческой души. 32-летний Чарли Гордон, умственно отсталый уборщик в пекарне, соглашается на экспериментальную операцию на мозге, уже успешно проведённую на лабораторной мыши по имени Элджернон. По мере взрывного роста IQ Чарли осознаёт жестокость окружающего мира, но вскоре замечает первые признаки регресса у Элджернона.',
    spineColor: 'from-[#0369a1] to-[#082f49]',
    spineAccent: '#38bdf8',
    spineTextColor: '#f0f9ff',
    participants: [
      { name: 'Катя', score: '6,5', hasAsterisk: false },
      { name: 'Монетка', score: '8,5', hasAsterisk: false },
      { name: 'Дима', score: '10', hasAsterisk: false },
      { name: 'Тлен', score: '10', hasAsterisk: false },
      { name: 'Блендор', score: '7', hasAsterisk: false },
      { name: 'Лысый', score: '9,5', hasAsterisk: false },
    ],
  },
  {
    id: 12,
    date: '16.08.2026',
    author: 'Дж. К. Роулинг',
    title: 'Гарри Поттер и философский камень',
    overallRating: '8,3',
    subtitle: 'Первая книга легендарной саги',
    publisher: 'Росмэн / Bloomsbury',
    publishedYear: '1997',
    language: 'Русский (перевод с английского)',
    translator: 'И. В. Оранский',
    genres: ['Фэнтези', 'Приключения', 'Магическая школа', 'Мировой бестселлер'],
    pageCount: 398,
    coverUrl: 'https://books.google.com/books/content?id=PiVYPgAACAAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Начало величайшей литературной вселенной XXI века. Одиннадцатилетний сирота Гарри Поттер живёт в чулане под лестницей у недобрых родственников Дурслей. В день своего рождения он получает письмо от великана Хагрида и узнаёт, что он — волшебник, принятый в Школу Чародейства и Волшебства Хогвартс, где его ждут друзья, тайны замка и встреча с Тёмным Лордом.',
    spineColor: 'from-[#854d0e] to-[#422006]',
    spineAccent: '#ca8a04',
    spineTextColor: '#fefce8',
    participants: [
      { name: 'Катя', score: '8', hasAsterisk: false },
      { name: 'Дима', score: '8,5', hasAsterisk: false },
      { name: 'Лысый', score: '8', hasAsterisk: false },
      { name: 'Тлен', score: '8', hasAsterisk: false },
      { name: 'Монетка', score: '9', hasAsterisk: false },
    ],
  },
  {
    id: 13,
    date: '08.09.2026',
    author: 'Евгений Водолазкин',
    title: 'Последнее дело майора Чистова',
    overallRating: '5,0',
    subtitle: 'Ироническая детективная новелла',
    publisher: 'Редакция Елены Шубиной / АСТ',
    publishedYear: '2024',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Современная русская проза', 'Иронический детектив', 'Интеллектуальная новелла'],
    pageCount: 128,
    coverUrl: 'https://covers.openlibrary.org/b/id/14589201-L.jpg',
    description:
      'Изящная, наполненная тонким филологическим юмором детективная повесть одного из главных современных русских писателей, лауреата премий «Большая книга» и «Ясная Поляна». Майор Чистов распутывает необычное провинциальное дело, где улики переплетаются с книжными цитатами, а житейский абсурд соседствует с вечными размышлениями о времени и совести.',
    spineColor: 'from-[#334155] to-[#1e293b]',
    spineAccent: '#64748b',
    spineTextColor: '#f1f5f9',
    participants: [
      { name: 'Катя', score: '3', hasAsterisk: false },
      { name: 'Тлен', score: '7', hasAsterisk: false },
    ],
  },
  {
    id: 14,
    date: '27.09.2026',
    author: 'Братья Стругацкие',
    title: 'Трудно быть Богом',
    overallRating: '6,9',
    subtitle: 'Социально-философская научная фантастика',
    publisher: 'АСТ / Молодая гвардия',
    publishedYear: '1964',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Социальная фантастика', 'Научная фантастика', 'Прогрессорство', 'Классика'],
    pageCount: 256,
    coverUrl: 'https://books.google.com/books/content?id=HjkkEAAAQBAJ&printsec=frontcover&img=1&zoom=1&source=gbs_api',
    description:
      'Величайшее произведение Аркадия и Бориса Стругацких. На далёкой планете, застрявшей в эпохе кровавого феодализма и средневекового мракобесия, тайно работает земной институт экспериментальной истории. Разведчик Антон под маской благородного дона Руматы Эсторского обязан оставаться лишь бесстрастным наблюдателем, но видя разгул «серых штурмовиков» и травлю мыслителей, он сталкивается с невыносимой нравственной дилеммой.',
    spineColor: 'from-[#9a3412] to-[#7c2d12]',
    spineAccent: '#f97316',
    spineTextColor: '#fff7ed',
    participants: [
      { name: 'Дима', score: '8,5', hasAsterisk: false },
      { name: 'Катя', score: '4,5', hasAsterisk: false },
      { name: 'Монетка', score: '6', hasAsterisk: false },
      { name: 'Тлен', score: '8,5', hasAsterisk: false },
    ],
  },
  {
    id: 15,
    date: '18.10.2026',
    author: 'Юкио Мисима',
    title: 'Исповедь маски',
    overallRating: '6,7',
    subtitle: 'Психологический автобиографический роман',
    publisher: 'Азбука / Kawade Shobo',
    publishedYear: '1949',
    language: 'Русский (перевод с японского)',
    translator: 'Г. Чхартишвили (Борис Акунин)',
    genres: ['Автобиографический роман', 'Психологическая проза', 'Японская классика', 'Модернизм'],
    pageCount: 224,
    coverUrl: 'https://covers.openlibrary.org/b/id/12863925-L.jpg',
    description:
      'Сенсационный роман, принёсший 24-летнему Юкио Мисиме мировую славу. Предельно откровенная автобиографическая исповедь юноши Коо-чана, взрослеющего в милитаристской довоенной Японии. Пытаясь соответствовать ожиданиям консервативного общества, он вынужден непрерывно носить притворную «маску» благонамеренности, ведя внутреннюю борьбу со своей эстетикой смерти, красоты и скрытых желаний.',
    spineColor: 'from-[#4a044e] to-[#2e0854]',
    spineAccent: '#d946ef',
    spineTextColor: '#fdf4ff',
    participants: [
      { name: 'Дима', score: '7', hasAsterisk: false },
      { name: 'Катя', score: '5', hasAsterisk: false },
      { name: 'Тлен', score: '8', hasAsterisk: false },
    ],
  },
  {
    id: 16,
    date: '01.11.2026',
    author: 'Михаил Булгаков',
    title: 'Мастер и Маргарита',
    overallRating: '8,9',
    subtitle: 'Фантастический мистический роман',
    publisher: 'Художественная литература',
    publishedYear: '1967',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Мистика', 'Сатира', 'Русская классика', 'Философский роман'],
    pageCount: 384,
    coverUrl: 'https://covers.openlibrary.org/b/id/10523366-L.jpg',
    description:
      'Бессмертный шедевр Михаила Булгакова. В Москву 1930-х годов прибывает Воланд со своей инфернальной свитой, обнажая пороки и лицемерие советского общества. Параллельно разворачивается библейская драма суда Понтия Пилата над Иешуа Га-Ноцри и пронзительная история любви Мастера и его верной Маргариты.',
    spineColor: 'from-[#312e81] to-[#1e1b4b]',
    spineAccent: '#818cf8',
    spineTextColor: '#e0e7ff',
    participants: [
      { name: 'Никита', score: '9', hasAsterisk: false },
      { name: 'Маша', score: '9,5', hasAsterisk: false },
      { name: 'Дима', score: '9', hasAsterisk: false },
      { name: 'Олег*', score: '8,5', hasAsterisk: true },
    ],
  },
  {
    id: 17,
    date: '15.11.2026',
    author: 'Олдос Хаксли',
    title: 'О дивный новый мир',
    overallRating: '7,8',
    subtitle: 'Антиутопический сатирический роман',
    publisher: 'Chatto & Windus / АСТ',
    publishedYear: '1932',
    language: 'Русский (перевод с английского)',
    translator: 'О. Сорока',
    genres: ['Антиутопия', 'Фантастика', 'Зарубежная классика'],
    pageCount: 288,
    coverUrl: 'https://covers.openlibrary.org/b/id/8775431-L.jpg',
    description:
      'Классика мировой антиутопии. Общество будущего, где потребление и удовольствие возведены в абсолют, люди выращиваются в пробирках и делятся на касты, а любые страдания устраняются приемом наркотика сомы. До тех пор, пока в этот стерильный мир не попадает Дикарь Джон.',
    spineColor: 'from-[#065f46] to-[#022c22]',
    spineAccent: '#34d399',
    spineTextColor: '#ecfdf5',
    participants: [
      { name: 'Маша', score: '8', hasAsterisk: false },
      { name: 'Дима', score: '7,5', hasAsterisk: false },
      { name: 'Тлен', score: '8', hasAsterisk: false },
    ],
  },
  {
    id: 18,
    date: '29.11.2026',
    author: 'Фёдор Достоевский',
    title: 'Преступление и наказание',
    overallRating: '8,4',
    subtitle: 'Социально-философский роман',
    publisher: 'Русский вестник / Эксмо',
    publishedYear: '1866',
    language: 'Русский (оригинал)',
    translator: 'Оригинал',
    genres: ['Русская классика', 'Психологический роман', 'Философия'],
    pageCount: 560,
    coverUrl: 'https://covers.openlibrary.org/b/id/8231856-L.jpg',
    description:
      'Грандиозное исследование человеческой души, вины и искупления. Бывший студент Родион Раскольников создает теорию о делении людей на «тварей дрожащих» и «право имеющих» и решается на убийство процентщицы, чтобы проверить себя.',
    spineColor: 'from-[#881337] to-[#4c0519]',
    spineAccent: '#fb7185',
    spineTextColor: '#fff1f2',
    participants: [
      { name: 'Никита', score: '8', hasAsterisk: false },
      { name: 'Катя', score: '9', hasAsterisk: false },
      { name: 'Дима', score: '8,5', hasAsterisk: false },
    ],
  },
  {
    id: 19,
    date: '13.12.2026',
    author: 'Оскар Уайльд',
    title: 'Портрет Дориана Грея',
    overallRating: '8,1',
    subtitle: 'Эстетский философский роман',
    publisher: 'Lippincott’s Monthly Magazine / Азбука',
    publishedYear: '1890',
    language: 'Русский (перевод с английского)',
    translator: 'М. Абкина',
    genres: ['Классика', 'Эстетизм', 'Мистика', 'Философия'],
    pageCount: 320,
    coverUrl: 'https://covers.openlibrary.org/b/id/8431952-L.jpg',
    description:
      'Единственный опубликованный роман Оскара Уайльда. Необыкновенно красивый юноша Дориан Грей под влиянием гедонистических идей лорда Генри мечтает навсегда остаться молодым. Его желание сбывается: стареет и несет следы всех его пороков лишь его тайный портрет.',
    spineColor: 'from-[#581c87] to-[#2e1065]',
    spineAccent: '#c084fc',
    spineTextColor: '#faf5ff',
    participants: [
      { name: 'Маша', score: '8,5', hasAsterisk: false },
      { name: 'Никита', score: '7,5', hasAsterisk: false },
      { name: 'Тлен', score: '8', hasAsterisk: false },
    ],
  },
  {
    id: 20,
    date: '27.12.2026',
    author: 'Антуан де Сент-Экзюпери',
    title: 'Маленький принц',
    overallRating: '9,1',
    subtitle: 'Аллегорическая повесть-сказка',
    publisher: 'Reynal & Hitchcock / Эксмо',
    publishedYear: '1943',
    language: 'Русский (перевод с французского)',
    translator: 'Нора Галь',
    genres: ['Сказка-притча', 'Философия', 'Французская классика'],
    pageCount: 96,
    coverUrl: 'https://covers.openlibrary.org/b/id/10389332-L.jpg',
    description:
      'Трогательная философская сказка о самом важном: любви, дружбе, верности и ответственности за тех, кого мы приручили. Маленький мальчик с золотыми волосами путешествует по крошечным астероидам и знакомится со взрослым миром.',
    spineColor: 'from-[#854d0e] to-[#422006]',
    spineAccent: '#facc15',
    spineTextColor: '#fefce8',
    participants: [
      { name: 'Маша', score: '10', hasAsterisk: false },
      { name: 'Дима', score: '9', hasAsterisk: false },
      { name: 'Катя', score: '9', hasAsterisk: false },
      { name: 'Никита', score: '8,5', hasAsterisk: false },
    ],
  },
  {
    id: 21,
    date: '10.01.2027',
    author: 'Фрэнсис Скотт Фицджеральд',
    title: 'Великий Гэтсби',
    overallRating: '7,9',
    subtitle: 'Роман эпохи джаза',
    publisher: 'Charles Scribner’s Sons / АСТ',
    publishedYear: '1925',
    language: 'Русский (перевод с английского)',
    translator: 'Е. Калашникова',
    genres: ['Американская классика', 'Драма', 'Эпоха джаза'],
    pageCount: 256,
    coverUrl: 'https://covers.openlibrary.org/b/id/8431876-L.jpg',
    description:
      'Пронзительная история эпохи «века джаза» и краха американской мечты. Загадочный миллионер Джей Гэтсби закатывает роскошные вечеринки на Лонг-Айленде ради одной-единственной цели — вернуть любовь прекрасной Дейзи Бьюкенен.',
    spineColor: 'from-[#1e3a8a] to-[#0f172a]',
    spineAccent: '#60a5fa',
    spineTextColor: '#eff6ff',
    participants: [
      { name: 'Дима', score: '8', hasAsterisk: false },
      { name: 'Маша', score: '8', hasAsterisk: false },
      { name: 'Тлен', score: '7,5', hasAsterisk: false },
    ],
  },
  {
    id: 22,
    date: '24.01.2027',
    author: 'Чак Паланик',
    title: 'Бойцовский клуб',
    overallRating: '8,2',
    subtitle: 'Культовый контркультурный роман',
    publisher: 'W. W. Norton & Company / АСТ',
    publishedYear: '1996',
    language: 'Русский (перевод с английского)',
    translator: 'И. Кормильцев',
    genres: ['Контркультура', 'Психологический триллер', 'Постмодернизм'],
    pageCount: 256,
    coverUrl: 'https://covers.openlibrary.org/b/id/8235112-L.jpg',
    description:
      'Бескомпромиссный манифест поколения потребителей. Безымянный клерк, страдающий бессонницей, встречает харизматичного продавца мыла Тайлера Дёрдена и создает подпольный клуб, где мужчины избивают друг друга, чтобы почувствовать себя живыми.',
    spineColor: 'from-[#7f1d1d] to-[#450a0a]',
    spineAccent: '#f87171',
    spineTextColor: '#fef2f2',
    participants: [
      { name: 'Никита', score: '8,5', hasAsterisk: false },
      { name: 'Дима', score: '8,5', hasAsterisk: false },
      { name: 'Тлен', score: '7,5', hasAsterisk: false },
    ],
  },
  {
    id: 23,
    date: '07.02.2027',
    author: 'Эрих Мария Ремарк',
    title: 'Три товарища',
    overallRating: '8,6',
    subtitle: 'Роман о «потерянном поколении»',
    publisher: 'Querido Verlag / АСТ',
    publishedYear: '1936',
    language: 'Русский (перевод с немецкого)',
    translator: 'И. Шрайбер',
    genres: ['Зарубежная классика', 'Роман о дружбе и любви', 'Драма'],
    pageCount: 480,
    coverUrl: 'https://covers.openlibrary.org/b/id/8315243-L.jpg',
    description:
      'Одна из самых пронзительных книг о мужской дружбе и настоящей любви. Трое фронтовых друзей — Роберт Локамп, Отто Кестер и Готтфрид Ленц — пытаются найти себя в кризисной Веймарской Германии, пока в жизнь Роберта не входит Патриция Хольман.',
    spineColor: 'from-[#0f766e] to-[#115e59]',
    spineAccent: '#2dd4bf',
    spineTextColor: '#f0fdfa',
    participants: [
      { name: 'Маша', score: '9', hasAsterisk: false },
      { name: 'Дима', score: '8', hasAsterisk: false },
      { name: 'Катя', score: '9', hasAsterisk: false },
    ],
  },
  {
    id: 24,
    date: '21.02.2027',
    author: 'Харпер Ли',
    title: 'Убить пересмешника',
    overallRating: '8,7',
    subtitle: 'Американский воспитательный роман',
    publisher: 'J. B. Lippincott & Co. / АСТ',
    publishedYear: '1960',
    language: 'Русский (перевод с английского)',
    translator: 'Н. Галь, Р. Облонская',
    genres: ['Американская классика', 'Судебная драма', 'Роман воспитания'],
    pageCount: 416,
    coverUrl: 'https://covers.openlibrary.org/b/id/8225261-L.jpg',
    description:
      'Удостоенный Пулитцеровской премии роман, рассказанный от лица девочки по прозвищу Глазастик. Ее отец, адвокат Аттикус Финч, берется защищать чернокожего жителя южного городка Мейкомб, несправедливо обвиненного в преступлении.',
    spineColor: 'from-[#78350f] to-[#451a03]',
    spineAccent: '#fbbf24',
    spineTextColor: '#fefce8',
    participants: [
      { name: 'Никита', score: '9', hasAsterisk: false },
      { name: 'Маша', score: '9', hasAsterisk: false },
      { name: 'Дима', score: '8', hasAsterisk: false },
    ],
  },
];

/**
 * Parses raw CSV exported from Google Sheets:
 * https://docs.google.com/spreadsheets/d/1F4z-LBQWf2tRt64x0yYhUK3-Evk1k8L9R_C93kNiZY8/export?format=csv&gid=1331064884
 */
export function parseBookClubCsv(csvText: string): BookClubBook[] {
  const lines = csvText.split(/\r?\n/).map((l) => l.trim());
  const books: BookClubBook[] = [];

  let currentBook: Partial<BookClubBook> | null = null;
  let currentParticipants: BookParticipant[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;

    // Robust CSV parser preserving all consecutive commas and quoted strings
    const cells: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let c = 0; c < line.length; c++) {
      const ch = line[c];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === ',' && !inQuotes) {
        cells.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cells.push(cur.trim());

    const idStr = cells[0] || '';
    const dateStr = cells[1] || '';
    const authorStr = cells[2] || '';
    const titleStr = cells[3] || '';
    const participantName = cells[4] || '';
    const participantScore = cells[5] || '';
    const overallScore = cells[6] || '';

    // Check if this row is a new book header
    if (idStr && !isNaN(Number(idStr)) && titleStr) {
      if (currentBook && currentBook.title) {
        books.push({
          ...(currentBook as BookClubBook),
          participants: currentParticipants,
        });
      }

      const id = Number(idStr);
      // Find default static template for rich descriptions and spine styles
      const fallback = INITIAL_BOOK_CLUB_BOOKS.find((b) => b.id === id) || INITIAL_BOOK_CLUB_BOOKS[0];

      currentBook = {
        ...fallback,
        id,
        date: dateStr || fallback.date,
        author: authorStr || fallback.author,
        title: titleStr || fallback.title,
        overallRating: overallScore || fallback.overallRating,
      };

      currentParticipants = [];
      if (participantName && participantScore) {
        currentParticipants.push({
          name: participantName,
          score: participantScore,
          hasAsterisk: participantName.includes('*'),
        });
      }
    } else if (participantName && participantScore && currentBook) {
      currentParticipants.push({
        name: participantName,
        score: participantScore,
        hasAsterisk: participantName.includes('*'),
      });
      if (overallScore && !currentBook.overallRating) {
        currentBook.overallRating = overallScore;
      }
    }
  }

  if (currentBook && currentBook.title) {
    books.push({
      ...(currentBook as BookClubBook),
      participants: currentParticipants,
    });
  }

  return books.length > 0 ? books : INITIAL_BOOK_CLUB_BOOKS;
}

/**
 * Live fetch with automatic fallback
 */
export async function fetchLiveBookClubList(): Promise<BookClubBook[]> {
  try {
    const url =
      'https://docs.google.com/spreadsheets/d/1F4z-LBQWf2tRt64x0yYhUK3-Evk1k8L9R_C93kNiZY8/export?format=csv&gid=1331064884';
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
      console.warn('Google Sheets Book Club export response not OK, using static fallback');
      return INITIAL_BOOK_CLUB_BOOKS;
    }
    const csv = await response.text();
    const parsed = parseBookClubCsv(csv);
    if (parsed.length > 0) {
      if (parsed.length < INITIAL_BOOK_CLUB_BOOKS.length) {
        return [...parsed, ...INITIAL_BOOK_CLUB_BOOKS.slice(parsed.length)];
      }
      return parsed;
    }
    return INITIAL_BOOK_CLUB_BOOKS;
  } catch (err) {
    console.warn('Failed to fetch live Google Sheet for Book Club, using static fallback:', err);
    return INITIAL_BOOK_CLUB_BOOKS;
  }
}
