/** Minutes and seconds, with no hour component - no club handicap runs that long. */
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatPace(secondsPerKm: number): string {
  return `${formatClock(Math.round(secondsPerKm))}/km`;
}
