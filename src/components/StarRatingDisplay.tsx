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
    sm: 'text-[14px]',
    md: 'text-[18px]',
    lg: 'text-[24px]',
  };

  return (
    <div className="flex items-center gap-1">
      <div className={`flex gap-0.5 ${sizeMap[size]}`}>
        {Array.from({ length: max }, (_, i) => (
          <span
            key={i}
            className="material-symbols-outlined"
            style={{
              fontVariationSettings: `'FILL' ${i < Math.round(value) ? 1 : 0}`,
              color: i < Math.round(value) ? '#FFE25C' : '#d8c2bb',
            }}
          >
            star
          </span>
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
