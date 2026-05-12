import { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title, children }: BottomSheetProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-card-base rounded-t-[24px] shadow-float max-h-[85vh] overflow-y-auto safe-area-bottom"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-2">
              <div className="w-10 h-1 rounded-full bg-outline-variant" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-5 pb-4 border-b border-outline-variant">
              <h2 className="font-card-title text-card-title text-ink">{title}</h2>
              <button
                onClick={onClose}
                className="w-9 h-9 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors"
              >
                <span className="material-symbols-outlined text-xl text-on-surface-variant" style={{ fontVariationSettings: "'FILL' 0" }}>
                  close
                </span>
              </button>
            </div>
            {/* Content */}
            <div className="p-5">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
