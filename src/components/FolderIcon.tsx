interface FolderIconProps {
  coverUrl?: string | null
  size?: 'sm' | 'lg'
  label?: string
  onClick?: () => void
  pinned?: boolean
}

export const FolderIcon = ({ coverUrl, size = 'sm', label, onClick, pinned }: FolderIconProps) => {
  const w = size === 'sm' ? 72 : 96
  const h = size === 'sm' ? 60 : 80
  const tabW = size === 'sm' ? 24 : 32
  const tabH = 6

  return (
    <div
      className="flex flex-col items-center gap-1 cursor-pointer select-none"
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={e => e.key === 'Enter' && onClick?.()}
    >
      <div style={{ width: w, height: h + tabH, position: 'relative' }}>
        {/* Tab */}
        <div style={{
          position: 'absolute',
          top: 0, left: 0,
          width: tabW, height: tabH,
          background: '#E8B947',
          borderRadius: '3px 3px 0 0',
        }} />

        {/* Body */}
        <div style={{
          position: 'absolute',
          top: tabH, left: 0, right: 0, bottom: 0,
          background: coverUrl
            ? undefined
            : 'linear-gradient(135deg, #F5D77A 0%, #E8B947 50%, #C99428 100%)',
          borderRadius: '2px 6px 4px 4px',
          overflow: 'hidden',
          boxShadow: '0 2px 6px rgba(0,0,0,0.25)',
        }}>
          {coverUrl && (
            <img
              src={coverUrl}
              alt=""
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          )}
          {/* Lucentezza */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0,
            height: '30%',
            background: 'rgba(255,255,255,0.25)',
            pointerEvents: 'none',
          }} />
        </div>

        {/* Indicatore pin */}
        {pinned && (
          <div style={{
            position: 'absolute', top: tabH + 2, right: 2,
            fontSize: 10, lineHeight: 1, pointerEvents: 'none',
            filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.5))',
          }}>
            📌
          </div>
        )}
      </div>

      {label && (
        <span
          className="text-center text-white font-tahoma leading-tight"
          style={{
            fontSize: '11px',
            maxWidth: w + 16,
            textShadow: '1px 1px 2px rgba(0,0,0,0.9), -1px -1px 2px rgba(0,0,0,0.9)',
            wordBreak: 'break-word',
          }}
        >
          {label}
        </span>
      )}
    </div>
  )
}
