import Logo from '../UI/Logo';
import BackgroundPosters from '../BackgroundPosters';
import type { PageMode } from '../../hooks/useAppNavigation';

const SLIDER_PAGES = [1, 2, 3, 4] as const;

interface LandingFeatureCardProps {
  icon: string;
  category: string;
  title: string;
  description: string;
  badgeText: string;
  color: 'amber' | 'indigo' | 'emerald';
  onClick: () => void;
}

const colorStyles = {
  amber: {
    border: 'hover:border-amber-500/40',
    shadow: 'hover:shadow-amber-500/10',
    iconBox: 'bg-amber-500/15 border-amber-500/30',
    category: 'text-amber-600 dark:text-amber-400',
    badge: 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/30 group-hover:bg-amber-500 group-hover:text-slate-950',
  },
  indigo: {
    border: 'hover:border-indigo-500/50',
    shadow: 'hover:shadow-indigo-500/10',
    iconBox: 'bg-indigo-500/15 border-indigo-500/30',
    category: 'text-indigo-600 dark:text-indigo-400',
    badge: 'bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/30 group-hover:bg-indigo-500 group-hover:text-white',
  },
  emerald: {
    border: 'hover:border-emerald-500/40',
    shadow: 'hover:shadow-emerald-500/10',
    iconBox: 'bg-emerald-500/15 border-emerald-500/30',
    category: 'text-emerald-600 dark:text-emerald-400',
    badge: 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/30 group-hover:bg-emerald-500 group-hover:text-white',
  },
};

const LandingFeatureCard = ({
  icon,
  category,
  title,
  description,
  badgeText,
  color,
  onClick,
}: LandingFeatureCardProps) => {
  const styles = colorStyles[color];

  return (
    <div
      onClick={onClick}
      className={`flex-1 min-h-[195px] sm:min-h-[205px] flex flex-col justify-between p-5 sm:p-6 rounded-3xl bg-white/95 dark:bg-[#12141f]/90 border border-slate-200/90 dark:border-white/10 ${styles.border} shadow-xl backdrop-blur-xl transition-all duration-200 hover:scale-[1.02] hover:shadow-2xl ${styles.shadow} cursor-pointer group text-left`}
    >
      <div>
        <div className="flex items-center gap-3.5 mb-3">
          <div className={`w-12 h-12 rounded-2xl ${styles.iconBox} border flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform shrink-0`}>
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <span className={`text-[10px] font-bold uppercase tracking-wider ${styles.category}`}>
              {category}
            </span>
            <h3 className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight truncate">
              {title}
            </h3>
          </div>
        </div>
        <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
          {description}
        </p>
      </div>

      <div className="flex justify-end mt-4">
        <span className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${styles.badge} transition-all shadow-sm`}>
          {badgeText}
        </span>
      </div>
    </div>
  );
};

interface WelcomeLandingProps {
  login: () => void;
  authError?: string;
  isAuthorized: boolean;
  onNavigateToPage: (page: PageMode) => void;
}

export const WelcomeLanding = ({
  login,
  authError,
  isAuthorized,
  onNavigateToPage,
}: WelcomeLandingProps) => {
  return (
    <div className="relative flex-1 w-full min-h-[calc(100vh-4.5rem)] flex flex-col items-center justify-center px-4 py-8 lg:py-12 overflow-hidden bg-[#090a0f]">
      {/* Background Posters Mosaic */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden flex items-center justify-center opacity-40 dark:opacity-20 transition-opacity">
        <div className="flex w-[160%] -rotate-6 flex-col items-center justify-center">
          <BackgroundPosters key={SLIDER_PAGES[0]} page={SLIDER_PAGES[0]} direction={false} />
          <BackgroundPosters key={SLIDER_PAGES[1]} page={SLIDER_PAGES[1]} direction />
          <BackgroundPosters key={SLIDER_PAGES[2]} page={SLIDER_PAGES[2]} direction={false} />
          <BackgroundPosters key={SLIDER_PAGES[3]} page={SLIDER_PAGES[3]} direction />
        </div>
      </div>

      {/* Light Theme Background Darkening Overlay & Vignettes */}
      <div className="pointer-events-none absolute inset-0 bg-slate-900/[0.14] dark:bg-transparent transition-colors" />

      <div
        className="pointer-events-none absolute inset-0 transition-all duration-300 dark:hidden"
        style={{
          background:
            'radial-gradient(circle at center, rgba(15, 23, 42, 0.05) 0%, rgba(15, 23, 42, 0.20) 55%, rgba(15, 23, 42, 0.45) 100%)',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 transition-all duration-300 hidden dark:block"
        style={{
          background:
            'radial-gradient(circle at center, transparent 20%, rgba(9, 10, 15, 0.75) 60%, #090a0f 100%)',
        }}
      />

      {/* 3-Column Layout: Left 2 Cards | Center Login Card | Right 2 Cards */}
      <div className="relative z-10 w-full max-w-7xl 2xl:max-w-[1600px] min-[1920px]:max-w-[1800px] min-[2560px]:max-w-[2200px] mx-auto px-2 sm:px-6 py-4 flex flex-col lg:flex-row items-center lg:items-stretch justify-center gap-5 xl:gap-7">
        {/* Left Column: 2 Cards */}
        <div className="w-full max-w-md lg:max-w-none lg:w-80 xl:w-88 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 sm:gap-5 order-2 lg:order-1">
          <LandingFeatureCard
            icon="🍿"
            category="Коллекция"
            title="Архив просмотров"
            description="Каталог всех сеансов киноклуба с фильтрами отображения и удобной навигацией по архиву."
            badgeText="Каталог →"
            color="amber"
            onClick={login}
          />
          <LandingFeatureCard
            icon="📚"
            category="Литература"
            title="Книжный клуб"
            description="Уютная интерактивная комната с книжной полкой, каталогом и оценками клуба."
            badgeText="Полка книг →"
            color="emerald"
            onClick={() => onNavigateToPage('book-club')}
          />
        </div>

        {/* Center: Main Login Modal */}
        <div className="w-full max-w-md xl:max-w-lg rounded-3xl overflow-hidden bg-white/95 dark:bg-[#12141f]/95 shadow-2xl backdrop-blur-xl flex flex-col transition-colors order-1 lg:order-2 shrink-0">
          {/* Upper Half: Always Dark */}
          <div className="relative bg-[#090a0f] px-6 py-8 sm:py-10 flex flex-col items-center justify-center overflow-hidden">
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
              <div className="w-56 h-32 bg-amber-500/20 rounded-full blur-3xl" />
            </div>
            <Logo className="relative z-10 h-28 sm:h-36 w-auto shrink-0 filter drop-shadow-[0_0_35px_rgba(245,158,11,0.45)] hover:scale-105 transition-transform duration-300" />
          </div>

          {/* Lower Half: Club Title, Description, and Google Login Button */}
          <div className="flex-1 p-6 sm:p-8 flex flex-col items-center justify-center text-center gap-5">
            <div className="flex flex-col gap-2">
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
                Мелкомемье
              </h1>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-zinc-300 max-w-sm leading-relaxed">
                Сообщество друзей, с отборной солянкой по интересам — от просмотра кино и жарких споров, до соревнований и горечи поражения.
              </p>
            </div>

            {authError && (
              <div role="alert" className="w-full rounded-xl bg-rose-500/15 dark:bg-rose-500/20 p-3 text-xs text-rose-700 dark:text-rose-300 border border-rose-500/30">
                {authError}
              </div>
            )}

            <button
              onClick={login}
              className="w-full sm:w-auto flex items-center justify-center gap-3 rounded-2xl bg-gradient-to-r from-amber-500 to-amber-400 hover:from-amber-400 hover:to-amber-300 text-slate-950 font-extrabold px-8 py-3.5 sm:py-4 text-sm sm:text-base shadow-xl shadow-amber-500/25 transition-all hover:scale-105 cursor-pointer"
            >
              <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
              <span>Войти с помощью Google</span>
            </button>
          </div>
        </div>

        {/* Right Column: 2 Feature Cards */}
        <div className="w-full max-w-md lg:max-w-none lg:w-80 xl:w-88 flex flex-col sm:flex-row lg:flex-col justify-between gap-4 sm:gap-5 order-3 lg:order-3">
          <LandingFeatureCard
            icon="🎲"
            category="Интерактив"
            title="Кинорулетка"
            description="Колесо фортуны — доступно даже без входа, но тогда не будет доступен выбор ранее просмотренных фильмов киноклубом."
            badgeText="Крутить →"
            color="indigo"
            onClick={() => onNavigateToPage('roulette')}
          />
          <LandingFeatureCard
            icon="🏆"
            category="Соревнования"
            title="Турниры клуба"
            description="Результаты турнира по Тетрису, интерактивная сетка Double Elimination и статистика участников."
            badgeText="Сетка →"
            color="amber"
            onClick={() => {
              if (isAuthorized) {
                onNavigateToPage('tournaments');
              } else {
                login();
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default WelcomeLanding;
