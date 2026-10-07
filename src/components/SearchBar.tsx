import { useId, useRef, useState } from 'react';
import Icon from './Icon';
export interface SearchSuggestion { type: 'program' | 'course' | 'professor'; label: string; sublabel?: string; programCode?: string; courseId?: string; professorId?: string; }
interface SearchBarProps { placeholder?: string; value?: string; onChange?: (value: string) => void; onSubmit?: (value: string) => void; suggestions?: SearchSuggestion[]; onSelectSuggestion?: (suggestion: SearchSuggestion) => void; className?: string; }
export default function SearchBar({ placeholder = 'Cerca corso…', value = '', onChange, onSubmit, suggestions = [], onSelectSuggestion, className = '' }: SearchBarProps) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(true);
  return <div className={`relative w-full ${className}`}>
    <form role="search" onSubmit={event => { event.preventDefault(); setOpen(false); onSubmit?.(value); }}>
      <label htmlFor={id} className="sr-only">{placeholder}</label>
      <div className="relative"><span className="absolute left-4 top-1/2 -translate-y-1/2 text-text pointer-events-none"><Icon name="search" size={20} /></span>
        <input ref={input} id={id} type="search" value={value} onChange={event => { setOpen(true); onChange?.(event.target.value); }} onFocus={() => setOpen(true)} onKeyDown={event => { if (event.key === 'Escape') { event.preventDefault(); setOpen(false); } }} placeholder={placeholder} autoComplete="off" className="w-full bg-canvas border border-outline-variant py-4 pl-12 pr-14 text-sm sm:text-base text-ink placeholder:text-text shadow-card rounded-full" />
        {value.length > 0 && <button type="button" aria-label="Cancella ricerca" onClick={() => { onChange?.(''); setOpen(true); input.current?.focus(); }} className="absolute right-2 top-1/2 flex size-11 -translate-y-1/2 items-center justify-center rounded-full text-text transition-colors duration-150 hover:bg-surface-container hover:text-ink"><Icon name="close" size={20} /></button>}
      </div>
      {onSubmit && <button type="submit" className="sr-only focus:not-sr-only focus:mt-2 focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-canvas">Cerca</button>}
    </form>
    {open && value.trim() && suggestions.length > 0 && <div className="mt-2 bg-canvas border border-outline-variant rounded-2xl shadow-card overflow-hidden"><p className="px-4 pt-3 text-xs text-text">Risultati suggeriti</p><ul>{suggestions.map((suggestion, index) => <li key={`${suggestion.type}-${suggestion.courseId || suggestion.professorId || suggestion.label}-${index}`}><button type="button" onClick={() => { setOpen(false); onSelectSuggestion?.(suggestion); }} className="w-full flex flex-col gap-1 px-4 py-3 text-left hover:bg-card-base"><span className="font-medium text-sm text-ink text-pretty">{suggestion.label}</span>{suggestion.sublabel && <span className="text-xs text-text text-pretty">{suggestion.sublabel}</span>}</button></li>)}</ul></div>}
  </div>;
}
