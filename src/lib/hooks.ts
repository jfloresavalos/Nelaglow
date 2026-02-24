'use client'

import { useState, useEffect } from 'react'

/**
 * Debounce a value — evita actualizaciones excesivas en inputs de búsqueda.
 * Reemplaza el patrón manual useRef<setTimeout> repartido en varios componentes.
 */
export function useDebounce<T>(value: T, delay = 500): T {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay)
    return () => clearTimeout(timer)
  }, [value, delay])

  return debouncedValue
}
