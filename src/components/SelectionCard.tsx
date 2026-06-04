import { motion } from 'framer-motion'

interface Option<T extends string> {
  value: T
  label: string
  emoji: string
}

interface SelectionCardProps<T extends string> {
  title: string
  icon: string
  options: Option<T>[]
  value: T
  onChange: (value: T) => void
}

export default function SelectionCard<T extends string>({
  title,
  icon,
  options,
  value,
  onChange,
}: SelectionCardProps<T>) {
  return (
    <div className="bg-white rounded-[var(--radius-card)] p-4 shadow-[var(--shadow-soft)] border border-[var(--color-border)]">
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xl">{icon}</span>
        <h3 className="font-semibold text-[var(--color-text)]">{title}</h3>
      </div>
      <div className="flex gap-2">
        {options.map((opt) => {
          const selected = value === opt.value
          return (
            <motion.button
              key={opt.value}
              type="button"
              onClick={() => onChange(opt.value)}
              whileTap={{ scale: 0.96 }}
              className={`relative flex-1 flex flex-col items-center gap-1.5 py-3 px-2 rounded-2xl transition-colors ${
                selected
                  ? 'bg-[var(--color-primary)] text-white shadow-lg shadow-[rgba(124,92,255,0.35)]'
                  : 'bg-[var(--color-surface)] text-[var(--color-text-secondary)] hover:bg-[var(--color-primary-soft)]'
              }`}
            >
              <span className="text-lg">{opt.emoji}</span>
              <span className={`text-xs font-medium ${selected ? 'text-white' : ''}`}>{opt.label}</span>
              {selected && (
                <motion.div
                  layoutId={`ring-${title}`}
                  className="absolute inset-0 rounded-2xl ring-2 ring-white/30"
                  transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                />
              )}
            </motion.button>
          )
        })}
      </div>
    </div>
  )
}
