// Metti i tuoi file WAV in /public/sounds/
// navigate.wav, open.wav, error.wav, boot.wav
const SOUND_PATHS: Record<string, string> = {
  navigate: '/sounds/navigate.wav',
  open:     '/sounds/open.wav',
  error:    '/sounds/error.wav',
  boot:     '/sounds/boot.wav',
}

let enabled = localStorage.getItem('xp-sounds') !== 'false'

export const playSound = (name: keyof typeof SOUND_PATHS) => {
  if (!enabled) return
  const audio = new Audio(SOUND_PATHS[name])
  audio.volume = 0.4
  audio.play().catch(() => {})
}

export const getSoundsEnabled = () => enabled

export const toggleSounds = () => {
  enabled = !enabled
  localStorage.setItem('xp-sounds', String(enabled))
  return enabled
}
