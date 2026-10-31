import { useState, useEffect, type RefObject } from 'react';

/**
 * Hook to dynamically calculate stage scale based on container height vs 1080p native height.
 * Uses ResizeObserver throttled with requestAnimationFrame for smooth 60fps responsive scaling.
 */
export function useStageScale(
  stageRef: RefObject<HTMLElement | null>,
  baseHeight = 1080,
  factor = 1.1157
): number {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    let rafId: number | null = null;

    const updateScale = () => {
      if (stageRef.current) {
        const h = stageRef.current.clientHeight;
        if (h > 0) {
          setScale((h / baseHeight) * factor);
        }
      }
    };

    updateScale();

    const ro = new ResizeObserver(() => {
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
      rafId = requestAnimationFrame(updateScale);
    });

    if (stageRef.current) {
      ro.observe(stageRef.current);
    }

    return () => {
      ro.disconnect();
      if (rafId !== null) {
        cancelAnimationFrame(rafId);
      }
    };
  }, [stageRef, baseHeight, factor]);

  return scale;
}
