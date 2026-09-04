const MAX_USEFUL_OFFSET_METERS = 15;

/**
 * Blends closeness to the stage and closeness to the centerline into one 0-100 score.
 * Takes two plain numbers on purpose: this is shared by the scoring code for seats and
 * for standing-room spots, and it has no business knowing about either record shape.
 */
export function positionScore(
  distanceFromStageMeters: number,
  offsetFromCenterMeters: number,
): number {
  const closeness = 100 - Math.min(distanceFromStageMeters, 100);
  const centering = centeringScore(offsetFromCenterMeters);
  return Math.round((closeness + centering) / 2);
}

function centeringScore(offsetFromCenterMeters: number): number {
  const ratio = Math.abs(offsetFromCenterMeters) / MAX_USEFUL_OFFSET_METERS;
  return 100 - Math.min(ratio * 100, 100);
}
