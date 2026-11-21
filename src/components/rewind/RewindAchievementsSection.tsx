import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import rawFactsData from '../../data/facts.json';

export type ImageFitMode = 'cover' | 'contain' | 'contain-blur' | 'contain-padding';

export interface FactItem {
  id?: string;
  заголовок?: string;
  title?: string;
  подпись?: string;
  subtitle?: string;
  flavorText?: string;
  описание?: string;
  description?: string;
  картинка?: string;
  image?: string;
  badge?: string;
  формат_картинки?: string;
  режим_картинки?: string;
  формат?: string;
  imageFit?: string;
  fit?: string;
}

interface RewindAchievementsSectionProps {
  achievements?: unknown;
  year: string | 'all';
}

function isImageUrl(val?: string): boolean {
  if (!val) return false;
  const trimmed = val.trim();
  if (
    trimmed.startsWith('http://') ||
    trimmed.startsWith('https://') ||
    trimmed.startsWith('/') ||
    trimmed.startsWith('./') ||
    trimmed.startsWith('../') ||
    trimmed.startsWith('data:image/') ||
    trimmed.startsWith('blob:')
  ) {
    return true;
  }
  return /\.(png|jpe?g|webp|gif|svg|avif)($|\?)/i.test(trimmed);
}

function getImageFitMode(item: FactItem): ImageFitMode {
  const mode = (
    item.формат_картинки ||
    item.режим_картинки ||
    item.формат ||
    item.imageFit ||
    item.fit ||
    'cover'
  )
    .toLowerCase()
    .trim();

  if (mode === 'contain-blur' || mode === 'blur') return 'contain-blur';
  if (mode === 'contain-padding' || mode === 'padding' || mode === 'inset') return 'contain-padding';
  if (mode === 'contain') return 'contain';
  return 'cover';
}

export const RewindAchievementsSection: React.FC<RewindAchievementsSectionProps> = ({
  year,
}) => {
  const yearText = year === 'all' ? 'За всё время' : `${year} год`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Directly load facts partitioned by year from facts.json
  const factsList: FactItem[] = useMemo(() => {
    const data = rawFactsData as unknown;
    if (!data) return [];

    if (Array.isArray(data)) {
      return data as FactItem[];
    }

    if (typeof data === 'object' && data !== null) {
      const dict = data as Record<string, FactItem[]>;

      if (year === 'all') {
        const allList =
          dict['общий'] || dict['all'] || dict['все'] || dict['всё'] || dict['general'];
        if (Array.isArray(allList) && allList.length > 0) return allList;
      } else {
        if (dict[year] && Array.isArray(dict[year]) && dict[year].length > 0) {
          return dict[year];
        }
        const fallback = dict['общий'] || dict['all'] || dict['general'];
        if (Array.isArray(fallback) && fallback.length > 0) return fallback;
      }

      for (const key of Object.keys(dict)) {
        if (!key.startsWith('_') && Array.isArray(dict[key]) && dict[key].length > 0) {
          return dict[key];
        }
      }
    }

    return [];
  }, [year]);

  const displayItems = useMemo(() => {
    return factsList.map((item, idx) => ({
      id: item.id || `fact-${year}-${idx}`,
      title: item.заголовок || item.title || 'Факт',
      subtitle: item.подпись || item.subtitle || item.flavorText || '',
      description: item.описание || item.description || '',
      image: item.картинка || item.image || item.badge || '✨',
      imageFit: getImageFitMode(item),
    }));
  }, [factsList, year]);

  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    container.scrollTo({ left: 0, behavior: 'auto' });
    updateScrollButtons();

    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    window.addEventListener('resize', updateScrollButtons);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      window.removeEventListener('resize', updateScrollButtons);
    };
  }, [updateScrollButtons, displayItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const card = container.querySelector<HTMLElement>('.fact-card');
    const scrollDelta = card ? card.offsetWidth + 20 : container.clientWidth * 0.85;

    container.scrollBy({
      left: direction === 'left' ? -scrollDelta : scrollDelta,
      behavior: 'smooth',
    });
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.currentTarget;
    target.style.display = 'none';
    if (target.parentElement) {
      const fallback = document.createElement('span');
      fallback.className = 'text-6xl select-none';
      fallback.textContent = '🎬';
      target.parentElement.appendChild(fallback);
    }
  };

  return (
    <section className="rounded-2xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#131620] p-5 sm:p-7 md:p-8 shadow-sm transition-colors overflow-hidden">
      {/* Compact Header: Title on Left, Year Indicator on Right */}
      <div className="flex items-center justify-between pb-4 sm:pb-5 border-b border-slate-100 dark:border-white/5">
        <h2 className="text-xl sm:text-2xl md:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Факты
        </h2>

        {/* Year Indicator */}
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-500 dark:text-amber-400 text-xs sm:text-sm font-semibold tracking-wide">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
          <span>{yearText}</span>
        </div>
      </div>

      {/* Slider Area with Left & Right Arrows */}
      <div className="pt-5 sm:pt-6 flex items-center gap-2 sm:gap-4 lg:gap-5 relative">
        {/* Left Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('left')}
          disabled={!canScrollLeft}
          className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-slate-100 dark:bg-[#181b28] hover:bg-amber-500 dark:hover:bg-amber-500 text-slate-700 dark:text-white hover:text-slate-950 dark:hover:text-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:hover:scale-100 z-10 cursor-pointer"
          aria-label="Назад"
          title="Предыдущие факты"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="15 18 9 12 15 6" />
          </svg>
        </button>

        {/* Horizontal Scrollable Cards Container (No scrollbar visible) */}
        <div
          ref={scrollContainerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="no-scrollbar flex-1 flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 items-stretch"
        >
          {displayItems.map((item) => {
            const hasImage = isImageUrl(item.image);

            return (
              <div
                key={item.id}
                className="fact-card snap-start shrink-0 w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3rem)/3)] h-[540px] sm:h-[580px] lg:h-[620px] rounded-2xl bg-slate-50 dark:bg-[#181b28] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-2xl transition-all flex flex-col overflow-hidden group select-none"
              >
                {/* Top Half: Картинка с поддержкой cover / contain / contain-blur / contain-padding */}
                <div className="w-full h-[280px] sm:h-[310px] lg:h-[340px] relative overflow-hidden bg-slate-900 dark:bg-[#0c0e15] border-b border-slate-200 dark:border-white/10 shrink-0 flex items-center justify-center">
                  {hasImage ? (
                    item.imageFit === 'contain-blur' ? (
                      <>
                        {/* Soft Ambient Blurred Backdrop */}
                        <img
                          src={item.image.trim()}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none"
                          loading="lazy"
                        />
                        {/* Crisp Main Image 100% Contained */}
                        <img
                          src={item.image.trim()}
                          alt={item.title}
                          className="relative z-10 w-full h-full object-contain p-2 group-hover:scale-105 transition-transform duration-500"
                          loading="lazy"
                          referrerPolicy="no-referrer"
                          onError={handleImageError}
                        />
                      </>
                    ) : item.imageFit === 'contain-padding' ? (
                      <img
                        src={item.image.trim()}
                        alt={item.title}
                        className="w-full h-full object-contain p-4 drop-shadow-2xl group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                    ) : item.imageFit === 'contain' ? (
                      <img
                        src={item.image.trim()}
                        alt={item.title}
                        className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                    ) : (
                      /* Default: cover */
                      <img
                        src={item.image.trim()}
                        alt={item.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={handleImageError}
                      />
                    )
                  ) : (
                    <span className="text-6xl select-none">{item.image}</span>
                  )}
                </div>

                {/* Bottom Half: Заголовок, Описание, Подпись */}
                <div className="p-5 sm:p-6 lg:p-7 flex flex-col flex-1 justify-between bg-white dark:bg-[#181b28]">
                  <div>
                    {/* Заголовок (Title - Centered) */}
                    <h3 className="text-base sm:text-lg lg:text-xl font-black text-slate-900 dark:text-white tracking-tight text-center group-hover:text-amber-500 dark:group-hover:text-amber-400 transition-colors mb-2.5">
                      {item.title}
                    </h3>

                    {/* Описание (Description - Left-aligned) */}
                    {item.description && (
                      <p className="text-xs sm:text-sm lg:text-[15px] text-slate-600 dark:text-zinc-300 leading-relaxed text-left">
                        {item.description}
                      </p>
                    )}
                  </div>

                  {/* Подпись (Subtitle / Quote - Centered at bottom) */}
                  {item.subtitle && (
                    <p className="text-xs sm:text-sm italic text-slate-500 dark:text-zinc-400 text-center pt-3 mt-3 border-t border-slate-100 dark:border-white/5 leading-relaxed">
                      «{item.subtitle}»
                    </p>
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Arrow Button */}
        <button
          type="button"
          onClick={() => handleScroll('right')}
          disabled={!canScrollRight}
          className="shrink-0 w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-full bg-slate-100 dark:bg-[#181b28] hover:bg-amber-500 dark:hover:bg-amber-500 text-slate-700 dark:text-white hover:text-slate-950 dark:hover:text-slate-950 border border-slate-200 dark:border-white/10 flex items-center justify-center transition-all shadow-md hover:scale-105 active:scale-95 disabled:opacity-20 disabled:pointer-events-none disabled:hover:scale-100 z-10 cursor-pointer"
          aria-label="Вперед"
          title="Следующие факты"
        >
          <svg
            className="w-5 h-5 sm:w-6 sm:h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </section>
  );
};

export default RewindAchievementsSection;
