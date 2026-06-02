export type ResupplyPoint = {
  id: string
  name: string
  distanceKm: number
  type: 'village' | 'superette' | 'source' | 'refuge'
  notes?: string
}

export type RationDay = {
  breakfast: number
  lunch: number
  dinner: number
  snacks: number
} // calories

export const DEFAULT_RATIONS: RationDay = {
  breakfast: 500,
  lunch: 600,
  dinner: 700,
  snacks: 400,
}

export function calculateTotalCalories(days: number, rations: RationDay): number {
  return days * (rations.breakfast + rations.lunch + rations.dinner + rations.snacks)
}

export function calculateFoodWeightGrams(calories: number): number {
  // ~450 kcal / 100g
  return (calories / 450) * 100
}
