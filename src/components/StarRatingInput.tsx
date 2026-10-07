import { useId } from 'react';
import Icon from './Icon';

interface StarRatingInputProps {
  label: string;
  icon?: string;
  value: number;
  onChange: (value: number) => void;
  descriptions?: string[];
  disabled?: boolean;
  error?: string;
}

export default function StarRatingInput({
  label,
  icon,
  value,
  onChange,
  descriptions = ['Molto basso', 'Basso', 'Medio', 'Alto', 'Molto alto'],
  disabled = false,
  error,
}: StarRatingInputProps) {
  const id = useId();
  return (
    <fieldset disabled={disabled} className="min-w-0 rounded-xl border border-outline-variant bg-canvas px-4 pb-3 pt-2">
      <legend className="px-1 text-sm font-semibold text-ink">
        <span className="flex items-start gap-2 leading-5">
          {icon && <Icon name={icon} size={18} className="mt-px" />}
          <span>{label} <span className="font-normal">(obbligatorio)</span></span>
        </span>
      </legend>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <div className="flex shrink-0">
          {Array.from({ length: 5 }, (_, index) => {
            const score = index + 1;
            return (
              <label key={score} className="relative flex size-11 cursor-pointer items-center justify-center rounded-full has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink has-[:disabled]:cursor-wait">
                <input
                  type="radio"
                  name={id}
                  value={score}
                  checked={value === score}
                  onChange={() => onChange(score)}
                  required
                  aria-label={`${label}: ${score} su 5, ${descriptions[index] || score}`}
                  aria-describedby={`${id}-description${error ? ` ${id}-error` : ''}`}
                  aria-invalid={Boolean(error)}
                  className="peer sr-only"
                />
                <Icon name="star" size={24} filled={score <= value} className="text-ink transition-transform duration-150 motion-reduce:transition-none peer-active:scale-95" />
              </label>
            );
          })}
        </div>
        <p id={`${id}-description`} className="text-xs text-text tabular-nums">{value ? `${value}/5 · ${descriptions[value - 1] || ''}` : 'Scegli da 1 a 5'}</p>
      </div>
      {error && <p id={`${id}-error`} className="mt-1 text-sm text-error">{error}</p>}
    </fieldset>
  );
}
