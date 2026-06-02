export type TrackPoint = {
  lat: number
  lng: number
  timestamp: number
  altitudeM?: number
}

export type WaypointNote = {
  id: string
  lat: number
  lng: number
  timestamp: number
  note: string
  type: 'info' | 'warning' | 'photo'
}

export type ActiveTrack = {
  id: string
  startTime: number
  points: TrackPoint[]
  notes: WaypointNote[]
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

export function computeTrackStats(track: ActiveTrack): {
  distanceKm: number
  durationMinutes: number
  avgSpeedKmh: number
  elevationGainM: number
  currentAltitude: number
} {
  const points = track.points
  let distanceM = 0
  let elevationGainM = 0

  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1]!
    const curr = points[i]!
    distanceM += haversineMeters(prev.lat, prev.lng, curr.lat, curr.lng)
    if (curr.altitudeM !== undefined && prev.altitudeM !== undefined) {
      const diff = curr.altitudeM - prev.altitudeM
      if (diff > 0) elevationGainM += diff
    }
  }

  const lastPoint = points[points.length - 1]
  const firstPoint = points[0]
  const durationMinutes =
    points.length >= 2 && firstPoint && lastPoint
      ? (lastPoint.timestamp - firstPoint.timestamp) / 60000
      : (Date.now() - track.startTime) / 60000

  const distanceKm = distanceM / 1000
  const avgSpeedKmh = durationMinutes > 0 ? distanceKm / (durationMinutes / 60) : 0
  const currentAltitude = lastPoint?.altitudeM ?? 0

  return {
    distanceKm,
    durationMinutes,
    avgSpeedKmh,
    elevationGainM,
    currentAltitude,
  }
}

export function exportToGPX(track: ActiveTrack, name: string): string {
  const trkpts = track.points
    .map((p) => {
      const eleTag =
        p.altitudeM !== undefined ? `\n        <ele>${p.altitudeM.toFixed(1)}</ele>` : ''
      const timeTag = `\n        <time>${new Date(p.timestamp).toISOString()}</time>`
      return `      <trkpt lat="${p.lat.toFixed(7)}" lon="${p.lng.toFixed(7)}">${eleTag}${timeTag}\n      </trkpt>`
    })
    .join('\n')

  const wpts = track.notes
    .map(
      (n) =>
        `  <wpt lat="${n.lat.toFixed(7)}" lon="${n.lng.toFixed(7)}">\n    <name>${escapeXml(n.note.substring(0, 60))}</name>\n    <time>${new Date(n.timestamp).toISOString()}</time>\n  </wpt>`
    )
    .join('\n')

  return `<?xml version="1.0" encoding="UTF-8"?>
<gpx version="1.1" creator="RandOs" xmlns="http://www.topografix.com/GPX/1/1">
  <metadata>
    <name>${escapeXml(name)}</name>
    <time>${new Date(track.startTime).toISOString()}</time>
  </metadata>
${wpts ? wpts + '\n' : ''}  <trk>
    <name>${escapeXml(name)}</name>
    <trkseg>
${trkpts}
    </trkseg>
  </trk>
</gpx>`
}

function escapeXml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}
