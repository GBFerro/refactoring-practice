/**
 * A Riverline rider's contact details. Every trip that references a Rider sees the same
 * fields - there is exactly one of these per rider, owned by the RiderDirectory.
 */
export interface Rider {
  readonly id: string;
  name: string;
  phone: string;
  email: string;
}

export interface RiderInput {
  readonly id: string;
  readonly name: string;
  readonly phone: string;
  readonly email: string;
}
