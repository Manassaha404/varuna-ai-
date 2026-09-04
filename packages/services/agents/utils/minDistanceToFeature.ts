function haversineKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}


export function minDistanceToFeature(
  userLat: number,
  userLon: number,
  coordinates: number[][][],
): number {
  let minDist = Infinity;
  for (const line of coordinates) {
    for (const [lon, lat] of line) {
      // GeoJSON: [longitude, latitude]
      const d = haversineKm(userLat, userLon, lat as number, lon as number);
      if (d < minDist) minDist = d;
    }
  }
  return minDist;
}