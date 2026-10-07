import Icon from './Icon';

interface StarRatingDisplayProps {
  value: number;
  max?: number;
  size?: 'sm' | 'md' | 'lg';
  showValue?: boolean;
}

export default function StarRatingDisplay({
  value,
  max = 5,
  size = 'md',
  showValue = false,
}: StarRatingDisplayProps) {
  const sizeMap = {
    sm: 14,
    md: 18,
    lg: 24,
  };

  return (
    <div className="flex items-center gap-1">
      <div className="flex gap-0.5">
        {Array.from({ length: max }, (_, i) => (
          <Icon
            key={i}
            name="star"
            size={sizeMap[size]}
            filled={i < Math.round(value)}
            className={i < Math.round(value) ? 'text-[#FFE25C]' : 'text-[#d8c2bb]'}
          />
        ))}
      </div>
      {showValue && (
        <span className="font-semibold text-[14px] text-ink ml-1">
          {value.toFixed(1)}
        </span>
      )}
    </div>
  );
}
