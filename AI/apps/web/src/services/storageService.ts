const PREFIX = 'insightflow:'

export function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key)
    if (!raw) return fallback
    return JSON.parse(raw) as T
  } catch {
    return fallback
  }
}

export function setItem<T>(key: string, value: T) {
  localStorage.setItem(PREFIX + key, JSON.stringify(value))
}

export function removeItem(key: string) {
  localStorage.removeItem(PREFIX + key)
}
