import { useState, useRef, useEffect, useCallback } from 'react';

export interface SearchSuggestion {
  type: 'program' | 'course' | 'professor';
  label: string;
  sublabel?: string;
  programCode?: string;
  courseId?: string;
  professorId?: string;
}

interface SearchBarProps {
  placeholder?: string;
  value?: string;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
  suggestions?: SearchSuggestion[];
  onSelectSuggestion?: (suggestion: SearchSuggestion) => void;
  className?: string;
}

export default function SearchBar({
  placeholder = 'Cerca corso...',
  value,
  onChange,
  onSubmit,
  suggestions = [],
  onSelectSuggestion,
  className = '',
}: SearchBarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const showDropdown = isOpen && suggestions.length > 0 && (value?.trim().length ?? 0) > 0;

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsOpen(true);
    setHighlightedIndex(-1);
    onChange?.(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (showDropdown && highlightedIndex >= 0 && highlightedIndex < suggestions.length) {
        const selected = suggestions[highlightedIndex];
        onSelectSuggestion?.(selected);
        setIsOpen(false);
        setHighlightedIndex(-1);
        onChange?.(selected.label);
      } else if (onSubmit) {
        onSubmit((e.target as HTMLInputElement).value);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prev) =>
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      setHighlightedIndex(-1);
      inputRef.current?.blur();
    }
  };

  const handleSuggestionClick = useCallback((suggestion: SearchSuggestion) => {
    onSelectSuggestion?.(suggestion);
    onChange?.(suggestion.label);
    setIsOpen(false);
    setHighlightedIndex(-1);
  }, [onSelectSuggestion, onChange]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setHighlightedIndex(-1);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (showDropdown && highlightedIndex >= 0 && dropdownRef.current) {
      const item = dropdownRef.current.querySelector(`[data-idx="${highlightedIndex}"]`);
      item?.scrollIntoView({ block: 'nearest' });
    }
  }, [highlightedIndex, showDropdown]);

  return (
    <div ref={wrapperRef} className={`relative w-full group rounded-full ${className}`}>
      <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted transition-colors duration-200 text-xl pointer-events-none">
        search
      </span>
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        onFocus={() => {
          if (suggestions.length > 0) setIsOpen(true);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="
          w-full
          bg-canvas
          border border-outline-variant
          px-5 py-4 pl-12
          font-body-main text-body-main
          text-ink
          placeholder:text-text-faint
          outline-none
          shadow-card
          rounded-full
        "
      />

      {showDropdown && (
        <div
          ref={dropdownRef}
          className="
            absolute top-full left-0 right-0 mt-2
            bg-canvas border border-outline-variant
            rounded-2xl shadow-card
            overflow-hidden z-50
            max-h-80 overflow-y-auto
          "
        >
          {suggestions.map((suggestion, index) => (
            <button
              key={`${suggestion.type}-${suggestion.label}-${index}`}
              data-idx={index}
              onMouseDown={(e) => {
                e.preventDefault();
                handleSuggestionClick(suggestion);
              }}
              onMouseEnter={() => setHighlightedIndex(index)}
              className={`
                w-full flex items-center gap-3 px-4 py-3 text-left
                transition-colors duration-100
                ${index === highlightedIndex ? 'bg-outline-variant' : 'hover:bg-surface-container'}
              `}
            >
              <span
                className={`
                  shrink-0 inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wide
                  ${suggestion.type === 'program'
                    ? 'bg-surface-high text-text-muted'
                    : suggestion.type === 'professor'
                    ? 'bg-primary-container text-on-primary-container'
                    : 'bg-surface-container text-text-muted'
                  }
                `}
              >
                {suggestion.type === 'program' ? 'LM / L' : suggestion.type === 'professor' ? 'docente' : suggestion.programCode || 'corso'}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="font-medium text-ink text-[14px] truncate">{suggestion.label}</span>
                {suggestion.sublabel && (
                  <span className="text-[12px] text-text-muted truncate">{suggestion.sublabel}</span>
                )}
              </div>
              {index === highlightedIndex && (
                <span className="material-symbols-outlined ml-auto text-[16px] text-text-muted shrink-0">
                  keyboard_return
                </span>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
