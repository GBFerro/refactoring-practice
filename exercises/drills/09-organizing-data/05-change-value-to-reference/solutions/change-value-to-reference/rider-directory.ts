import type { Rider, RiderInput } from "./rider";

/** Every rider Riverline knows about - the one place their contact details live. */
export interface RiderDirectory {
  readonly ridersById: Map<string, Rider>;
}

export function openDirectory(): RiderDirectory {
  return { ridersById: new Map() };
}

export function registerRider(directory: RiderDirectory, input: RiderInput): Rider {
  const rider: Rider = {
    id: input.id,
    name: input.name,
    phone: input.phone,
    email: input.email,
  };
  directory.ridersById.set(input.id, rider);
  return rider;
}

export function findRider(directory: RiderDirectory, riderId: string): Rider | undefined {
  return directory.ridersById.get(riderId);
}

/** Corrects a rider's phone number in the one place it is stored. */
export function correctRiderPhone(
  directory: RiderDirectory,
  riderId: string,
  phone: string,
): void {
  const rider = directory.ridersById.get(riderId);
  if (rider === undefined) return;
  rider.phone = phone;
}
