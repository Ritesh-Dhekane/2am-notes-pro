// Counts skeletons on screen. If any stay up longer than SLOW_MS, the "server is slow" toast shows.

import { useEffect, useState } from 'react'

const SLOW_MS = 2500
let active = 0
const listeners = new Set()
const emit = () => listeners.forEach((fn) => fn(active))

export function useLoadingMark() {
  useEffect(() => {
    active += 1
    emit()
    return () => {
      active -= 1
      emit()
    }
  }, [])
}

/** True once something has been loading for longer than SLOW_MS; false again when it finishes. */
export function useSlowLoading() {
  const [slow, setSlow] = useState(false)
  useEffect(() => {
    let timer
    const onChange = (count) => {
      if (count > 0 && !timer) timer = setTimeout(() => setSlow(true), SLOW_MS)
      if (count === 0) {
        clearTimeout(timer)
        timer = undefined
        setSlow(false)
      }
    }
    listeners.add(onChange)
    onChange(active)
    return () => {
      listeners.delete(onChange)
      clearTimeout(timer)
    }
  }, [])
  return slow
}
