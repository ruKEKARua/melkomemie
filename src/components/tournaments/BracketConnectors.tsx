import React, { type RefObject } from 'react';
import { useBracketConnectors, type BracketConn } from '../../hooks/useBracketConnectors';

interface BracketConnectorsProps {
  containerRef: RefObject<HTMLDivElement | null>;
  connections: BracketConn[];
  theme: 'blue' | 'purple';
  isDark: boolean;
}

export const BracketConnectors: React.FC<BracketConnectorsProps> = ({
  containerRef,
  connections,
  theme,
  isDark,
}) => {
  const { paths, markers } = useBracketConnectors(containerRef, connections, theme, isDark);

  if (paths.length === 0) return null;

  return (
    <svg
      className="absolute inset-0 pointer-events-none w-full h-full z-0 overflow-visible"
      aria-hidden="true"
    >
      <defs>
        {markers.map((m) => (
          <marker
            key={m.id}
            id={m.id}
            viewBox="0 0 10 10"
            refX="0.5"
            refY="5"
            markerWidth="7"
            markerHeight="7"
            orient="auto"
            style={{ opacity: 1 }}
          >
            <path
              d="M 0 1.5 L 9 5 L 0 8.5 Z"
              fill={m.color}
              fillOpacity="1"
              stroke="none"
              style={{ opacity: 1, fillOpacity: 1 }}
            />
          </marker>
        ))}
      </defs>

      {paths.map((p) => (
        <path
          key={p.id}
          d={p.d}
          fill="none"
          stroke={p.color}
          strokeWidth={p.isHighlighted ? 2.5 : 2}
          strokeOpacity={p.isHighlighted ? 1 : isDark ? 0.8 : 0.85}
          strokeLinecap="round"
          markerEnd={p.hasArrow && p.markerId ? `url(#${p.markerId})` : undefined}
          className="transition-colors duration-200"
          style={
            p.isHighlighted
              ? { filter: 'drop-shadow(0 0 4px rgba(245, 158, 11, 0.6))' }
              : isDark
              ? { filter: `drop-shadow(0 0 2px ${p.color}35)` }
              : undefined
          }
        />
      ))}
    </svg>
  );
};
