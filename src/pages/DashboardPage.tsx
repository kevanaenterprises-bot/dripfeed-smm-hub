import { useState, useEffect } from 'react'
import { Link } from '@tanstack/react-router'
import { 
  LayoutDashboard,
  Activity,
  Clock,
  TrendingUp,
  Eye,
  ExternalLink,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Loader2,
  Plus,
  ArrowRight,
  BarChart3,
  Users,
  Heart,
  Music2
} from 'lucide-react'
import { Button, Badge } from '@blinkdotnew/ui'
import { Service, Package, Campaign, Order } from '../lib/blink'

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Heart className="w-4 h-4" />,
  youtube: <Play className="w-4 h-4" />,
  facebook: <Users className="w-4 h-4" />,
  tiktok: <Music2 className="w-4 h-4" />,
}

const statusConfig: Record<string, { color: string; bg: string; icon: React.ReactNode }> = {
  pending: { 
    color: 'text-amber-600 dark:text-amber-400', 
    bg: 'bg-amber-100 dark:bg-amber-900/30',
    icon: <Clock className="w-4 h-4" />
  },
  active: { 
    color: 'text-green-600 dark:text-green-400', 
    bg: 'bg-green-100 dark:bg-green-900/30',
    icon: <Activity className="w-4 h-4" />
  },
  completed: { 
    color: 'text-blue-600 dark:text-blue-400', 
    bg: 'bg-blue-100 dark:bg-blue-900/30',
    icon: <CheckCircle2 className="w-4 h-4" />
  },
  cancelled: { 
    color: 'text-red-600 dark:text-red-400', 
    bg: 'bg-red-100 dark:bg-red-900/30',
    icon: <XCircle className="w-4 h-4" />
  },
}

export default function DashboardPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadData() {
      try {
        const [cmp, pkg] = await Promise.all([
          blink.db.campaigns.list({ orderBy: { created_at: 'desc' } }),
          blink.db.packages.list()
        ])
        setCampaigns(cmp)
        setPackages(pkg)
      } catch (e) {
        console.error('Failed to load campaigns:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const getPackage = (packageId: string) => packages.find(p => p.id === packageId)
  
  const activeCampaigns = campaigns.filter(c => c.status === 'active')
  const completedCampaigns = campaigns.filter(c => c.status === 'completed')
  const totalDelivered = campaigns.reduce((sum, c) => sum + (c.delivered_quantity || 0), 0)
  const totalOrdered = campaigns.reduce((sum, c) => sum + c.total_quantity, 0)

  // Calculate progress percentage for active campaigns
  const getProgress = (campaign: Campaign) => {
    if (campaign.total_quantity === 0) return 0
    return Math.round((campaign.delivered_quantity / campaign.total_quantity) * 100)
  }

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
                <LayoutDashboard className="w-6 h-6" />
                Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">Manage your campaigns</p>
            </div>
            <Link to="/order">
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                New Campaign
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Stats Overview */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Activity className="w-4 h-4" />
              <span className="text-sm">Active</span>
            </div>
            <div className="text-2xl font-bold">{activeCampaigns.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle2 className="w-4 h-4" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="text-2xl font-bold">{completedCampaigns.length}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm">Delivered</span>
            </div>
            <div className="text-2xl font-bold">{totalDelivered.toLocaleString()}</div>
          </div>
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <BarChart3 className="w-4 h-4" />
              <span className="text-sm">In Progress</span>
            </div>
            <div className="text-2xl font-bold">{totalOrdered > 0 ? Math.round((totalDelivered / totalOrdered) * 100) : 0}%</div>
          </div>
        </div>

        {/* Active Campaigns */}
        {activeCampaigns.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-green-500" />
              Active Campaigns
            </h2>
            <div className="space-y-3">
              {activeCampaigns.map(campaign => {
                const pkg = getPackage(campaign.package_id)
                const progress = getProgress(campaign)
                const status = statusConfig[campaign.status] || statusConfig.pending
                
                return (
                  <div 
                    key={campaign.id} 
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/50 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <div className={`w-10 h-10 rounded-lg ${status.bg} ${status.color} flex items-center justify-center`}>
                            {status.icon}
                          </div>
                          <div>
                            <div className="font-medium">{pkg?.name || 'Campaign'}</div>
                            <div className="text-sm text-muted-foreground flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {campaign.target_url.slice(0, 50)}...
                            </div>
                          </div>
                        </div>
                        {/* Progress bar */}
                        <div className="mt-3">
                          <div className="flex justify-between text-sm mb-1">
                            <span className="text-muted-foreground">Progress</span>
                            <span className="font-medium">{campaign.delivered_quantity?.toLocaleString() || 0} / {campaign.total_quantity.toLocaleString()}</span>
                          </div>
                          <div className="h-2 bg-muted rounded-full overflow-hidden">
                            <div 
                              className="h-full bg-primary rounded-full transition-all" 
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                          <div className="flex justify-between text-xs text-muted-foreground mt-1">
                            <span>{progress}% complete</span>
                            <span>{campaign.drip_days} day drip</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <a 
                          href={campaign.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* All Campaigns */}
        <div>
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5" />
            All Campaigns
          </h2>
          
          {campaigns.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl bg-card border border-border">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Activity className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold mb-2">No campaigns yet</h3>
              <p className="text-muted-foreground mb-4">Start your first campaign to see it here</p>
              <Link to="/order">
                <Button>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Campaign
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {campaigns.map(campaign => {
                const pkg = getPackage(campaign.package_id)
                const status = statusConfig[campaign.status] || statusConfig.pending
                
                return (
                  <div 
                    key={campaign.id} 
                    className="p-4 rounded-xl bg-card border border-border hover:border-primary/30 transition-all"
                  >
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-lg ${status.bg} ${status.color} flex items-center justify-center`}>
                          {status.icon}
                        </div>
                        <div>
                          <div className="font-medium">{pkg?.name || 'Campaign'}</div>
                          <div className="text-sm text-muted-foreground flex items-center gap-1">
                            <Eye className="w-3 h-3" />
                            {campaign.target_url.slice(0, 40)}...
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="text-sm text-muted-foreground">Delivered</div>
                          <div className="font-medium">{(campaign.delivered_quantity || 0).toLocaleString()} / {campaign.total_quantity.toLocaleString()}</div>
                        </div>
                        <Badge variant={campaign.status === 'active' ? 'default' : 'secondary'}>
                          {campaign.status}
                        </Badge>
                        <a 
                          href={campaign.target_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="p-2 rounded-lg border border-border hover:bg-muted transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  )
}