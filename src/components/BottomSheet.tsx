import { useEffect, useId, useRef, type ReactNode } from 'react';
import Icon from './Icon';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  role?: 'dialog' | 'alertdialog';
  children: ReactNode;
}

export default function BottomSheet({ open, onClose, title = 'Dettagli', description, role = 'dialog', children }: BottomSheetProps) {
  const dialog = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    const element = dialog.current;
    if (!element) return;
    if (!open) { if (element.open) element.close(); return; }
    const previousOverflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previousOverflow;
      if (element.open) element.close();
    };
  }, [open]);
  return <dialog ref={dialog} role={role} aria-labelledby={titleId} aria-describedby={description ? descriptionId : undefined}
    onCancel={event => { event.preventDefault(); onClose(); }}
    onClick={event => { if (event.target !== event.currentTarget) return; const rect = event.currentTarget.getBoundingClientRect(); if (event.clientY < rect.top || event.clientY > rect.bottom || event.clientX < rect.left || event.clientX > rect.right) onClose(); }}
    className="bottom-sheet fixed inset-x-0 bottom-0 top-auto m-0 mx-auto w-full max-w-2xl max-h-[85dvh] overflow-y-auto rounded-t-3xl border-0 bg-card-base text-ink shadow-float safe-area-bottom">
    <div className="flex justify-center pt-3 pb-2" aria-hidden="true"><div className="w-10 h-1 rounded-full bg-outline-variant" /></div>
    <div className="flex items-center justify-between gap-4 px-5 pb-4 border-b border-outline-variant">
      <h2 id={titleId} className="font-card-title text-card-title text-ink">{title}</h2>
      <button type="button" onClick={onClose} aria-label="Chiudi finestra" className="size-11 shrink-0 rounded-full bg-surface-container flex items-center justify-center hover:bg-surface-container-high transition-colors duration-150">
        <Icon name="close" size={20} />
      </button>
    </div>
    {description && <p id={descriptionId} className="px-5 pt-5 text-sm text-text">{description}</p>}
    <div className="p-5">{children}</div>
  </dialog>;
}
