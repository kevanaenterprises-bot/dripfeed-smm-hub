import { useState, useEffect } from 'react'
import { 
  ArrowLeft,
  Instagram, 
  Youtube as YoutubeIcon, 
  Facebook, 
  Music2 as TikTokIcon,
  Heart,
  Users,
  Play,
  ThumbsUp,
  Check,
  Loader2,
  CreditCard
} from 'lucide-react'
import { Button, Input, toast } from '@blinkdotnew/ui'
import { Service, Package, blink } from '../lib/blink'

// Stripe publishable key from environment
const STRIPE_PUBLISHABLE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_test_placeholder'

let stripePromise: Promise<any> | null = null

const getStripe = () => {
  if (!stripePromise) {
    const { loadStripe } = require('@stripe/stripe-js')
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY)
  }
  return stripePromise
}

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Instagram className="w-5 h-5" />,
  youtube: <Youtube className="w-5 h-5" />,
  facebook: <Facebook className="w-5 h-5" />,
  tiktok: <Music2 className="w-5 h-5" />,
}

const serviceTypeIcons: Record<string, React.ReactNode> = {
  likes: <Heart className="w-4 h-4" />,
  followers: <Users className="w-4 h-4" />,
  views: <Play className="w-4 h-4" />,
  subscribers: <Users className="w-4 h-4" />,
}

export default function OrderPage() {
  const [searchParams] = useSearchParams()
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [orderComplete, setOrderComplete] = useState(false)
  const [orderId, setOrderId] = useState('')

  const [selectedPlatform, setSelectedPlatform] = useState(searchParams.get('platform') || '')
  const [selectedService, setSelectedService] = useState(searchParams.get('service') || '')
  const [selectedPackage, setSelectedPackage] = useState(searchParams.get('package') || '')
  const [targetUrl, setTargetUrl] = useState('')

  useEffect(() => {
    async function loadData() {
      try {
        const [srv, pkg] = await Promise.all([
          blink.db.services.list({ where: { is_active: '1' } }),
          blink.db.packages.list({ orderBy: { quantity: 'asc' } })
        ])
        setServices(srv)
        setPackages(pkg)
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
          <Link to="/">
            <Button>Back to Home</Button>
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
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
                  <span>{currentPackage.quantity.toLocaleString()} engagements</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Delivery</span>
                  <span>{currentPackage.drip_days} days gradual</span>
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
                  // Create campaign in DB first
                  const campaignId = `campaign_${Date.now()}`
                  await blink.db.campaigns.create({
                    id: campaignId,
                    user_id: 'guest',
                    package_id: selectedPackage,
                    target_url: targetUrl,
                    status: 'pending',
                    total_quantity: currentPackage?.quantity || 0,
                    delivered_quantity: 0,
                    drip_days: currentPackage?.drip_days || 1
                  })

                  // Create order in DB
                  const orderId = `order_${Date.now()}`
                  await blink.db.orders.create({
                    id: orderId,
                    user_id: 'guest',
                    campaign_id: campaignId,
                    amount: currentPackage?.price || 0,
                    status: 'pending',
                    payment_method: 'stripe'
                  })

                  // Open Stripe Checkout in new tab
                  // Using the Payment Link we created
                  window.open('https://buy.stripe.com/dRmeVee0PcyDegsaBJbV600', '_blank')
                  
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
