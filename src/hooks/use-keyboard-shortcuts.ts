"use client"

import { useEffect, useRef } from "react"

/**
 * Global keyboard shortcuts registry.
 * Each page can add shortcuts with useKeyboardShortcuts.
 */
const globalShortcuts = new Map<string, () => void>()

if (typeof window !== "undefined") {
  document.addEventListener("keydown", (e) => {
    // Ignore when typing in inputs/textareas
    const target = e.target as HTMLElement
    if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
      return
    }
    const key = [
      e.ctrlKey || e.metaKey ? "mod" : "",
      e.shiftKey ? "shift" : "",
      e.altKey ? "alt" : "",
      e.key.toLowerCase(),
    ].filter(Boolean).join("+")
    const handler = globalShortcuts.get(key)
    if (handler) {
      e.preventDefault()
      handler()
    }
  })
}

/**
 * Register keyboard shortcuts for the current component.
 * Automatically cleans up on unmount.
 *
 * @example
 * useKeyboardShortcuts({
 *   "mod+k": () => setSearchOpen(true),
 *   "mod+n": () => router.push("/rfps/create"),
 *   "escape": () => setOpen(false),
 * })
 */
export function useKeyboardShortcuts(shortcuts: Record<string, () => void>) {
  const keysRef = useRef(Object.keys(shortcuts))
  keysRef.current = Object.keys(shortcuts)

  useEffect(() => {
    for (const key of keysRef.current) {
      globalShortcuts.set(key, shortcuts[key])
    }
    return () => {
      for (const key of keysRef.current) {
        globalShortcuts.delete(key)
      }
    }
  })
}
