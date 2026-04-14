import { useState, useEffect } from 'react'
import { 
  LayoutDashboard,
  Activity,
  Clock,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  Loader2,
  Zap,
  Target,
  Calendar,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react'
import { Button } from '@blinkdotnew/ui'
import { Campaign, Package, Service, blink } from '../lib/blink'

// Stat card component
function StatCard({ 
  label, 
  value, 
  trend, 
  icon,
  description 
}: { 
  label: string
  value: string | number
  trend?: number
  icon: React.ReactNode
  description?: string
}) {
  const trendUp = trend && trend > 0
  const trendDown = trend && trend < 0
  
  return (
    <div className="p-5 rounded-xl bg-card border border-border">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-muted-foreground font-medium">{label}</span>
        <div className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
          {icon}
        </div>
      </div>
      <div className="text-3xl font-bold mb-1">{value}</div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-sm ${trendUp ? 'text-green-600' : trendDown ? 'text-red-600' : 'text-muted-foreground'}`}>
          {trendUp && <ArrowUpRight className="w-4 h-4" />}
          {trendDown && <ArrowDownRight className="w-4 h-4" />}
          <span>{Math.abs(trend)}%</span>
          <span className="text-muted-foreground">vs last period</span>
        </div>
      )}
      {description && (
        <div className="text-sm text-muted-foreground mt-2">{description}</div>
      )}
    </div>
  )
}

// Campaign performance row
function CampaignRow({ 
  campaign, 
  packageItem 
}: { 
  campaign: Campaign
  packageItem?: Package
}) {
  const progress = campaign.total_quantity > 0 
    ? Math.round((campaign.delivered_quantity / campaign.total_quantity) * 100) 
    : 0
  
  const statusColors: Record<string, string> = {
    pending: 'bg-amber-500',
    scheduled: 'bg-blue-500',
    active: 'bg-green-500',
    completed: 'bg-purple-500',
    cancelled: 'bg-red-500'
  }
  
  const speedLabel = campaign.notes?.includes('Speed: gradual') ? 'Gradual' 
    : campaign.notes?.includes('Speed: fast') ? 'Fast'
    : 'Balanced'

  return (
    <div className="p-4 rounded-lg border border-border hover:border-primary/30 transition-colors">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className={`w-2 h-2 rounded-full ${statusColors[campaign.status] || 'bg-gray-500'}`} />
          <div>
            <div className="font-medium">{packageItem?.name || 'Campaign'}</div>
            <div className="text-sm text-muted-foreground truncate max-w-[200px]">
              {campaign.target_url}
            </div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{progress}%</div>
          <div className="text-sm text-muted-foreground">complete</div>
        </div>
      </div>
      
      {/* Progress bar */}
      <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
        <div 
          className="h-full bg-primary rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="grid grid-cols-3 gap-4 text-sm">
        <div>
          <div className="text-muted-foreground">Delivered</div>
          <div className="font-medium">{(campaign.delivered_quantity || 0).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Remaining</div>
          <div className="font-medium">{(campaign.total_quantity - (campaign.delivered_quantity || 0)).toLocaleString()}</div>
        </div>
        <div>
          <div className="text-muted-foreground">Duration</div>
          <div className="font-medium">{campaign.drip_days} days</div>
        </div>
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [services, setServices] = useState<Service[]>([])
  const [loading, setLoading] = useState(true)
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | 'all'>('30d')

  useEffect(() => {
    async function loadData() {
      try {
        const [cmp, pkg, svc] = await Promise.all([
          blink.db.campaigns.list({ orderBy: { created_at: 'desc' } }),
          blink.db.packages.list(),
          blink.db.services.list({ where: { is_active: '1' } })
        ])
        setCampaigns(cmp)
        setPackages(pkg)
        setServices(svc)
      } catch (e) {
        console.error('Failed to load analytics:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  // Filter campaigns by time range
  const filteredCampaigns = campaigns.filter(c => {
    if (timeRange === 'all') return true
    const now = new Date()
    const daysAgo = timeRange === '7d' ? 7 : 30
    const cutoff = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000)
    return new Date(c.created_at || '') >= cutoff
  })

  // Calculate metrics
  const totalCampaigns = filteredCampaigns.length
  const activeCampaigns = filteredCampaigns.filter(c => c.status === 'active').length
  const completedCampaigns = filteredCampaigns.filter(c => c.status === 'completed').length
  const cancelledCampaigns = filteredCampaigns.filter(c => c.status === 'cancelled').length
  
  const totalEngagements = filteredCampaigns.reduce((sum, c) => sum + c.total_quantity, 0)
  const deliveredEngagements = filteredCampaigns.reduce((sum, c) => sum + (c.delivered_quantity || 0), 0)
  const completionRate = totalEngagements > 0 
    ? Math.round((deliveredEngagements / totalEngagements) * 100) 
    : 0

  // Calculate average delivery speed (engagements per day)
  const avgDripDays = filteredCampaigns.length > 0
    ? filteredCampaigns.reduce((sum, c) => sum + c.drip_days, 0) / filteredCampaigns.length
    : 0
  const avgDeliverySpeed = avgDripDays > 0 
    ? Math.round(deliveredEngagements / avgDripDays) 
    : 0

  // Campaign status distribution
  const statusCounts = {
    active: filteredCampaigns.filter(c => c.status === 'active').length,
    pending: filteredCampaigns.filter(c => c.status === 'pending').length,
    scheduled: filteredCampaigns.filter(c => c.status === 'scheduled').length,
    completed: filteredCampaigns.filter(c => c.status === 'completed').length,
    cancelled: filteredCampaigns.filter(c => c.status === 'cancelled').length,
  }

  const getPackage = (id: string) => packages.find(p => p.id === id)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Activity className="w-6 h-6" />
                Analytics
              </h1>
              <p className="text-muted-foreground mt-1">Campaign performance metrics</p>
            </div>
            
            {/* Time range selector */}
            <div className="flex gap-2">
              <button
                onClick={() => setTimeRange('7d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '7d' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                7 days
              </button>
              <button
                onClick={() => setTimeRange('30d')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === '30d' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                30 days
              </button>
              <button
                onClick={() => setTimeRange('all')}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'all' 
                    ? 'bg-primary text-primary-foreground' 
                    : 'bg-muted hover:bg-muted/80'
                }`}
              >
                All time
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            label="Total Campaigns"
            value={totalCampaigns}
            icon={<LayoutDashboard className="w-5 h-5" />}
            description="All time"
          />
          <StatCard 
            label="Active Campaigns"
            value={activeCampaigns}
            icon={<Zap className="w-5 h-5" />}
            description="Running now"
          />
          <StatCard 
            label="Completion Rate"
            value={`${completionRate}%`}
            icon={<CheckCircle2 className="w-5 h-5" />}
            description="Delivered vs ordered"
          />
          <StatCard 
            label="Delivery Speed"
            value={avgDeliverySpeed.toLocaleString()}
            icon={<TrendingUp className="w-5 h-5" />}
            description="Avg per day"
          />
        </div>

        {/* Campaign Status Distribution */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div 
            className="p-4 rounded-xl bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800"
            onClick={() => setTimeRange('all')}
          >
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-sm text-green-700 dark:text-green-400">Active</span>
            </div>
            <div className="text-2xl font-bold">{statusCounts.active}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-sm text-blue-700 dark:text-blue-400">Scheduled</span>
            </div>
            <div className="text-2xl font-bold">{statusCounts.scheduled}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-amber-500" />
              <span className="text-sm text-amber-700 dark:text-amber-400">Pending</span>
            </div>
            <div className="text-2xl font-bold">{statusCounts.pending}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-purple-500" />
              <span className="text-sm text-purple-700 dark:text-purple-400">Completed</span>
            </div>
            <div className="text-2xl font-bold">{statusCounts.completed}</div>
          </div>
          
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className="text-sm text-red-700 dark:text-red-400">Cancelled</span>
            </div>
            <div className="text-2xl font-bold">{statusCounts.cancelled}</div>
          </div>
        </div>

        {/* Delivery Progress */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Engagement Delivery</h3>
            <div className="h-4 bg-muted rounded-full overflow-hidden mb-2">
              <div 
                className="h-full bg-gradient-to-r from-primary to-primary/70 rounded-full"
                style={{ width: `${completionRate}%` }}
              />
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {deliveredEngagements.toLocaleString()} delivered
              </span>
              <span className="font-medium">
                {completionRate}%
              </span>
            </div>
            <div className="mt-4 text-sm text-muted-foreground">
              {totalEngagements.toLocaleString()} total ordered
            </div>
          </div>

          <div className="p-6 rounded-xl bg-card border border-border">
            <h3 className="font-semibold mb-4">Campaign Performance</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Success Rate</span>
                <span className="font-medium">
                  {totalCampaigns > 0 
                    ? Math.round(((statusCounts.active + statusCounts.completed) / totalCampaigns) * 100)
                    : 0}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Duration</span>
                <span className="font-medium">{avgDripDays.toFixed(1)} days</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Avg Daily Rate</span>
                <span className="font-medium">{avgDeliverySpeed.toLocaleString()}/day</span>
              </div>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div>
          <h3 className="font-semibold mb-4">Campaign Details</h3>
          {filteredCampaigns.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-card border border-border">
              <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h4 className="font-medium mb-2">No campaigns yet</h4>
              <p className="text-muted-foreground mb-4">Create your first campaign to see analytics</p>
              <a href="#/order">
                <Button>Create Campaign</Button>
              </a>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredCampaigns.slice(0, 10).map(campaign => (
                <CampaignRow 
                  key={campaign.id} 
                  campaign={campaign}
                  packageItem={getPackage(campaign.package_id)}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}