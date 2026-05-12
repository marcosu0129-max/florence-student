import { ReactNode } from 'react';
import { motion } from 'framer-motion';

interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: ReactNode;
  accentColor?: 'coral' | 'mint' | 'amber';
}

export default function EmptyState({
  icon,
  title,
  description,
  action,
  accentColor = 'coral',
}: EmptyStateProps) {
  const colors = {
    coral: {
      bg: 'bg-surface-container-low',
      icon: 'text-coral',
      ring: 'border-surface-variant',
    },
    mint: {
      bg: 'bg-mint/30',
      icon: 'text-mint-deep',
      ring: 'border-mint-deep/20',
    },
    amber: {
      bg: 'bg-surface-cream',
      icon: 'text-amber',
      ring: 'border-outline-variant',
    },
  };
  const c = colors[accentColor];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col items-center justify-center py-16 gap-4 text-center"
    >
      {icon && (
        <motion.div
          whileHover={{ scale: 1.05 }}
          transition={{ duration: 0.3 }}
          className={`w-16 h-16 rounded-full ${c.bg} border border-${accentColor === 'coral' ? 'coral/30' : accentColor === 'mint' ? 'mint-deep/30' : 'amber/30'} flex items-center justify-center`}
        >
          <span className={`material-symbols-outlined text-3xl ${c.icon}`} style={{ fontVariationSettings: "'FILL' 0" }}>
            {icon}
          </span>
        </motion.div>
      )}
      <div className="text-center">
        <h3 className="h-card text-lg text-text-primary font-semibold mb-1">{title}</h3>
        {description && (
          <p className="t-body text-body-main text-text-muted max-w-xs">{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}
