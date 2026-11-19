/**
 * Centralized editable placeholders and flavor texts for the Rewind page.
 * Edit texts, dates and badges here to customize presentation.
 */

export const aboutClubPlaceholders = {
  badge: 'Сообщество Мелкомемье',
  title: 'Киноклуб, где кино оживает в горячих спорах',
  foundedDate: '[Дата основания]',
  description:
    'Мелкомемье — это союз старых и новых друзей: от заядлых геймеров и синефилов до вдумчивых чтецов книжного клуба. Каждую неделю мы собираемся вместе, чтобы открывать шедевры мирового кино, погружаться в забытую классику и до хрипоты обсуждать каждый сюжетный поворот.',
  stats: [
    { label: 'Дата основания', value: '[Дата основания]' },
    { label: 'Киночасов в эфире', value: '500+ ч.' },
    { label: 'Сломанных копий в спорах', value: '1000+' },
    { label: 'Состав киноклуба', value: 'Непобедимый' },
  ],
};

export type AchievementPlaceholderMeta = {
  id: string;
  defaultTitle: string;
  badge: string;
  rarity: string;
  rarityColor: string;
  flavorText: string;
  factPrefix: string;
};

export const achievementPlaceholdersMeta: Record<string, AchievementPlaceholderMeta> = {
  unanimous_top: {
    id: 'unanimous_top',
    defaultTitle: 'Рождественское перемирие',
    badge: '🕊️',
    rarity: 'Легендарное (0.8%)',
    rarityColor: 'text-amber-400 border-amber-500/40 bg-amber-500/10',
    flavorText: 'Редчайший момент в истории, когда никто не захотел задушить соседа по дискорду.',
    factPrefix: 'Микро-факт:',
  },
  most_controversial: {
    id: 'most_controversial',
    defaultTitle: 'Яблоко раздора',
    badge: '⚡',
    rarity: 'Эпическое (2.4%)',
    rarityColor: 'text-rose-400 border-rose-500/40 bg-rose-500/10',
    flavorText: 'Одни увидели гениальную метафору, другие — два часа потраченного впустую времени.',
    factPrefix: 'Полярность мнений:',
  },
  frequent_pair: {
    id: 'frequent_pair',
    defaultTitle: 'Неразлучники',
    badge: '👥',
    rarity: 'Редкое (5.1%)',
    rarityColor: 'text-indigo-400 border-indigo-500/40 bg-indigo-500/10',
    flavorText: 'И в горе, и в радости, и на пятичасовом артхаусе на языке оригинала.',
    factPrefix: 'Кино-дуэт:',
  },
  top_genre: {
    id: 'top_genre',
    defaultTitle: 'Жанровый триумф',
    badge: '🎭',
    rarity: 'Особое (12.5%)',
    rarityColor: 'text-purple-400 border-purple-500/40 bg-purple-500/10',
    flavorText: 'Жанр, который мы включаем, когда «ну давайте просто что-нибудь нормальное глянем».',
    factPrefix: 'Доминирование:',
  },
  top_moviegoer: {
    id: 'top_moviegoer',
    defaultTitle: 'Главный киноман',
    badge: '🍿',
    rarity: 'Золотое (1.2%)',
    rarityColor: 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10',
    flavorText: 'Этот человек видел всё. Буквально всё. Даже то, что следовало бы развидеть.',
    factPrefix: 'Посещаемость:',
  },
  strictest_critic: {
    id: 'strictest_critic',
    defaultTitle: 'Гроза кинематографа',
    badge: '🧐',
    rarity: 'Ультраредкое (0.5%)',
    rarityColor: 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10',
    flavorText: '«Шедевр? Ну максимум 5 баллов, и то за титры». Пощады не ждите.',
    factPrefix: 'Строгость:',
  },
};
