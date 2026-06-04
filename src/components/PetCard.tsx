import { motion } from 'framer-motion'
import type { Pet } from '../types'

interface PetCardProps {
  pet: Pet
  compact?: boolean
}

export default function PetCard({ pet, compact }: PetCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-[var(--radius-card)] shadow-[var(--shadow-soft)] border border-[var(--color-border)] overflow-hidden ${compact ? 'p-4' : 'p-5'}`}
    >
      <div className="flex items-center gap-4">
        <div className={`relative shrink-0 ${compact ? 'w-14 h-14' : 'w-20 h-20'}`}>
          {pet.photo ? (
            <img
              src={pet.photo}
              alt={pet.name}
              className="w-full h-full rounded-[18px] object-cover ring-2 ring-[var(--color-primary-soft)]"
            />
          ) : (
            <div className="w-full h-full rounded-[18px] bg-gradient-to-br from-[var(--color-primary-soft)] to-[#E8E0FF] flex items-center justify-center text-3xl">
              🐾
            </div>
          )}
        </div>
        <div className="min-w-0">
          <h1 className={`font-bold text-[var(--color-text)] truncate ${compact ? 'text-lg' : 'text-2xl'}`}>
            {pet.name}
          </h1>
          {pet.breed && (
            <p className="text-sm text-[var(--color-text-secondary)] mt-0.5">{pet.breed}</p>
          )}
        </div>
      </div>
    </motion.div>
  )
}
