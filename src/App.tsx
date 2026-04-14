import { useEffect, useState } from 'react'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { blink } from './lib/blink'
import { Loader2 } from 'lucide-react'

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = blink.auth.onAuthStateChanged((state) => {
      setIsAuthenticated(state.isAuthenticated)
      if (!state.isLoading) setIsLoading(false)
    })
    return unsubscribe
  }, [])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  // If not authenticated, show landing page (public)
  if (!isAuthenticated) {
    return (
      <SharedAppLayout appName="DripFeed">
        <LandingPage />
      </SharedAppLayout>
    )
  }

  // Authenticated users see dashboard
  return (
    <SharedAppLayout appName="DripFeed">
      <DashboardPage />
    </SharedAppLayout>
  )
}

function LandingPage() {
  const handleLogin = () => {
    blink.auth.login()
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-8 text-center">
      <div className="max-w-2xl">
        <h1 className="text-4xl font-bold mb-4">Welcome to DripFeed</h1>
        <p className="text-xl text-muted-foreground mb-8">
          Boost your social media presence with gradual, natural-looking engagement delivery.
        </p>
        
        <div className="space-y-4">
          <button
            onClick={handleLogin}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 transition-colors"
          >
            Sign In to Access Dashboard
          </button>
          
          <p className="text-sm text-muted-foreground">
            Already have an account? <button onClick={handleLogin} className="text-primary hover:underline">Sign in</button>
          </p>
        </div>

        <div className="mt-12 grid grid-cols-3 gap-6 text-left">
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">Gradual Delivery</h3>
            <p className="text-sm text-muted-foreground">Engagements drip over time for natural growth</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">Multiple Platforms</h3>
            <p className="text-sm text-muted-foreground">Instagram, TikTok, YouTube, Facebook</p>
          </div>
          <div className="p-4 rounded-lg bg-card border">
            <h3 className="font-semibold mb-2">Real Analytics</h3>
            <p className="text-sm text-muted-foreground">Track delivery progress in real-time</p>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardPage() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Dashboard</h1>
      <p className="text-muted-foreground mb-8">
        Welcome back! Use the sidebar to navigate.
      </p>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-6 rounded-xl bg-card border">
          <div className="text-sm text-muted-foreground mb-1">Active Campaigns</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="p-6 rounded-xl bg-card border">
          <div className="text-sm text-muted-foreground mb-1">Total Delivered</div>
          <div className="text-3xl font-bold">0</div>
        </div>
        <div className="p-6 rounded-xl bg-card border">
          <div className="text-sm text-muted-foreground mb-1">Total Spent</div>
          <div className="text-3xl font-bold">$0</div>
        </div>
      </div>
    </div>
  )
}
