import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react'

interface XPInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export const XPInput = forwardRef<HTMLInputElement, XPInputProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-xp-ui text-xp-text">{label}</label>}
        <input ref={ref} className={`xp-input w-full ${className}`} {...props} />
      </div>
    )
  }
)
XPInput.displayName = 'XPInput'

interface XPTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}

export const XPTextarea = forwardRef<HTMLTextAreaElement, XPTextareaProps>(
  ({ label, className = '', ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && <label className="text-xp-ui text-xp-text">{label}</label>}
        <textarea ref={ref} className={`xp-input w-full resize-none ${className}`} {...props} />
      </div>
    )
  }
)
XPTextarea.displayName = 'XPTextarea'
