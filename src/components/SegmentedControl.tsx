import { useId } from 'react';

interface SegmentedControlProps {
  label: string;
  labelledBy?: string;
  value: string;
  options: Array<{ value: string; label: string }>;
  onValueChange: (value: string) => void;
  disabled?: boolean;
}

export default function SegmentedControl({ label, labelledBy, value, options, onValueChange, disabled }: SegmentedControlProps) {
  const name = useId();
  if (!options.length) return null;
  const selectedIndex = options.findIndex(option => option.value === value);
  return <fieldset disabled={disabled} aria-label={labelledBy ? undefined : label} aria-labelledby={labelledBy} className="segmented-control relative isolate inline-grid max-w-full min-w-0 gap-1 rounded-full border border-outline-variant bg-canvas-soft p-1 disabled:opacity-60" style={{ gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` }}>
    {selectedIndex >= 0 && <span aria-hidden="true" className="pointer-events-none absolute inset-y-1 left-1 rounded-full bg-ink transition-transform duration-200 ease-out motion-reduce:transition-none" style={{ width: `calc((100% - 0.5rem - ${(options.length - 1) * 0.25}rem) / ${options.length})`, transform: `translateX(calc(${selectedIndex * 100}% + ${selectedIndex * 0.25}rem))` }} />}
    {options.map(option => <label key={option.value} className="relative z-10 min-w-0 flex-1 cursor-pointer rounded-full has-[:disabled]:cursor-not-allowed has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink">
      <input type="radio" name={name} value={option.value} checked={value === option.value} onChange={() => onValueChange(option.value)} className="peer sr-only" />
      <span className="flex min-h-11 items-center justify-center text-center rounded-full px-3 sm:px-4 py-3 text-sm font-medium leading-5 text-text tabular-nums transition-colors duration-200 ease-out motion-reduce:transition-none peer-checked:text-canvas">{option.label}</span>
    </label>)}
  </fieldset>;
}
