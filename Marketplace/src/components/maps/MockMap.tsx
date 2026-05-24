import { MapPin, Navigation } from 'lucide-react'
import { cn } from '@/utils/cn'

interface MockMapProps {
  className?: string
  showRoute?: boolean
  vendorLabel?: string
  customerLabel?: string
  animated?: boolean
}

export function MockMap({
  className,
  showRoute = false,
  vendorLabel = 'Vendor',
  customerLabel = 'You',
  animated = false,
}: MockMapProps) {
  return (
    <div className={cn('relative overflow-hidden rounded-xl border bg-slate-100 dark:bg-slate-800', className)}>
      {/* Map grid background */}
      <div className="absolute inset-0 opacity-30">
        <svg width="100%" height="100%">
          <defs>
            <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="0.5" className="text-slate-400" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
        </svg>
      </div>

      {/* Roads */}
      <div className="absolute inset-0">
        <div className="absolute left-0 right-0 top-1/2 h-2 -translate-y-1/2 bg-slate-300/60 dark:bg-slate-600/60" />
        <div className="absolute bottom-0 top-0 left-1/3 w-2 -translate-x-1/2 bg-slate-300/60 dark:bg-slate-600/60" />
        <div className="absolute bottom-0 top-0 left-2/3 w-1.5 -translate-x-1/2 bg-slate-300/40 dark:bg-slate-600/40" />
      </div>

      {/* Route line */}
      {showRoute && (
        <svg className="absolute inset-0 h-full w-full" viewBox="0 0 400 300">
          <path
            d="M 80 220 Q 150 180 200 150 T 320 80"
            fill="none"
            stroke="#2563eb"
            strokeWidth="3"
            strokeDasharray="8 4"
            className={animated ? 'animate-pulse' : ''}
          />
        </svg>
      )}

      {/* Customer pin */}
      <div className="absolute bottom-[25%] left-[20%] flex flex-col items-center">
        <div className="rounded-full bg-green-500 p-2 shadow-lg">
          <MapPin className="h-4 w-4 text-white" />
        </div>
        <span className="mt-1 rounded bg-white/90 px-2 py-0.5 text-xs font-medium shadow dark:bg-slate-900/90">
          {customerLabel}
        </span>
      </div>

      {/* Vendor pin */}
      <div
        className={cn(
          'absolute top-[20%] right-[20%] flex flex-col items-center',
          animated && 'animate-bounce'
        )}
      >
        <div className="rounded-full bg-blue-600 p-2 shadow-lg">
          <Navigation className="h-4 w-4 text-white" />
        </div>
        <span className="mt-1 rounded bg-white/90 px-2 py-0.5 text-xs font-medium shadow dark:bg-slate-900/90">
          {vendorLabel}
        </span>
      </div>

      {/* Map controls mockup */}
      <div className="absolute right-3 top-3 flex flex-col gap-1">
        <div className="rounded bg-white/90 px-2 py-1 text-xs shadow dark:bg-slate-900/90">+</div>
        <div className="rounded bg-white/90 px-2 py-1 text-xs shadow dark:bg-slate-900/90">−</div>
      </div>

      <div className="absolute bottom-3 left-3 rounded bg-white/90 px-2 py-1 text-xs text-muted-foreground shadow dark:bg-slate-900/90">
        Google Maps style mockup
      </div>
    </div>
  )
}

export function RoutePreview({ distance = '2.4 km', eta = '12 min' }: { distance?: string; eta?: string }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-muted/50 p-3 text-sm">
      <Navigation className="h-5 w-5 text-primary" />
      <div>
        <p className="font-medium">{distance} away</p>
        <p className="text-muted-foreground">ETA: {eta}</p>
      </div>
    </div>
  )
}
