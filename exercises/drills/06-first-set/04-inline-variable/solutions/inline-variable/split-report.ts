import type { Segment, Split, SplitSheet } from "./splits";

const LABEL_WIDTH = 8;
const ELAPSED_WIDTH = 7;
const DURATION_WIDTH = 8;

/** A segment is "even" while its pace is within this of the average, in s/km. */
const EVEN_PACING_SECONDS = 15;

export function renderSplitReport(sheet: SplitSheet): string {
  const segments = segmentsOf(sheet.splits);
  return [
    `${sheet.runner} - ${sheet.club}`,
    ...segments.map(renderSegment),
    ...renderSummary(segments),
  ].join("\n");
}

function segmentsOf(splits: readonly Split[]): Segment[] {
  return splits.map((split, index) => {
    const previous = splits[index - 1];
    return {
      label: split.label,
      km: split.km - (previous?.km ?? 0),
      elapsedSeconds: split.elapsedSeconds,
      durationSeconds: split.elapsedSeconds - (previous?.elapsedSeconds ?? 0),
    };
  });
}

function renderSegment(segment: Segment): string {
  const columns = [
    segment.label.padEnd(LABEL_WIDTH),
    formatDuration(segment.elapsedSeconds).padStart(ELAPSED_WIDTH),
    `+${formatDuration(segment.durationSeconds)}`.padStart(DURATION_WIDTH),
    formatPace(paceSecondsPerKm(segment)),
  ];
  return columns.join(" ").trimEnd();
}

function renderSummary(segments: readonly Segment[]): string[] {
  const fastest = fastestSegment(segments);
  if (fastest === undefined) return [];
  return [
    `Total: ${formatDuration(totalSeconds(segments))} over ${formatKm(totalKm(segments))} km`,
    `Fastest leg: ${fastest.label} at ${formatPace(paceSecondsPerKm(fastest))}`,
    `Even pacing: ${hasEvenPacing(segments) ? "yes" : "no"}`,
  ];
}

function fastestSegment(segments: readonly Segment[]): Segment | undefined {
  let fastest: Segment | undefined;
  for (const segment of segments) {
    if (fastest === undefined || paceSecondsPerKm(segment) < paceSecondsPerKm(fastest)) {
      fastest = segment;
    }
  }
  return fastest;
}

function hasEvenPacing(segments: readonly Segment[]): boolean {
  const average = averagePaceSecondsPerKm(segments);
  return segments.every(
    (segment) => Math.abs(paceSecondsPerKm(segment) - average) <= EVEN_PACING_SECONDS,
  );
}

function averagePaceSecondsPerKm(segments: readonly Segment[]): number {
  return totalSeconds(segments) / totalKm(segments);
}

function paceSecondsPerKm(segment: Segment): number {
  return segment.durationSeconds / segment.km;
}

function totalSeconds(segments: readonly Segment[]): number {
  return segments[segments.length - 1]?.elapsedSeconds ?? 0;
}

function totalKm(segments: readonly Segment[]): number {
  return segments.reduce((sum, segment) => sum + segment.km, 0);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const tail = `${pad2(minutes)}:${pad2(rest)}`;
  return hours > 0 ? `${String(hours)}:${tail}` : tail;
}

function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm);
  return `${String(Math.floor(rounded / 60))}:${pad2(rounded % 60)}/km`;
}

function formatKm(km: number): string {
  return km.toFixed(1);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
