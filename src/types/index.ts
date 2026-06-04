export type SleepLevel = 'poor' | 'okay' | 'great'
export type FoodLevel = 'less' | 'normal' | 'more'
export type ActivityLevel = 'low' | 'normal' | 'high'
export type MoodLevel = 'sad' | 'normal' | 'happy'

export interface DailyEntry {
  date: string // YYYY-MM-DD
  sleep: SleepLevel
  food: FoodLevel
  activity: ActivityLevel
  mood: MoodLevel
  photo?: string // base64 data URL
}

export interface Pet {
  name: string
  photo?: string
  breed?: string
  /** Age in whole years */
  age?: number
  /** Body condition score 1–9 (optional) */
  bodyConditionScore?: number
}

export interface AppData {
  pet: Pet
  entries: DailyEntry[]
}

export const SLEEP_OPTIONS: { value: SleepLevel; label: string; emoji: string }[] = [
  { value: 'poor', label: 'Poor', emoji: '😴' },
  { value: 'okay', label: 'Okay', emoji: '😪' },
  { value: 'great', label: 'Great', emoji: '💤' },
]

export const FOOD_OPTIONS: { value: FoodLevel; label: string; emoji: string }[] = [
  { value: 'less', label: 'Ate Less', emoji: '🥣' },
  { value: 'normal', label: 'Normal', emoji: '🍖' },
  { value: 'more', label: 'Ate More', emoji: '🦴' },
]

export const ACTIVITY_OPTIONS: { value: ActivityLevel; label: string; emoji: string }[] = [
  { value: 'low', label: 'Low', emoji: '🐢' },
  { value: 'normal', label: 'Normal', emoji: '🎾' },
  { value: 'high', label: 'High', emoji: '⚡' },
]

export const MOOD_OPTIONS: { value: MoodLevel; label: string; emoji: string }[] = [
  { value: 'sad', label: 'Sad', emoji: '😿' },
  { value: 'normal', label: 'Normal', emoji: '😐' },
  { value: 'happy', label: 'Happy', emoji: '😊' },
]

export function moodEmoji(mood: MoodLevel): string {
  return MOOD_OPTIONS.find((o) => o.value === mood)?.emoji ?? '😐'
}

export function sleepLabel(v: SleepLevel): string {
  return SLEEP_OPTIONS.find((o) => o.value === v)?.label ?? v
}

export function foodLabel(v: FoodLevel): string {
  return FOOD_OPTIONS.find((o) => o.value === v)?.label ?? v
}

export function activityLabel(v: ActivityLevel): string {
  return ACTIVITY_OPTIONS.find((o) => o.value === v)?.label ?? v
}

export function moodLabel(v: MoodLevel): string {
  return MOOD_OPTIONS.find((o) => o.value === v)?.label ?? v
}

export function todayKey(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const DEFAULT_PET: Pet = {
  name: 'Woody',
  breed: 'Golden Retriever',
  age: 3,
}

export const BCS_OPTIONS: { value: number; label: string }[] = [
  { value: 1, label: '1 — Very thin' },
  { value: 2, label: '2 — Thin' },
  { value: 3, label: '3 — Lean' },
  { value: 4, label: '4 — Slightly lean' },
  { value: 5, label: '5 — Ideal' },
  { value: 6, label: '6 — Slightly heavy' },
  { value: 7, label: '7 — Heavy' },
  { value: 8, label: '8 — Obese' },
  { value: 9, label: '9 — Severely obese' },
]

export function bodyConditionLabel(bcs: number): string {
  return BCS_OPTIONS.find((o) => o.value === bcs)?.label ?? `BCS ${bcs}`
}

export function ageLabel(age: number): string {
  if (age < 1) return 'Puppy'
  if (age < 3) return 'Young'
  if (age < 7) return 'Adult'
  return 'Senior'
}

export const DEFAULT_ENTRY: Omit<DailyEntry, 'date'> = {
  sleep: 'okay',
  food: 'normal',
  activity: 'normal',
  mood: 'happy',
}
