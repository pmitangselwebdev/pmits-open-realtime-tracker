import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabase =
  supabaseUrl && supabaseKey
    ? createClient(supabaseUrl, supabaseKey)
    : null

if (!supabaseUrl) {
  console.warn("NEXT_PUBLIC_SUPABASE_URL not set — real-time broadcast disabled")
} else if (!supabaseKey) {
  console.warn("SUPABASE_SERVICE_ROLE_KEY not set — real-time broadcast disabled")
}
