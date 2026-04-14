import { useEffect, useState } from 'react'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { blink } from './lib/blink'
import { Loader2 } from 'lucide-react'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CampaignDetailPage from './pages/CampaignDetailPage'

function getQueryParams() {
  if (typeof window === 'undefined') return {}
  const params = new URLSearchParams(window.location.search)
  return {
    view: params.get('view'),
    id: params.get('id'),
  }
}

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState({ view: '', id: '' })

  useEffect(() => {
    const handleChange = () => setQuery(getQueryParams())
    handleChange()
    const interval = setInterval(handleChange, 100)
    return () => clearInterval(interval)
  }, [])

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

  if (!isAuthenticated) {
    return (
      <SharedAppLayout appName="DripFeed">
        <LandingPage />
      </SharedAppLayout>
    )
  }

  const showCampaignDetail = query.view === 'campaign' && query.id
  const showAnalytics = query.view === 'analytics'

  return (
    <SharedAppLayout appName="DripFeed">
      {showCampaignDetail ? <CampaignDetailPage /> : showAnalytics ? <AnalyticsPage /> : <DashboardPage />}
    </SharedAppLayout>
  )
}