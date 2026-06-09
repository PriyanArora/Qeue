import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const EASE = 'ease-[cubic-bezier(0.25,0.1,0.25,1)]';

interface RollButtonProps {
  /** Visible label; duplicated internally to power the vertical text-roll. */
  label: string;
  to?: string;
  onClick?: () => void;
  className?: string;
  circleClassName?: string;
  arrowClassName?: string;
  gapClassName?: string;
}

/**
 * Signature pill button: the label rolls vertically on hover while the
 * arrow rotates -45deg, both on a shared 500ms cubic-bezier easing.
 * Renders as a router Link when `to` is set, otherwise a button.
 */
export function RollButton({
  label,
  to,
  onClick,
  className = '',
  circleClassName = 'w-7 h-7 bg-white',
  arrowClassName = 'text-gray-900 w-4 h-4',
  gapClassName = 'gap-3',
}: RollButtonProps) {
  const inner = (
    <>
      <span className="roll-mask">
        <span
          className={`flex flex-col transition-transform duration-500 ${EASE} group-hover:-translate-y-1/2`}
        >
          <span className="flex h-[20px] items-center whitespace-nowrap">{label}</span>
          <span className="flex h-[20px] items-center whitespace-nowrap">{label}</span>
        </span>
      </span>
      <span className={`flex shrink-0 items-center justify-center rounded-full ${circleClassName}`}>
        <ArrowRight
          className={`transition-transform duration-500 ${EASE} group-hover:-rotate-45 ${arrowClassName}`}
        />
      </span>
    </>
  );

  const cls = `group relative inline-flex items-center ${gapClassName} ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls}>
        {inner}
      </Link>
    );
  }
  return (
    <button type="button" onClick={onClick} className={cls}>
      {inner}
    </button>
  );
}
