import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface AccordionItemProps {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}

export default function AccordionItem({ title, children, defaultOpen = false }: AccordionItemProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-border-card rounded-xl overflow-hidden bg-card-base">
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-surface-container transition-colors group"
        aria-expanded={isOpen}
      >
        <span className="font-card-title text-card-title text-ink text-left">{title}</span>
        <span
          className="material-symbols-outlined text-xl text-text-muted transition-transform duration-300 group-hover:text-ink shrink-0 ml-3"
          style={{
            fontVariationSettings: "'FILL' 0",
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
          }}
        >
          expand_more
        </span>
      </button>
      <AnimatePresence initial={false}>
        {isOpen && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 border-t border-outline-variant pt-4">
              <p className="font-body-main text-body-main text-text leading-relaxed whitespace-pre-wrap">
                {children}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
