import type { SplitLog } from "./checkpoints";
import { formatPace, formatSpread } from "./format";
import {
  averagePaceSecondsPerKm,
  isEvenlyPaced,
  pacingSpreadSeconds,
  segmentsOf,
  type Segment,
} from "./pacing";

const MARKER_WIDTH = 5;

export function renderPacingReport(log: SplitLog): string {
  const segments = segmentsOf(log.checkpoints);
  return [
    `${log.runner} - ${log.session}`,
    ...segments.map(renderSegmentLine),
    "",
    `Average pace: ${formatPace(averagePaceSecondsPerKm(segments))}`,
    `Pacing spread: ${formatSpread(pacingSpreadSeconds(segments))}`,
    `Consistency: ${isEvenlyPaced(segments) ? "Even" : "Uneven"}`,
  ].join("\n");
}

function renderSegmentLine(segment: Segment): string {
  const marker = `${String(segment.markerKm)}km`.padStart(MARKER_WIDTH);
  return `${marker}  ${formatPace(segment.paceSecondsPerKm)}`;
}
