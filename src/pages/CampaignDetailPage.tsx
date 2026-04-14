import { useState, useEffect } from 'react'
// Using standard anchor tags since no react-router in this project
import { 
  ArrowLeft,
  ExternalLink,
  Clock,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  Play,
  Pause,
  RefreshCw,
  Calendar,
  Target,
  TrendingUp,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { Button, Badge, toast } from '@blinkdotnew/ui'
import { Campaign, Package, Service, Order, blink } from '../lib/blink'

function getCampaignIdFromUrl() {
  const params = new URLSearchParams(window.location.search)
  return params.get('id') || ''
}

const statusConfig: Record<string, { 
  color: string
  bg: string
  borderColor: string
  icon: React.ReactNode
  label: string
}> = {
  pending: { 
    color: 'text-amber-600',
    bg: 'bg-amber-50 dark:bg-amber-950',
    borderColor: 'border-amber-200 dark:border-amber-800',
    icon: <Clock className="w-4 h-4" />,
    label: 'Pending'
  },
  processing: { 
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <RefreshCw className="w-4 h-4" />,
    label: 'Processing'
  },
  active: { 
    color: 'text-green-600',
    bg: 'bg-green-50 dark:bg-green-950',
    borderColor: 'border-green-200 dark:border-green-800',
    icon: <Activity className="w-4 h-4" />,
    label: 'Active'
  },
  completed: { 
    color: 'text-blue-600',
    bg: 'bg-blue-50 dark:bg-blue-950',
    borderColor: 'border-blue-200 dark:border-blue-800',
    icon: <CheckCircle2 className="w-4 h-4" />,
    label: 'Completed'
  },
  cancelled: { 
    color: 'text-red-600',
    bg: 'bg-red-50 dark:bg-red-950',
    borderColor: 'border-red-200 dark:border-red-800',
    icon: <XCircle className="w-4 h-4" />,
    label: 'Cancelled'
  },
}

export default function CampaignDetailPage() {
  const campaignId = getCampaignIdFromUrl()
  
  const [campaign, setCampaign] = useState<Campaign | null>(null)
  const [order, setOrder] = useState<Order | null>(null)
  const [packageItem, setPackageItem] = useState<Package | null>(null)
  const [service, setService] = useState<Service | null>(null)
  const [loading, setLoading] = useState(true)
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    async function loadData() {
      try {
        // Load campaign
        const cmp = await blink.db.campaigns.get(campaignId)
        if (!cmp) {
          toast.error('Campaign not found')
          return
        }
        setCampaign(cmp)

        // Load related data
        if (cmp.package_id) {
          const [pkg, orders] = await Promise.all([
            blink.db.packages.get(cmp.package_id),
            blink.db.orders.list({
              where: { campaign_id: campaignId }
            })
          ])
          setPackageItem(pkg || null)
          
          // Get first order for this campaign
          if (orders.length > 0) {
            setOrder(orders[0])
             
            // Get service from package
            if (pkg?.service_id) {
              const svc = await blink.db.services.get(pkg.service_id)
              setService(svc)
            }
          }
        }
      } catch (e) {
        console.error('Failed to load campaign:', e)
        toast.error('Failed to load campaign')
      } finally {
        setLoading(false)
      }
    }
    
    if (campaignId) {
      loadData()
    }
  }, [campaignId])

  const handleCancel = async () => {
    if (!campaign || !confirm('Are you sure you want to cancel this campaign?')) return
    
    setIsCancelling(true)
    try {
      await blink.db.campaigns.update(campaign.id, {
        status: 'cancelled'
      })
      setCampaign({ ...campaign, status: 'cancelled' })
      toast.success('Campaign cancelled')
    } catch (e) {
      console.error('Failed to cancel:', e)
      toast.error('Failed to cancel campaign')
    } finally {
      setIsCancelling(false)
    }
  }

  const progress = campaign 
    ? Math.round((campaign.delivered_quantity / campaign.total_quantity) * 100) 
    : 0

  const status = campaign ? (statusConfig[campaign.status] || statusConfig.pending) : statusConfig.pending

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Campaign Not Found</h2>
          <p className="text-muted-foreground mb-4">This campaign doesn't exist or was deleted.</p>
          <a href="/">
            <Button>Back to Dashboard</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a 
            href="/" 
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </a>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl ${status.bg} ${status.color} flex items-center justify-center ${status.borderColor} border`}>
                {status.icon}
              </div>
              <div>
                <h1 className="text-2xl font-bold">{packageItem?.name || 'Campaign'}</h1>
                <p className="text-muted-foreground flex items-center gap-2">
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${status.bg} ${status.color}`}>
                    {status.label}
                  </span>
                  <span>•</span>
                  <span>ID: {campaign.id}</span>
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {campaign.status === 'active' && (
                <Button 
                  variant="outline" 
                  onClick={handleCancel}
                  disabled={isCancelling}
                >
                  {isCancelling ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Pause className="w-4 h-4 mr-2" />
                  )}
                  Cancel
                </Button>
              )}
              <a 
                href={campaign.target_url} 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Button variant="outline">
                  <ExternalLink className="w-4 h-4 mr-2" />
                  View {service?.platform || 'Link'}
                </Button>
              </a>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* Progress Section */}
        <div className={`rounded-xl ${status.bg} ${status.borderColor} border p-6 mb-6`}>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Delivery Progress</h2>
            <span className="text-2xl font-bold">{progress}%</span>
          </div>
          
          <div className="h-4 bg-muted rounded-full overflow-hidden mb-4">
            <div 
              className="h-full bg-primary rounded-full transition-all" 
              style={{ width: `${progress}%` }}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-4 text-center">
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-sm text-muted-foreground">Delivered</div>
              <div className="text-xl font-bold">{(campaign.delivered_quantity || 0).toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-sm text-muted-foreground">Remaining</div>
              <div className="text-xl font-bold">{(campaign.total_quantity - (campaign.delivered_quantity || 0)).toLocaleString()}</div>
            </div>
            <div className="p-3 rounded-lg bg-background/50">
              <div className="text-sm text-muted-foreground">Total Ordered</div>
              <div className="text-xl font-bold">{campaign.total_quantity.toLocaleString()}</div>
            </div>
          </div>
        </div>

        {/* Campaign Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {/* Target URL */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Target URL</span>
            </div>
            <a 
              href={campaign.target_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
            >
              {campaign.target_url}
            </a>
          </div>

          {/* Service */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <TrendingUp className="w-4 h-4" />
              <span className="text-sm font-medium">Service</span>
            </div>
            <div className="font-medium">{service?.name || packageItem?.service_id}</div>
            <div className="text-sm text-muted-foreground capitalize">
              {service?.platform} {service?.service_type}
            </div>
          </div>

          {/* Quantity */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Target className="w-4 h-4" />
              <span className="text-sm font-medium">Quantity</span>
            </div>
            <div className="font-medium">{campaign.total_quantity.toLocaleString()}</div>
            <div className="text-sm text-muted-foreground">
              {service?.price_per_unit ? `$${service.price_per_unit}/unit` : ''}
            </div>
          </div>

          {/* Drip Days */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Clock className="w-4 h-4" />
              <span className="text-sm font-medium">Delivery Duration</span>
            </div>
            <div className="font-medium">{campaign.drip_days} days</div>
            <div className="text-sm text-muted-foreground">
              ~{Math.round(campaign.total_quantity / campaign.drip_days)} per day
            </div>
          </div>

          {/* Dates */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">Timeline</span>
            </div>
            <div className="font-medium">Started: {campaign.start_date || 'Pending'}</div>
            <div className="text-sm text-muted-foreground">
              End: {campaign.end_date || `~${campaign.drip_days} days`}
            </div>
          </div>

          {/* Order Info */}
          <div className="p-4 rounded-xl bg-card border border-border">
            <div className="flex items-center gap-2 text-muted-foreground mb-2">
              <DollarSign className="w-4 h-4" />
              <span className="text-sm font-medium">Order</span>
            </div>
            {order && (
              <>
                <div className="font-medium">${order.amount}</div>
                <div className="text-sm text-muted-foreground capitalize">
                  {order.status} • {order.payment_method || 'pending'}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Notes */}
        {campaign.notes && (
          <div className="p-4 rounded-xl bg-card border border-border">
            <h3 className="font-medium mb-2">Notes</h3>
            <p className="text-muted-foreground">{campaign.notes}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 mt-6">
          {campaign.status === 'pending' && (
            <Button 
              onClick={async () => {
                try {
                  await blink.db.campaigns.update(campaign.id, {
                    status: 'active'
                  })
                  setCampaign({ ...campaign, status: 'active' })
                  toast.success('Campaign activated')
                } catch (e) {
                  toast.error('Failed to activate')
                }
              }}
            >
              <Play className="w-4 h-4 mr-2" />
              Start Campaign
            </Button>
          )}
          
          <a href="/">
            <Button variant="outline">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </a>
        </div>
      </main>
    </div>
  )
}
