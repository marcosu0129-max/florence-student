import type { ReactNode } from 'react';
export default function AccordionItem({ title, children, defaultOpen = false }: { title: string; children: ReactNode; defaultOpen?: boolean }) {
  return <details open={defaultOpen || undefined} className="border border-outline-variant rounded-xl bg-card-base"><summary className="cursor-pointer px-5 py-4 font-semibold text-ink text-pretty">{title}</summary><div className="px-5 pb-5 border-t border-outline-variant pt-4 text-sm sm:text-base text-text leading-relaxed whitespace-pre-wrap break-words">{children}</div></details>;
}
