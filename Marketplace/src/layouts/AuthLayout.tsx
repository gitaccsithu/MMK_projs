import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Zap } from 'lucide-react'

export function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 gradient-primary flex-col justify-between p-12 text-white">
        <Link to="/" className="flex items-center gap-2 text-xl font-bold">
          <Zap className="h-7 w-7" />
          ServiceHub
        </Link>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h1 className="text-4xl font-bold leading-tight">
            Your trusted marketplace for local services
          </h1>
          <p className="mt-4 text-lg text-blue-100">
            Book home cleaning, repairs, beauty services and more from verified local vendors.
          </p>
          <div className="mt-8 grid grid-cols-3 gap-4">
            {['20+ Vendors', '100+ Services', '50+ Bookings'].map((stat) => (
              <div key={stat} className="rounded-xl bg-white/10 p-4 backdrop-blur">
                <p className="text-2xl font-bold">{stat.split(' ')[0]}</p>
                <p className="text-sm text-blue-100">{stat.split(' ').slice(1).join(' ')}</p>
              </div>
            ))}
          </div>
        </motion.div>
        <p className="text-sm text-blue-200">© 2026 ServiceHub. Demo application.</p>
      </div>
      <div className="flex flex-1 items-center justify-center p-6">
        <div className="w-full max-w-md">{children}</div>
      </div>
    </div>
  )
}
