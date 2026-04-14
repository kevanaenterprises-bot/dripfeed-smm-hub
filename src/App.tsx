import { useEffect, useState } from 'react'
import { SharedAppLayout } from './layouts/shared-app-layout'
import { blink } from './lib/blink'
import { Loader2 } from 'lucide-react'
import LandingPage from './pages/LandingPage'
import DashboardPage from './pages/DashboardPage'
import AnalyticsPage from './pages/AnalyticsPage'
import CampaignDetailPage from './pages/CampaignDetailPage'
import OrderPage from './pages/OrderPage'
import ServicesPage from './pages/ServicesPage'

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

  // Determine which page to show based on query params
  const renderPage = () => {
    // Order/New Campaign page
    if (query.view === 'order') {
      return <OrderPage />
    }
    // Campaign detail
    if (query.view === 'campaign' && query.id) {
      return <CampaignDetailPage />
    }
    // Analytics
    if (query.view === 'analytics') {
      return <AnalyticsPage />
    }
    // Services
    if (query.view === 'services') {
      return <ServicesPage />
    }
    // Default for authenticated: Dashboard
    if (isAuthenticated) {
      return <DashboardPage />
    }
    // Not authenticated: Landing page
    return <LandingPage />
  }

  // Handle login - redirect to managed auth
  if (query.view === 'login') {
    blink.auth.login(window.location.href)
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <SharedAppLayout appName="DripFeed">
      {renderPage()}
    </SharedAppLayout>
  )
}
