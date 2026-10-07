import { useCallback, useState } from 'react';
import { Select } from '@base-ui/react/select';
import { Check, ChevronDown } from 'lucide-react';
import styles from './FilterSelect.module.css';

interface FilterSelectProps {
  label: string;
  disabled?: boolean;
  value: string;
  onValueChange: (value: string) => void;
  options: Array<{ label: string; value: string }>;
}

export default function FilterSelect({ label, value, onValueChange, options, disabled = false }: FilterSelectProps) {
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  const fieldRef = useCallback((node: HTMLDivElement | null) => { setPortalContainer(node?.closest('dialog') || null); }, []);
  return (
    <div ref={fieldRef} className={styles.field}>
      <Select.Root disabled={disabled} items={options} value={value} onValueChange={next => { if (next !== null) onValueChange(next); }} modal={false}>
        <Select.Label className={styles.label}>{label}</Select.Label>
        <Select.Trigger className={styles.trigger}>
          <Select.Value className={styles.value} />
          <Select.Icon className={styles.icon}>
            <ChevronDown size={18} aria-hidden="true" focusable="false" />
          </Select.Icon>
        </Select.Trigger>
        <Select.Portal container={portalContainer ?? undefined}>
          <Select.Positioner className={styles.positioner} align="start" sideOffset={8} collisionPadding={12} alignItemWithTrigger={false}>
            <Select.Popup className={styles.popup}>
              <Select.List className={styles.list}>
                {options.map(option => (
                  <Select.Item key={option.value} value={option.value} className={styles.item}>
                    <Select.ItemText className={styles.itemText}>{option.label}</Select.ItemText>
                    <Select.ItemIndicator className={styles.indicator}>
                      <Check size={18} aria-hidden="true" focusable="false" />
                    </Select.ItemIndicator>
                  </Select.Item>
                ))}
              </Select.List>
            </Select.Popup>
          </Select.Positioner>
        </Select.Portal>
      </Select.Root>
    </div>
  );
}
