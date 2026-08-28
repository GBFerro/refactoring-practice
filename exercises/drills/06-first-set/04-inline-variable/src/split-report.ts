import type { Segment, Split, SplitSheet } from "./splits";

const LABEL_WIDTH = 8;
const ELAPSED_WIDTH = 7;
const DURATION_WIDTH = 8;

/** A segment is "even" while its pace is within this of the average, in s/km. */
const EVEN_PACING_SECONDS = 15;

export function renderSplitReport(sheet: SplitSheet): string {
  const segments = segmentsOf(sheet.splits);
  const heading = `${sheet.runner} - ${sheet.club}`;
  const segmentLines = segments.map(renderSegment);
  const summaryLines = renderSummary(segments);
  const lines = [heading, ...segmentLines, ...summaryLines];
  return lines.join("\n");
}

function segmentsOf(splits: readonly Split[]): Segment[] {
  return splits.map((split, index) => {
    const previous = splits[index - 1];
    const previousKm = previous?.km ?? 0;
    const previousElapsedSeconds = previous?.elapsedSeconds ?? 0;
    const label = split.label;
    const km = split.km - previousKm;
    const elapsedSeconds = split.elapsedSeconds;
    const durationSeconds = split.elapsedSeconds - previousElapsedSeconds;
    return { label, km, elapsedSeconds, durationSeconds };
  });
}

function renderSegment(segment: Segment): string {
  const label = segment.label.padEnd(LABEL_WIDTH);
  const elapsed = formatDuration(segment.elapsedSeconds).padStart(ELAPSED_WIDTH);
  const duration = `+${formatDuration(segment.durationSeconds)}`.padStart(DURATION_WIDTH);
  const pace = formatPace(paceSecondsPerKm(segment));
  const columns = [label, elapsed, duration, pace];
  const row = columns.join(" ");
  return row.trimEnd();
}

function renderSummary(segments: readonly Segment[]): string[] {
  const fastest = fastestSegment(segments);
  if (fastest === undefined) return [];
  const total = totalSeconds(segments);
  const distance = totalKm(segments);
  const fastestPace = paceSecondsPerKm(fastest);
  const isEven = hasEvenPacing(segments);
  const totalLine = `Total: ${formatDuration(total)} over ${formatKm(distance)} km`;
  const fastestLine = `Fastest leg: ${fastest.label} at ${formatPace(fastestPace)}`;
  const pacingLine = `Even pacing: ${isEven ? "yes" : "no"}`;
  return [totalLine, fastestLine, pacingLine];
}

function fastestSegment(segments: readonly Segment[]): Segment | undefined {
  let fastest: Segment | undefined;
  for (const segment of segments) {
    const pace = paceSecondsPerKm(segment);
    const isFirstOrFaster = fastest === undefined || pace < paceSecondsPerKm(fastest);
    if (isFirstOrFaster) {
      fastest = segment;
    }
  }
  return fastest;
}

function hasEvenPacing(segments: readonly Segment[]): boolean {
  const average = averagePaceSecondsPerKm(segments);
  return segments.every((segment) => {
    const pace = paceSecondsPerKm(segment);
    const difference = Math.abs(pace - average);
    return difference <= EVEN_PACING_SECONDS;
  });
}

function averagePaceSecondsPerKm(segments: readonly Segment[]): number {
  const total = totalSeconds(segments);
  const distance = totalKm(segments);
  return total / distance;
}

function paceSecondsPerKm(segment: Segment): number {
  const duration = segment.durationSeconds;
  const distance = segment.km;
  return duration / distance;
}

function totalSeconds(segments: readonly Segment[]): number {
  const last = segments[segments.length - 1];
  const lastElapsed = last?.elapsedSeconds ?? 0;
  return lastElapsed;
}

function totalKm(segments: readonly Segment[]): number {
  return segments.reduce((sum, segment) => sum + segment.km, 0);
}

function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const rest = seconds % 60;
  const tail = `${pad2(minutes)}:${pad2(rest)}`;
  const hasHours = hours > 0;
  return hasHours ? `${String(hours)}:${tail}` : tail;
}

function formatPace(secondsPerKm: number): string {
  const rounded = Math.round(secondsPerKm);
  const wholeMinutes = Math.floor(rounded / 60);
  const remainingSeconds = rounded % 60;
  return `${String(wholeMinutes)}:${pad2(remainingSeconds)}/km`;
}

function formatKm(km: number): string {
  return km.toFixed(1);
}

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}
