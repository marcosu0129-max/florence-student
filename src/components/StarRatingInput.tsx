interface StarRatingInputProps {
  label: string;
  icon?: string;
  iconColor?: string;
  value: number;
  onChange: (value: number) => void;
  descriptions?: string[];
}

export default function StarRatingInput({
  label,
  icon,
  iconColor = 'text-[#2e5ea2]',
  value,
  onChange,
  descriptions = ['Molto facile', 'Facile', 'Medio', 'Difficile', 'Molto difficile'],
}: StarRatingInputProps) {
  return (
    <div className="
      bg-white
      border border-slate-200/80
      rounded-2xl
      px-5 py-4
      shadow-elevation-1
      hover:shadow-elevation-2
      transition-shadow duration-200
      flex items-center justify-between gap-4
    ">
      <div className="flex items-center gap-3">
        {icon && (
          <span className={`material-symbols-outlined ${iconColor}`} style={{ fontVariationSettings: "'FILL' 1" }}>
            {icon}
          </span>
        )}
        <span className="font-semibold text-[15px] text-slate-700">{label}</span>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex gap-1">
          {Array.from({ length: 5 }, (_, i) => (
            <button
              key={i}
              type="button"
              onClick={() => onChange(i + 1)}
              className="material-symbols-outlined text-[22px] transition-all duration-150 cursor-pointer p-0.5 hover:scale-110"
              style={{
                fontVariationSettings: `'FILL' ${i < value ? 1 : 0}`,
                color: i < value ? '#F59E0B' : '#c4c7c7',
              }}
            >
              star
            </button>
          ))}
        </div>
        {descriptions[value - 1] && (
          <span className="text-[12px] text-slate-400 font-medium min-w-[80px]">
            {descriptions[value - 1]}
          </span>
        )}
      </div>
    </div>
  );
}
