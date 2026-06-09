import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react';

const control =
  'w-full rounded-xl border border-gray-200 bg-white px-3.5 py-2.5 text-sm text-gray-900 placeholder:text-gray-400 transition-colors focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/20 disabled:bg-gray-50 disabled:text-gray-400';

export function Field({
  label,
  htmlFor,
  error,
  hint,
  required,
  children,
}: {
  label?: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-gray-700">
          {label}
          {required && <span className="ml-0.5 text-brand">*</span>}
        </label>
      )}
      {children}
      {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      {error && <p className="text-xs text-rose-600">{error}</p>}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  function Input({ className = '', ...props }, ref) {
    return <input ref={ref} className={`${control} ${className}`} {...props} />;
  },
);

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  function Textarea({ className = '', rows = 4, ...props }, ref) {
    return <textarea ref={ref} rows={rows} className={`${control} resize-y ${className}`} {...props} />;
  },
);

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  function Select({ className = '', children, ...props }, ref) {
    return (
      <select ref={ref} className={`${control} cursor-pointer pr-9 ${className}`} {...props}>
        {children}
      </select>
    );
  },
);

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="inline-flex items-center gap-2.5"
    >
      <span
        className={`relative h-6 w-11 rounded-full transition-colors ${
          checked ? 'bg-brand' : 'bg-gray-300'
        }`}
      >
        <span
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-[22px]' : 'translate-x-0.5'
          }`}
        />
      </span>
      {label && <span className="text-[13px] text-gray-700">{label}</span>}
    </button>
  );
}
