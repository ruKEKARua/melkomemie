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
  const stageRef = useRef<HTMLDivElement>(null);

  // Smooth 2.5s atmospheric fade-in state
  const [isFadedIn, setIsFadedIn] = useState(false);
  const [scale, setScale] = useState(1);

  // Track the exact scale factor based on stage height vs 1080p native height
  useEffect(() => {
    const updateScale = () => {
      if (stageRef.current) {
        const h = stageRef.current.clientHeight;
        if (h > 0) {
          setScale(h / 1080);
        }
      }
    };

    updateScale();
    const ro = new ResizeObserver(() => updateScale());
    if (stageRef.current) {
      ro.observe(stageRef.current);
    }
    window.addEventListener('resize', updateScale);

    return () => {
      ro.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsFadedIn(true);
    }, 50);
    return () => clearTimeout(timer);
  }, []);

  // Correct URL respecting Vite base URL (/movies/)
  const videoSrc = `${import.meta.env.BASE_URL}book-club-bg.mp4`;

  return (
    <div
      className={`relative w-full h-[calc(100vh-4.25rem)] overflow-hidden bg-[#090a0f] flex items-center justify-center p-1 sm:p-0 transition-opacity duration-[2500ms] ease-out select-none ${
        isFadedIn ? 'opacity-100' : 'opacity-0'
      }`}
    >
      {/* Ambient glow backdrop for ultra-wide monitors (no black void, smooth blurred room extension) */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none -z-0">
        <video
          key={`ambient-${videoSrc}`}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-cover filter blur-3xl opacity-35 scale-105"
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#090a0f]/60 to-[#090a0f]" />
      </div>

      {/* 
        Cinema 16:9 Stage:
        - Max height fits comfortably in the viewport under the header
        - Max width matches the 16:9 aspect ratio
        - Stepped back so the entire wooden bookcase, top moulding, and fireplace are 100% visible
        - Zero page scrolling
      */}
      <div
        ref={stageRef}
        className="relative aspect-video h-full max-w-full max-h-[calc(92vh-1.5rem)] overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)]  z-10 flex items-center justify-center"
      >
        {/* Crystal clear stabilized atmospheric room video */}
        <video
          key={`main-${videoSrc}`}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          className="w-full h-full object-fill pointer-events-none"
        />

        {/* 
          Virtual Bookcase Overlay:
          Locked with sub-pixel percentage accuracy directly onto the video's wooden cabinet:
          - Video resolution: 1920x1080
          - Cabinet Left: 64px (3.3333%)
          - Cabinet Top: 112px (10.3704%)
          - Cabinet Width: 184px (9.5833%)
          - Cabinet Height: 768px (71.1111%)
        */}
        <div
          className="absolute z-20 pointer-events-auto"
          style={{
                left: '6.3333%',
                top: '10.3704%',
                width: '13.5833%',
                height: '70.1111%',
                transform: 'skew(2deg, 0deg)'
          }}
        >
          <VirtualBookShelf
            books={books}
            onSelectBook={onSelectBook}
            onOpenCatalog={onOpenCatalog}
            scale={scale}
          />
        </div>
      </div>
    </div>
  );
};

export default AtmosphericRoom;
