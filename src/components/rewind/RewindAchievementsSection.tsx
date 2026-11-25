import React, { useMemo, useRef, useState, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import rawFactsData from '../../data/facts.json';
import { useBodyScrollLock } from '../../hooks/useBodyScrollLock';

export type ImageFitMode = 'cover' | 'contain' | 'contain-blur' | 'contain-padding';

export interface FactMediaObject {
  картинка?: string;
  image?: string;
  src?: string;
  url?: string;
  формат_картинки?: string;
  режим_картинки?: string;
  формат?: string;
  imageFit?: string;
  fit?: string;
}

export type FactMediaInput = string | FactMediaObject;

export interface FactItem {
  id?: string;
  заголовок?: string;
  title?: string;
  подпись?: string;
  subtitle?: string;
  flavorText?: string;
  описание?: string;
  description?: string;
  картинка?: string | FactMediaInput[];
  картинки?: FactMediaInput[];
  image?: string | FactMediaInput[];
  images?: FactMediaInput[];
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

interface FactSlide {
  src: string;
  isImage: boolean;
  imageFit: ImageFitMode;
}

interface DisplayFactItem {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  slides: FactSlide[];
}

type FitSource = Pick<
  FactItem,
  'формат_картинки' | 'режим_картинки' | 'формат' | 'imageFit' | 'fit'
>;

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

function normalizeImageSrc(raw: string): string {
  const trimmed = raw.trim();
  const publicMatch = trimmed.match(/^(?:(?:\.\.\/)+|\.\/|\/)?public\/(.+)$/);
  if (publicMatch) {
    return `${import.meta.env.BASE_URL}${publicMatch[1]}`;
  }
  if (trimmed.startsWith('/')) {
    return `${import.meta.env.BASE_URL}${trimmed.slice(1)}`;
  }
  return trimmed;
}

function getImageFitMode(source: FitSource, fallback: ImageFitMode = 'cover'): ImageFitMode {
  const rawMode =
    source.формат_картинки ||
    source.режим_картинки ||
    source.формат ||
    source.imageFit ||
    source.fit;

  if (!rawMode) return fallback;

  const mode = rawMode.toLowerCase().trim();
  if (mode === 'contain-blur' || mode === 'blur') return 'contain-blur';
  if (mode === 'contain-padding' || mode === 'padding' || mode === 'inset') return 'contain-padding';
  if (mode === 'contain') return 'contain';
  if (mode === 'cover') return 'cover';
  return fallback;
}

function parseSlideEntry(entry: FactMediaInput, cardDefaultFit: ImageFitMode): FactSlide | null {
  if (typeof entry === 'string') {
    const trimmed = entry.trim();
    if (!trimmed) return null;
    const isImage = isImageUrl(trimmed);
    return {
      src: isImage ? normalizeImageSrc(trimmed) : trimmed,
      isImage,
      imageFit: cardDefaultFit,
    };
  }

  if (entry && typeof entry === 'object') {
    const rawVal = entry.картинка || entry.image || entry.src || entry.url;
    if (!rawVal || !rawVal.trim()) return null;
    const trimmed = rawVal.trim();
    const isImage = isImageUrl(trimmed);
    return {
      src: isImage ? normalizeImageSrc(trimmed) : trimmed,
      isImage,
      imageFit: getImageFitMode(entry, cardDefaultFit),
    };
  }

  return null;
}

function buildFactSlides(item: FactItem): FactSlide[] {
  const cardDefaultFit = getImageFitMode(item);
  const rawArray =
    item.картинки ??
    item.images ??
    (Array.isArray(item.картинка) ? item.картинка : undefined) ??
    (Array.isArray(item.image) ? item.image : undefined);

  if (Array.isArray(rawArray)) {
    const parsed = rawArray
      .map((entry) => parseSlideEntry(entry, cardDefaultFit))
      .filter((slide): slide is FactSlide => slide !== null);

    if (parsed.length > 0) return parsed;
  }

  const singleRaw =
    (typeof item.картинка === 'string' ? item.картинка : undefined) ||
    (typeof item.image === 'string' ? item.image : undefined) ||
    item.badge ||
    '✨';

  return [
    parseSlideEntry(singleRaw, cardDefaultFit) ?? {
      src: '✨',
      isImage: false,
      imageFit: cardDefaultFit,
    },
  ];
}

const IMAGE_FIT_CLASSES: Record<ImageFitMode, string> = {
  cover: 'w-full h-full object-cover',
  contain: 'w-full h-full object-contain',
  'contain-blur': 'relative z-10 w-full h-full object-contain p-2',
  'contain-padding': 'w-full h-full object-contain p-4 drop-shadow-2xl',
};

const INNER_ARROW_BTN_CLASS =
  'w-8 h-8 rounded-full bg-slate-900/90 dark:bg-[#1a1f2e] hover:bg-amber-500 dark:hover:bg-amber-500 text-white hover:text-slate-950 dark:hover:text-slate-950 border border-white/30 hover:border-amber-400 shadow-sm flex items-center justify-center transition-all hover:scale-110 active:scale-95 cursor-pointer';

const ChevronIcon: React.FC<{ direction: 'left' | 'right'; className?: string }> = ({
  direction,
  className = 'w-4 h-4',
}) => (
  <svg
    className={className}
    fill="none"
    stroke="currentColor"
    viewBox="0 0 24 24"
    strokeWidth={2.5}
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points={direction === 'left' ? '15 18 9 12 15 6' : '9 18 15 12 9 6'} />
  </svg>
);

interface ZoomedImageState {
  src: string;
  alt: string;
  naturalWidth?: number;
  naturalHeight?: number;
}

interface FactCardProps {
  item: DisplayFactItem;
  failedImageIds: Record<string, boolean>;
  onImageError: (failureKey: string) => void;
  onZoomImage: (src: string, alt: string) => void;
}

const FactCard: React.FC<FactCardProps> = ({
  item,
  failedImageIds,
  onImageError,
  onZoomImage,
}) => {
  const [activeSlideIndex, setActiveSlideIndex] = useState(0);
  const totalSlides = item.slides.length;
  const safeSlideIndex = Math.min(activeSlideIndex, Math.max(0, totalSlides - 1));
  const hasMultipleSlides = totalSlides > 1;

  const handlePrevSlide = () => {
    setActiveSlideIndex((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const handleNextSlide = () => {
    setActiveSlideIndex((prev) => (prev + 1) % totalSlides);
  };

  return (
    <div className="fact-card snap-start shrink-0 w-full sm:w-[calc((100%-1.25rem)/2)] lg:w-[calc((100%-3rem)/3)] h-[540px] sm:h-[580px] lg:h-[620px] rounded-2xl bg-slate-50 dark:bg-[#181b28] border border-slate-200 dark:border-white/10 hover:border-amber-500/50 dark:hover:border-amber-500/50 hover:shadow-2xl transition-all flex flex-col overflow-hidden group select-none">
      {/* Section 1: Фото (единая высота для всех карточек) + панель стрелок и индикаторов */}
      <div className="w-full flex flex-col bg-slate-900 dark:bg-[#0c0e15] border-b-2 border-slate-300 dark:border-white/20 shrink-0">
        {/* Viewport картинок (всегда на одном уровне по высоте на всех карточках) */}
        <div className="w-full h-[280px] sm:h-[310px] lg:h-[340px] relative overflow-hidden shrink-0">
          <div
            className="flex w-full h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${safeSlideIndex * 100}%)` }}
          >
            {item.slides.map((slide, slideIdx) => {
              const failureKey = `${item.id}-slide-${slideIdx}`;
              const canZoom = slide.isImage && !failedImageIds[failureKey];

              return (
                <div
                  key={failureKey}
                  className="w-full h-full shrink-0 relative flex items-center justify-center"
                >
                  {canZoom ? (
                    <button
                      type="button"
                      tabIndex={slideIdx === safeSlideIndex ? 0 : -1}
                      onClick={() => onZoomImage(slide.src, item.title)}
                      aria-label={`Увеличить картинку: ${item.title}`}
                      className="w-full h-full relative flex items-center justify-center cursor-zoom-in group/image focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-amber-500"
                    >
                      {slide.imageFit === 'contain-blur' && (
                        <img
                          src={slide.src}
                          alt=""
                          aria-hidden="true"
                          className="absolute inset-0 w-full h-full object-cover blur-2xl opacity-40 scale-125 pointer-events-none select-none"
                          loading="lazy"
                        />
                      )}
                      <img
                        src={slide.src}
                        alt={item.title}
                        className={`${IMAGE_FIT_CLASSES[slide.imageFit]} group-hover/image:scale-105 transition-transform duration-500`}
                        loading="lazy"
                        referrerPolicy="no-referrer"
                        onError={() => onImageError(failureKey)}
                      />
                      <span
                        aria-hidden="true"
                        className="pointer-events-none absolute top-3 right-3 z-20 w-8 h-8 rounded-full bg-slate-950/75 backdrop-blur-md border border-white/30 text-white flex items-center justify-center opacity-0 group-hover/image:opacity-100 transition-opacity duration-200 shadow-lg"
                      >
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                          strokeWidth={2}
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <circle cx="11" cy="11" r="7" />
                          <line x1="21" y1="21" x2="16.65" y2="16.65" />
                          <line x1="11" y1="8" x2="11" y2="14" />
                          <line x1="8" y1="11" x2="14" y2="11" />
                        </svg>
                      </span>
                    </button>
                  ) : (
                    <span className="text-6xl select-none">{slide.isImage ? '🎬' : slide.src}</span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Полоса стрелок и индикатора страниц (забирает место у текстовой секции, не у фото) */}
        {hasMultipleSlides && (
          <div className="shrink-0 px-3.5 sm:px-4 py-1.5 sm:py-2 flex items-center justify-between gap-2 bg-slate-800/95 dark:bg-[#131620] border-t border-white/10">
            <button
              type="button"
              onClick={handlePrevSlide}
              aria-label="Предыдущая картинка"
              title="Предыдущая картинка"
              className={INNER_ARROW_BTN_CLASS}
            >
              <ChevronIcon direction="left" />
            </button>

            <div
              role="tablist"
              aria-label="Выбор картинки"
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-slate-950/60 border border-white/15"
            >
              {item.slides.map((_, slideIdx) => {
                const isActive = slideIdx === safeSlideIndex;
                return (
                  <button
                    key={`${item.id}-dot-${slideIdx}`}
                    type="button"
                    role="tab"
                    aria-selected={isActive}
                    aria-label={`Картинка ${slideIdx + 1} из ${totalSlides}`}
                    onClick={() => setActiveSlideIndex(slideIdx)}
                    className={`rounded-full transition-all cursor-pointer ${
                      isActive
                        ? 'w-2.5 h-2.5 bg-white shadow-[0_0_6px_rgba(255,255,255,0.85)] scale-110'
                        : 'w-2 h-2 bg-white/35 hover:bg-white/70'
                    }`}
                  />
                );
              })}
            </div>

            <button
              type="button"
              onClick={handleNextSlide}
              aria-label="Следующая картинка"
              title="Следующая картинка"
              className={INNER_ARROW_BTN_CLASS}
            >
              <ChevronIcon direction="right" />
            </button>
          </div>
        )}
      </div>

      {/* Section 2: Текстовая область (Заголовок, Описание, Подпись) */}
      <div
        className={`${
          hasMultipleSlides ? 'px-5 sm:px-6 lg:px-7 py-4 sm:py-5' : 'p-5 sm:p-6 lg:p-7'
        } flex flex-col flex-1 min-h-0 overflow-y-auto dark-sleek-scrollbar justify-between bg-white dark:bg-[#181b28]`}
      >
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
};

export const RewindAchievementsSection: React.FC<RewindAchievementsSectionProps> = ({
  year,
}) => {
  const yearText = year === 'all' ? 'За всё время' : `${year} год`;
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const pendingScrollRef = useRef<{ targetIndex: number; targetLeft: number } | null>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [failedImageIds, setFailedImageIds] = useState<Record<string, boolean>>({});
  const [zoomedImage, setZoomedImage] = useState<ZoomedImageState | null>(null);

  useBodyScrollLock(Boolean(zoomedImage));

  useEffect(() => {
    if (!zoomedImage) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setZoomedImage(null);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [zoomedImage]);

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

  const displayItems: DisplayFactItem[] = useMemo(() => {
    return factsList.map((item, idx) => ({
      id: item.id || `fact-${year}-${idx}`,
      title: item.заголовок || item.title || 'Факт',
      subtitle: item.подпись || item.subtitle || item.flavorText || '',
      description: item.описание || item.description || '',
      slides: buildFactSlides(item),
    }));
  }, [factsList, year]);

  const clearPendingScroll = useCallback(() => {
    pendingScrollRef.current = null;
  }, []);

  const updateScrollButtons = useCallback(() => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;

    if (pendingScrollRef.current && Math.abs(scrollLeft - pendingScrollRef.current.targetLeft) <= 4) {
      pendingScrollRef.current = null;
    }

    setCanScrollLeft(scrollLeft > 8);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 8);
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    clearPendingScroll();
    container.scrollTo({ left: 0, behavior: 'auto' });
    updateScrollButtons();

    const handleResize = () => {
      clearPendingScroll();
      updateScrollButtons();
    };

    container.addEventListener('scroll', updateScrollButtons, { passive: true });
    container.addEventListener('scrollend', clearPendingScroll, { passive: true });
    container.addEventListener('wheel', clearPendingScroll, { passive: true });
    container.addEventListener('touchstart', clearPendingScroll, { passive: true });
    container.addEventListener('pointerdown', clearPendingScroll, { passive: true });
    window.addEventListener('resize', handleResize);

    return () => {
      container.removeEventListener('scroll', updateScrollButtons);
      container.removeEventListener('scrollend', clearPendingScroll);
      container.removeEventListener('wheel', clearPendingScroll);
      container.removeEventListener('touchstart', clearPendingScroll);
      container.removeEventListener('pointerdown', clearPendingScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [clearPendingScroll, updateScrollButtons, displayItems]);

  const handleScroll = (direction: 'left' | 'right') => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cards = Array.from(container.querySelectorAll<HTMLElement>('.fact-card'));
    if (cards.length === 0) return;

    const baseLeft = cards[0].getBoundingClientRect().left;
    const cardOffsets = cards.map((card) => card.getBoundingClientRect().left - baseLeft);
    const slidesPerScroll = 1;

    const maxScrollLeft = Math.max(0, container.scrollWidth - container.clientWidth);
    let maxReachableIndex = 0;
    for (let i = 0; i < cardOffsets.length; i++) {
      if (cardOffsets[i] <= maxScrollLeft + 4) {
        maxReachableIndex = i;
      }
    }

    const pending = pendingScrollRef.current;
    let baseIndex = 0;
    if (pending && Math.abs(container.scrollLeft - pending.targetLeft) > 4) {
      baseIndex = Math.min(pending.targetIndex, maxReachableIndex);
    } else {
      pendingScrollRef.current = null;
      let closestDistance = Infinity;
      for (let i = 0; i <= maxReachableIndex; i++) {
        const distance = Math.abs(cardOffsets[i] - container.scrollLeft);
        if (distance < closestDistance) {
          closestDistance = distance;
          baseIndex = i;
        }
      }
    }

    const delta = direction === 'left' ? -slidesPerScroll : slidesPerScroll;
    const targetIndex = Math.max(0, Math.min(maxReachableIndex, baseIndex + delta));
    const targetLeft = Math.min(maxScrollLeft, Math.max(0, cardOffsets[targetIndex]));

    pendingScrollRef.current = { targetIndex, targetLeft };
    container.scrollTo({
      left: targetLeft,
      behavior: 'smooth',
    });
  };

  const handleImageError = useCallback((failureKey: string) => {
    setFailedImageIds((prev) => (prev[failureKey] ? prev : { ...prev, [failureKey]: true }));
  }, []);

  const handleZoomImage = useCallback((src: string, alt: string) => {
    setZoomedImage({ src, alt });
  }, []);

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
          <ChevronIcon direction="left" className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        {/* Horizontal Scrollable Cards Container (No scrollbar visible) */}
        <div
          ref={scrollContainerRef}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          className="no-scrollbar flex-1 flex gap-4 sm:gap-5 lg:gap-6 overflow-x-auto scroll-smooth snap-x snap-mandatory py-2 items-stretch"
        >
          {displayItems.map((item) => (
            <FactCard
              key={item.id}
              item={item}
              failedImageIds={failedImageIds}
              onImageError={handleImageError}
              onZoomImage={handleZoomImage}
            />
          ))}
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
          <ChevronIcon direction="right" className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      {zoomedImage &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={zoomedImage.alt}
            onClick={() => setZoomedImage(null)}
            className="fixed inset-0 z-[120] flex items-center justify-center p-4 sm:p-8 bg-black/85 backdrop-blur-sm animate-fade-in cursor-zoom-out"
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              aria-label="Закрыть увеличенную картинку"
              title="Закрыть (Esc)"
              className="fixed top-4 right-4 sm:top-6 sm:right-6 z-10 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-white/10 hover:bg-white/20 border border-white/15 text-white flex items-center justify-center transition-colors cursor-pointer backdrop-blur-md"
            >
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>

            <img
              src={zoomedImage.src}
              alt={zoomedImage.alt}
              referrerPolicy="no-referrer"
              onClick={(e) => e.stopPropagation()}
              onLoad={(e) => {
                const { naturalWidth, naturalHeight } = e.currentTarget;
                if (naturalWidth > 0 && naturalHeight > 0) {
                  setZoomedImage((prev) => {
                    if (
                      prev &&
                      prev.src === zoomedImage.src &&
                      (prev.naturalWidth !== naturalWidth || prev.naturalHeight !== naturalHeight)
                    ) {
                      return { ...prev, naturalWidth, naturalHeight };
                    }
                    return prev;
                  });
                }
              }}
              style={
                zoomedImage.naturalWidth && zoomedImage.naturalHeight
                  ? {
                      width: `min(${Math.max(zoomedImage.naturalWidth, 560)}px, 92vw, calc(88vh * ${
                        zoomedImage.naturalWidth / zoomedImage.naturalHeight
                      }))`,
                      height: 'auto',
                      aspectRatio: `${zoomedImage.naturalWidth} / ${zoomedImage.naturalHeight}`,
                    }
                  : undefined
              }
              className="max-w-[92vw] max-h-[88vh] w-auto h-auto object-contain rounded-xl shadow-2xl select-none cursor-default animate-modal-enter"
            />
          </div>,
          document.body,
        )}
    </section>
  );
};

export default RewindAchievementsSection;
