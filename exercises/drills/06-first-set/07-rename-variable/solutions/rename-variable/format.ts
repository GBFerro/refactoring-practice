/** Minutes and seconds, with no hour component - no training split runs that long. */
export function formatClock(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes)}:${String(seconds % 60).padStart(2, "0")}`;
}

export function formatPace(secondsPerKm: number): string {
  return `${formatClock(Math.round(secondsPerKm))}/km`;
}

export function formatSpread(secondsPerKm: number): string {
  return `±${String(Math.round(secondsPerKm))}s/km`;
}
