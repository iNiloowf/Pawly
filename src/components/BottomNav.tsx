import { NavLink } from 'react-router-dom'
import { Home, CalendarDays, Images, PawPrint } from 'lucide-react'
import { motion } from 'framer-motion'

const tabs = [
  { to: '/', icon: Home, label: 'Home' },
  { to: '/history', icon: CalendarDays, label: 'Journal' },
  { to: '/gallery', icon: Images, label: 'Memories' },
  { to: '/profile', icon: PawPrint, label: 'Profile' },
]

export default function BottomNav() {
  return (
    <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] z-50 safe-bottom">
      <div className="mx-4 mb-4 px-2 py-2 bg-white/90 backdrop-blur-xl rounded-[28px] shadow-[var(--shadow-card)] border border-[var(--color-border)]">
        <div className="flex items-center justify-around">
          {tabs.map(({ to, icon: Icon, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className="relative flex flex-col items-center gap-0.5 px-4 py-2 min-w-[64px]"
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="nav-pill"
                      className="absolute inset-0 bg-[var(--color-primary-soft)] rounded-2xl"
                      transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                    />
                  )}
                  <Icon
                    size={22}
                    strokeWidth={isActive ? 2.5 : 2}
                    className={`relative z-10 transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}
                  />
                  <span
                    className={`relative z-10 text-[10px] font-medium transition-colors ${isActive ? 'text-[var(--color-primary)]' : 'text-[var(--color-muted)]'}`}
                  >
                    {label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  )
}
