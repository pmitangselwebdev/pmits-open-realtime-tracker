import { useState } from "react"
import { StatusBar } from "expo-status-bar"
import { useTrackingStore } from "./src/stores/tracking-store"
import { useTracking } from "./src/hooks/use-tracking"
import { SetupScreen } from "./src/screens/SetupScreen"
import { TrackingScreen } from "./src/screens/TrackingScreen"

export default function App() {
  const { isConfigured, setConfigured } = useTrackingStore()
  const { start, stop, configure } = useTracking()
  const [editing, setEditing] = useState(false)

  return (
    <>
      <StatusBar style="light" />
      {!isConfigured || editing ? (
        <SetupScreen
          initialUrl={useTrackingStore.getState().serverUrl}
          initialId={useTrackingStore.getState().uniqueId}
          onSave={async (url, id) => {
            await configure(url, id)
            setConfigured(true)
            setEditing(false)
          }}
        />
      ) : (
        <TrackingScreen
          onEdit={() => setEditing(true)}
          onStart={start}
          onStop={stop}
        />
      )}
    </>
  )
}
