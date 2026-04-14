import { useEffect, useState } from 'react'
// Using standard anchor tags for navigation since we don't have react-router
import { 
  Camera,
  Tv, 
  ThumbsUp, 
  Music2 as TikTokIcon, 
  Zap, 
  Clock, 
  TrendingUp, 
  Shield, 
  ArrowRight,
  CheckCircle2,
  Heart,
  Users,
  Play,
  Droplets,
  Link
} from 'lucide-react'
import { Button } from '@blinkdotnew/ui'
import { Service, Package, blink } from '../lib/blink'

const platformIcons: Record<string, React.ReactNode> = {
  instagram: <Camera className="w-6 h-6" />,
  youtube: <Tv className="w-6 h-6" />,
  facebook: <ThumbsUp className="w-6 h-6" />,
  tiktok: <TikTokIcon className="w-6 h-6" />,
}

const serviceIcons: Record<string, React.ReactNode> = {
  heart: <Heart className="w-5 h-5" />,
  users: <Users className="w-5 h-5" />,
  play: <Play className="w-5 h-5" />,
  'thumbs-up': <ThumbsUp className="w-5 h-5" />,
}

export default function LandingPage() {
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

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
        console.error('Failed to load services:', e)
      } finally {
        setLoading(false)
      }
    }
    loadData()
  }, [])

  const popularPackage = packages.find(p => p.is_popular === 1)

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center">
                <Droplets className="w-6 h-6 text-primary-foreground" />
              </div>
              <span className="font-bold text-xl">DripFeed</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#services" className="text-muted-foreground hover:text-foreground transition-colors">Services</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors">How It Works</a>
            </div>
            <div className="flex items-center gap-3">
              <a href="/?view=login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </a>
              <a href="/?view=order">
                <Button size="sm">Get Started</Button>
              </a>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="absolute top-20 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary text-secondary-foreground text-sm font-medium mb-6">
              <Zap className="w-4 h-4 text-amber-500" />
              Gradual Delivery for Natural Growth
            </div>
            <h1 className="text-5xl sm:text-6xl font-bold mb-6 leading-tight">
              Boost Your Social Presence{' '}
              <span className="text-primary">Naturally</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 leading-relaxed">
              DripFeed delivers likes, followers, and engagement gradually over time—keeping your growth natural and avoiding algorithm penalties.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="#/order">
                <Button size="lg" className="text-lg px-8">
                  Start Your Campaign
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </a>
              <a href="#how-it-works">
                <Button variant="outline" size="lg" className="text-lg px-8">
                  Learn More
                </Button>
              </a>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16">
            {[
              { label: 'Active Campaigns', value: '12K+' },
              { label: 'Deliveries Today', value: '850K' },
              { label: 'Success Rate', value: '99.2%' },
              { label: 'Platforms', value: '4' },
            ].map((stat, i) => (
              <div key={i} className="text-center p-6 rounded-2xl bg-card border border-border">
                <div className="text-3xl font-bold text-primary mb-1">{stat.value}</div>
                <div className="text-sm text-muted-foreground">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section id="services" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Our Services</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose from our range of social media growth services across major platforms
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Instagram */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white mb-4">
                {platformIcons.instagram}
              </div>
              <h3 className="text-xl font-semibold mb-2">Instagram</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-pink-500" /> Likes
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-pink-500" /> Followers
                </li>
                <li className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-pink-500" /> Views
                </li>
              </ul>
              <a href="#/order?platform=instagram">
                <Button variant="ghost" className="w-full mt-4 group-hover:text-primary">
                  Order Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            {/* TikTok */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-400 to-purple-500 flex items-center justify-center text-white mb-4">
                {platformIcons.tiktok}
              </div>
              <h3 className="text-xl font-semibold mb-2">TikTok</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <Heart className="w-4 h-4 text-cyan-400" /> Likes
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-cyan-400" /> Followers
                </li>
                <li className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-cyan-400" /> Views
                </li>
              </ul>
              <a href="#/order?platform=tiktok">
                <Button variant="ghost" className="w-full mt-4 group-hover:text-primary">
                  Order Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            {/* YouTube */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center text-white mb-4">
                {platformIcons.youtube}
              </div>
              <h3 className="text-xl font-semibold mb-2">YouTube</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-red-500" /> Likes
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-red-500" /> Subscribers
                </li>
                <li className="flex items-center gap-2">
                  <Play className="w-4 h-4 text-red-500" /> Views
                </li>
              </ul>
              <a href="#/order?platform=youtube">
                <Button variant="ghost" className="w-full mt-4 group-hover:text-primary">
                  Order Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>

            {/* Facebook */}
            <div className="p-6 rounded-2xl bg-card border border-border hover:border-primary/50 transition-all hover:shadow-lg group">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white mb-4">
                {platformIcons.facebook}
              </div>
              <h3 className="text-xl font-semibold mb-2">Facebook</h3>
              <ul className="space-y-2 text-muted-foreground">
                <li className="flex items-center gap-2">
                  <ThumbsUp className="w-4 h-4 text-blue-500" /> Likes
                </li>
                <li className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-blue-500" /> Followers
                </li>
              </ul>
              <a href="#/order?platform=facebook">
                <Button variant="ghost" className="w-full mt-4 group-hover:text-primary">
                  Order Now <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Choose your package. All orders include gradual drip delivery at no extra cost.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {packages.slice(0, 6).map((pkg, i) => (
              <div 
                key={pkg.id} 
                className={`p-6 rounded-2xl bg-card border-2 transition-all hover:shadow-xl ${
                  pkg.is_popular ? 'border-primary relative' : 'border-border'
                }`}
              >
                {pkg.is_popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                    Most Popular
                  </div>
                )}
                <div className="text-center mb-6">
                  <h3 className="text-lg font-semibold text-muted-foreground mb-2">{pkg.name}</h3>
                  <div className="text-4xl font-bold">
                    ${pkg.price}
                    <span className="text-lg font-normal text-muted-foreground">/order</span>
                  </div>
                  <p className="text-muted-foreground text-sm mt-2">
                    {pkg.quantity} engagements • {pkg.drip_days} day drip
                  </p>
                </div>
                <ul className="space-y-3 mb-6">
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Gradual delivery over {pkg.drip_days} days
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Real, active accounts
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    24/7 support
                  </li>
                  <li className="flex items-center gap-2 text-sm">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Start within 1 hour
                  </li>
                </ul>
                <a href={`/order?package=${pkg.id}`} className="block">
                  <Button className="w-full" variant={pkg.is_popular ? 'default' : 'outline'}>
                    Order Now
                  </Button>
                </a>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-20 px-4 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How DripFeed Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get natural-looking growth without the risks
            </p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { icon: Clock, title: 'Choose Package', desc: 'Select your desired engagement and platform' },
              { icon: Link, title: 'Enter Link', desc: 'Provide your post or profile URL' },
              { icon: Droplets, title: 'We Drip Feed', desc: 'Deliveries happen gradually over days' },
              { icon: TrendingUp, title: 'Watch Growth', desc: 'See your engagement grow naturally' },
            ].map((step, i) => (
              <div key={i} className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <step.icon className="w-8 h-8 text-primary" />
                </div>
                <div className="text-sm text-primary font-semibold mb-2">Step {i + 1}</div>
                <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
                <p className="text-muted-foreground text-sm">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-20 px-4">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h2 className="text-4xl font-bold mb-6">Why Choose DripFeed?</h2>
              <div className="space-y-6">
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-100 dark:bg-green-900/30 flex items-center justify-center shrink-0">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Safe & Compliant</h3>
                    <p className="text-muted-foreground">Our gradual delivery system mimics organic growth, keeping your account safe.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Gradual Delivery</h3>
                    <p className="text-muted-foreground">Deliveries are spread over time—no sudden spikes that trigger algorithms.</p>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg mb-1">Real Results</h3>
                    <p className="text-muted-foreground">Engagements from real, active accounts that actually engage with your content.</p>
                  </div>
                </div>
              </div>
            </div>
            <div className="relative">
              <div className="p-8 rounded-3xl bg-card border border-border">
                <div className="space-y-4">
                  {[
                    { day: 'Day 1', delivered: '15%', bar: 'bg-primary/20' },
                    { day: 'Day 2', delivered: '25%', bar: 'bg-primary/40' },
                    { day: 'Day 3', delivered: '35%', bar: 'bg-primary/60' },
                    { day: 'Day 4', delivered: '15%', bar: 'bg-primary/80' },
                    { day: 'Day 5', delivered: '10%', bar: 'bg-primary' },
                  ].map((d, i) => (
                    <div key={i}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{d.day}</span>
                        <span className="font-medium">{d.delivered}</span>
                      </div>
                      <div className="h-3 bg-muted rounded-full overflow-hidden">
                        <div className={`h-full ${d.bar} rounded-full transition-all`} style={{ width: d.delivered }} />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-center text-sm text-muted-foreground mt-4">
                  Example: 1,000 likes over 5 days
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Grow Your Social Presence?</h2>
          <p className="text-xl text-muted-foreground mb-8">
            Join thousands of creators who trust DripFeed for their social media growth.
          </p>
          <a href="#/order">
            <Button size="lg" className="text-xl px-12">
              Start Your Campaign Now
              <ArrowRight className="w-6 h-6 ml-3" />
            </Button>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
                <Droplets className="w-4 h-4 text-primary-foreground" />
              </div>
              <span className="font-semibold">DripFeed</span>
            </div>
            <p className="text-muted-foreground text-sm">
              © 2024 DripFeed. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
