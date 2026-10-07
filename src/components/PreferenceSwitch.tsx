import { Switch } from '@base-ui/react/switch';

export default function PreferenceSwitch({ label, describedBy, checked, disabled, onCheckedChange }: {
  label: string;
  describedBy?: string;
  checked: boolean;
  disabled?: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return <Switch.Root aria-label={label} aria-describedby={describedBy} checked={checked} disabled={disabled} onCheckedChange={onCheckedChange} className="preference-switch">
    <Switch.Thumb className="preference-switch-thumb" />
  </Switch.Root>;
}
