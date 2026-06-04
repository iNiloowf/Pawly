import { BCS_OPTIONS } from '../types'

interface PhysicalStatsFieldsProps {
  breed: string
  age: string
  bodyConditionScore: number | ''
  onBreedChange: (value: string) => void
  onAgeChange: (value: string) => void
  onBodyConditionScoreChange: (value: number | '') => void
  variant?: 'onboarding' | 'profile'
}

export default function PhysicalStatsFields({
  breed,
  age,
  bodyConditionScore,
  onBreedChange,
  onAgeChange,
  onBodyConditionScoreChange,
  variant = 'profile',
}: PhysicalStatsFieldsProps) {
  const inputClass =
    variant === 'onboarding'
      ? 'w-full bg-transparent outline-none text-[var(--color-text)] placeholder:text-[var(--color-muted)]'
      : 'w-full px-4 py-3 bg-white rounded-2xl border border-[var(--color-border)] text-[var(--color-text)] focus:outline-none focus:ring-2 focus:ring-[var(--color-primary)]/30'

  const labelClass =
    variant === 'onboarding'
      ? 'block text-xs font-medium text-[var(--color-text-secondary)] mb-1.5 ml-1'
      : 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5'

  const wrapField = (label: string, children: React.ReactNode, hint?: string) => (
    <div>
      <label className={labelClass}>{label}</label>
      {variant === 'onboarding' ? (
        <div className="px-4 py-3.5 bg-[var(--color-surface)] rounded-2xl border border-[var(--color-border)] focus-within:border-[var(--color-primary-light)] focus-within:ring-2 focus-within:ring-[var(--color-primary)]/20 transition-all">
          {children}
        </div>
      ) : (
        children
      )}
      {hint && <p className="text-[11px] text-[var(--color-muted)] mt-1.5 ml-0.5">{hint}</p>}
    </div>
  )

  return (
    <div className="space-y-4">
      {wrapField('Breed', (
        <input
          type="text"
          value={breed}
          onChange={(e) => onBreedChange(e.target.value)}
          placeholder="e.g. Golden Retriever"
          className={inputClass}
        />
      ))}

      {wrapField('Age (years)', (
        <input
          type="number"
          min={0}
          max={30}
          inputMode="numeric"
          value={age}
          onChange={(e) => onAgeChange(e.target.value)}
          placeholder="e.g. 3"
          className={inputClass}
        />
      ), 'Whole years — helps tailor activity insights')}

      <div>
        <label className={labelClass}>Body condition score (optional)</label>
        <div className="grid grid-cols-9 gap-1">
          {BCS_OPTIONS.map((opt) => {
            const selected = bodyConditionScore === opt.value
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => onBodyConditionScoreChange(selected ? '' : opt.value)}
                title={opt.label}
                className={`aspect-square rounded-xl text-xs font-semibold transition-all ${
                  selected
                    ? 'bg-[var(--color-primary)] text-white shadow-md'
                    : 'bg-white border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:border-[var(--color-primary-light)]'
                }`}
              >
                {opt.value}
              </button>
            )
          })}
        </div>
        <p className="text-[11px] text-[var(--color-muted)] mt-1.5 ml-0.5">
          {bodyConditionScore !== ''
            ? BCS_OPTIONS.find((o) => o.value === bodyConditionScore)?.label
            : '1 = very thin · 5 = ideal · 9 = severely obese'}
        </p>
      </div>
    </div>
  )
}
