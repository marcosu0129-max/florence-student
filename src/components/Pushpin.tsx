import { motion } from 'framer-motion';

export type PushpinColor = 'blue' | 'red' | 'green' | 'yellow' | 'white';

interface PushpinProps {
  color?: PushpinColor;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  animate?: boolean;
}

const colorMap: Record<PushpinColor, { main: string; highlight: string; shadow: string }> = {
  blue: { main: '#2e5ea2', highlight: '#5a8fd4', shadow: '#1a3d70' },
  red: { main: '#FF453A', highlight: '#ff6b5c', shadow: '#cc362e' },
  green: { main: '#30D158', highlight: '#5ae07a', shadow: '#26a646' },
  yellow: { main: '#FFD60A', highlight: '#ffe14d', shadow: '#ccab08' },
  white: { main: '#ffffff', highlight: '#ffffff', shadow: '#e0e0e0' },
};

export default function Pushpin({
  color = 'blue',
  size = 'md',
  className = '',
  animate = true,
}: PushpinProps) {
  const colors = colorMap[color];

  const sizeMap = {
    sm: { width: 20, height: 28, pinRadius: 8, headRadius: 5 },
    md: { width: 28, height: 38, pinRadius: 11, headRadius: 7 },
    lg: { width: 36, height: 48, pinRadius: 14, headRadius: 9 },
  };

  const { width, height, pinRadius, headRadius } = sizeMap[size];

  const svgContent = (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ filter: 'drop-shadow(1px 2px 2px rgba(0,0,0,0.25))' }}
    >
      {/* Pin body - cylinder */}
      <rect
        x={width / 2 - pinRadius * 0.5}
        y={height * 0.45}
        width={pinRadius}
        height={height * 0.4}
        rx={pinRadius / 2}
        fill={colors.shadow}
      />

      {/* Pin head - sphere (top circle) */}
      <circle
        cx={width / 2}
        cy={height * 0.35}
        r={headRadius}
        fill={colors.main}
      />

      {/* Highlight on head */}
      <ellipse
        cx={width / 2 - headRadius * 0.25}
        cy={height * 0.3}
        rx={headRadius * 0.35}
        ry={headRadius * 0.25}
        fill={colors.highlight}
        opacity={0.8}
      />

      {/* Metal pin tip */}
      <path
        d={`M ${width / 2 - 3} ${height * 0.8} L ${width / 2} ${height} L ${width / 2 + 3} ${height * 0.8}`}
        fill={colors.shadow}
      />
    </svg>
  );

  if (animate) {
    return (
      <motion.div
        className={`pushpin-container ${className}`}
        whileHover={{
          rotate: [0, -5, 5, -3, 3, 0],
          scale: [1, 1.1, 1.05, 1],
        }}
        transition={{
          duration: 0.4,
          ease: 'easeInOut',
        }}
        style={{ display: 'inline-block' }}
      >
        {svgContent}
      </motion.div>
    );
  }

  return (
    <div className={`pushpin-container ${className}`} style={{ display: 'inline-block' }}>
      {svgContent}
    </div>
  );
}
