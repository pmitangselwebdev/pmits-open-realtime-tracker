import { useEffect, useState } from "react"
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native"
import { useTrackingStore } from "../stores/tracking-store"
import { getBufferCount } from "../tracking/offline-buffer"

interface TrackingScreenProps {
  onEdit: () => void
  onStart: () => Promise<boolean>
  onStop: () => Promise<void>
}

export function TrackingScreen({ onEdit, onStart, onStop }: TrackingScreenProps) {
  const store = useTrackingStore()
  const [starting, setStarting] = useState(false)

  useEffect(() => {
    const interval = setInterval(async () => {
      const count = await getBufferCount()
      store.setBufferCount(count)
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  async function handleToggle() {
    if (store.isTracking) {
      await onStop()
    } else {
      setStarting(true)
      try {
        await onStart()
      } catch {
        // onError already set by use-tracking
      }
      setStarting(false)
    }
  }

  function formatCoord(val: number | null): string {
    return val != null ? val.toFixed(6) : "--"
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Open Tracker</Text>
        <Text style={styles.subtitle}>
          {store.serverUrl.replace(/^https?:\/\//, "")}
        </Text>
      </View>

      <View style={styles.card}>
        <View style={styles.cardRow}>
          <Text style={styles.cardLabel}>Vehicle</Text>
          <TouchableOpacity onPress={onEdit}>
            <Text style={styles.editText}>{store.uniqueId} ✎</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsGrid}>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>
            {store.isTracking ? "ACTIVE" : "STOPPED"}
          </Text>
          <Text style={styles.statLabel}>Status</Text>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: store.isTracking ? "#22c55e" : "#6b7280" },
            ]}
          />
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{store.sentCount}</Text>
          <Text style={styles.statLabel}>Sent</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{store.bufferCount}</Text>
          <Text style={styles.statLabel}>Buffered</Text>
        </View>
      </View>

      <View style={styles.locationCard}>
        <Text style={styles.locationTitle}>Last Location</Text>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Lat</Text>
          <Text style={styles.coordValue}>{formatCoord(store.lastLat)}</Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Lng</Text>
          <Text style={styles.coordValue}>{formatCoord(store.lastLng)}</Text>
        </View>
        <View style={styles.coordRow}>
          <Text style={styles.coordLabel}>Speed</Text>
          <Text style={styles.coordValue}>
            {store.lastSpeed != null ? `${store.lastSpeed.toFixed(0)} km/h` : "--"}
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[
          styles.mainButton,
          store.isTracking ? styles.stopButton : styles.startButton,
          (starting || (!store.isConfigured)) && styles.buttonDisabled,
        ]}
        onPress={handleToggle}
        disabled={starting || !store.isConfigured}
      >
        <Text style={styles.mainButtonText}>
          {starting ? "Starting..." : store.isTracking ? "Stop Tracking" : "Start Tracking"}
        </Text>
      </TouchableOpacity>

      {store.error && (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{store.error}</Text>
        </View>
      )}
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
  },
  content: {
    padding: 20,
    paddingTop: 60,
  },
  header: {
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  subtitle: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 2,
  },
  card: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardLabel: {
    fontSize: 14,
    color: "#94a3b8",
  },
  editText: {
    fontSize: 14,
    color: "#3b82f6",
    fontWeight: "600",
  },
  statsGrid: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  statValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  statLabel: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 4,
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginTop: 6,
  },
  locationCard: {
    backgroundColor: "#1e293b",
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  locationTitle: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginBottom: 12,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  coordRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 6,
  },
  coordLabel: {
    fontSize: 13,
    color: "#64748b",
  },
  coordValue: {
    fontSize: 13,
    color: "#f1f5f9",
    fontFamily: Platform.OS === "ios" ? "Menlo" : "monospace",
  },
  mainButton: {
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
  },
  startButton: {
    backgroundColor: "#22c55e",
  },
  stopButton: {
    backgroundColor: "#ef4444",
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  mainButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "700",
  },
  errorBox: {
    backgroundColor: "rgba(239,68,68,0.1)",
    borderRadius: 8,
    padding: 12,
    marginTop: 16,
  },
  errorText: {
    color: "#ef4444",
    fontSize: 13,
    textAlign: "center",
  },
})
