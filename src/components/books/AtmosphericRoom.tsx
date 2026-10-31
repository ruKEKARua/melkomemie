import React, { useState, useEffect, useRef } from 'react';
import type { BookClubBook } from '../../api/bookClubData';
import VirtualBookShelf from './VirtualBookShelf';

interface AtmosphericRoomProps {
  books: BookClubBook[];
  onSelectBook: (book: BookClubBook) => void;
  onOpenCatalog?: () => void;
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
  // Automatically scales fonts and popups proportionally on FullHD, 2K, 4K, and laptops
  useEffect(() => {
    const updateScale = () => {
      if (stageRef.current) {
        const h = stageRef.current.clientHeight;
        if (h > 0) {
          setScale((h / 1080) * 1.1157);
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
      className={`relative w-full h-full flex-1 min-h-0 overflow-hidden bg-[#090a0f] flex flex-col items-center justify-start p-0 transition-opacity duration-[2500ms] ease-out select-none ${
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
          className="w-full h-full object-cover filter blur-3xl opacity-35"
          style={{
            transform: 'translateY(-11.57%) scale(1.15)',
            transformOrigin: 'top center',
          }}
        />
        <div className="absolute inset-0 bg-radial from-transparent via-[#090a0f]/60 to-[#090a0f]" />
      </div>

      {/* 
        Cinema 16:9 Stage:
        - Glued directly to the bottom of the sticky header with 0 gap
        - Fully fits FullHD screens (1080p) and scales seamlessly to 4K displays
        - Aspect ratio 16:9 preserved with zero vertical or horizontal scroll
      */}
      <div
        ref={stageRef}
        className="relative aspect-video h-full max-h-full max-w-full overflow-hidden shadow-[0_0_60px_rgba(0,0,0,0.9)] z-10 flex items-center justify-center"
      >
        {/* 
          Raised Scene Plan:
          The entire room scene is shifted upwards so the top moulding of the wooden bookcase
          rests directly against the header with zero gap, perfectly matching the user's framing.
        */}
        <div
          className="relative w-full h-full"
          style={{
            transform: 'translateY(-8.57%) scale(1)',
            transformOrigin: 'top center',
          }}
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
            Locked directly to the video's wooden cabinet
          */}
          <div
            className="absolute z-20 pointer-events-auto"
            style={{
              left: '5.3333%',
              top: '10.3704%',
              width: '18.5833%',
              height: '70.1111%',
              transform: 'skew(1.5deg, 0deg) perspective(500px) rotateY(8deg)',

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
    </div>
  );
};

export default AtmosphericRoom;
