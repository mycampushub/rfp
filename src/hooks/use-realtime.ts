"use client"

import { useEffect, useRef, useCallback } from 'react'
import { useSession } from 'next-auth/react'

export function useRealtimeNotifications(onNotification: (_data: unknown) => void) {
  const { data: session } = useSession()
  const wsRef = useRef<WebSocket | null>(null)
  const reconnectTimeout = useRef<NodeJS.Timeout>(undefined)

  const connect = useCallback(() => {
    const userId = (session?.user as any)?.id
    if (!userId || wsRef.current?.readyState === WebSocket.OPEN) return
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const ws = new WebSocket(`${protocol}//${window.location.host}/?XTransformPort=3001`)
    ws.onmessage = (e) => {
      try { onNotification(JSON.parse(e.data)) } catch (err) { console.error(err) }
    }
    ws.onclose = () => {
      reconnectTimeout.current = setTimeout(connect, 5000)
    }
    wsRef.current = ws
  }, [session?.user, onNotification])

  useEffect(() => {
    connect()
    return () => {
      wsRef.current?.close()
      clearTimeout(reconnectTimeout.current)
    }
  }, [connect])
}
