import { useEffect, useState } from "react"

/**
 * Debounce a value by the given delay in ms.
 * Returns the debounced value.
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}

/**
 * Returns a debounced version of the callback function.
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => void>(
  callback: T,
  delay = 300
): T {
  const [timer, setTimer] = useState<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    return () => {
      if (timer) clearTimeout(timer)
    }
  }, [timer])

  return ((...args: unknown[]) => {
    if (timer) clearTimeout(timer)
    setTimer(setTimeout(() => callback(...args), delay))
  }) as T
}
