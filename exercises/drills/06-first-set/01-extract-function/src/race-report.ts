import type { Entry, Race } from "./race";

export function renderRaceReport(race: Race): string {
  const lines: string[] = [];

  // the header is the title plus a rule as wide as it
  const title = race.name + " - " + race.date;
  lines.push(title);
  lines.push("=".repeat(title.length));

  // everyone with a chip time finished; rank them fastest first
  const finishers: Entry[] = [];
  for (const entry of race.entries) {
    if (entry.seconds !== null) {
      finishers.push(entry);
    }
  }
  finishers.sort((a, b) => (a.seconds ?? 0) - (b.seconds ?? 0));

  let position = 0;
  let paceTotal = 0;
  for (const finisher of finishers) {
    position = position + 1;
    const seconds = finisher.seconds ?? 0;

    // chip time as h:mm:ss, dropping the hour when the runner came in under one
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const rest = seconds % 60;
    let time = String(minutes).padStart(2, "0") + ":" + String(rest).padStart(2, "0");
    if (hours > 0) {
      time = String(hours) + ":" + time;
    }

    // pace as m:ss per kilometre
    const secondsPerKm = seconds / race.distanceKm;
    paceTotal = paceTotal + secondsPerKm;
    const roundedPace = Math.round(secondsPerKm);
    const pace =
      String(Math.floor(roundedPace / 60)) +
      ":" +
      String(roundedPace % 60).padStart(2, "0") +
      "/km";

    lines.push(
      (
        String(position).padStart(3) +
        " " +
        finisher.name.padEnd(22) +
        " " +
        finisher.club.padEnd(20) +
        " " +
        time +
        " " +
        pace
      ).trimEnd(),
    );
  }

  // the ones who started but did not finish
  for (const entry of race.entries) {
    if (entry.seconds === null) {
      lines.push(("DNF " + entry.name.padEnd(22) + " " + entry.club).trimEnd());
    }
  }

  lines.push("-".repeat(title.length));

  // summary
  lines.push(
    "Finishers: " + String(finishers.length) + " of " + String(race.entries.length),
  );
  const fastest = finishers[0];
  if (fastest !== undefined) {
    const best = fastest.seconds ?? 0;
    const bestHours = Math.floor(best / 3600);
    const bestMinutes = Math.floor((best % 3600) / 60);
    const bestRest = best % 60;
    let bestTime =
      String(bestMinutes).padStart(2, "0") + ":" + String(bestRest).padStart(2, "0");
    if (bestHours > 0) {
      bestTime = String(bestHours) + ":" + bestTime;
    }
    lines.push("Fastest: " + fastest.name + " (" + bestTime + ")");

    const averagePace = paceTotal / finishers.length;
    const roundedAverage = Math.round(averagePace);
    lines.push(
      "Average pace: " +
        String(Math.floor(roundedAverage / 60)) +
        ":" +
        String(roundedAverage % 60).padStart(2, "0") +
        "/km",
    );
  }

  return lines.join("\n");
}
