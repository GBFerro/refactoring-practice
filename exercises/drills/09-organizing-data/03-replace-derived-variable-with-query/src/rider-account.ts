import type { Trip } from "./trip";

/** A rider's account: who they are, every trip they have taken, and the running total. */
export interface RiderAccount {
  readonly riderId: string;
  readonly displayName: string;
  readonly trips: Trip[];
  /** Sum of every trip's fareCents, maintained by hand at every site that changes a fare. */
  totalFareCentsCache: number;
}

/** Opens a new account with no trips yet. */
export function openAccount(riderId: string, displayName: string): RiderAccount {
  return { riderId, displayName, trips: [], totalFareCentsCache: 0 };
}

/** Adds a completed trip to the rider's history. */
export function recordTrip(account: RiderAccount, trip: Trip): void {
  account.trips.push(trip);
  account.totalFareCentsCache += trip.fareCents;
}

/**
 * A bike returned after the free period is charged extra once the dock reports how late
 * it was - often hours after the ride itself was recorded. Adjusts the named trip's fare
 * in place; a negative feeCents issues a credit instead.
 */
export function applyLateReturnFee(
  account: RiderAccount,
  tripId: string,
  feeCents: number,
): void {
  const trip = account.trips.find((candidate) => candidate.id === tripId);
  if (trip === undefined) return;
  trip.fareCents += feeCents;
}

/** What this rider has been charged in total, across every trip on the account. */
export function totalFareCents(account: RiderAccount): number {
  return account.totalFareCentsCache;
}
