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
  const containerRef = useRef<HTMLDivElement>(null);
  // Smooth atmospheric fade-in state
  const [isFadedIn, setIsFadedIn] = useState(false);
  const [containerSize, setContainerSize] = useState(() => ({
    width: typeof window !== 'undefined' ? window.innerWidth : 1920,
    height: typeof window !== 'undefined' ? Math.max(0, window.innerHeight - 64) : 1016,
  }));

  useEffect(() => {
    // Reveal stage cleanly once mounted or fallback after 120ms
    const timer = setTimeout(() => {
      setIsFadedIn(true);
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  // Measure container dimensions dynamically to achieve true full-screen COVER under header
  useEffect(() => {
    if (!containerRef.current) return;
    const updateSize = () => {
      if (containerRef.current) {
        setContainerSize({
          width: containerRef.current.clientWidth,
          height: containerRef.current.clientHeight,
        });
      }
    };
    updateSize();

    const ro = new ResizeObserver(updateSize);
    ro.observe(containerRef.current);
    return () => ro.disconnect();
  }, []);

  // Correct URL respecting Vite base URL (/movies/)
  const videoSrc = `${import.meta.env.BASE_URL}book-club-bg.mp4`;

  // Calculate dimensions so the 16:9 stage completely COVERS the viewport under the header
  const targetAspect = 16 / 9;
  const currentW =
    containerSize.width || (typeof window !== 'undefined' ? window.innerWidth : 1920);
  const currentH =
    containerSize.height || (typeof window !== 'undefined' ? window.innerHeight - 64 : 1080);
  const currentAspect = currentW / (currentH || 1);

  let stageW = currentW;
  let stageH = currentH;

  if (currentAspect >= targetAspect) {
    // Ultrawide / wider than 16:9: width fills 100%, height expands to maintain 16:9
    stageW = currentW;
    stageH = Math.round(currentW / targetAspect);
  } else {
    // Taller than 16:9: height fills 100%, width expands to maintain 16:9
    stageH = currentH;
    stageW = Math.round(currentH * targetAspect);
  }

  // Slightly shift up so bookcase top moulding rests directly under the header, without black bar at bottom
  const maxShiftY = Math.max(0, stageH - currentH);
  const translateY = Math.round(Math.min(maxShiftY, stageH * 0.0857));

  // Dynamic scale for the books and overlays
  const scale = (stageH / 1080) * 1.1157;

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full flex-1 min-h-0 overflow-hidden bg-[#090a0f] flex items-start justify-start p-0 select-none"
    >
      {/* 
        Full-Screen Stage (Cover Mode):
        - Fills 100% of the screen under the header with zero letterboxing or pillarboxing
        - Maintains authentic 16:9 coordinates so the virtual bookcase overlay stays pixel-perfect
        - Smooth cinematic fade-in over the solid #090a0f background without any light bleed or sharp jumps
      */}
      <div
        className={`relative z-10 shrink-0 pointer-events-auto transition-opacity duration-700 ease-in-out ${
          isFadedIn ? 'opacity-100' : 'opacity-0'
        }`}
        style={{
          width: `${stageW}px`,
          height: `${stageH}px`,
          transform: `translateY(-${translateY}px)`,
          transformOrigin: 'top left',
        }}
      >
        {/* Crystal clear stabilized atmospheric room video filling full stage */}
        <video
          key={`main-${videoSrc}`}
          src={videoSrc}
          autoPlay
          loop
          muted
          playsInline
          onLoadedData={() => setIsFadedIn(true)}
          className="w-full h-full object-fill pointer-events-none"
        />

        {/* 
          Virtual Bookcase Overlay:
          Locked directly to the video's wooden cabinet in 16:9 space
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
  );
};

export default AtmosphericRoom;
