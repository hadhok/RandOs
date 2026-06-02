function b64Encode(str: string): string {
  // Base64 encoding without using btoa (not available in all envs)
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/'
  const bytes = Array.from(str).map((c) => c.charCodeAt(0))
  let result = ''
  for (let i = 0; i < bytes.length; i += 3) {
    const b0 = bytes[i] ?? 0
    const b1 = bytes[i + 1] ?? 0
    const b2 = bytes[i + 2] ?? 0
    result += chars[b0 >> 2]
    result += chars[((b0 & 3) << 4) | (b1 >> 4)]
    result += i + 1 < bytes.length ? chars[((b1 & 15) << 2) | (b2 >> 6)] : '='
    result += i + 2 < bytes.length ? chars[b2 & 63] : '='
  }
  return result
}

export function generateShareableLink(hikeId: string, baseUrl: string): string {
  return `${baseUrl}/partage/${b64Encode(hikeId)}`
}

export function generateTextSummary(hike: {
  name: string
  waypoints: { lat: number; lng: number }[]
  distanceKm: number
  elevationGainM: number
}): string {
  const lines = [
    `=== ${hike.name} ===`,
    `Distance : ${hike.distanceKm.toFixed(1)} km`,
    `Dénivelé+ : ${Math.round(hike.elevationGainM)} m`,
    `Points de passage : ${hike.waypoints.length}`,
  ]

  if (hike.waypoints.length > 0) {
    const first = hike.waypoints[0]!
    const last = hike.waypoints[hike.waypoints.length - 1]!
    lines.push(`Départ : ${first.lat.toFixed(4)}, ${first.lng.toFixed(4)}`)
    lines.push(`Arrivée : ${last.lat.toFixed(4)}, ${last.lng.toFixed(4)}`)
  }

  lines.push(`\nGénéré par RandOs — ${new Date().toLocaleDateString('fr-FR')}`)

  return lines.join('\n')
}
