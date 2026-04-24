import { ButtonHTMLAttributes, forwardRef } from 'react'

interface XPButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'primary'
}

export const XPButton = forwardRef<HTMLButtonElement, XPButtonProps>(
  ({ variant = 'default', className = '', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={`xp-button ${variant === 'primary' ? 'primary' : ''} ${className}`}
        {...props}
      >
        {children}
      </button>
    )
  }
)

XPButton.displayName = 'XPButton'
