import React, { useState, useEffect, useRef } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import VirtualBookShelf from './VirtualBookShelf';

interface AtmosphericRoomProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog: () => void;
}

export const AtmosphericRoom: React.FC<AtmosphericRoomProps> = ({
  books,
  onSelectBook,
  onOpenCatalog,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  // Smooth 2.5s fade-in state
  const [isFadedIn, setIsFadedIn] = useState(false);

  // Calculated sub-pixel coordinates for the bookcase inside the video
  const [shelfLayout, setShelfLayout] = useState<{
    x0: number;
    y0: number;
    w0: number;
    h0: number;
    scale: number;
  }>({
    x0: 42,
    y0: 119,
    w0: 188,
    h0: 730,
    scale: 1,
  });

  // Calculate exact position of the real wooden bookcase from the 1920x1080 video
  useEffect(() => {
    const updatePosition = () => {
      if (!containerRef.current) return;
      const { clientWidth: cw, clientHeight: ch } = containerRef.current;
      if (cw === 0 || ch === 0) return;

      const videoRatio = 1920 / 1080;
      const containerRatio = cw / ch;

      let scale = 1;
      let ox = 0;
      let oy = 0;

      // In object-cover mode:
      if (containerRatio > videoRatio) {
        // Container is wider than 16:9
        scale = cw / 1920;
        const rh = 1080 * scale;
        ox = 0;
        oy = (ch - rh) / 2;
      } else {
        // Container is taller than 16:9
        scale = ch / 1080;
        const rw = 1920 * scale;
        oy = 0;
        ox = (cw - rw) / 2;
      }

      setShelfLayout({
        x0: Math.round(42 * scale + ox),
        y0: Math.round(119 * scale + oy),
        w0: Math.round(188 * scale),
        h0: Math.round(730 * scale),
        scale,
      });
    };

    updatePosition();

    const resizeObserver = new ResizeObserver(() => updatePosition());
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    window.addEventListener('resize', updatePosition);

    return () => {
      resizeObserver.disconnect();
      window.removeEventListener('resize', updatePosition);
    };
  }, []);

  useEffect(() => {
    // Trigger smooth fade-in after mount
    const timer = setTimeout(() => {
      setIsFadedIn(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Correct URL respecting Vite base URL (/movies/)
  const videoSrc = `${import.meta.env.BASE_URL}book-club-bg.mp4`;

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-[calc(100vh-4.25rem)] overflow-hidden bg-black transition-opacity duration-[2500ms] ease-out select-none ${
        isFadedIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Background Stabilized Atmospheric Video - Seamless Loop, Zero Jitter */}
      <video
        key={videoSrc}
        src={videoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="absolute inset-0 w-full h-full object-cover object-center pointer-events-none"
      />

      {/* Virtual Bookcase Overlay: Placed with sub-pixel precision directly into the video's wooden cabinet */}
      <div
        className="absolute z-20 pointer-events-auto"
        style={{
          left: `${shelfLayout.x0}px`,
          top: `${shelfLayout.y0}px`,
          width: `${shelfLayout.w0}px`,
          height: `${shelfLayout.h0}px`,
        }}
      >
        <VirtualBookShelf
          books={books}
          onSelectBook={onSelectBook}
          onOpenCatalog={onOpenCatalog}
          scale={shelfLayout.scale}
        />
      </div>
    </div>
  );
};

export default AtmosphericRoom;
