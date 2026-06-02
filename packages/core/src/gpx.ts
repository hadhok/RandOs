export type GPXWaypoint = {
  lat: number
  lng: number
  elevation?: number
  name?: string
  time?: string
}

export function parseGPX(
  xmlString: string
): { waypoints: GPXWaypoint[]; name: string; totalDistanceKm: number } {
  const waypoints: GPXWaypoint[] = []

  // Extract name
  const nameMatch = xmlString.match(/<name[^>]*>([\s\S]*?)<\/name>/)
  const name = nameMatch ? decodeXmlEntities(nameMatch[1]?.trim() ?? '') : 'Rando importée'

  // Parse track points
  const trkptRegex = /<trkpt\s[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/trkpt>/g
  let match: RegExpExecArray | null

  while ((match = trkptRegex.exec(xmlString)) !== null) {
    const lat = parseFloat(match[1] ?? '0')
    const lng = parseFloat(match[2] ?? '0')
    const inner = match[3] ?? ''
    const eleMatch = inner.match(/<ele[^>]*>([\s\S]*?)<\/ele>/)
    const timeMatch = inner.match(/<time[^>]*>([\s\S]*?)<\/time>/)
    const elevation = eleMatch ? parseFloat(eleMatch[1]?.trim() ?? '0') : undefined
    const time = timeMatch ? timeMatch[1]?.trim() : undefined
    waypoints.push({ lat, lng, elevation, time })
  }

  // Also parse standalone waypoints <wpt>
  const wptRegex = /<wpt\s[^>]*lat="([^"]+)"[^>]*lon="([^"]+)"[^>]*>([\s\S]*?)<\/wpt>/g
  while ((match = wptRegex.exec(xmlString)) !== null) {
    const lat = parseFloat(match[1] ?? '0')
    const lng = parseFloat(match[2] ?? '0')
    const inner = match[3] ?? ''
    const nameM = inner.match(/<name[^>]*>([\s\S]*?)<\/name>/)
    const eleMatch = inner.match(/<ele[^>]*>([\s\S]*?)<\/ele>/)
    const timeMatch = inner.match(/<time[^>]*>([\s\S]*?)<\/time>/)
    const wptName = nameM ? decodeXmlEntities(nameM[1]?.trim() ?? '') : undefined
    const elevation = eleMatch ? parseFloat(eleMatch[1]?.trim() ?? '0') : undefined
    const time = timeMatch ? timeMatch[1]?.trim() : undefined
    waypoints.push({ lat, lng, elevation, name: wptName, time })
  }

  const totalDistanceKm = computeDistanceKm(waypoints)

  return { waypoints, name, totalDistanceKm }
}

function computeDistanceKm(waypoints: GPXWaypoint[]): number {
  let total = 0
  for (let i = 1; i < waypoints.length; i++) {
    const prev = waypoints[i - 1]!
    const curr = waypoints[i]!
    total += haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng)
  }
  return total / 1000
}

function haversineMeters(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const R = 6371000
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2)
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function decodeXmlEntities(str: string): string {
  return str
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

export type GeoJSONLineString = {
  type: 'LineString'
  coordinates: number[][]
}

export function waypointsToGeoJSON(waypoints: GPXWaypoint[]): GeoJSONLineString {
  return {
    type: 'LineString',
    coordinates: waypoints.map((wp) =>
      wp.elevation !== undefined ? [wp.lng, wp.lat, wp.elevation] : [wp.lng, wp.lat]
    ),
  }
}
