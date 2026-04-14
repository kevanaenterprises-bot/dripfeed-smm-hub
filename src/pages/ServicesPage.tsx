import { useEffect, useState } from 'react'
import { blink } from '../lib/blink'
import { 
  Camera as InstagramIcon,
  Tv as YoutubeIcon,
  Music as TikTokIcon, 
  Heart,
  ThumbsUp,
  Users,
  Play,
  Search,
  Filter,
  Loader2
} from 'lucide-react'

interface Service {
  id: string
  name: string
  platform: string
  service_type: string
  description: string
  icon: string
  min_quantity: number
  max_quantity: number
  price_per_unit: number
}

interface Package {
  id: string
  service_id: string
  name: string
  quantity: number
  price: number
  drip_days: number
  is_popular: number
}

const platformIcons: Record<string, React.ComponentType<{className?: string}>> = {
  instagram: InstagramIcon,
  youtube: YoutubeIcon,
  tiktok: TikTokIcon,
  facebook: ThumbsUp,
}

const typeIcons: Record<string, React.ComponentType<{className?: string}>> = {
  likes: Heart,
  followers: Users,
  views: Play,
  subscribers: Users,
}

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [selectedPlatform, setSelectedPlatform] = useState<string>('all')
  const [selectedService, setSelectedService] = useState<Service | null>(null)

  useEffect(() => {
    async function loadData() {
      const [servicesData, packagesData] = await Promise.all([
        blink.db.services.list({ where: { is_active: "1" } }),
        blink.db.packages.list()
      ])
      setServices(servicesData)
      setPackages(packagesData)
      setIsLoading(false)
    }
    loadData()
  }, [])

  const filteredServices = selectedPlatform === 'all' 
    ? services 
    : services.filter(s => s.platform === selectedPlatform)

  const getPackagesForService = (serviceId: string) => 
    packages.filter(p => p.service_id === serviceId)

  const platforms = ['all', ...new Set(services.map(s => s.platform))]

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Services</h1>
        <p className="text-muted-foreground">Choose a service to get started</p>
      </div>

      {/* Platform Filter */}
      <div className="flex gap-2 flex-wrap">
        {platforms.map(platform => {
          const Icon = platformIcons[platform] || Filter
          return (
            <button
              key={platform}
              onClick={() => setSelectedPlatform(platform)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-colors ${
                selectedPlatform === platform 
                  ? 'bg-primary text-primary-foreground border-primary' 
                  : 'bg-card hover:bg-accent'
              }`}
            >
              {platform !== 'all' && <Icon className="w-4 h-4" />}
              <span className="capitalize">{platform === 'all' ? 'All' : platform}</span>
            </button>
          )
        })}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredServices.map(service => {
          const PlatformIcon = platformIcons[service.platform] || Filter
          const TypeIcon = typeIcons[service.service_type] || Heart
          const servicePackages = getPackagesForService(service.id)
          const hasPopular = servicePackages.some(p => p.is_popular)

          return (
            <div
              key={service.id}
              className="p-4 rounded-xl border bg-card hover:border-primary/50 transition-colors cursor-pointer"
              onClick={() => setSelectedService(service)}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <PlatformIcon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{service.name}</h3>
                    <p className="text-xs text-muted-foreground capitalize">
                      {service.platform} {service.service_type}
                    </p>
                  </div>
                </div>
                {hasPopular && (
                  <span className="px-2 py-0.5 text-xs rounded-full bg-primary text-primary-foreground">
                    Popular
                  </span>
                )}
              </div>
              
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {service.description}
              </p>

              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {service.min_quantity} - {service.max_quantity.toLocaleString()}
                </span>
                <span className="font-medium">
                  ${service.price_per_unit.toFixed(3)}/unit
                </span>
              </div>

              {/* Package Preview */}
              {servicePackages.length > 0 && (
                <div className="mt-3 pt-3 border-t">
                  <p className="text-xs text-muted-foreground mb-2">Quick packages:</p>
                  <div className="flex gap-1 flex-wrap">
                    {servicePackages.slice(0, 3).map(pkg => (
                      <span 
                        key={pkg.id}
                        className="px-2 py-0.5 text-xs rounded bg-secondary text-secondary-foreground"
                      >
                        {pkg.quantity.toLocaleString()} - ${pkg.price}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Service Detail Modal */}
      {selectedService && (
        <div 
          className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedService(null)}
        >
          <div 
            className="bg-background border rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <ServiceDetail 
              service={selectedService} 
              packages={getPackagesForService(selectedService.id)}
              onClose={() => setSelectedService(null)}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function ServiceDetail({ 
  service, 
  packages,
  onClose 
}: { 
  service: Service
  packages: Package[]
  onClose: () => void
}) {
  const PlatformIcon = platformIcons[service.platform] || Filter
  const TypeIcon = typeIcons[service.service_type] || Heart

  const handleOrder = (pkg: Package) => {
    // TODO: Navigate to order page with package
    window.location.href = `/order?package=${pkg.id}`
  }

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-primary/10">
            <PlatformIcon className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-xl font-bold">{service.name}</h2>
            <p className="text-sm text-muted-foreground capitalize">
              {service.platform} {service.service_type}
            </p>
          </div>
        </div>
        <button onClick={onClose} className="p-2 hover:bg-accent rounded-lg">
          ×
        </button>
      </div>

      <p className="text-muted-foreground">{service.description}</p>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-muted-foreground">Min Order</p>
          <p className="font-semibold">{service.min_quantity.toLocaleString()}</p>
        </div>
        <div className="p-3 rounded-lg bg-secondary">
          <p className="text-muted-foreground">Max Order</p>
          <p className="font-semibold">{service.max_quantity.toLocaleString()}</p>
        </div>
      </div>

      <div>
        <h3 className="font-semibold mb-3">Available Packages</h3>
        <div className="space-y-2">
          {packages.map(pkg => (
            <button
              key={pkg.id}
              onClick={() => handleOrder(pkg)}
              className={`w-full p-4 rounded-lg border text-left hover:border-primary transition-colors ${
                pkg.is_popular ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">{pkg.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {pkg.quantity.toLocaleString()} {service.service_type} • {pkg.drip_days} day drip
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold">${pkg.price}</p>
                  <p className="text-xs text-muted-foreground">
                    ${(pkg.price / pkg.quantity).toFixed(3)}/unit
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}