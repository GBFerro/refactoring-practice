/** m:ss per kilometre - no club session is paced slower than a ten-minute kilometre. */
export function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm);
  return `${String(Math.floor(rounded / 60))}:${String(rounded % 60).padStart(2, "0")}/km`;
}
