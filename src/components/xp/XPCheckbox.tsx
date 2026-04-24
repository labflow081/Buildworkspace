import { InputHTMLAttributes } from 'react'

interface XPCheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label?: string
}

export const XPCheckbox = ({ label, className = '', ...props }: XPCheckboxProps) => {
  return (
    <label className={`flex items-center gap-2 cursor-pointer min-h-[44px] ${className}`}>
      <input
        type="checkbox"
        className="w-4 h-4 border border-xp-border bg-white cursor-pointer"
        style={{ accentColor: '#2A5BA5' }}
        {...props}
      />
      {label && <span className="text-xp-ui text-xp-text select-none">{label}</span>}
    </label>
  )
}
