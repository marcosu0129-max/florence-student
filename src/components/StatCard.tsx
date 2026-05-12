import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';

interface StatCardProps {
  icon: string;
  value: string | number;
  label: string;
  accentColor?: 'coral' | 'mint' | 'amber' | 'cream';
  href?: string;
}

const colorMap = {
  coral: {
    bg: 'bg-coral/10',
    icon: 'text-coral',
    value: 'text-coral',
  },
  mint: {
    bg: 'bg-mint',
    icon: 'text-mint-deep',
    value: 'text-mint-deep',
  },
  amber: {
    bg: 'bg-amber/20',
    icon: 'text-amber',
    value: 'text-amber',
  },
  cream: {
    bg: 'bg-surface-cream',
    icon: 'text-primary',
    value: 'text-primary',
  },
};

export default function StatCard({
  icon,
  value,
  label,
  accentColor = 'coral',
  href,
}: StatCardProps) {
  const colors = colorMap[accentColor];

  const content = (
    <motion.div
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className={`
        bg-surface-soft
        border border-surface-variant
        p-5
        shadow-[0_4px_16px_rgba(42,37,32,0.04)]
        hover:shadow-[0_8px_24px_rgba(42,37,32,0.08)]
        transition-all duration-200
        flex flex-col items-center justify-center text-center gap-2
        min-h-[120px]
        rounded-[20px]
        ${href ? 'cursor-pointer' : ''}
      `}>
      <div className={`w-14 h-14 rounded-full ${colors.bg} flex items-center justify-center mb-1`}>
        <span className={`material-symbols-outlined text-[28px] ${colors.icon}`} style={{ fontVariationSettings: "'FILL' 1" }}>
          {icon}
        </span>
      </div>
      <span className={`font-bold text-[36px] leading-none ${colors.value} t-stat`}>
        {value}
      </span>
      <span className="text-[13px] text-text-secondary h-card leading-tight mt-1">
        {label}
      </span>
    </motion.div>
  );

  if (href) {
    return (
      <Link to={href} className="block group">
        {content}
      </Link>
    );
  }

  return content;
}
