import Link from "next/link"

export default function HomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-950 to-slate-900">
      <div className="text-center space-y-6">
        <h1 className="gradient-text text-5xl font-bold">
          Open Realtime Tracker
        </h1>
        <p className="text-muted-foreground text-lg max-w-md mx-auto">
          Real-time vehicle tracking system with modern dashboard
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/dashboard"
            className="gradient-accent text-white px-6 py-3 rounded-lg font-medium hover:opacity-90 transition-opacity"
          >
            Go to Dashboard
          </Link>
          <Link
            href="/login"
            className="px-6 py-3 rounded-lg font-medium border border-border text-muted-foreground hover:text-foreground transition-colors"
          >
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
