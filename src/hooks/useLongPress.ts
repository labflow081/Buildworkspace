import React, { useCallback, useRef } from 'react'

export const useLongPress = (callback: () => void, ms = 500) => {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const startPosRef = useRef<{ x: number; y: number } | null>(null)

  const cancelTimer = useCallback(() => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }, [])

  const onMouseDown = useCallback((_e: React.MouseEvent) => {
    cancelTimer()
    timerRef.current = setTimeout(callback, ms)
  }, [callback, ms, cancelTimer])

  const onMouseUp = useCallback((_e: React.MouseEvent) => cancelTimer(), [cancelTimer])
  const onMouseLeave = useCallback((_e: React.MouseEvent) => cancelTimer(), [cancelTimer])

  const onTouchStart = useCallback((e: React.TouchEvent) => {
    cancelTimer()
    const t = e.touches[0]
    startPosRef.current = { x: t.clientX, y: t.clientY }
    timerRef.current = setTimeout(callback, ms)
  }, [callback, ms, cancelTimer])

  const onTouchMove = useCallback((e: React.TouchEvent) => {
    if (!startPosRef.current || !timerRef.current) return
    const t = e.touches[0]
    const dx = Math.abs(t.clientX - startPosRef.current.x)
    const dy = Math.abs(t.clientY - startPosRef.current.y)
    if (dx > 10 || dy > 10) {
      cancelTimer()
      startPosRef.current = null
    }
  }, [cancelTimer])

  const onTouchEnd = useCallback((_e: React.TouchEvent) => cancelTimer(), [cancelTimer])
  const onTouchCancel = useCallback((_e: React.TouchEvent) => cancelTimer(), [cancelTimer])

  // Previene il context menu nativo iOS dopo long-press
  const onContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
  }, [])

  return { onMouseDown, onMouseUp, onMouseLeave, onTouchStart, onTouchEnd, onTouchMove, onTouchCancel, onContextMenu }
}
