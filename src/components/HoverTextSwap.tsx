interface HoverTextSwapProps {
  visible: string;
  hidden: string;
  className?: string;
  hovered?: boolean;
}

export default function HoverTextSwap({
  visible,
  hidden,
  className = '',
  hovered = false,
}: HoverTextSwapProps) {
  return (
    <span
      className={`relative inline-block cursor-pointer ${className}`}
      style={{ display: 'inline-flex', alignItems: 'center' }}
    >
      <span
        className="hts-label--visible"
        style={{
          opacity: hovered ? 0 : 1,
          transition: 'opacity 360ms cubic-bezier(.6,.05,.2,1)',
          lineHeight: 1.15,
          color: '#0A0A0A',
          whiteSpace: 'nowrap',
        }}
      >
        {visible}
      </span>
      <span
        className="hts-label--hidden absolute"
        aria-hidden={true}
        style={{
          opacity: hovered ? 1 : 0,
          transition: 'opacity 360ms cubic-bezier(.6,.05,.2,1)',
          lineHeight: 1.15,
          color: '#8A8A8A',
          whiteSpace: 'nowrap',
        }}
      >
        {hidden}
      </span>
    </span>
  );
}
