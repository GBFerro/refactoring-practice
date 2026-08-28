import type { Checkpoint } from "./checkpoints";

/** Below this spread, in seconds per km, a session counts as evenly paced. */
const EVEN_PACING_THRESHOLD_SECONDS = 8;

/** One km of a training run: the marker it ends at, and the pace run to reach it. */
export interface Segment {
  readonly markerKm: number;
  readonly paceSecondsPerKm: number;
}

/** Each checkpoint's pace back to the previous one - or to the start line, for the first. */
export function segmentsOf(checkpoints: readonly Checkpoint[]): Segment[] {
  return checkpoints.map((checkpoint, index) => {
    const previous = checkpoints[index - 1];
    const distanceKm = checkpoint.markerKm - (previous?.markerKm ?? 0);
    const durationSeconds = checkpoint.elapsedSeconds - (previous?.elapsedSeconds ?? 0);
    return {
      markerKm: checkpoint.markerKm,
      paceSecondsPerKm: durationSeconds / distanceKm,
    };
  });
}

export function averagePaceSecondsPerKm(segments: readonly Segment[]): number {
  const total = segments.reduce((sum, segment) => sum + segment.paceSecondsPerKm, 0);
  return total / segments.length;
}

/**
 * How much a runner's kilometre-by-kilometre pace wandered around their own average, in
 * seconds per km - the population standard deviation of the segment paces.
 */
export function pacingSpreadSeconds(segments: readonly Segment[]): number {
  const count = segments.length;
  const meanPace = averagePaceSecondsPerKm(segments);
  const meanSquare =
    segments.reduce((sum, segment) => sum + segment.paceSecondsPerKm ** 2, 0) / count;
  const variance = meanSquare - meanPace * meanPace;
  return Math.sqrt(Math.max(0, variance));
}

export function isEvenlyPaced(segments: readonly Segment[]): boolean {
  return pacingSpreadSeconds(segments) <= EVEN_PACING_THRESHOLD_SECONDS;
}
