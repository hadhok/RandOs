export type GearCategory =
  | 'navigation'
  | 'vetements'
  | 'bivouac'
  | 'securite'
  | 'nourriture'
  | 'electronique'
  | 'divers'

export type GearItem = {
  id: string
  name: string
  category: GearCategory
  weightGrams: number
  quantity: number
  packed: boolean
}

export const WEIGHT_THRESHOLDS = {
  light: 7000,
  moderate: 10000,
  heavy: 14000,
} // grammes

export function totalWeight(items: GearItem[]): number {
  return items.reduce((sum, item) => sum + item.weightGrams * item.quantity, 0)
}

export function weightByCategory(items: GearItem[]): Record<GearCategory, number> {
  const result: Record<GearCategory, number> = {
    navigation: 0,
    vetements: 0,
    bivouac: 0,
    securite: 0,
    nourriture: 0,
    electronique: 0,
    divers: 0,
  }
  for (const item of items) {
    result[item.category] += item.weightGrams * item.quantity
  }
  return result
}

export function weightStatus(
  totalGrams: number
): 'optimal' | 'acceptable' | 'lourd' | 'trop-lourd' {
  if (totalGrams < WEIGHT_THRESHOLDS.light) return 'optimal'
  if (totalGrams < WEIGHT_THRESHOLDS.moderate) return 'acceptable'
  if (totalGrams < WEIGHT_THRESHOLDS.heavy) return 'lourd'
  return 'trop-lourd'
}
