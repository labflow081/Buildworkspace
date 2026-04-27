import { SelectHTMLAttributes } from 'react'

interface Option {
  value: string
  label: string
  color?: string
}

interface Props extends SelectHTMLAttributes<HTMLSelectElement> {
  options: Option[]
  emptyLabel: string
}

export const XpSelect = ({ options, emptyLabel, style, ...rest }: Props) => (
  <select
    className="xp-input"
    style={{ width: '100%', ...style }}
    {...rest}
  >
    <option value="">{emptyLabel}</option>
    {options.map(opt => (
      <option
        key={opt.value}
        value={opt.value}
        style={opt.color ? { color: opt.color } : undefined}
      >
        {opt.color ? `● ${opt.label}` : opt.label}
      </option>
    ))}
  </select>
)
