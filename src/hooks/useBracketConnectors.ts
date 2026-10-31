import { useCallback, useEffect, useState, type RefObject } from 'react';

export interface ForkDef {
  type: 'fork';
  topFrom: string;
  bottomFrom: string;
  to: string;
  isHighlighted?: boolean;
}

export interface SingleDef {
  type: 'single';
  from: string;
  to: string;
  isHighlighted?: boolean;
  color?: string;
}

export type BracketConn = ForkDef | SingleDef;

export interface RenderedPath {
  id: string;
  d: string;
  color: string;
  hasArrow: boolean;
  markerId?: string;
  isHighlighted: boolean;
}

export interface MarkerDef {
  id: string;
  color: string;
}

export const getDividerY = (cardElement: HTMLElement, containerRect: DOMRect): number => {
  const divider = cardElement.querySelector<HTMLElement>('[data-bracket-divider="true"]');
  if (divider) {
    const r = divider.getBoundingClientRect();
    return r.top + r.height * 0.5 - containerRect.top;
  }
  const byeRow = cardElement.querySelector<HTMLElement>('[data-bracket-bye="true"]');
  if (byeRow) {
    const r = byeRow.getBoundingClientRect();
    return r.top + r.height * 0.5 - containerRect.top;
  }
  const cardRect = cardElement.getBoundingClientRect();
  return cardRect.top + cardRect.height * 0.5 - containerRect.top;
};

export function useBracketConnectors(
  containerRef: RefObject<HTMLDivElement | null>,
  connections: BracketConn[],
  theme: 'blue' | 'purple',
  isDark: boolean
) {
  const [paths, setPaths] = useState<RenderedPath[]>([]);
  const [markers, setMarkers] = useState<MarkerDef[]>([]);

  const updatePaths = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const newPaths: RenderedPath[] = [];
    const newMarkers: MarkerDef[] = [];

    const solidBlue = isDark ? '#60a5fa' : '#2563eb';
    const solidPurple = isDark ? '#c084fc' : '#9333ea';
    const solidGold = isDark ? '#fbbf24' : '#d97706';
    const defaultSolidColor = theme === 'blue' ? solidBlue : solidPurple;

    const defaultColor = defaultSolidColor;
    const goldColor = solidGold;

    connections.forEach((conn, index) => {
      const isHighlighted = !!conn.isHighlighted;
      const lineColor = isHighlighted
        ? goldColor
        : 'color' in conn && conn.color
        ? conn.color
        : defaultColor;

      const solidMarkerColor = isHighlighted
        ? solidGold
        : 'color' in conn && conn.color
        ? conn.color
        : defaultSolidColor;

      const markerId = `arrow-${theme}-${isHighlighted ? 'gold' : isDark ? 'dark' : 'light'}-${index}`;
      newMarkers.push({ id: markerId, color: solidMarkerColor });

      if (conn.type === 'fork') {
        const topEl = document.getElementById(conn.topFrom);
        const bottomEl = document.getElementById(conn.bottomFrom);
        const toEl = document.getElementById(conn.to);
        if (!topEl || !bottomEl || !toEl) return;

        const topRect = topEl.getBoundingClientRect();
        const bottomRect = bottomEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        if (toRect.left <= topRect.left) return;

        const x1_top = topRect.right - containerRect.left;
        const x1_bottom = bottomRect.right - containerRect.left;
        const x1 = Math.max(x1_top, x1_bottom);

        // Subpixel vertical centers of participant dividing lines
        const y_top = getDividerY(topEl, containerRect);
        const y_bottom = getDividerY(bottomEl, containerRect);
        const y_target = getDividerY(toEl, containerRect);

        const x_target = toRect.left - containerRect.left;
        const totalDx = x_target - x1;
        // Junction point where top and bottom branches merge into single stem
        const x_junction = x1 + totalDx * 0.52;
        const arrowMargin = 8;
        const x_end = x_target - arrowMargin;
        const cdx = (x_junction - x1) * 0.5;

        // 1. Top branch curving down to junction
        const dTop = `M ${x1_top} ${y_top} C ${x1_top + cdx} ${y_top}, ${x_junction - cdx} ${y_target}, ${x_junction} ${y_target}`;
        newPaths.push({
          id: `${conn.topFrom}->${conn.to}-top`,
          d: dTop,
          color: lineColor,
          hasArrow: false,
          isHighlighted,
        });

        // 2. Bottom branch curving up to junction
        const dBottom = `M ${x1_bottom} ${y_bottom} C ${x1_bottom + cdx} ${y_bottom}, ${x_junction - cdx} ${y_target}, ${x_junction} ${y_target}`;
        newPaths.push({
          id: `${conn.bottomFrom}->${conn.to}-bottom`,
          d: dBottom,
          color: lineColor,
          hasArrow: false,
          isHighlighted,
        });

        // 3. Single merged stem pointing right at participant divider line with arrowhead
        const dStem = `M ${x_junction} ${y_target} L ${x_end} ${y_target}`;
        newPaths.push({
          id: `${conn.topFrom}_${conn.bottomFrom}->${conn.to}-stem`,
          d: dStem,
          color: lineColor,
          hasArrow: true,
          markerId,
          isHighlighted,
        });
      } else {
        // Single connection
        const fromEl = document.getElementById(conn.from);
        const toEl = document.getElementById(conn.to);
        if (!fromEl || !toEl) return;

        const fromRect = fromEl.getBoundingClientRect();
        const toRect = toEl.getBoundingClientRect();

        if (toRect.left <= fromRect.left) return;

        const x1 = fromRect.right - containerRect.left;
        const y1 = getDividerY(fromEl, containerRect);

        const x_target = toRect.left - containerRect.left;
        const y_target = getDividerY(toEl, containerRect);
        const arrowMargin = 8;
        const x_end = x_target - arrowMargin;

        const isLevel = Math.abs(y1 - y_target) < 3;
        const y_level = isLevel ? y_target : y1;
        const d = isLevel
          ? `M ${x1} ${y_level} L ${x_end} ${y_level}`
          : `M ${x1} ${y1} C ${x1 + (x_end - x1) * 0.5} ${y1}, ${x_end - (x_end - x1) * 0.5} ${y_target}, ${x_end} ${y_target}`;

        newPaths.push({
          id: `${conn.from}->${conn.to}`,
          d,
          color: lineColor,
          hasArrow: true,
          markerId,
          isHighlighted,
        });
      }
    });

    setPaths(newPaths);
    setMarkers(newMarkers);
  }, [containerRef, connections, theme, isDark]);

  useEffect(() => {
    const rafId = requestAnimationFrame(updatePaths);
    const timer = setTimeout(updatePaths, 120);

    const container = containerRef.current;
    let observer: ResizeObserver | null = null;
    if (container && typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver(() => {
        updatePaths();
      });
      observer.observe(container);
    }

    window.addEventListener('resize', updatePaths);
    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timer);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', updatePaths);
    };
  }, [updatePaths, containerRef]);

  return { paths, markers };
}
