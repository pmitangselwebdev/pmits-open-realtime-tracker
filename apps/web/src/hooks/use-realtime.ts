"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase-client"

type MessageHandler = (payload: any) => void

interface UseRealtimeOptions {
  channel: string
  event: string
  onMessage?: MessageHandler
}

export function useRealtime({
  channel: channelName,
  event,
  onMessage,
}: UseRealtimeOptions) {
  const channelRef = useRef<any>(null)
  const onMessageRef = useRef(onMessage)
  onMessageRef.current = onMessage

  const subscribe = useCallback(() => {
    if (!supabase) return

    channelRef.current = supabase.channel(channelName)

    channelRef.current.on(
      "broadcast",
      { event },
      (payload: any) => {
        onMessageRef.current?.(payload)
      }
    )

    channelRef.current.subscribe()
  }, [channelName, event])

  useEffect(() => {
    subscribe()

    return () => {
      channelRef.current?.unsubscribe()
      channelRef.current = null
    }
  }, [subscribe])
}
