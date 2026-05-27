import { useState } from "react"
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native"

interface SetupScreenProps {
  initialUrl: string
  initialId: string
  onSave: (url: string, id: string) => Promise<void>
}

export function SetupScreen({ initialUrl, initialId, onSave }: SetupScreenProps) {
  const [serverUrl, setServerUrl] = useState(initialUrl)
  const [uniqueId, setUniqueId] = useState(initialId)
  const [saving, setSaving] = useState(false)

  async function handleSave() {
    const url = serverUrl.trim()
    const id = uniqueId.trim().toUpperCase()

    if (!url) {
      Alert.alert("Error", "Server URL is required")
      return
    }
    if (!id) {
      Alert.alert("Error", "Unique ID is required")
      return
    }

    setSaving(true)
    try {
      await onSave(url, id)
      Alert.alert("Saved", "Configuration saved successfully")
    } catch {
      Alert.alert("Error", "Failed to save configuration")
    } finally {
      setSaving(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Open Tracker</Text>
        <Text style={styles.subtitle}>Real-time vehicle tracking</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.label}>Server URL</Text>
        <TextInput
          style={styles.input}
          value={serverUrl}
          onChangeText={setServerUrl}
          placeholder="https://your-app.vercel.app"
          placeholderTextColor="#64748b"
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="url"
        />
        <Text style={styles.hint}>
          Your tracking dashboard URL
        </Text>

        <Text style={styles.label}>Unique ID</Text>
        <TextInput
          style={styles.input}
          value={uniqueId}
          onChangeText={setUniqueId}
          placeholder="TRK-A7X3K9"
          placeholderTextColor="#64748b"
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <Text style={styles.hint}>
          Vehicle identifier from admin dashboard
        </Text>

        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.buttonText}>
            {saving ? "Saving..." : "Save & Start Tracking"}
          </Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0f172a",
    justifyContent: "center",
    padding: 24,
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#f1f5f9",
  },
  subtitle: {
    fontSize: 14,
    color: "#64748b",
    marginTop: 4,
  },
  form: {
    gap: 8,
  },
  label: {
    fontSize: 13,
    fontWeight: "600",
    color: "#94a3b8",
    marginTop: 12,
    marginBottom: 4,
  },
  input: {
    backgroundColor: "#1e293b",
    borderWidth: 1,
    borderColor: "#334155",
    borderRadius: 10,
    padding: 14,
    fontSize: 16,
    color: "#f1f5f9",
  },
  hint: {
    fontSize: 11,
    color: "#64748b",
    marginTop: 2,
  },
  button: {
    backgroundColor: "#3b82f6",
    borderRadius: 10,
    padding: 16,
    alignItems: "center",
    marginTop: 24,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
})
