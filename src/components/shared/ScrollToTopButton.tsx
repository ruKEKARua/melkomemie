import { useEffect, useRef, useCallback } from 'react';

export const ScrollToTopButton = () => {
  const pageAnchorYRef = useRef(560);
  const maxScrollRef = useRef(1);
  const filmContainerRef = useRef<HTMLDivElement | null>(null);
  const filmPatternRef = useRef<SVGPatternElement | null>(null);
  const lastTopOffsetRef = useRef<number>(-1);
  const reelGRef = useRef<SVGGElement | null>(null);
  const buttonRef = useRef<HTMLButtonElement | null>(null);

  // References for continuous smooth film unspooling animation (no stepped jumps!)
  const filmRollClipRef = useRef<SVGCircleElement | null>(null);
  const outerWrapCircleRef = useRef<SVGCircleElement | null>(null);

  // Geometry configuration
  const REEL_SIZE = 72; // 72px wide x 72px high (scaled 1.5x from 48px)
  const BOTTOM_MARGIN = 36; // 36px from bottom
  const RIGHT_MARGIN = 24; // 24px from right
  const FILM_WIDTH = 28; // 28px wide
  // Center of reel:
  const REEL_CENTER_X = RIGHT_MARGIN + REEL_SIZE / 2; // 24 + 36 = 60px
  const REEL_CENTER_Y_FROM_BOTTOM = BOTTOM_MARGIN + REEL_SIZE / 2; // 36 + 36 = 72px
  const FILM_RIGHT = REEL_CENTER_X - FILM_WIDTH / 2; // 60 - 14 = 46px

  // Dynamically measure the sorting toolbar position on the page
  const updateAnchor = useCallback(() => {
    const sortAnchorEl = document.getElementById('catalog-sort-anchor');
    if (sortAnchorEl) {
      const rect = sortAnchorEl.getBoundingClientRect();
      const pageY = rect.top + window.scrollY;
      if (pageY > 0) {
        pageAnchorYRef.current = pageY;
      }
    }
    const winHeight = window.innerHeight;
    const docHeight = document.documentElement.scrollHeight;
    maxScrollRef.current = Math.max(docHeight - winHeight, 1);

    // Dynamic horizontal centering: ensure film strip center strictly matches button center
    if (buttonRef.current && filmContainerRef.current) {
      const btnRect = buttonRef.current.getBoundingClientRect();
      if (btnRect.width > 0) {
        const btnCenterX = btnRect.left + btnRect.width / 2;
        const filmLeft = Math.round(btnCenterX - FILM_WIDTH / 2);
        filmContainerRef.current.style.left = `${filmLeft}px`;
        filmContainerRef.current.style.right = 'auto';
      }
    }
  }, []);

  useEffect(() => {
    updateAnchor();

    // High performance 120+ FPS direct DOM scroll handler
    const onScroll = () => {
      const sy = window.scrollY;
      const wh = window.innerHeight;

      // When near the top, continuously ensure the anchor is locked to the sorting bar
      if (sy < 200) {
        updateAnchor();
      }

      // Distance from sorting toolbar anchor to reel center
      const anchorScreenY = pageAnchorYRef.current - sy;
      const reelCenterScreenY = wh - REEL_CENTER_Y_FROM_BOTTOM;
      const distFromAnchorToReel = reelCenterScreenY - anchorScreenY;

      // Visible strictly when user is scrolled down beyond threshold AND anchor is above reel
      const visible = sy > 25 && distFromAnchorToReel > 15;

      // Top offset calculation:
      // When sy >= pageAnchorY: anchor is above the viewport -> top is clamped to 0px.
      // When sy < pageAnchorY: anchor is visible in viewport -> top follows anchorScreenY.
      const topOffset = Math.max(0, Math.round(anchorScreenY));

      // 1. Fixed film container: bottom is hard-locked to reel center (44px) on GPU compositor,
      // zero frames of lag or desync when rapid scrolling!
      if (filmContainerRef.current) {
        if (lastTopOffsetRef.current !== topOffset) {
          lastTopOffsetRef.current = topOffset;
          filmContainerRef.current.style.top = `${topOffset}px`;
        }
        if (visible) {
          filmContainerRef.current.style.opacity = '1';
          filmContainerRef.current.style.transition = 'opacity 140ms ease-out';
        } else {
          // Disappear immediately without lingering delay when reaching top!
          filmContainerRef.current.style.opacity = '0';
          filmContainerRef.current.style.transition = 'opacity 50ms ease-in';
        }
      }

      // 2. Synchronize film pattern texture with page scroll (frames roll with page 1:1)
      if (filmPatternRef.current) {
        const patternOffsetY = ((pageAnchorYRef.current - sy) % 36 + 36) % 36;
        filmPatternRef.current.setAttribute('patternTransform', `translate(0, ${patternOffsetY})`);
      }

      // 3. Continuous reel rotation on GPU (never resets to 0 at any modulo or scroll threshold!)
      if (reelGRef.current) {
        const rot = sy * 0.75;
        reelGRef.current.style.transform = `rotate(${rot}deg)`;
      }

      // 4. CONTINUOUS SMOOTH UNWINDING OF FILM LAYERS
      const progress = Math.min(Math.max(sy / (maxScrollRef.current || 1), 0), 1);
      const coilRadius = 12.0 + (23.5 - 12.0) * Math.max(0, 1 - progress);

      if (filmRollClipRef.current) {
        filmRollClipRef.current.setAttribute('r', coilRadius.toFixed(2));
      }
      if (outerWrapCircleRef.current) {
        outerWrapCircleRef.current.setAttribute('r', coilRadius.toFixed(2));
        outerWrapCircleRef.current.style.opacity = coilRadius > 12.2 ? '0.9' : '0';
      }

      // 5. Direct button visibility & scale (crisp immediate fade at top)
      if (buttonRef.current) {
        if (visible) {
          buttonRef.current.style.opacity = '1';
          buttonRef.current.style.pointerEvents = 'auto';
          buttonRef.current.style.transform = 'translate3d(0, 0, 0) scale(1)';
        } else {
          buttonRef.current.style.opacity = '0';
          buttonRef.current.style.pointerEvents = 'none';
          buttonRef.current.style.transform = 'translate3d(0, 10px, 0) scale(0.9)';
        }
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => {
      updateAnchor();
      onScroll();
    });

    let ro: ResizeObserver | null = null;
    try {
      ro = new ResizeObserver(() => {
        updateAnchor();
        onScroll();
      });
      ro.observe(document.body);
    } catch {
      // fallback
    }

    const t1 = setTimeout(() => { updateAnchor(); onScroll(); }, 150);
    const t2 = setTimeout(() => { updateAnchor(); onScroll(); }, 500);
    const t3 = setTimeout(() => { updateAnchor(); onScroll(); }, 1500);

    onScroll();

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      if (ro) ro.disconnect();
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', updateAnchor);
    };
  }, [updateAnchor]);

  const handleScrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  };

  return (
    <>
      {/* 1. Киноплёнка (скрыта при ширине менее 1000px, видна при >=1000px) */}
      <div
        ref={filmContainerRef}
        className="scroll-to-top-film hidden min-[1000px]:block fixed pointer-events-none drop-shadow-md overflow-hidden select-none z-10"
        style={{
          position: 'fixed',
          right: `${FILM_RIGHT}px`,
          width: `${FILM_WIDTH}px`,
          bottom: `${REEL_CENTER_Y_FROM_BOTTOM - 4}px`,
          top: `${Math.max(0, pageAnchorYRef.current)}px`,
          opacity: 0,
          willChange: 'top, opacity',
          transform: 'translate3d(0, 0, 0)',
          transition: 'opacity 140ms ease-out',
        }}
      >
        <svg
          width={FILM_WIDTH}
          height="100%"
          className="w-full h-full block"
          style={{ overflow: 'hidden' }}
        >
          <defs>
            {/* 35mm Film Pattern: фиксированный размер кадра 28x36px без искажений */}
            <pattern
              ref={filmPatternRef}
              id="film35mmLivePattern"
              width={FILM_WIDTH}
              height="36"
              patternUnits="userSpaceOnUse"
            >
              {/* Dark semi-translucent acetate film base */}
              <rect width={FILM_WIDTH} height="36" fill="#0b0d13" />

              {/* Edge guide rails */}
              <line x1="0.5" y1="0" x2="0.5" y2="36" stroke="#252a38" strokeWidth="0.8" />
              <line x1="27.5" y1="0" x2="27.5" y2="36" stroke="#252a38" strokeWidth="0.8" />

              {/* Horizontal Frame Divider Bar (черная межкадровая линия) */}
              <rect x="0" y="34" width={FILM_WIDTH} height="2" fill="#040507" />
              <line x1="5" y1="35" x2="23" y2="35" stroke="#1d222e" strokeWidth="0.5" />

              {/* Central Picture Aperture Window (кинокадр 35мм) */}
              <rect
                x="5.5"
                y="2"
                width="17"
                height="30"
                rx="1.2"
                fill="#151722"
                stroke="#282d3d"
                strokeWidth="0.6"
              />
              {/* Inner cinema vignette tint */}
              <rect x="6.5" y="3" width="15" height="28" rx="0.8" fill="#1b1f2e" opacity="0.9" />

              {/* Authentic 4-perf Left Sprocket Holes */}
              <rect x="1.2" y="2" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="1.2" y="11" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="1.2" y="20" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="1.2" y="29" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />

              {/* Authentic 4-perf Right Sprocket Holes */}
              <rect x="23.6" y="2" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="23.6" y="11" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="23.6" y="20" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
              <rect x="23.6" y="29" width="3.2" height="4.8" rx="0.8" fill="#060709" stroke="#373e50" strokeWidth="0.5" />
            </pattern>
          </defs>

          {/* Сплошное полотно 35мм кинопленки на всю высоту контейнера */}
          <rect width={FILM_WIDTH} height="100%" fill="url(#film35mmLivePattern)" />
        </svg>
      </div>

      {/* 2. Круглая винтажная бобина (точная копия фото-референса) */}
      <button
        ref={buttonRef}
        onClick={handleScrollToTop}
        aria-label="Прокрутить страницу наверх"
        className="scroll-to-top-btn fixed z-20 group focus:outline-hidden active:scale-95 drop-shadow-2xl shrink-0 cursor-pointer pointer-events-none"
        style={{
          opacity: 0,
          transform: 'translate3d(0, 10px, 0) scale(0.9)',
          willChange: 'transform, opacity',
          transition: 'opacity 140ms ease-out, transform 140ms ease-out',
        }}
      >
        {/* Ambient golden glow behind reel */}
        <div className="absolute inset-0 rounded-full bg-amber-500/25 blur-md group-hover:bg-amber-500/40 transition-all duration-300" />

        <svg viewBox="0 0 64 64" className="w-full h-full relative z-10 overflow-visible">
          <defs>
            {/* Vintage Cast Aluminum / Magnesium Alloy Gradient (Точно как на фото) */}
            <linearGradient id="vintageCastAluminum" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#f1f3f6" />
              <stop offset="20%" stopColor="#d5d8dc" />
              <stop offset="45%" stopColor="#b8bdc5" />
              <stop offset="70%" stopColor="#8e949e" />
              <stop offset="90%" stopColor="#b0b5be" />
              <stop offset="100%" stopColor="#e2e5e9" />
            </linearGradient>

            {/* Rich Acetate Film Roll Radial Gradient */}
            <radialGradient id="woundAcetateRollGrad" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#131722" />
              <stop offset="40%" stopColor="#1d2331" />
              <stop offset="70%" stopColor="#293144" />
              <stop offset="90%" stopColor="#38425a" />
              <stop offset="100%" stopColor="#1e2433" />
            </radialGradient>

            {/* Smooth Dynamic Unspooling ClipPath (Радиус плавно уменьшается без рывков) */}
            <clipPath id="filmRollSmoothClip">
              <circle ref={filmRollClipRef} cx="32" cy="32" r="23.5" />
            </clipPath>
          </defs>

          {/* Dark Backplate behind the reel (прячет нижний край входящей ленты) */}
          <circle cx="32" cy="32" r="29" fill="#090a0f" stroke="#1e293b" strokeWidth="1" />
          <circle cx="32" cy="32" r="25.5" fill="#07080c" />

          {/* ROTATING REEL ASSEMBLY (Вращающаяся бобина в точности по фото) */}
          <g
            ref={reelGRef}
            style={{
              transformOrigin: '32px 32px',
              willChange: 'transform',
            }}
          >
            {/* 1. SMOOTH CONTINUOUSLY SHRINKING WOUND FILM ROLL (Плавно разматывающийся рулон с видимыми слоями) */}
            <g clipPath="url(#filmRollSmoothClip)">
              <circle cx="32" cy="32" r="24.5" fill="url(#woundAcetateRollGrad)" />
              {/* Множественные концентрические слои и витки кинопленки (светлые и золотистые блики) */}
              <circle cx="32" cy="32" r="13.2" fill="none" stroke="#64748b" strokeWidth="0.6" opacity="0.75" />
              <circle cx="32" cy="32" r="14.4" fill="none" stroke="#94a3b8" strokeWidth="0.7" opacity="0.8" />
              <circle cx="32" cy="32" r="15.6" fill="none" stroke="#f59e0b" strokeWidth="0.8" opacity="0.85" />
              <circle cx="32" cy="32" r="16.8" fill="none" stroke="#cbd5e1" strokeWidth="0.85" strokeDasharray="4 1.5" opacity="0.9" />
              <circle cx="32" cy="32" r="18.0" fill="none" stroke="#e2e8f0" strokeWidth="0.9" opacity="0.95" />
              <circle cx="32" cy="32" r="19.2" fill="none" stroke="#fbbf24" strokeWidth="0.85" opacity="0.9" />
              <circle cx="32" cy="32" r="20.4" fill="none" stroke="#cbd5e1" strokeWidth="0.85" strokeDasharray="6 2" opacity="0.95" />
              <circle cx="32" cy="32" r="21.6" fill="none" stroke="#ffffff" strokeWidth="0.95" opacity="1.0" />
              <circle cx="32" cy="32" r="22.7" fill="none" stroke="#fbbf24" strokeWidth="0.85" opacity="0.9" />
            </g>

            {/* Плавный внешний контур смотанного рулона (сжимается плавно с каждым пикселем скролла) */}
            <circle
              ref={outerWrapCircleRef}
              cx="32"
              cy="32"
              r="23.5"
              fill="none"
              stroke="#cbd5e1"
              strokeWidth="0.85"
              opacity="0.9"
            />

            {/* 2. 5 ПРЯМЫХ АЛЮМИНИЕВЫХ СПИЦ («ПАЛОЧКИ» СТРОГО ПОВЕРХ САМОЙ ЛЕНТЫ В БОБИНЕ) */}
            {[0, 1, 2, 3, 4].map((i) => (
              <g key={`spoke-${i}`} transform={`rotate(${i * 72} 32 32)`}>
                {/* Тень, отбрасываемая спицей на саму киноплёнку под ней */}
                <rect
                  x="29.4"
                  y="4.5"
                  width="5.2"
                  height="18"
                  fill="#000000"
                  opacity="0.55"
                  rx="0.5"
                />
                {/* Непрозрачное монолитное тело спицы из винтажного алюминия поверх ленты */}
                <rect
                  x="30.0"
                  y="4.5"
                  width="4.0"
                  height="18"
                  fill="url(#vintageCastAluminum)"
                  stroke="#5a6068"
                  strokeWidth="0.5"
                  rx="0.6"
                />
                {/* Теневая боковая фаска спицы */}
                <line x1="30.5" y1="5" x2="30.5" y2="22" stroke="#505660" strokeWidth="0.4" />
                {/* Световое ребро жесткости по центру спицы */}
                <line x1="32" y1="5" x2="32" y2="22" stroke="#ffffff" strokeWidth="0.85" opacity="0.85" />
                <line x1="33.5" y1="5" x2="33.5" y2="22" stroke="#ffffff" strokeWidth="0.4" opacity="0.6" />
              </g>
            ))}

            {/* 3. ВНЕШНИЙ КРУГЛЫЙ ОБОД (Как на фото: круглый плоский алюминиевый обод) */}
            <circle
              cx="32"
              cy="32"
              r="27.2"
              fill="none"
              stroke="url(#vintageCastAluminum)"
              strokeWidth="3.4"
            />
            <circle cx="32" cy="32" r="28.9" fill="none" stroke="#6e7580" strokeWidth="0.5" />
            <circle cx="32" cy="32" r="25.5" fill="none" stroke="#505660" strokeWidth="0.5" />

            {/* 4. ВНУТРЕННЯЯ АЛЮМИНИЕВАЯ СТУПИЦА (Широкий металлический круг по центру, как на фото) */}
            <circle
              cx="32"
              cy="32"
              r="11.8"
              fill="url(#vintageCastAluminum)"
              stroke="#6e7580"
              strokeWidth="0.6"
            />
            <circle cx="32" cy="32" r="11.2" fill="none" stroke="#ffffff" strokeWidth="0.4" opacity="0.7" />

            {/* 5. 5 КРУГЛЫХ СКВОЗНЫХ ОТВЕРСТИЙ В СТУПИЦЕ (Точно как на фото: сквозные штампованные отверстия между спицами) */}
            {[0, 1, 2, 3, 4].map((i) => (
              <circle
                key={`hub-hole-${i}`}
                cx="32"
                cy="24.2"
                r="1.15"
                fill="#07080c"
                stroke="#505660"
                strokeWidth="0.4"
                transform={`rotate(${i * 72 + 36} 32 32)`}
              />
            ))}
          </g>

          {/* 6. СТАЦИОНАРНЫЙ ЦЕНТРАЛЬНЫЙ ШПИНДЕЛЬ С ЗОЛОТИСТОЙ СТРЕЛКОЙ ПЕРЕМОТКИ НАВЕРХ */}
          <circle
            cx="32"
            cy="32"
            r="7.5"
            fill="#12151f"
            stroke="#f59e0b"
            strokeWidth="1.5"
          />

          {/* Upward golden rewind arrow */}
          <g className="transition-transform duration-200 group-hover:-translate-y-0.5">
            <path
              d="M32 27 L28 31 M32 27 L36 31 M32 27 L32 37"
              stroke="#fbbf24"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </g>
        </svg>

        {/* Tooltip on hover directly below the reel */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2.5 py-1 rounded-lg bg-slate-900/95 dark:bg-[#141824]/95 border border-amber-500/40 text-amber-200 text-xs font-semibold whitespace-nowrap shadow-xl opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity duration-200 hidden min-[1000px]:flex items-center backdrop-blur-md">
          <span>Смотать наверх</span>
        </div>
      </button>
    </>
  );
};
