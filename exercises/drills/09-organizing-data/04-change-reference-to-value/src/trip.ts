import { Fare } from "./fare";

/** One ride on a Riverline bike, from dock to dock. */
export interface Trip {
  readonly id: string;
  readonly fromStationId: string;
  readonly toStationId: string;
  fare: Fare;
}

export interface TripInput {
  readonly fromStationId: string;
  readonly toStationId: string;
  readonly cents: number;
}

export function bookTrip(tripId: string, input: TripInput): Trip {
  return {
    id: tripId,
    fromStationId: input.fromStationId,
    toStationId: input.toStationId,
    fare: new Fare(input.cents),
  };
}

export interface RoundTripInput {
  readonly outboundStationId: string;
  readonly returnStationId: string;
  readonly cents: number;
}

export interface RoundTrip {
  readonly outbound: Trip;
  readonly inbound: Trip;
}

interface LegInput {
  readonly id: string;
  readonly fromStationId: string;
  readonly toStationId: string;
  readonly fare: Fare;
}

function leg(input: LegInput): Trip {
  return {
    id: input.id,
    fromStationId: input.fromStationId,
    toStationId: input.toStationId,
    fare: input.fare,
  };
}

/**
 * Books an out-and-back pair at one flat fare. Both legs are quoted from the same Fare
 * object - they cost the same, so there is only one amount to allocate.
 */
export function bookRoundTrip(
  outboundId: string,
  inboundId: string,
  input: RoundTripInput,
): RoundTrip {
  const fare = new Fare(input.cents);
  const { outboundStationId: out, returnStationId: ret } = input;
  return {
    outbound: leg({ id: outboundId, fromStationId: out, toStationId: ret, fare }),
    inbound: leg({ id: inboundId, fromStationId: ret, toStationId: out, fare }),
  };
}

/**
 * Corrects a trip's fare - a billing dispute, a promo credit, a fee.
 */
export function adjustTripFare(trip: Trip, deltaCents: number): void {
  trip.fare.adjustBy(deltaCents);
}
