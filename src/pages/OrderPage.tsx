import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Camera, 
  Tv, 
  ThumbsUp, 
  Music2 as TikTokIcon,
  Heart,
  Users,
  Play,
  Check,
  Loader2,
  CreditCard,
  Clock,
  Calendar,
  Zap
} from 'lucide-react'
import { Button, Input, toast } from '@blinkdotnew/ui'
import { Service, Package, blink } from '../lib/blink'

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'

// Blink Backend URL for checkout (uses project ID)
const BACKEND_URL = `${window.location.protocol}//${window.location.host.split('.')[0]}.backend.blink.new`

const PLATFORM_ID = import.meta.env.VITE_BLINK_PROJECT_ID || 'dripfeed-smm-site-l7gylq69'

let stripePromise: Promise<any> | null = null

const getStripe = () => {
  if (!stripePromise) {
    const { loadStripe } = require('@stripe/stripe-js')
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Camera className="w-5 h-5" />,
  youtube: <Tv className="w-5 h-5" />,
  facebook: <ThumbsUp className="w-5 h-5" />,
  tiktok: <TikTokIcon className="w-5 h-5" />,
}

const serviceTypeIcons: Record<string, React.ReactNode> = {
  likes: <Heart className="w-4 h-4" />,
  followers: <Users className="w-4 h-4" />,
  views: <Play className="w-4 h-4" />,
  subscribers: <Users className="w-4 h-4" />,
}

export default function OrderPage() {
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')
  const [currentUser, setCurrentUser] = useState<any>(null)

  const [selectedPlatform, setSelectedPlatform] = useState(new URLSearchParams(window.location.search).get('platform') || '')
  const [selectedService, setSelectedService] = useState(new URLSearchParams(window.location.search).get('service') || '')
  const [selectedPackage, setSelectedPackage] = useState(new URLSearchParams(window.location.search).get('package') || '')
  const [targetUrl, setTargetUrl] = useState('')
  
  // Custom campaign settings
  const [customQuantity, setCustomQuantity] = useState<number | ''>('')
  const [dripSpeed, setDripSpeed] = useState<'gradual' | 'balanced' | 'fast'>('balanced')
  const [startNow, setStartNow] = useState(true)
  const [scheduledDate, setScheduledDate] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        // Load services and packages first
        const [srv, pkg] = await Promise.all([
          blink.db.services.list({ where: { is_active: '1' } }),
          blink.db.packages.list({ orderBy: { quantity: 'asc' } })
        ])
        setServices(srv || [])
        setPackages(pkg || [])
        
        // Try to get user (may fail if not authenticated)
        try {
          const user = await blink.auth.me()
          setCurrentUser(user)
        } catch (authError) {
          // User not logged in - this is okay for public pages
          console.log('User not authenticated (this is fine)')
        }
      } catch (e) {
        console.error('Failed to load data:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const filteredServices = selectedPlatform 
    ? services.filter(s => s.platform === selectedPlatform)
    : services

  const filteredPackages = selectedService
    ? packages.filter(p => p.service_id === selectedService)
    : packages

  const currentService = services.find(s => s.id === selectedService)
  const currentPackage = packages.find(p => p.id === selectedPackage)

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    )
  }

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="w-20 h-20 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-3xl font-bold mb-4">Order Placed!</h1>
          <p className="text-muted-foreground mb-2">Your order ID is:</p>
          <code className="block p-4 bg-muted rounded-lg font-mono text-sm mb-6">
            {orderId}
          </code>
          <p className="text-muted-foreground mb-6">
            Your campaign will start within 1 hour. You'll receive updates as your engagement grows.
          </p>
          <a href="/">
            <Button>Back to Home</Button>
          </a>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </a>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">Create Your Campaign</h1>

        <form className="space-y-8">
          {/* Platform Selection */}
          <div>
            <label className="text-sm font-medium mb-3 block">Select Platform</label>
            <div className="grid grid-cols-4 gap-3">
              {['instagram', 'tiktok', 'youtube', 'facebook'].map(platform => (
                <button
                  key={platform}
                  type="button"
                  onClick={() => {
                    setSelectedPlatform(platform)
                    setSelectedService('')
                    setSelectedPackage('')
                  }}
                  className={`p-4 rounded-xl border-2 transition-all flex flex-col items-center gap-2 ${
                    selectedPlatform === platform 
                      ? 'border-primary bg-primary/5' 
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  {platformIcons[platform]}
                  <span className="text-sm font-medium capitalize">{platform}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Service Selection */}
          {selectedPlatform && (
            <div>
              <label className="text-sm font-medium mb-3 block">Select Service</label>
              <div className="grid grid-cols-3 gap-3">
                {filteredServices.map(service => (
                  <button
                    key={service.id}
                    type="button"
                    onClick={() => {
                      setSelectedService(service.id)
                      setSelectedPackage('')
                    }}
                    className={`p-4 rounded-xl border-2 transition-all text-left ${
                      selectedService === service.id 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      {serviceTypeIcons[service.service_type]}
                      <span className="font-medium capitalize">{service.service_type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2">
                      {service.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Package Selection */}
          {selectedService && (
            <div>
              <label className="text-sm font-medium mb-3 block">Select Package</label>
              {filteredPackages.length === 0 ? (
                <div className="p-4 text-center text-muted-foreground">
                  <p className="mb-2">No packages available for this service.</p>
                  <p className="text-sm">Debug: Service ID: {selectedService}, Total packages: {packages.length}</p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredPackages.map(pkg => (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackage(pkg.id)}
                      className={`p-4 rounded-xl border-2 transition-all ${
                        selectedPackage === pkg.id 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-semibold mb-1">{pkg.name}</div>
                      <div className="text-2xl font-bold text-primary">
                        ${pkg.price}
                      </div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {pkg.quantity} engagements
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {pkg.drip_days} day drip
                      </div>
                      {pkg.is_popular === 1 && (
                        <div className="text-xs text-primary font-medium mt-2">Most Popular</div>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Target URL */}
          {selectedPackage && (
            <div className="animate-fade-in">
              <label className="text-sm font-medium mb-3 block">Your Profile/Post URL</label>
              <Input
                type="url"
                placeholder="https://instagram.com/yourprofile or https://instagram.com/p/yourpost"
                value={targetUrl}
                onChange={(e) => setTargetUrl(e.target.value)}
                required
                className="h-12"
              />
              <p className="text-sm text-muted-foreground mt-2">
                Enter your Instagram profile URL or post URL
              </p>
            </div>
          )}

          {/* Delivery Schedule Settings */}
          {selectedPackage && currentService && (
            <div className="animate-fade-in space-y-6">
              <div className="border-t border-border pt-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Delivery Schedule
                </h3>
                
                {/* Start Now / Schedule Toggle */}
                <div className="flex gap-3 mb-4">
                  <button
                    type="button"
                    onClick={() => setStartNow(true)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      startNow 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Zap className="w-4 h-4" />
                    <span className="font-medium">Start Now</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setStartNow(false)}
                    className={`flex-1 p-3 rounded-lg border-2 transition-all flex items-center justify-center gap-2 ${
                      !startNow 
                        ? 'border-primary bg-primary/5' 
                        : 'border-border hover:border-primary/50'
                    }`}
                  >
                    <Calendar className="w-4 h-4" />
                    <span className="font-medium">Schedule</span>
                  </button>
                </div>

                {/* Scheduled Date Picker */}
                {!startNow && (
                  <div className="mb-4">
                    <label className="text-sm font-medium mb-2 block">Start Date</label>
                    <Input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      min={new Date().toISOString().slice(0, 16)}
                      className="h-12"
                    />
                    <p className="text-sm text-muted-foreground mt-2">
                      Campaign will start at this date and time
                    </p>
                  </div>
                )}

                {/* Drip Speed */}
                <div>
                  <label className="text-sm font-medium mb-3 block">Delivery Speed</label>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      type="button"
                      onClick={() => setDripSpeed('gradual')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        dripSpeed === 'gradual' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">Gradual</div>
                      <div className="text-xs text-muted-foreground">Natural spread</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDripSpeed('balanced')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        dripSpeed === 'balanced' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">Balanced</div>
                      <div className="text-xs text-muted-foreground">Steady flow</div>
                    </button>
                    <button
                      type="button"
                      onClick={() => setDripSpeed('fast')}
                      className={`p-3 rounded-lg border-2 transition-all text-center ${
                        dripSpeed === 'fast' 
                          ? 'border-primary bg-primary/5' 
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <div className="font-medium text-sm">Fast</div>
                      <div className="text-xs text-muted-foreground">Quick delivery</div>
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    {dripSpeed === 'gradual' && 'Engagements spread over the full duration for maximum safety'}
                    {dripSpeed === 'balanced' && 'Most popular choice - natural-looking growth pattern'}
                    {dripSpeed === 'fast' && 'Faster delivery, still looks natural'}
                  </p>
                </div>

                {/* Custom Quantity Input */}
                <div className="mt-4">
                  <label className="text-sm font-medium mb-2 block">Custom Quantity (optional)</label>
                  <Input
                    type="number"
                    placeholder={`Min ${currentService.min_quantity} - Max ${currentService.max_quantity.toLocaleString()}`}
                    value={customQuantity}
                    onChange={(e) => setCustomQuantity(e.target.value ? parseInt(e.target.value) : '')}
                    min={currentService.min_quantity}
                    max={currentService.max_quantity}
                    className="h-12"
                  />
                  <p className="text-sm text-muted-foreground mt-2">
                    Leave empty to use package quantity ({currentPackage?.quantity.toLocaleString() || 'N/A'})
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Order Summary */}
          {selectedPackage && currentPackage && (
            <div className="animate-fade-in p-6 rounded-xl bg-muted/30 border border-border">
              <h3 className="font-semibold mb-4">Order Summary</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Package</span>
                  <span>{currentPackage.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Quantity</span>
                  <span>
                    {customQuantity 
                      ? customQuantity.toLocaleString() 
                      : currentPackage.quantity.toLocaleString()
                    } engagements
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span className="capitalize">
                    {startNow ? 'Starts immediately' : scheduledDate 
                      ? `Scheduled: ${new Date(scheduledDate).toLocaleString()}` 
                      : `${currentPackage.drip_days} days`
                    }
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Speed</span>
                  <span className="capitalize">{dripSpeed}</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-border font-semibold text-lg">
                  <span>Total</span>
                  <span className="text-primary">${currentPackage.price}</span>
                </div>
              </div>
            </div>
          )}

          {/* Submit - Stripe Checkout */}
          {selectedPackage && targetUrl && (
            <Button 
              type="button"
              size="lg" 
              className="w-full"
              disabled={submitting}
              onClick={async () => {
                if (!currentPackage) return
                setSubmitting(true)
                try {
                  // Get current user ID or use guest fallback
                  const userId = currentUser?.id || 'guest'
                  
                  // Calculate effective quantity
                  const effectiveQuantity = customQuantity || currentPackage?.quantity || 0
                  
                  // Calculate drip days based on speed (faster = fewer days)
                  const baseDripDays = currentPackage?.drip_days || 1
                  let adjustedDripDays = baseDripDays
                  if (dripSpeed === 'gradual') adjustedDripDays = Math.round(baseDripDays * 1.5)
                  else if (dripSpeed === 'fast') adjustedDripDays = Math.max(1, Math.round(baseDripDays * 0.5))
                  
                  // Determine start date
                  let campaignStatus: 'pending' | 'scheduled' = 'pending'
                  let startDate: string | null = null
                  
                  if (!startNow && scheduledDate) {
                    campaignStatus = 'scheduled'
                    startDate = scheduledDate
                  } else {
                    startDate = new Date().toISOString()
                  }
                  
                  // Create campaign in DB first
                  const campaignId = `campaign_${Date.now()}`
                  await blink.db.campaigns.create({
                    id: campaignId,
                    user_id: userId,
                    package_id: selectedPackage,
                    target_url: targetUrl,
                    status: campaignStatus,
                    total_quantity: effectiveQuantity,
                    delivered_quantity: 0,
                    drip_days: adjustedDripDays,
                    start_date: startDate,
                    notes: `Speed: ${dripSpeed}, Custom quantity: ${customQuantity ? 'yes' : 'no'}`
                  })

                  // Create order in DB
                  const orderId = `order_${Date.now()}`
                  await blink.db.orders.create({
                    id: orderId,
                    user_id: userId,
                    campaign_id: campaignId,
                    amount: currentPackage?.price || 0,
                    status: 'pending',
                    payment_method: 'stripe'
                  })

                  // Create Stripe Checkout session via backend
                  const response = await fetch(`https://${PLATFORM_ID}.backend.blink.new/create-checkout`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      packageId: selectedPackage,
                      packageName: currentPackage?.name,
                      quantity: effectiveQuantity,
                      price: currentPackage?.price,
                      dripDays: adjustedDripDays,
                      targetUrl,
                      platform: selectedPlatform,
                      serviceType: currentService?.service_type,
                      userId: currentUser?.id
                    })
                  })
                  
                  const { url, error } = await response.json()
                  
                  if (error || !url) {
                    throw new Error(error || 'Failed to create checkout session')
                  }
                  
                  // Open Stripe Checkout in new tab
                  window.open(url, '_blank')
                  
                  setOrderId(orderId)
                  setOrderComplete(true)
                  toast.success('Redirecting to secure payment...')
                } catch (e) {
                  console.error('Order failed:', e)
                  toast.error('Failed to create order. Please try again.')
                } finally {
                  setSubmitting(false)
                }
              }}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="w-5 h-5 mr-2" />
                  Pay ${currentPackage?.price} with Stripe
                </>
              )}
            </Button>
          )}
        </form>
      </main>
    </div>
  )
}