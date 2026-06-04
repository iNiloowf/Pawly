import type { DailyEntry, Pet } from '../types'
import { ageLabel, bodyConditionLabel } from '../types'

export type AgeCategory = 'puppy' | 'young' | 'adult' | 'senior'
export type BcsCategory = 'underweight' | 'ideal' | 'overweight' | 'obese'

export function ageCategory(age?: number): AgeCategory | null {
  if (age == null || age < 0) return null
  if (age < 1) return 'puppy'
  if (age < 3) return 'young'
  if (age < 7) return 'adult'
  return 'senior'
}

export function bcsCategory(bcs?: number): BcsCategory | null {
  if (bcs == null) return null
  if (bcs <= 3) return 'underweight'
  if (bcs <= 5) return 'ideal'
  if (bcs <= 7) return 'overweight'
  return 'obese'
}

export interface WeeklyInsight {
  title: string
  text: string
}

export function formatPetContext(pet: Pet): string {
  const parts: string[] = []
  if (pet.age != null) parts.push(`${pet.age} yr${pet.age !== 1 ? 's' : ''} (${ageLabel(pet.age)})`)
  if (pet.breed) parts.push(pet.breed)
  if (pet.bodyConditionScore != null) parts.push(bodyConditionLabel(pet.bodyConditionScore))
  return parts.length ? parts.join(' · ') : 'Add age, breed, and body condition for smarter insights.'
}

export function activitySubtitle(pet: Pet, avgActivity: number, hasData: boolean): string {
  if (!hasData) return 'Based on daily activity ratings'
  const cat = ageCategory(pet.age)
  if (cat === 'senior' && avgActivity >= 2.5) {
    return `Strong activity for a ${pet.age}-year-old senior`
  }
  if (cat === 'puppy' && avgActivity < 1.5) {
    return 'Puppies often need more daily movement'
  }
  if (pet.breed && pet.age != null) {
    return `Trend for ${pet.age}-yr ${pet.breed}`
  }
  if (pet.age != null) {
    return `Trend for a ${ageLabel(pet.age).toLowerCase()} (${pet.age} yrs)`
  }
  return 'Based on daily activity ratings'
}

export function foodSubtitle(pet: Pet, avgFood: number, hasData: boolean): string {
  if (!hasData) return 'Based on daily food ratings'
  const bcs = bcsCategory(pet.bodyConditionScore)
  if (bcs === 'underweight' && avgFood < 1.8) {
    return 'Appetite vs. lean body condition — worth monitoring'
  }
  if ((bcs === 'overweight' || bcs === 'obese') && avgFood > 2.2) {
    return 'Portions may matter with current body condition'
  }
  if (pet.bodyConditionScore != null) {
    return `Appetite trend · ${bodyConditionLabel(pet.bodyConditionScore)}`
  }
  return 'Based on daily food ratings'
}

export function buildWeeklyInsights(
  pet: Pet,
  weekEntries: DailyEntry[],
  avgActivity: number,
  avgFood: number,
): WeeklyInsight[] {
  const insights: WeeklyInsight[] = []

  if (weekEntries.length === 0) {
    if (pet.age != null || pet.breed || pet.bodyConditionScore != null) {
      insights.push({
        title: 'Physical profile',
        text: `${pet.name}: ${formatPetContext(pet)}. Daily check-ins unlock tailored trends.`,
      })
    }
    return insights
  }

  const cat = ageCategory(pet.age)
  if (cat === 'senior' && avgActivity >= 2.5 && pet.age != null) {
    insights.push({
      title: 'Age & activity',
      text: `At ${pet.age} years, ${pet.name} is staying active — great for senior joints and mood.`,
    })
  } else if (cat === 'puppy' && avgActivity < 1.5) {
    insights.push({
      title: 'Age & activity',
      text: 'Young dogs usually need more play. Short walks and games can boost energy.',
    })
  } else if (cat === 'adult' && avgActivity < 1.5 && pet.age != null) {
    insights.push({
      title: 'Age & activity',
      text: `Activity has been on the low side for a ${pet.age}-year-old. Extra movement may help.`,
    })
  }

  const bcs = bcsCategory(pet.bodyConditionScore)
  if (bcs === 'underweight' && avgFood < 1.8 && pet.bodyConditionScore != null) {
    insights.push({
      title: 'Body condition & food',
      text: `BCS ${pet.bodyConditionScore}/9 with lighter eating some days — keep an eye on appetite.`,
    })
  } else if ((bcs === 'overweight' || bcs === 'obese') && avgFood > 2.2 && pet.bodyConditionScore != null) {
    insights.push({
      title: 'Body condition & food',
      text: `BCS ${pet.bodyConditionScore}/9 — steady portions and activity support healthy weight.`,
    })
  } else if (bcs === 'ideal' && pet.bodyConditionScore != null) {
    insights.push({
      title: 'Body condition',
      text: `BCS ${pet.bodyConditionScore}/9 is in the ideal range. Keep up the balanced routine.`,
    })
  }

  if (pet.breed) {
    insights.push({
      title: 'Breed context',
      text: `${pet.name} is a ${pet.breed}. Weekly patterns help you spot changes early.`,
    })
  }

  return insights.slice(0, 3)
}
