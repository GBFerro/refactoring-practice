import { findRider } from "./rider-directory";
import type { RiderDirectory } from "./rider-directory";
import type { Rider } from "./rider";

/** One ride on a Riverline bike, from dock to dock. */
export interface Trip {
  readonly id: string;
  readonly rider: Rider;
  readonly fromStationId: string;
  readonly toStationId: string;
}

export interface TripBookingInput {
  readonly riderId: string;
  readonly fromStationId: string;
  readonly toStationId: string;
}

/** A trip's own copy of the rider's details, taken at booking time. */
function snapshotRider(rider: Rider): Rider {
  return { id: rider.id, name: rider.name, phone: rider.phone, email: rider.email };
}

function requireRider(directory: RiderDirectory, riderId: string): Rider {
  const rider = findRider(directory, riderId);
  if (rider === undefined) {
    throw new Error(`unknown rider: ${riderId}`);
  }
  return rider;
}

function toTrip(tripId: string, rider: Rider, input: TripBookingInput): Trip {
  return {
    id: tripId,
    rider: snapshotRider(rider),
    fromStationId: input.fromStationId,
    toStationId: input.toStationId,
  };
}

/**
 * Books a trip for a rider already in the directory.
 */
export function bookTrip(
  directory: RiderDirectory,
  tripId: string,
  input: TripBookingInput,
): Trip {
  return toTrip(tripId, requireRider(directory, input.riderId), input);
}
